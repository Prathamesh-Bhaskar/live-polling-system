import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import { useSocket } from "../../../context/SocketContext";
import PollResults from "../../common/PollResults/PollResults";
import styles from "./LiveResults.module.css";

const LiveResults = () => {
  const { state, dispatch } = useApp();
  const { socket } = useSocket();
  const { currentPoll, pollResults, connectedStudents } = state;
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();

  const handleNewQuestion = () => {
    // Check if all connected students have submitted their votes
    // Handle different possible data structures for pollResults
    const voterCount = pollResults.voterCount ?? pollResults.totalVotes ?? 0;
    const totalConnectedStudents =
      pollResults.connectedStudents ?? connectedStudents.length;

    console.log("Checking votes:", {
      voterCount,
      totalConnectedStudents,
      pollResults,
    });

    // If there are connected students but not all have voted, show warning
    if (totalConnectedStudents > 0 && voterCount < totalConnectedStudents) {
      setShowWarning(true);
      return;
    }

    // Hide warning if it was shown before
    setShowWarning(false);

    // All students have answered (or no students connected), end poll and redirect to create
    socket?.emit("teacher:end_poll", {}, (response) => {
      console.log("End poll response:", response);
      if (response?.success) {
        // Reset poll and navigate to create view atomically
        dispatch({ type: "RESET_POLL_AND_GO_TO_CREATE" });
      } else {
        console.error("Failed to end poll:", response);
      }
    });
  };

  const handleViewHistory = () => {
    navigate('/teacher/history');
  };

  if (!currentPoll) {
    return (
      <div className={styles.noPoll}>
        <p>No active poll. Create a new poll to see results.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PollResults />

      <div className={styles.actions}>
        <button className={styles.newQuestionBtn} onClick={handleNewQuestion}>
          + Ask a new question
        </button>
      </div>

      {showWarning && (
        <div className={styles.warning}>
          Not all students have answered yet! (
          {pollResults.voterCount ?? pollResults.totalVotes ?? 0}/
          {pollResults.connectedStudents ?? connectedStudents.length} students
          have voted)
        </div>
      )}
    </div>
  );
};

export default LiveResults;