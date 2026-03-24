# 🚀 NexChat – Real-Time Messaging Platform

NexChat is a modern real-time chat application inspired by WhatsApp, built to deliver fast, secure, and scalable communication across web and mobile platforms.

---

## ✨ Features

* 💬 Real-time messaging (1:1 & group chat)
* 🟢 Online/Offline user presence
* 📎 Media sharing (images, files)
* 🔔 Push notifications
* 📞 Voice & Video calling (Agora/Twilio integration)
* 🔐 End-to-end encryption (planned)
* ⚡ Fast and scalable architecture

---

## 🏗️ Tech Stack

### Frontend

* React.js / Next.js
* Tailwind CSS
* Redux / Context API

### Backend

* Node.js
* Express.js

### Real-Time Communication

* Socket.IO / WebSockets

### Database

* MongoDB / Firebase Firestore

### Services

* Firebase (Authentication & Notifications)
* Agora / Twilio (Calling)

---

## 📁 Project Structure

NexChat/
├── Frontend/       # Frontend (React)
├── Backend/        # Backend (Node.js)
├── Mobile/         # Mobile App (optional)
├── Docker/         # Docker setup
├── README.md

---

## ⚙️ Installation & Setup

### 1. Clone the repository

git clone https://github.com/vedantdubey19/NexChat.git
cd NexChat

### 2. Install dependencies

Backend:
cd Backend
npm install

Frontend:
cd ../Frontend
npm install

---

### 3. Environment Variables

Create a `.env` file in Backend:

PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret

FIREBASE_API_KEY=your_key

AGORA_APP_ID=your_id
AGORA_APP_CERTIFICATE=your_certificate

---

### 4. Run the project

Start Backend:
cd Backend
npm run dev

Start Frontend:
cd Frontend
npm start

---

## 🔮 Future Improvements

* 🔐 End-to-End Encryption
* 🤖 AI Chat Integration
* 🌍 Multi-language support
* 📊 Admin Dashboard

---

## 🤝 Contributing

Fork → Clone → Create Branch → Commit → Push → Pull Request

---

## 👨‍💻 Author

Vedant Dubey
GitHub: https://github.com/vedantdubey19

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
