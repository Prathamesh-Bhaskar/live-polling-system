export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  export const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }
  
  export const validatePollData = (question, options) => {
    if (!question.trim()) {
      return { isValid: false, error: 'Question is required' }
    }
    
    if (question.length > 500) {
      return { isValid: false, error: 'Question is too long' }
    }
    
    const validOptions = options.filter(opt => opt.trim())
    if (validOptions.length < 2) {
      return { isValid: false, error: 'At least 2 options are required' }
    }
    
    if (validOptions.length > 6) {
      return { isValid: false, error: 'Maximum 6 options allowed' }
    }
    
    return { isValid: true }
  }
  
  export const sanitizeMessage = (message) => {
    return message.trim().replace(/<[^>]*>/g, '')
  }