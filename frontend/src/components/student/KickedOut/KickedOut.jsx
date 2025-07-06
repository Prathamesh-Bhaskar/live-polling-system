import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './KickedOut.module.css';

const KickedOut = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    // Clear student session data
    sessionStorage.removeItem('studentName');
    // Navigate back to student join page
    navigate('/student/join');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.intervuePollContainer}>
          <button className={styles.intervuePollBtn}>
            <span className={styles.sparkleIcon}>✨</span> Intervue Poll
          </button>
        </div>

        <h1 className={styles.title}>You've been Kicked out!</h1>
        <p className={styles.message}>
          Looks like the teacher had removed you from the poll system. Please try again sometime.
        </p>
        
        <button className={styles.tryAgainBtn} onClick={handleTryAgain}>
          Try Again
        </button>
      </div>
    </div>
  );
};

export default KickedOut;