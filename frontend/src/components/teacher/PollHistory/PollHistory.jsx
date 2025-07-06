import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../../../context/SocketContext'
import styles from './PollHistory.module.css'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner'

const PollHistory = () => {
  const [pollHistory, setPollHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { socket } = useSocket()
  const [sessionId] = useLocalStorage('teacherSessionId', null)
  const navigate = useNavigate()

  useEffect(() => {
    // Clear any previous errors
    setError(null)
    
    // Debug logs
    console.log('PollHistory useEffect running with:', { 
      socketConnected: socket?.connected,
      sessionId 
    })

    if (!socket) {
      setError('Socket connection not available')
      setIsLoading(false)
      return
    }

    const fetchHistory = () => {
      console.log('Fetching poll history with sessionId:', sessionId)
      
      // This request can work with or without sessionId
      socket.emit('teacher:get_history', { 
        sessionId: sessionId || undefined,
        limit: 20 
      }, (response) => {
        console.log('Poll history response:', response)
        setIsLoading(false)
        
        if (response?.success) {
          // Make sure we're getting the polls array from the right place
          const polls = response.data?.polls || []
          console.log('Setting poll history:', polls)
          setPollHistory(polls)
          
          if (polls.length === 0) {
            setError('No poll history found. Create some polls first.')
          }
        } else {
          setError(response?.error?.message || 'Failed to fetch poll history')
        }
      })
    }

    // Call immediately if connected, otherwise wait for connection
    if (socket.connected) {
      fetchHistory()
    } else {
      console.log('Socket not connected, waiting for connection')
      socket.once('connect', () => {
        console.log('Socket connected, now fetching history')
        fetchHistory()
      })
    }

    // Cleanup listener on unmount
    return () => {
      socket.off('connect', fetchHistory)
    }
  }, [socket, sessionId])

  const getPercentage = (count, total) => {
    if (!total || total === 0) return 0
    return Math.round((count / total) * 100)
  }

  const handleBackToTeacher = () => {
    navigate('/teacher')
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner size="large" />
        <p>Loading poll history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>View Poll History</h1>
        </div>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.backButton} onClick={handleBackToTeacher}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (pollHistory.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>View Poll History</h1>
        </div>
        <div className={styles.noPollHistory}>
          <p>No poll history available. Create some polls to see them here.</p>
          <button className={styles.backButton} onClick={handleBackToTeacher}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>View Poll History</h1>
        <button className={styles.backButton} onClick={handleBackToTeacher}>
          Back to Dashboard
        </button>
      </div>

      <div className={styles.pollList}>
        {pollHistory.map((poll, pollIndex) => {
          // Handle different data structures that might come from the backend
          const results = poll.results || {}
          const totalVotes = Object.values(results).reduce((sum, count) => sum + (Number(count) || 0), 0)

          return (
            <div key={poll.id || poll._id || pollIndex} className={styles.pollCard}>
              <div className={styles.pollHeader}>
                <h3 className={styles.pollTitle}>Question {pollIndex + 1}</h3>
                <span className={styles.pollDate}>
                  {new Date(poll.createdAt).toLocaleDateString()} {new Date(poll.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div className={styles.question}>
                {poll.question || "Question not available"}
              </div>

              <div className={styles.results}>
                {(poll.options || []).map((option, index) => {
                  const count = Number(results[option]) || 0
                  const percentage = getPercentage(count, totalVotes)
                  const barWidth = totalVotes > 0 ? (count / totalVotes) * 100 : 0

                  return (
                    <div key={index} className={styles.resultItem}>
                      <div className={styles.optionInfo}>
                        <div className={styles.optionCircle}>
                          <span className={styles.optionNumber}>{index + 1}</span>
                        </div>
                        <span className={styles.optionText}>{option}</span>
                      </div>
                      
                      <div className={styles.barContainer}>
                        <div 
                          className={styles.bar}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                      
                      <div className={styles.percentage}>
                        {percentage}% ({count})
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className={styles.pollFooter}>
                <span className={styles.totalVotes}>
                  Total responses: {totalVotes}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PollHistory