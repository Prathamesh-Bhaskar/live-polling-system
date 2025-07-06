import React from "react";
import Header from "../../common/Header/Header";
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import styles from "./WaitingScreen.module.css";

const WaitingScreen = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.intervuePollContainer}>
          <button className={styles.intervuePollBtn}>
            <span className={styles.sparkleIcon}>✨</span> Intervue Poll
          </button>
        </div>

        <LoadingSpinner />

        <h2 className={styles.title}>
          Wait for the teacher to ask questions..
        </h2>
      </div>
    </div>
  );
};

export default WaitingScreen;
