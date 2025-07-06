import React from 'react'
import styles from './ChatMessage.module.css'

const ChatMessage = ({ message }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const isTeacher = message.senderType === 'teacher'

  return (
    <div className={`${styles.message} ${isTeacher ? styles.teacher : styles.student}`}>
      <div className={styles.messageHeader}>
        <span className={styles.sender}>{message.sender}</span>
        <span className={styles.time}>{formatTime(message.timestamp)}</span>
      </div>
      <div className={styles.messageText}>
        {message.message}
      </div>
    </div>
  )
}

export default ChatMessage