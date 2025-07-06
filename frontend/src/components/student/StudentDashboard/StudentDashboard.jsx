import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useSocket } from '../../../context/SocketContext'
import Header from '../../common/Header/Header'
import WaitingScreen from '../WaitingScreen/WaitingScreen'
import PollAnswer from '../PollAnswer/PollAnswer'
import PollResults from '../../common/PollResults/PollResults'
import Chat from '../../common/Chat/Chat'
import styles from './StudentDashboard.module.css'

const StudentDashboard = () => {
  const { state } = useApp()
  const { socket } = useSocket()
  const { currentPoll, hasVoted, timeRemaining, studentName } = state
  const navigate = useNavigate()

  useEffect(() => {
    // Join the student session when component mounts
    if (socket && studentName) {
      socket.emit('student:join', { name: studentName })
    }

    // Listen for the kick event
    const handleKickEvent = () => {
      console.log('Student kicked out event received')
      // Navigate to kicked out page
      navigate('/student/kicked-out')
    }

    if (socket) {
      socket.on('student:kicked', handleKickEvent)
    }

    // Clean up event listener on unmount
    return () => {
      if (socket) {
        socket.off('student:kicked', handleKickEvent)
      }
    }
  }, [socket, studentName, navigate])

  const renderContent = () => {
    if (!currentPoll) {
      return <WaitingScreen />
    }

    if (currentPoll && !hasVoted && timeRemaining > 0) {
      return <PollAnswer poll={currentPoll} />
    }

    return <PollResults />
  }

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.content}>
        {renderContent()}
      </div>

      <Chat />
    </div>
  )
}

export default StudentDashboard