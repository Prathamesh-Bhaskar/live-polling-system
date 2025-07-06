 // ===================================================================
import React, { useState } from 'react'
import { useApp } from '../../../context/AppContext'
import { useSocket } from '../../../context/SocketContext'
import Timer from '../../common/Timer/Timer'
import styles from './PollAnswer.module.css'

const PollAnswer = ({ poll }) => {
  const [selectedOption, setSelectedOption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { dispatch, state } = useApp()
  const { socket } = useSocket()
  const { timeRemaining } = state

  const handleOptionSelect = (option) => {
    setSelectedOption(option)
  }

  const handleSubmit = async () => {
    if (!selectedOption || isSubmitting) return

    setIsSubmitting(true)

    socket?.emit('student:vote', {
      pollId: poll.id,
      selectedOption,
      studentName: state.studentName
    }, (response) => {
      setIsSubmitting(false)
      
      if (response?.success) {
        dispatch({ type: 'SET_HAS_VOTED', payload: true })
      } else {
        alert('Failed to submit vote. Please try again.')
      }
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.pollCard}>
        <div className={styles.pollHeader}>
          <div className={styles.questionInfo}>
            <span className={styles.questionLabel}>Question 1</span>
            <Timer timeRemaining={timeRemaining} />
          </div>
          
          <h2 className={styles.question}>{poll.question}</h2>
        </div>

        <div className={styles.options}>
          {poll.options.map((option, index) => (
            <div
              key={index}
              className={`${styles.option} ${selectedOption === option ? styles.selected : ''}`}
              onClick={() => handleOptionSelect(option)}
            >
              <div className={styles.optionCircle}>
                {selectedOption === option && <div className={styles.optionSelected} />}
              </div>
              <span className={styles.optionText}>{option}</span>
            </div>
          ))}
        </div>

        <button
          className={`${styles.submitBtn} ${!selectedOption || isSubmitting ? styles.disabled : ''}`}
          onClick={handleSubmit}
          disabled={!selectedOption || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  )
}

export default PollAnswer