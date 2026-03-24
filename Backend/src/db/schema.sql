-- NexChat Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    bio VARCHAR(500) DEFAULT '',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER SETTINGS
-- ============================================
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_seen_visibility VARCHAR(20) DEFAULT 'everyone', -- everyone, contacts, nobody
    profile_photo_visibility VARCHAR(20) DEFAULT 'everyone',
    read_receipts BOOLEAN DEFAULT true,
    typing_indicators BOOLEAN DEFAULT true,
    notification_messages BOOLEAN DEFAULT true,
    notification_groups BOOLEAN DEFAULT true,
    notification_calls BOOLEAN DEFAULT true,
    theme VARCHAR(10) DEFAULT 'light', -- light, dark, system
    language VARCHAR(10) DEFAULT 'en',
    font_size VARCHAR(10) DEFAULT 'medium', -- small, medium, large
    media_auto_download BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTACTS
-- ============================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100),
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, contact_user_id)
);

-- ============================================
-- CHATS (1:1 and Group)
-- ============================================
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(10) NOT NULL DEFAULT 'direct', -- direct, group
    name VARCHAR(100), -- For group chats
    description VARCHAR(500),
    avatar_url VARCHAR(500),
    created_by UUID REFERENCES users(id),
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT MEMBERS
-- ============================================
CREATE TABLE chat_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- admin, member
    is_muted BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    type VARCHAR(20) DEFAULT 'text', -- text, image, video, audio, file, voice, system
    reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}', -- For file info, image dimensions, etc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGE STATUS (delivery/read receipts)
-- ============================================
CREATE TABLE message_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) DEFAULT 'sent', -- sent, delivered, read
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- ============================================
-- MESSAGE REACTIONS
-- ============================================
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- ============================================
-- MEDIA
-- ============================================
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    type VARCHAR(20) NOT NULL, -- image, video, audio, file
    filename VARCHAR(255),
    size_bytes BIGINT,
    mime_type VARCHAR(100),
    width INT,
    height INT,
    duration_seconds INT,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STATUS / STORIES
-- ============================================
CREATE TABLE statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'text', -- text, image, video
    content TEXT,
    media_url VARCHAR(500),
    background_color VARCHAR(20),
    font_style VARCHAR(20),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE status_viewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status_id UUID NOT NULL REFERENCES statuses(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(status_id, viewer_id)
);

-- ============================================
-- CALL HISTORY
-- ============================================
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    callee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL, -- voice, video
    status VARCHAR(20) DEFAULT 'initiated', -- initiated, ringing, answered, ended, missed, declined
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SESSIONS (for JWT refresh tokens)
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_message_status_message_id ON message_status(message_id);
CREATE INDEX idx_statuses_user_id ON statuses(user_id);
CREATE INDEX idx_statuses_expires_at ON statuses(expires_at);
CREATE INDEX idx_calls_caller_id ON calls(caller_id);
CREATE INDEX idx_calls_callee_id ON calls(callee_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_media_message_id ON media(message_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
