# 💬 NexChat — Real-Time Messaging Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Socket.IO-4.8-white?style=for-the-badge&logo=socket.io" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" />
</p>

NexChat is a full-stack, WhatsApp-style real-time messaging web application. It supports direct and group chats, voice & video calls, online presence, OTP-based authentication, and a responsive mobile-first UI — all running on a modern, self-hosted stack.

---

## ✨ Features

- 💬 **Real-time messaging** — 1:1 and group chats powered by Socket.IO
- 🟢 **Online presence** — live online/offline/last-seen status
- 📌 **Pinned & muted chats** — organize conversations your way
- 🔔 **Read receipts** — single ✓ sent, double ✓✓ delivered, blue ✓✓ read
- ✍️ **Typing indicators** — see when someone is typing in real time
- 📞 **Voice & Video calls** — browser-based calling with mic/camera access
- 🔐 **OTP verification** — secure signup & login with email/phone one-time codes
- 🌗 **Light / Dark mode** — toggle with preference saved to localStorage
- 🔍 **Global user search** — find any user and start a chat instantly
- 🖥️ **WhatsApp Web layout** — responsive split-pane design for desktop and mobile
- 🐳 **Docker support** — spin up the entire stack with one command

---

## 🏗️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| **Next.js 16** | React framework with App Router |
| **Vanilla CSS** | Custom WhatsApp-style design system |
| **Socket.IO Client** | Real-time event handling |
| **Context API** | Auth & global state management |

### Backend
| Tech | Purpose |
|------|---------|
| **Node.js 20 + Express** | REST API server |
| **Socket.IO 4.8** | WebSocket real-time engine |
| **PostgreSQL 16** | Primary database |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT access & refresh tokens |
| **multer** | File upload handling |
| **helmet + rate-limit** | Security middleware |

### Infrastructure
| Tech | Purpose |
|------|---------|
| **Docker + Compose** | Containerised deployment |
| **PostgreSQL** | Persistent data storage |

---

## 📁 Project Structure

```
NexChat/
├── Frontend/                  # Next.js web app
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── auth/          # Login & Signup
│   │   │   ├── chat/          # Chat list & chat room
│   │   │   ├── calls/         # Call history
│   │   │   ├── status/        # Status updates
│   │   │   ├── settings/      # App settings
│   │   │   └── profile/       # User profile
│   │   ├── components/        # Shared components (MainLayout)
│   │   ├── context/           # AuthContext (user, calls, theme)
│   │   └── lib/               # API helper & Socket client
│   └── Dockerfile
│
├── Backend/                   # Express API + Socket server
│   ├── src/
│   │   ├── routes/            # auth, chats, users, settings, calls, contacts
│   │   ├── middleware/        # JWT authenticate, optionalAuth
│   │   ├── socket/            # Socket.IO event handlers
│   │   ├── config/            # Database connection
│   │   └── db/schema.sql      # PostgreSQL schema
│   └── Dockerfile
│
├── Docker/
│   └── docker-compose.yml     # Runs postgres + backend + frontend
│
└── README.md
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally (or use Docker)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/vedantdubey19/NexChat.git
cd NexChat
```

### 2. Setup Backend

```bash
cd Backend
npm install
cp .env.example .env   # then edit .env with your values
npm run dev            # starts on http://localhost:3001
```

**Backend `.env` variables:**

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexchat
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### 3. Setup Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE nexchat;"

# Run schema
psql -U postgres -d nexchat -f Backend/src/db/schema.sql
```

### 4. Setup Frontend

```bash
cd Frontend
npm install
npm run dev            # starts on http://localhost:3000
```

**Frontend `.env.local` variables:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## 🐳 Docker Setup (Recommended)

Run the **entire stack** (PostgreSQL + Backend + Frontend) with a single command:

```bash
cd Docker
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| PostgreSQL | localhost:5432 |

To stop:
```bash
docker-compose down
```

To wipe database and start fresh:
```bash
docker-compose down -v
```

---

## 🔐 Authentication Flow

1. **Register** → enter name, username, email/phone + password
2. **OTP sent** → 6-digit code logged in backend terminal (dev mode)
3. **Verify OTP** → account activated, JWT tokens issued
4. **Login** → identifier (email / phone / username) + password
5. **Token refresh** → access token auto-refreshed on 401

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/chats` | Get all chats |
| POST | `/api/chats` | Create / find direct chat |
| GET | `/api/chats/:id/messages` | Get messages |
| GET | `/api/users/search?q=` | Search users globally |
| GET | `/api/users/profile` | Get own profile |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update settings |

---

## 🔮 Roadmap

- [ ] 🔐 End-to-end encryption
- [ ] 🖼️ Image & file sharing in chat
- [ ] 📊 Admin dashboard
- [ ] 📱 React Native mobile app
- [ ] 🤖 AI chat assistant integration
- [ ] 🌍 Multi-language support

---

## 🤝 Contributing

```bash
# Fork → Clone → Branch → Commit → Push → Pull Request
git checkout -b feature/your-feature
git commit -m "add: your feature"
git push origin feature/your-feature
```

---

## 👨‍💻 Author

**Vedant Dubey**
- GitHub: [@vedantdubey19](https://github.com/vedantdubey19)

---

## ⭐ Support

If you find this project useful, give it a ⭐ on [GitHub](https://github.com/vedantdubey19/NexChat)!
