import React, { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext()

const initialState = {
  userType: localStorage.getItem('userType') || '',
  studentName: sessionStorage.getItem('studentName') || '',
  currentPoll: null,
  pollResults: {},
  connectedStudents: [],
  hasVoted: false,
  timeRemaining: 0,
  pollHistory: [],
  chatMessages: [],
  isChatOpen: false,
  teacherDashboardView: 'create'
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER_TYPE':
      localStorage.setItem('userType', action.payload)
      return { ...state, userType: action.payload }
    
    case 'SET_STUDENT_NAME':
      sessionStorage.setItem('studentName', action.payload)
      return { ...state, studentName: action.payload }
    
    case 'SET_CURRENT_POLL':
      return { ...state, currentPoll: action.payload, hasVoted: false }
    
    case 'SET_POLL_RESULTS':
      return { ...state, pollResults: action.payload }
    
    case 'SET_HAS_VOTED':
      return { ...state, hasVoted: action.payload }
    
    case 'SET_TIME_REMAINING':
      return { ...state, timeRemaining: action.payload }
    
    case 'SET_CONNECTED_STUDENTS':
      return { ...state, connectedStudents: action.payload }
    
    case 'ADD_CHAT_MESSAGE':
      return { 
        ...state, 
        chatMessages: [...state.chatMessages, action.payload] 
      }
    
    case 'TOGGLE_CHAT':
      return { ...state, isChatOpen: !state.isChatOpen }
    
    case 'SET_POLL_HISTORY':
      return { ...state, pollHistory: action.payload }
    
    case 'SET_TEACHER_DASHBOARD_VIEW':
      return { ...state, teacherDashboardView: action.payload }
    
    case 'RESET_POLL_AND_GO_TO_CREATE':
      return { 
        ...state, 
        currentPoll: null, 
        hasVoted: false, 
        timeRemaining: 0,
        pollResults: {},
        teacherDashboardView: 'create'
      }
    
    case 'RESET_POLL':
      return { 
        ...state, 
        currentPoll: null, 
        hasVoted: false, 
        timeRemaining: 0,
        pollResults: {}
      }
    
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  // Ensure we have the userType from localStorage on initial load and path changes
  useEffect(() => {
    const savedUserType = localStorage.getItem('userType')
    if (savedUserType && savedUserType !== state.userType) {
      dispatch({ type: 'SET_USER_TYPE', payload: savedUserType })
    }
    
    // Debug the current userType
    console.log('Current userType in AppContext:', state.userType)
  }, [state.userType])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}