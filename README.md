---
title: NexChat
emoji: 💬
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 🚀 NexChat — AI-Powered Real-Time Chat Platform

<div align="center">

<h3>Modern Full-Stack AI Chat Application with Authentication, Real-Time Messaging & Intelligent Conversations</h3>

![GitHub stars](https://img.shields.io/github/stars/vedantdubey19/NexChat?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/vedantdubey19/NexChat?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/vedantdubey19/NexChat?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

## 📖 About The Project

NexChat is a modern AI-powered chat platform designed to deliver intelligent and seamless conversations through a clean user interface and scalable backend architecture.

Built using modern web technologies, NexChat combines secure authentication, real-time communication, AI integration, and responsive design to provide an engaging user experience.

Whether you're exploring AI applications, building conversational systems, or learning full-stack development, NexChat serves as a powerful foundation for modern chat solutions.

---

## ✨ Key Features

### 🤖 AI-Powered Conversations
- Intelligent AI chat responses
- Context-aware interactions
- Fast response generation
- Multiple AI model support ready

### 🔐 Authentication & Security
- Secure user registration
- JWT authentication
- Protected routes
- Session management
- OAuth integration support

### 💬 Real-Time Communication
- Instant messaging experience
- Dynamic chat updates
- Persistent conversations
- Chat history management

### 👤 User Experience
- Modern responsive UI
- Mobile-friendly design
- Smooth navigation
- Clean chat interface
- Optimized performance

### ⚡ Performance
- Fast API responses
- Optimized database queries
- Scalable architecture
- Efficient state management

---

# 🏗️ System Architecture

```text
┌─────────────────────────┐
│        Frontend         │
│   React / Next.js UI    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      Backend API        │
│   Node.js + Express     │
└────────────┬────────────┘
             │
 ┌───────────┴───────────┐
 ▼                       ▼
┌───────────┐      ┌─────────────┐
│ MongoDB   │      │ AI Provider │
│ Database  │      │ OpenAI API  │
└───────────┘      └─────────────┘

---

# 🛠 Tech Stack

## Frontend
- React.js
- TypeScript
- Tailwind CSS
- Axios
- Modern UI Components

## Backend
- Node.js
- Express.js
- JWT Authentication
- REST APIs

## Database
- MongoDB
- Mongoose ODM

## Authentication
- JWT Tokens
- OAuth Support
- Secure Sessions

## AI Integration
- OpenAI API
- Extensible AI Architecture

## Deployment
- Vercel
- Render
- Railway
- MongoDB Atlas

---

# 📂 Project Structure

```bash
NexChat/
│
├── client/
│   ├── public/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── assets/
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── utils/
│
├── docs/
├── screenshots/
├── .env.example
├── package.json
└── README.md

---

# ⚙️ Getting Started

## Prerequisites

Make sure you have installed:

- Node.js (v18+)
- npm or yarn
- MongoDB
- Git

Verify installation:

```bash
node -v
npm -v
git --version

---

# 📥 Installation

### Clone Repository

```bash
git clone https://github.com/vedantdubey19/NexChat.git

### Navigate To Project

```bash
cd NexChat

### Install Dependencies

```bash
npm install

or

```bash
yarn install

---

# 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# AI Provider
OPENAI_API_KEY=your_openai_api_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Webhook Secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

---

# ▶️ Running The Project

### Development Mode

```bash
npm run dev

### Backend Only

```bash
npm run server

### Frontend Only

```bash
npm run client

---

# 🌐 API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile

## Chat

```http
GET    /api/chat
POST   /api/chat
DELETE /api/chat/:id

## AI

```http
POST /api/ai/generate

---

# 📊 Database Design

```text
Users
│
├── id
├── name
├── email
├── password
├── avatar
└── createdAt

Chats
│
├── id
├── userId
├── messages
├── createdAt
└── updatedAt

Messages
│
├── id
├── sender
├── content
├── timestamp
└── conversationId

---

# 🚀 Deployment

## Frontend Deployment

### Vercel

```bash
npm run build

Deploy build folder to Vercel.

---

## Backend Deployment

### Render

1. Connect GitHub repository
2. Configure environment variables
3. Deploy Node.js service

---

## Database Deployment

### MongoDB Atlas

1. Create Cluster
2. Generate Connection String
3. Add Network Access
4. Configure Environment Variables

---

# 📸 Screenshots

Add project screenshots here:

![Home Page](screenshots/home.png)

![Chat Interface](screenshots/chat.png)

![Authentication](screenshots/login.png)

---

# 🎯 Future Enhancements

- Voice Chat Support
- File Sharing
- Group Conversations
- AI Memory
- Multi-Model AI Support
- Push Notifications
- Dark/Light Theme Toggle
- Mobile Application
- End-to-End Encryption

---

# 🤝 Contributing

Contributions are welcome!

### Steps

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/amazing-feature

3. Commit your changes

```bash
git commit -m "Add amazing feature"

4. Push to branch

```bash
git push origin feature/amazing-feature

5. Open a Pull Request

---

# 👨‍💻 Developer

## Vedant Dubey

Aspiring Software Engineer | AI Engineer | Full-Stack Developer

### Connect With Me

- GitHub: https://github.com/vedantdubey19
- LinkedIn: https://linkedin.com/in/vedantdubey19

---

# ⭐ Show Your Support

If you found this project useful:

⭐ Star the repository

🍴 Fork the repository

📢 Share it with others

---

# 📜 License

Distributed under the MIT License.

---

<div align="center">

### 🚀 Building Intelligent Conversations With NexChat

Made with ❤️ by Vedant Dubey

</div>
