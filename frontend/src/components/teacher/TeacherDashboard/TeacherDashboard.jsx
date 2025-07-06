import React, { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useApp } from "../../../context/AppContext";
import { useSocket } from "../../../context/SocketContext";
import Header from "../../common/Header/Header";
import CreatePoll from "../CreatePoll/CreatePoll";
import LiveResults from "../LiveResults/LiveResults";
import Chat from "../../common/Chat/Chat";
import styles from "./TeacherDashboard.module.css";
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const TeacherDashboard = () => {
  const { state, dispatch } = useApp();
  const { socket } = useSocket();
  const { currentPoll, teacherDashboardView } = state;
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useLocalStorage('teacherSessionId', null);

  useEffect(() => {
    // Join as teacher when component mounts
    if (socket) {
      console.log("Joining as teacher...");
      socket.emit("teacher:join", {}, (response) => {
        console.log("Teacher join response:", response);
        if (response?.success && response.data?.sessionId) {
          console.log("Setting teacher sessionId:", response.data.sessionId);
          setSessionId(response.data.sessionId);
        }
      });
    }
  }, [socket, setSessionId]);

  useEffect(() => {
    // Switch to results view when a poll is active, or back to create when poll ends
    if (currentPoll) {
      dispatch({ type: "SET_TEACHER_DASHBOARD_VIEW", payload: "results" });
    } else if (teacherDashboardView === "results") {
      // If we're on results view but no active poll, switch to create
      dispatch({ type: "SET_TEACHER_DASHBOARD_VIEW", payload: "create" });
    }
  }, [currentPoll, dispatch, teacherDashboardView]);

  const handleViewHistory = () => {
    navigate('/teacher/history');
  };

  const renderContent = () => {
    switch (teacherDashboardView) {
      case "create":
        return <CreatePoll />;
      case "results":
        return <LiveResults />;
      default:
        return <CreatePoll />;
    }
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.placeholder}></div>
          <button 
            className={styles.viewHistoryBtn} 
            onClick={handleViewHistory}
          >
            <svg
              className={styles.eyeIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            View Poll history
          </button>
        </div>
        <div className={styles.main}>{renderContent()}</div>
      </div>

      <Chat />
    </div>
  );
};

export default TeacherDashboard;