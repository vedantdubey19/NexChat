# NexChat 🚀

> **Connect. Chat. Share.** — A modern real-time messaging application.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React, CSS Custom Properties |
| **Backend** | Node.js, Express, Socket.IO |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (Access + Refresh tokens), bcrypt |
| **Real-time** | Socket.IO WebSockets |
| **Cache** | Redis |
| **DevOps** | Docker Compose |

## Architecture

```
NexChat/
├── Backend/          # Node.js + Express API & Socket.IO server
│   ├── src/
│   │   ├── config/   # Database configuration
│   │   ├── db/       # SQL schema
│   │   ├── middleware/# JWT authentication
│   │   ├── routes/   # REST API routes (10 modules)
│   │   ├── socket/   # WebSocket event handlers
│   │   ├── app.js    # Express application
│   │   └── server.js # HTTP + Socket.IO server
│   └── package.json
├── Frontend/         # Next.js 14 web application
│   └── src/
│       ├── app/      # Pages (splash, auth, chat, settings, profile)
│       ├── context/  # React Context (Auth)
│       └── lib/      # API wrapper, Socket.IO client
├── Docker/           # Docker Compose configuration
│   └── docker-compose.yml
└── Mobile/           # Expo React Native (scaffolding)
```

## Features

- ✅ **Real-time Messaging** — WebSocket-powered instant messaging
- ✅ **Group Chats** — Create groups, add members, @mentions
- ✅ **Message Status** — Sent, delivered, read ticks
- ✅ **Typing Indicators** — Real-time "typing..." status
- ✅ **Media Sharing** — Image, video, audio, file uploads (50MB)
- ✅ **Status/Stories** — 24-hour ephemeral statuses
- ✅ **Voice/Video Calls** — Call signaling via WebSockets
- ✅ **User Search** — Find users by username or name
- ✅ **Privacy Controls** — Last seen, profile photo, read receipts
- ✅ **Dark Mode** — Full dark/light theme support
- ✅ **JWT Auth** — Access + refresh token rotation
- ✅ **Contact Management** — Add, search, block contacts

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 16 (or Docker)
- npm

### Option 1: Docker (Recommended)

```bash
cd Docker
docker-compose up -d
```

App will be available at `http://localhost:3000`.

### Option 2: Manual Setup

**1. Database**
```bash
# Create PostgreSQL database
createdb nexchat
psql nexchat < Backend/src/db/schema.sql
```

**2. Backend**
```bash
cd Backend
cp .env.example .env   # Edit with your DB credentials
npm install
npm run dev             # Starts on port 3001
```

**3. Frontend**
```bash
cd Frontend
npm install
npm run dev             # Starts on port 3000
```

## API Endpoints

| Module | Endpoints |
|--------|----------|
| **Auth** | `POST /api/auth/register`, `/login`, `/refresh`, `/logout` |
| **Users** | `GET /api/users/profile`, `PUT /api/users/profile`, `GET /api/users/search` |
| **Chats** | `GET /api/chats`, `POST /api/chats`, `GET /api/chats/:id/messages` |
| **Messages** | `POST /api/messages`, `PUT /api/messages/:id/react`, `DELETE /api/messages/:id` |
| **Groups** | `POST /api/groups`, `GET /api/groups/:id`, `PUT /api/groups/:id` |
| **Media** | `POST /api/media/upload`, `GET /api/media/:chatId` |
| **Status** | `POST /api/status`, `GET /api/status/feed`, `GET /api/status/:id/viewers` |
| **Contacts** | `GET /api/contacts`, `POST /api/contacts/sync`, `GET /api/contacts/search` |
| **Calls** | `POST /api/calls/initiate`, `GET /api/calls/history` |
| **Settings** | `GET /api/settings`, `PUT /api/settings`, `PUT /api/settings/privacy` |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|------------|
| `message:send` | Client → Server | Send a new message |
| `message:new` | Server → Client | New message broadcast |
| `message:delivered` | Client → Server | Mark message delivered |
| `message:seen` | Client → Server | Mark message read |
| `message:status` | Server → Client | Message status update |
| `typing:start` | Bidirectional | Typing indicator on |
| `typing:stop` | Bidirectional | Typing indicator off |
| `user:online` | Server → Client | User came online |
| `user:offline` | Server → Client | User went offline |
| `call:initiate` | Client → Server | Start a call |
| `call:incoming` | Server → Client | Incoming call notification |
| `call:answer` | Client → Server | Answer a call |
| `call:end` | Client → Server | End a call |

## Database Schema

13 tables: `users`, `user_settings`, `contacts`, `chats`, `chat_members`, `messages`, `message_status`, `message_reactions`, `media`, `statuses`, `status_viewers`, `calls`, `sessions`

See [`Backend/src/db/schema.sql`](Backend/src/db/schema.sql) for the full DDL.

## Design System

Built on the "NexChat Lumina" design language:
- **Primary**: `#2563EB` (Blue)
- **Accent**: `#10B981` (Emerald)
- **Danger**: `#EF4444` (Red)
- **Typography**: Inter font family
- **Surfaces**: Tonal layering (no harsh borders)
- **Animations**: Spring-based micro-interactions

## License

MIT
