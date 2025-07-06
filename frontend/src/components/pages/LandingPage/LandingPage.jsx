import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import Header from "../../common/Header/Header";
import styles from "./LandingPage.module.css";

const LandingPage = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    dispatch({ type: "SET_USER_TYPE", payload: selectedRole });
    if (selectedRole === "teacher") {
      navigate("/teacher");
    } else {
      navigate("/student/join");
    }
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        <div className={styles.intervuePollContainer}>
          <button className={styles.intervuePollBtn}>
            <span className={styles.sparkleIcon}>✨</span> Intervue Poll
          </button>
        </div>

        <div className={styles.welcomeSection}>
          <h1 className={styles.title}>
            Welcome to the{" "}
            <span className={styles.highlight}>Live Polling System</span>
          </h1>
          <p className={styles.subtitle}>
            Please select the role that best describes you to begin using the
            live polling system
          </p>
        </div>

        <div className={styles.roleSelection}>
          <div
            className={`${styles.roleCard} ${
              selectedRole === "student" ? styles.selected : ""
            }`}
            onClick={() => handleRoleSelect("student")}
          >
            <h3 className={styles.roleTitle}>I'm a Student</h3>
            <p className={styles.roleDescription}>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry
            </p>
          </div>
          <div
            className={`${styles.roleCard} ${
              selectedRole === "teacher" ? styles.selected : ""
            }`}
            onClick={() => handleRoleSelect("teacher")}
          >
            <h3 className={styles.roleTitle}>I'm a Teacher</h3>
            <p className={styles.roleDescription}>
              Submit answers and view live poll results in real-time.
            </p>
          </div>
        </div>
        <button
          className={`${styles.continueBtn} ${
            !selectedRole ? styles.disabled : ""
          }`}
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
