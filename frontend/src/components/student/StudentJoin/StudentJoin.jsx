import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import { useSocket } from "../../../context/SocketContext";
import Header from "../../common/Header/Header";
import styles from "./StudentJoin.module.css";

const StudentJoin = () => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const { socket } = useSocket();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    // Emit join event to server
    socket?.emit("student:join", { name: name.trim() }, (response) => {
      setIsLoading(false);

      if (response?.success) {
        dispatch({ type: "SET_STUDENT_NAME", payload: name.trim() });
        navigate("/student/dashboard");
      } else {
        setError(
          response?.message || "Failed to join. Name might already be taken."
        );
      }
    });
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (error) setError("");
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        <div className={styles.welcomeSection}>
          <div className={styles.intervuePollContainer}>
            <button className={styles.intervuePollBtn}>
              <span className={styles.sparkleIcon}>✨</span> Intervue Poll
            </button>
          </div>

          <h1 className={styles.title}>Let's Get Started</h1>
          <p className={styles.subtitle}>
            If you're a student, you'll be able to{" "}
            <strong>submit your answers</strong>, participate in live polls, and
            see how your responses compare with your classmates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>
              Enter your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter your name here"
              className={`${styles.input} ${error ? styles.inputError : ""}`}
              maxLength={50}
              disabled={isLoading}
            />
            <div className={styles.charCount}>{name.length}/100</div>

            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>

          <button
            type="submit"
            className={`${styles.continueBtn} ${
              isLoading ? styles.loading : ""
            }`}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? "Joining..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentJoin;
