# Live Polling System 📊

A real-time polling application that enables teachers to create polls and students to participate with live results visualization.

## 🚀 Features

### Teacher Features
- Create new polls with multiple choice questions
- View live polling results in real-time
- Control poll timing (60-second default)
- Manage student participation
- Access chat functionality
- View past poll results

### Student Features
- Join with unique name (per tab session)
- Answer polls within time limit (60 seconds)
- View live results after submitting
- Participate in chat with teacher and other students
- Real-time updates via WebSocket

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- Socket.io Client

**Backend:**
- Node.js
- Express.js
- Socket.io
- Real-time WebSocket connections

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd live-polling-system
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../live
npm install
```

4. **Environment Setup**
```bash
# Backend - create .env file
cd backend
echo "PORT=3001" > .env
```

## 🚀 Running the Application

1. **Start Backend Server**
```bash
cd backend
npm start
# Server runs on http://localhost:3001
```

2. **Start Frontend Development Server**
```bash
cd live
npm run dev
# Frontend runs on http://localhost:5173
```


## 📁 Project Structure

```
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── routes/   # API routes
│   │   └── ...
├── live/             # React frontend
│   ├── src/
│   └── ...
└── README.md
```

## 🌐 Deployment

The application is designed for easy deployment on platforms like:
- Frontend: Vercel
- Backend: Render
## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is created as part of an SDE internship assignment.

---

**Made with ❤️ for real-time learning experiences**
