import React, { useState } from 'react'
import { useApp } from '../../../../context/AppContext'
import { useSocket } from '../../../../context/SocketContext'
import styles from './ParticipantsList.module.css'

const ParticipantsList = () => {
  const { state } = useApp()
  const { socket } = useSocket()
  const { connectedStudents, userType } = state
  const [kickingStudent, setKickingStudent] = useState(null)

  const handleKickStudent = (studentName) => {
    if (userType !== 'teacher') return
    
    setKickingStudent(studentName)
    
    if (window.confirm(`Are you sure you want to kick ${studentName}?`)) {
      socket?.emit('teacher:kick_student', { studentName }, (response) => {
        setKickingStudent(null)
        if (response?.success) {
          console.log(`${studentName} was kicked successfully`)
        } else {
          console.error(`Failed to kick ${studentName}:`, response?.error)
        }
      })
    } else {
      setKickingStudent(null)
    }
  }

  // For debugging - log to see what userType we have
  console.log('Current userType:', userType)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Participants</h3>
        <span className={styles.count}>{connectedStudents.length}</span>
      </div>

      <div className={styles.participantsList}>
        {connectedStudents.length === 0 ? (
          <div className={styles.noParticipants}>
            No participants connected
          </div>
        ) : (
          connectedStudents.map((student, index) => (
            <div key={student.id || index} className={styles.participant}>
              <div className={styles.participantInfo}>
                <div className={styles.avatar}>
                  {student.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className={styles.name}>{student.name}</span>
              </div>
              
              {userType === 'teacher' && (
                <button
                  className={styles.kickBtn}
                  onClick={() => handleKickStudent(student.name)}
                  disabled={kickingStudent === student.name}
                >
                  {kickingStudent === student.name ? 'Kicking...' : 'Kick out'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ParticipantsList