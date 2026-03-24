'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Mock data for demo (works without backend)
// Use static dates to avoid SSR hydration issues
const MOCK_CHATS = [
  { id: '1', type: 'direct', name: 'Sarah Chen', avatarUrl: null, isPinned: true, isMuted: false, unreadCount: 3, otherUser: { isOnline: true, fullName: 'Sarah Chen' }, lastMessage: { content: 'typing...', type: 'text', createdAt: '2026-03-24T09:53:00Z' } },
  { id: '2', type: 'direct', name: 'Alex Kumar', avatarUrl: null, isPinned: true, isMuted: false, unreadCount: 0, otherUser: { isOnline: false, fullName: 'Alex Kumar' }, lastMessage: { content: '📷 Photo', type: 'image', createdAt: '2026-03-24T08:53:00Z' } },
  { id: '3', type: 'group', name: 'Dev Team', avatarUrl: null, isPinned: false, isMuted: false, unreadCount: 12, memberCount: 5, lastMessage: { content: 'Maya: Let\'s ship this!', type: 'text', createdAt: '2026-03-24T07:53:00Z' } },
  { id: '4', type: 'direct', name: 'Maya Patel', avatarUrl: null, isPinned: false, isMuted: false, unreadCount: 0, otherUser: { isOnline: true, fullName: 'Maya Patel' }, lastMessage: { content: 'Sounds good! See you tomorrow 👋', type: 'text', createdAt: '2026-03-23T09:53:00Z' } },
  { id: '5', type: 'direct', name: 'Jake Wilson', avatarUrl: null, isPinned: false, isMuted: true, unreadCount: 1, otherUser: { isOnline: false, fullName: 'Jake Wilson' }, lastMessage: { content: '🎵 Voice message (0:42)', type: 'voice', createdAt: '2026-03-22T09:53:00Z' } },
  { id: '6', type: 'group', name: 'Design Squad', avatarUrl: null, isPinned: false, isMuted: false, unreadCount: 0, memberCount: 8, lastMessage: { content: 'Emma: New mockups uploaded!', type: 'text', createdAt: '2026-03-21T09:53:00Z' } },
];

const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';
const getAvatarColor = (name) => {
  const colors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatTime = (dateStr) => {
  if (typeof window === 'undefined') return ''; // Return empty on server
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (diff < 172800000) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function ChatListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState(MOCK_CHATS);
  const [search, setSearch] = useState('');

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const regularChats = filteredChats.filter(c => !c.isPinned);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div className="glass-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'var(--sp-4) var(--sp-4) var(--sp-3)',
      }}>
        <h1 className="text-headline">Chats</h1>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-icon btn-ghost">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
          <button className="btn btn-icon btn-ghost">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 var(--sp-4) var(--sp-3)' }}>
        <input
          id="chat-search"
          className="input-field"
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: 'var(--surface-container)' }}
        />
      </div>

      {/* Chat List */}
      <div className="main-content">
        {/* Pinned */}
        {pinnedChats.length > 0 && (
          <div style={{ padding: '0 var(--sp-4)' }}>
            <span className="text-label" style={{ color: 'var(--on-surface-variant)', fontSize: '0.65rem' }}>PINNED</span>
            {pinnedChats.map(chat => (
              <ChatRow key={chat.id} chat={chat} onClick={() => router.push(`/chat/${chat.id}`)} />
            ))}
          </div>
        )}

        {/* Regular chats */}
        <div style={{ padding: '0 var(--sp-4)' }}>
          {pinnedChats.length > 0 && regularChats.length > 0 && (
            <span className="text-label" style={{ color: 'var(--on-surface-variant)', fontSize: '0.65rem', display: 'block', marginTop: 'var(--sp-3)' }}>ALL CHATS</span>
          )}
          {regularChats.map(chat => (
            <ChatRow key={chat.id} chat={chat} onClick={() => router.push(`/chat/${chat.id}`)} />
          ))}
        </div>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => router.push('/contacts')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
      </button>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item active" onClick={() => router.push('/chat')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span>Chats</span>
        </button>
        <button className="nav-item" onClick={() => router.push('/calls')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>Calls</span>
        </button>
        <button className="nav-item" onClick={() => router.push('/status')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Status</span>
        </button>
        <button className="nav-item" onClick={() => router.push('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}

function ChatRow({ chat, onClick }) {
  const isTyping = chat.lastMessage?.content === 'typing...';

  return (
    <div
      id={`chat-row-${chat.id}`}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
        padding: 'var(--sp-3) 0',
        cursor: 'pointer',
        transition: 'background var(--transition-fast)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Avatar */}
      <div className={`avatar ${chat.otherUser?.isOnline ? 'avatar-online' : ''}`}
        style={{ background: getAvatarColor(chat.name), width: 52, height: 52, fontSize: '1.1rem' }}>
        {chat.type === 'group' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        ) : getInitials(chat.name)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }} className="truncate">{chat.name}</span>
          <span suppressHydrationWarning style={{ fontSize: '0.7rem', color: chat.unreadCount > 0 ? 'var(--primary)' : 'var(--on-surface-variant)', flexShrink: 0, marginLeft: 8 }}>
            {formatTime(chat.lastMessage?.createdAt)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span className="truncate" style={{
            fontSize: '0.8rem',
            color: isTyping ? 'var(--accent)' : 'var(--on-surface-variant)',
            fontStyle: isTyping ? 'italic' : 'normal',
          }}>
            {isTyping ? (
              <span>typing<span className="typing-dots" style={{ marginLeft: 2 }}><span></span><span></span><span></span></span></span>
            ) : (
              <>
                {chat.unreadCount === 0 && chat.type === 'direct' && <span className="tick tick-read">✓✓ </span>}
                {chat.lastMessage?.content}
              </>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', flexShrink: 0, marginLeft: 8 }}>
            {chat.isMuted && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--on-surface-variant)" opacity="0.5"><path d="M16.5 12A4.5 4.5 0 0 0 14 8.07V4.5a2.5 2.5 0 0 0-5 0v3.57A4.5 4.5 0 0 0 7.5 12a4.5 4.5 0 0 0 2 3.75V19h5v-3.25A4.5 4.5 0 0 0 16.5 12z"/></svg>
            )}
            {chat.unreadCount > 0 && <span className="badge">{chat.unreadCount}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
