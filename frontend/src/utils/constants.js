export const SOCKET_EVENTS = {
    // Student events
    STUDENT_JOIN: 'student:join',
    STUDENT_VOTE: 'student:vote',
    STUDENT_DISCONNECT: 'student:disconnect',
    
    // Teacher events
    TEACHER_JOIN: 'teacher:join',
    TEACHER_CREATE_POLL: 'teacher:create_poll',
    TEACHER_END_POLL: 'teacher:end_poll',
    TEACHER_KICK_STUDENT: 'teacher:kick_student',
    TEACHER_GET_HISTORY: 'teacher:get_history',
    
    // Broadcast events
    POLL_STARTED: 'poll:started',
    POLL_ENDED: 'poll:ended',
    POLL_RESULTS: 'poll:results',
    TIMER_UPDATE: 'timer:update',
    STUDENTS_UPDATED: 'students:updated',
    
    // Chat events
    CHAT_SEND_MESSAGE: 'chat:send_message',
    CHAT_MESSAGE: 'chat:message'
  }
  
  export const USER_TYPES = {
    TEACHER: 'teacher',
    STUDENT: 'student'
  }
  
  export const POLL_STATES = {
    WAITING: 'waiting',
    ACTIVE: 'active',
    ENDED: 'ended'
  }