import React from 'react'
import { useApp } from '../../../context/AppContext'
import styles from './PollResults.module.css'

const PollResults = () => {
  const { state } = useApp()
  const { currentPoll, pollResults } = state

  // Debug log to inspect structure
  //console.log('PollResults debug:', { pollResults, currentPoll })

  if (!currentPoll || !pollResults) {
    return <div>No results available</div>
  }

  // Use pollResults.results if available, otherwise fallback to pollResults
  const results = pollResults.results || pollResults
  const totalVotes = pollResults.totalVotes ?? Object.values(results).reduce((sum, count) => sum + Number(count), 0)

  const getPercentage = (count) => {
    if (!totalVotes || totalVotes === 0) return 0
    return Math.round((count / totalVotes) * 100)
  }

  const getBarWidth = (count) => {
    if (!totalVotes || totalVotes === 0) return 0
    return (count / totalVotes) * 100
  }

  return (
    <div className={styles.container}>
      <div className={styles.resultsCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>Question</h2>
        </div>

        <div className={styles.question}>
          {currentPoll.question}
        </div>

        <div className={styles.results}>
          {currentPoll.options.map((option, index) => {
            const count = Number(results[option]) || 0
            const percentage = getPercentage(count)
            const barWidth = getBarWidth(count)

            // Debug log
            //console.log('option:', option, 'count:', count, 'percentage:', percentage, 'barWidth:', barWidth)

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
                  {percentage}%
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.footer}>
          <span className={styles.totalVotes}>
            Total votes: {totalVotes}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PollResults
