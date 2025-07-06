const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
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
  STUDENT_JOINED: 'student:joined',
  STUDENT_LEFT: 'student:left',
  STUDENT_KICKED: 'student:kicked',
  
  // Chat events
  CHAT_SEND_MESSAGE: 'chat:send_message',
  CHAT_MESSAGE: 'chat:message',
};

const USER_TYPES = {
  TEACHER: 'teacher',
  STUDENT: 'student',
};

const POLL_STATUS = {
  ACTIVE: 'active',
  ENDED: 'ended',
  DRAFT: 'draft',
};

const REDIS_KEYS = {
  ACTIVE_POLL: 'active_poll',
  POLL_VOTES: 'poll_votes',
  POLL_VOTERS: 'poll_voters',
  CONNECTED_STUDENTS: 'connected_students',
  TEACHER_SESSION: 'teacher_session',
  CHAT_MESSAGES: 'chat_messages',
};

const DEFAULT_POLL_DURATION = 60; // seconds
const MAX_POLL_DURATION = 300; // 5 minutes
const MIN_POLL_DURATION = 10; // 10 seconds
const MAX_POLL_OPTIONS = 6;
const MIN_POLL_OPTIONS = 2;
const MAX_QUESTION_LENGTH = 500;
const MAX_OPTION_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;
const MAX_STUDENT_NAME_LENGTH = 50;

const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT || '3600'); // 1 hour

module.exports = {
  SOCKET_EVENTS,
  USER_TYPES,
  POLL_STATUS,
  REDIS_KEYS,
  DEFAULT_POLL_DURATION,
  MAX_POLL_DURATION,
  MIN_POLL_DURATION,
  MAX_POLL_OPTIONS,
  MIN_POLL_OPTIONS,
  MAX_QUESTION_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_STUDENT_NAME_LENGTH,
  SESSION_TIMEOUT,
}; 