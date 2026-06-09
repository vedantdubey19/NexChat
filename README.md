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

1. **Register**: User enters full name, username, password, and optional email or phone.
2. **OTP Verification**:
   - OTP codes are generated for provided email/phone (valid for 10 minutes).
   - In production, email OTP is dispatched via Resend. In development, OTP is printed to the server terminal.
3. **Activation**: On verification of OTP, the user is marked active, and JWT tokens (access + refresh) are issued.
4. **Login**: Login accepts username, email, or phone. Unverified accounts trigger new OTP issuance.
5. **Token Rotation**: Client refreshes the access token using `/api/auth/refresh` on token expiration.

---

## 📡 API Endpoints

All endpoints require a JWT bearer token in the `Authorization` header (`Bearer <token>`) except registration, login, and OTP verification/resend.

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate username/email/phone + password |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP code to activate user and issue tokens |
| `POST` | `/api/auth/resend-otp` | Resend new email/phone OTP |
| `POST` | `/api/auth/refresh` | Rotate refresh token and get a new access token |
| `POST` | `/api/auth/logout` | Terminate session and go offline |

### Users & Profiles (`/api/users`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/users/profile` | Retrieve own profile info along with counts |
| `PUT` | `/api/users/profile` | Update profile fields (name, bio, avatar url, email, etc.) |
| `GET` | `/api/users/search?q=` | Global search users by name or username (min 2 characters) |
| `PUT` | `/api/users/change-password` | Update account password |

### Contact Management (`/api/contacts`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/contacts` | Get user's contacts list (excluding blocked users) |
| `POST` | `/api/contacts/sync` | Add/sync a contact user by ID |
| `GET` | `/api/contacts/search?q=` | Search within contacts list |

### Chat Conversations (`/api/chats`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/chats` | Get all user chats (includes type, pin/mute/archive details) |
| `POST` | `/api/chats` | Create or retrieve a direct 1:1 chat |
| `GET` | `/api/chats/:id/messages` | Fetch chat messages (paginated) |
| `PUT` | `/api/chats/:id/pin` | Pin / unpin chat |
| `PUT` | `/api/chats/:id/mute` | Mute / unmute notifications |
| `PUT` | `/api/chats/:id/archive` | Archive / unarchive chat |
| `DELETE` | `/api/chats/:id` | Delete conversation (leaves chat room) |

### Group Chats (`/api/groups`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/groups` | Create group chat with initial members |
| `GET` | `/api/groups/:id` | Fetch group info and member list |
| `PUT` | `/api/groups/:id` | Update group info (name, description, avatar) |
| `POST` | `/api/groups/:id/members` | Add new member(s) to group |
| `DELETE` | `/api/groups/:id/members/:userId` | Remove member from group |

### Messages & Reactions (`/api/messages`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/messages` | Send message (text, media metadata, or reply reference) |
| `PUT` | `/api/messages/:id/react` | Toggle an emoji reaction on a message |
| `PUT` | `/api/messages/:id` | Edit message content |
| `DELETE` | `/api/messages/:id` | Soft delete a message |

### Media Uploads (`/api/media`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/media/upload` | Upload file attachment (multer upload, max 50MB) |
| `GET` | `/api/media/:chatId` | Get all shared files and media in a chat |

### Status Stories (`/api/status`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/status` | Create status/story (expires in 24 hours) |
| `GET` | `/api/status/feed` | Retrieve active status feed from contacts |
| `GET` | `/api/status/:id/viewers` | Get list of users who viewed a status |

### Call Log (`/api/calls`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/calls/initiate` | Log initiated voice/video call |
| `GET` | `/api/calls/history` | Get call logs (limited to 50 entries) |

### Settings (`/api/settings`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/settings` | Retrieve user preferences (theme, language, privacy, etc.) |
| `PUT` | `/api/settings` | Update general preferences (theme, language, font, etc.) |
| `PUT` | `/api/settings/privacy` | Update privacy rules (last seen, read receipts, etc.) |
| `PUT` | `/api/settings/notifications` | Toggle notification triggers |

---

## ⚡ Socket.IO Real-time Events

NexChat uses Socket.IO for real-time messaging, typing events, and WebRTC signaling. The server handles token authentication on connect.

### Message Events
* **`message:send`** (Client → Server)
  - Sends a chat message.
  - Payload: `{ chatId: string, content: string, type: string, replyTo?: string, metadata?: object }`
* **`message:new`** (Server → Client)
  - Broadcasts new message to chat room.
* **`message:delivered`** (Client → Server)
  - Updates delivery status when a message arrives.
* **`message:seen`** (Client → Server)
  - Updates status when user reads a message.
* **`message:status`** (Server → Client)
  - Relays receipt updates (`delivered` or `read`) to chat members.
* **`message:edit`** / **`message:delete`** (Server → Client)
  - Informs clients of modified content or soft-deleted messages.

### Typing Indicators
* **`typing:start`** (Client → Server) / (Server → Client)
  - Triggers typing indicator in chat. Payload: `{ chatId }`
* **`typing:stop`** (Client → Server) / (Server → Client)
  - Clears typing indicator in chat. Payload: `{ chatId }`

### User Presence
* **`user:online`** / **`user:offline`** (Server → Client)
  - Broadcasts contact presence changes to all online users.

### WebRTC Calling Signals
* **`call:initiate`** (Client → Server) / **`call:incoming`** (Server → Client)
  - Signals caller is calling callee.
