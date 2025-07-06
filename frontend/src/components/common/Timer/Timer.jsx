 // ===================================================================
import React from 'react'
import styles from './Timer.module.css'

const Timer = ({ timeRemaining }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeClass = () => {
    if (timeRemaining <= 10) return styles.critical
    if (timeRemaining <= 30) return styles.warning
    return styles.normal
  }

  return (
    <div className={`${styles.timer} ${getTimeClass()}`}>
      <span className={styles.icon}>⏱</span>
      <span className={styles.time}>{formatTime(timeRemaining)}</span>
    </div>
  )
}

export default Timer