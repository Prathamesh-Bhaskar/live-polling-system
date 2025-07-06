import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { useSocket } from '../../../context/SocketContext'
import ChatMessage from './ChatMessage/ChatMessage'
import ParticipantsList from './ParticipantsList/ParticipantsList'
import styles from './Chat.module.css'

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('chat') // 'chat' or 'participants'
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)
  const { state } = useApp()
  const { socket } = useSocket()
  const { chatMessages, userType, studentName } = state

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!message.trim()) return

    const messageData = {
      message: message.trim(),
      sender: userType === 'teacher' ? 'Teacher' : studentName,
      senderType: userType,
      timestamp: new Date().toISOString()
    }

    // Only emit the message to the server and let the socket event handler
    // add it to the state when it comes back from the server
    socket?.emit('chat:send_message', messageData)
    
    // Clear the input field after sending
    setMessage('')
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button 
        className={styles.chatToggle}
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        💬
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'chat' ? styles.active : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'participants' ? styles.active : ''}`}
                onClick={() => setActiveTab('participants')}
              >
                Participants
              </button>
            </div>
            
            <button 
              className={styles.closeBtn}
              onClick={toggleChat}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className={styles.chatContent}>
            {activeTab === 'chat' ? (
              <>
                <div className={styles.messagesContainer}>
                  <div className={styles.messages}>
                    {chatMessages.length === 0 ? (
                      <div className={styles.noMessages}>
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      chatMessages.map((msg, index) => (
                        <ChatMessage 
                          key={msg.id || `${msg.sender}-${msg.timestamp}-${index}`} 
                          message={msg} 
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className={styles.messageForm}>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className={styles.messageInput}
                    maxLength={500}
                  />
                  <button 
                    type="submit" 
                    className={styles.sendBtn}
                    disabled={!message.trim()}
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <ParticipantsList />
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Chat