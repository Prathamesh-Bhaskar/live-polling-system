Live Polling System 📊
A real-time polling application that enables teachers to create polls and students to participate with live results visualization.
🚀 Features
Teacher Features

Create new polls with multiple choice questions
View live polling results in real-time
Control poll timing (60-second default)
Manage student participation
Access chat functionality
View past poll results

Student Features

Join with unique name (per tab session)
Answer polls within time limit (60 seconds)
View live results after submitting
Participate in chat with teacher and other students
Real-time updates via WebSocket

🛠️ Tech Stack
Frontend:

React 18
Vite
Socket.io Client

Backend:

Node.js
Express.js
Socket.io
Real-time WebSocket connections

📦 Installation
Prerequisites

Node.js (v14 or higher)
npm or yarn

Setup

Clone the repository

bashgit clone <repository-url>
cd live-polling-system

Install Backend Dependencies

bashcd backend
npm install

Install Frontend Dependencies

bashcd ../live
npm install

Environment Setup

bash# Backend - create .env file
cd backend
echo "PORT=3001" > .env
🚀 Running the Application

Start Backend Server

bashcd backend
npm start
# Server runs on http://localhost:3001

Start Frontend Development Server

bashcd live
npm run dev
