import React, { createContext, useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'
import { useApp } from './AppContext'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { dispatch, state } = useApp()

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL
    const newSocket = io(socketUrl)

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to server')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from server')
    })

    // Poll events
    newSocket.on('poll:started', (poll) => {
      dispatch({ type: 'SET_CURRENT_POLL', payload: poll })
      dispatch({ type: 'SET_TIME_REMAINING', payload: poll.duration || 60 })
    })

    newSocket.on('poll:ended', () => {
      dispatch({ type: 'RESET_POLL' })
    })

    newSocket.on('poll:results', (results) => {
      dispatch({ type: 'SET_POLL_RESULTS', payload: results })
    })

    newSocket.on('timer:update', (timeLeft) => {
      dispatch({ type: 'SET_TIME_REMAINING', payload: timeLeft })
    })

    // Student events
    newSocket.on('students:updated', (students) => {
      dispatch({ type: 'SET_CONNECTED_STUDENTS', payload: students })
    })

    newSocket.on('student:kicked', (data) => {
      console.log('Student kicked event received:', data)
      // The navigation will happen in the StudentDashboard component
    })

    // Chat events
    newSocket.on('chat:message', (message) => {
      // Check if this message already exists in our state to prevent duplicates
      const isDuplicate = state.chatMessages.some(msg => 
        msg.sender === message.sender && 
        msg.message === message.message &&
        msg.timestamp === message.timestamp
      )
      
      if (!isDuplicate) {
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message })
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [dispatch, state.chatMessages])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}