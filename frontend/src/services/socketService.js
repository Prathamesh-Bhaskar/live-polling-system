import io from 'socket.io-client'
import { SOCKET_EVENTS } from '../utils/constants'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  connect(url = import.meta.env.VITE_SOCKET_URL) {
    this.socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    })

    this.setupEventListeners()
    return this.socket
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.isConnected = true
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts')
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error)
    })
  }

  // Student methods
  joinAsStudent(studentData, callback) {
    this.emit(SOCKET_EVENTS.STUDENT_JOIN, studentData, callback)
  }

  submitVote(voteData, callback) {
    this.emit(SOCKET_EVENTS.STUDENT_VOTE, voteData, callback)
  }

  // Teacher methods
  joinAsTeacher(callback) {
    this.emit(SOCKET_EVENTS.TEACHER_JOIN, {}, callback)
  }

  createPoll(pollData, callback) {
    this.emit(SOCKET_EVENTS.TEACHER_CREATE_POLL, pollData, callback)
  }

  endPoll(pollId, callback) {
    this.emit(SOCKET_EVENTS.TEACHER_END_POLL, { pollId }, callback)
  }

  kickStudent(studentName, callback) {
    this.emit(SOCKET_EVENTS.TEACHER_KICK_STUDENT, { studentName }, callback)
  }

  getPollHistory(callback) {
    this.emit(SOCKET_EVENTS.TEACHER_GET_HISTORY, {}, callback)
  }

  // Chat methods
  sendMessage(messageData, callback) {
    this.emit(SOCKET_EVENTS.CHAT_SEND_MESSAGE, messageData, callback)
  }

  // Utility methods
  emit(event, data, callback) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data, callback)
    } else {
      console.warn('Socket not connected')
      if (callback) callback({ success: false, message: 'Not connected to server' })
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  getSocket() {
    return this.socket
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected
  }
}

export default new SocketService()