* **`call:answer`** (Client → Server) / **`call:answered`** (Server → Client)
  - Signals callee has accepted call.
* **`call:offer`** (Client ↔ Server ↔ Client)
  - Transmits WebRTC local description offer to callee.
* **`call:answer-sdp`** (Client ↔ Server ↔ Client)
  - Transmits WebRTC remote description answer to caller.
* **`call:candidate`** (Client ↔ Server ↔ Client)
  - Relays WebRTC ICE candidate candidates.
* **`call:end`** (Client → Server) / **`call:ended`** (Server → Client)
  - Terminates the call.

---

## 🗄️ Database Schema

NexChat uses a normalized PostgreSQL schema designed for integrity and querying speed:

```
                                  +-------------------+
                                  |       users       |<-----------------------+
                                  +-------------------+                        |
                                    |        |      ^                          |
                                    |        |      | (uploader)               |
  +-----------------------+         |        |  +---+------------------+       |
  |     user_settings     |---------+        |  |      user_otps       |       |
  +-----------------------+                  |  +----------------------+       |
                                             v                                 v (viewer)
  +-----------------------+         +------------------+             +--------------------+
  |       contacts        |-------->|      media       |             |   status_viewers   |
  +-----------------------+         +------------------+             +--------------------+
                                             ^                                 |
                                             | (message_id)                    v (status_id)
  +-----------------------+         +------------------+             +--------------------+
  |         chats         |<--------|     messages     |<------------|      statuses      |
  +-----------------------+         +------------------+             +--------------------+
     |                                |              |
     v (chat_id)                      v (message_id) v (message_id)
  +-----------------------+         +----------------+
  |     chat_members      |         | message_status |
  +-----------------------+         +----------------+
                                           |
                                           v
                                    +----------------+
                                    |message_reactions|
                                    +----------------+
```

### Tables Overview
1. **`users`**: Contains account profiles (`username`, `email`, `phone`, password hash, online state, and `last_seen`).
2. **`user_settings`**: Stores custom visibility, notification toggles, UI theme, and layout preferences.
3. **`user_otps`**: Manages verification codes, types, and expiry timestamps.
4. **`contacts`**: Handles peer lists with custom nicknames and block flags.
5. **`chats`**: Defines conversations (both direct `1:1` and multi-user `group` chats).
6. **`chat_members`**: Bridges users to chats; manages permissions (`admin`/`member`), notifications (`mute`), and chat feeds (`pin`).
7. **`messages`**: Contains chat logs (supports text, media attachments, replies, edits, and soft deletions).
8. **`message_status`**: Manages read receipts (`sent` ✓, `delivered` ✓✓, and `read` ✓✓).
9. **`message_reactions`**: Maps user emoji reactions to individual messages.
10. **`media`**: Tracks uploaded file sizes, file paths, dimensions, and mime-types.
11. **`statuses`**: Implements 24-hour ephemeral text/image/video stories.
12. **`status_viewers`**: Logs viewer lists and view times for stories.
13. **`calls`**: Logs RTC voice & video call records (states: `initiated`, `ringing`, `answered`, `ended`, `missed`, `declined`).
14. **`sessions`**: Keeps user JWT sessions (device info, IP, and expires date).

---

## 📞 WebRTC Calling Architecture

NexChat supports WebRTC voice and video calls through a hybrid peer-to-peer and signaling layout:

```
 Caller Client                       Signaling plane                      Callee Client
 -------------                       ---------------                      -------------
  getUserMedia()
  POST /calls/initiate ------------> Database (logs call)
  socket.emit('call:initiate') ----> Socket.IO server -------------> socket.emit('call:incoming')
                                                                      getUserMedia()
                                                                      socket.emit('call:answer')
  socket.emit('call:answered') <----- Socket.IO server <-------------
  
  // PeerConnection Negotiation
  createPeerConnection()
  addTrack(localStream)
  createOffer()
  socket.emit('call:offer') --------> Socket.IO server -------------> socket.emit('call:offer')
                                                                      createPeerConnection()
                                                                      addTrack(localStream)
                                                                      setRemoteDescription(offer)
                                                                      createAnswer()
                                                                      socket.emit('call:answer-sdp')
  socket.emit('call:answer-sdp') <--- Socket.IO server <-------------
  setRemoteDescription(answer)
  
  // ICE candidate updates
  onicecandidate -------------------> Socket.IO server -------------> addIceCandidate()
  addIceCandidate() <---------------- Socket.IO server <------------- onicecandidate
  
  ========================= PEER-TO-PEER MEDIA CHANNEL ESTABLISHED =========================
```

1. **Signaling**: The Socket.IO server acts as the signaling channel, relaying SDP offers, SDP answers, and ICE candidates between clients.
2. **Media Stream Acquisition**: Client uses browser `navigator.mediaDevices.getUserMedia` to acquire mic and camera access.
3. **Connection Hook**: An active `RTCPeerConnection` is negotiated using Google STUN servers (`stun.l.google.com:19302`) to traverse NAT firewall tables.
4. **Mock Fallback**: If a chat is initiated with a simulated/mock user (e.g. testing), the Call Overlay switches to active status after a 3-second simulation delay for testing UI call states.

---

## 🔮 Roadmap

- [ ] 🔐 End-to-end encryption
- [x] 🖼️ Image & file sharing in chat (using media API upload)
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
