import React, { useState } from "react";
import { useApp } from "../../../context/AppContext";
import { useSocket } from "../../../context/SocketContext";
import styles from "./CreatePoll.module.css";

const CreatePoll = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useApp();
  const { socket } = useSocket();
  const { connectedStudents } = state;

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      alert("Please enter a question");
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      alert("Please provide at least 2 options");
      return;
    }

    if (connectedStudents.length === 0) {
      alert("No students are connected. Wait for students to join.");
      return;
    }

    setIsSubmitting(true);

    const pollData = {
      question: question.trim(),
      options: validOptions,
      duration,
    };

    socket?.emit("teacher:create_poll", pollData, (response) => {
      setIsSubmitting(false);

      if (response?.success) {
        // Reset form
        setQuestion("");
        setOptions(["", ""]);
        setDuration(60);
      } else {
        alert("Failed to create poll. Please try again.");
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.intervuePollContainer}>
          <button className={styles.intervuePollBtn}>
            <span className={styles.sparkleIcon}>✨</span> Intervue Poll
          </button>
        </div>

        <h1 className={styles.title}>Let's Get Started</h1>
        <p className={styles.subtitle}>
          you'll have the ability to create and manage polls, ask questions, and
          monitor your students' responses in real-time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.questionSection}>
          <div className={styles.questionHeader}>
            <label className={styles.label}>Enter your question</label>
            <div className={styles.durationSelector}>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className={styles.durationSelect}
              >
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
                <option value={120}>2 minutes</option>
              </select>
            </div>
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="what is the capital of India?"
            className={styles.questionInput}
            rows={4}
            maxLength={500}
          />

          <div className={styles.charCount}>{question.length}/100</div>
        </div>

        <div className={styles.optionsSection}>
          <div className={styles.optionsHeader}>
            <h3 className={styles.sectionTitle}>Edit Options</h3>
            <h3 className={styles.sectionTitle}>Is it Correct?</h3>
          </div>

          <div className={styles.optionsList}>
            {options.map((option, index) => (
              <div key={index} className={styles.optionRow}>
                <div className={styles.optionInput}>
                  <span className={styles.optionNumber}>{index + 1}</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder="Enter your option here"
                    className={styles.optionField}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className={styles.removeBtn}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className={styles.correctnessOptions}>
                  <label className={styles.radioOption}>
                    <input type="radio" name={`correct_${index}`} value="yes" />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name={`correct_${index}`}
                      value="no"
                      defaultChecked
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className={styles.addOptionBtn}
            >
              + Add More option
            </button>
          )}
        </div>

        <div className={styles.submitSection}>
          <div className={styles.studentsCount}>
            {connectedStudents.length} students connected
          </div>

          <button
            type="submit"
            className={`${styles.askBtn} ${isSubmitting ? styles.loading : ""}`}
            disabled={
              isSubmitting ||
              !question.trim() ||
              options.filter((o) => o.trim()).length < 2
            }
          >
            {isSubmitting ? "Creating..." : "Ask Question"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePoll;
