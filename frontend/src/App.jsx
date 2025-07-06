import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import { AppProvider } from './context/AppContext'
import LandingPage from './components/pages/LandingPage/LandingPage'
import TeacherDashboard from './components/teacher/TeacherDashboard/TeacherDashboard'
import StudentJoin from './components/student/StudentJoin/StudentJoin'
import StudentDashboard from './components/student/StudentDashboard/StudentDashboard'
import NotFound from './components/pages/NotFound/NotFound'
import CreatePoll from './components/teacher/CreatePoll/CreatePoll'
import PollHistory from './components/teacher/PollHistory/PollHistory'
import KickedOut from './components/student/KickedOut/KickedOut'
import styles from './App.module.css'

function App() {
  return (
    <AppProvider>
      <SocketProvider>
        <Router>
          <div className={styles.app}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/create-poll" element={<CreatePoll />} />
              <Route path="/teacher/history" element={<PollHistory />} />
              <Route path="/student/join" element={<StudentJoin />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/kicked-out" element={<KickedOut />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AppProvider>
  )
}

export default App