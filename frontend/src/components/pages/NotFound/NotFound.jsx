import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../../common/Header/Header'
import styles from './NotFound.module.css'

const NotFound = () => {
  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <p className={styles.message}>Page not found</p>
        <Link to="/" className={styles.homeLink}>
          Go back to home
        </Link>
      </div>
    </div>
  )
}

export default NotFound