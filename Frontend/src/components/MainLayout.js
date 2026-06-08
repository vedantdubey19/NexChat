'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { get, post } from '@/lib/api';
import { getSocket } from '@/lib/socket';


const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';
const getAvatarColor = (name) => {
  const colors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatTime = (dateStr) => {
  if (typeof window === 'undefined') return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (diff < 172800000) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function MainLayout({ children, activeTab = 'chats', activeChatId = null }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatError, setChatError] = useState(false);
  const [globalUsers, setGlobalUsers] = useState([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Load and persist theme
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('nexchat-theme') : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('nexchat-theme', next ? 'dark' : 'light');
  };

  // Global search effect
  useEffect(() => {
    if (search.trim().length < 2) {
      setGlobalUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingGlobal(true);
        const results = await get(`/users/search?q=${encodeURIComponent(search)}`);
        setGlobalUsers(results || []);
      } catch (err) {
        console.warn('Global user search failed:', err);
      } finally {
        setSearchingGlobal(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const handleStartChat = async (targetUser) => {
    try {
      setLoading(true);
      const res = await post('/chats', { userId: targetUser.id });
      setSearch('');
      setGlobalUsers([]);
      await fetchChats();
      router.push(`/chat/${res.chatId}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const existingChatUserIds = new Set(
    chats
      .filter(c => c.type === 'direct' && c.otherUser)
      .map(c => c.otherUser.id)
  );

  const uniqueGlobalUsers = globalUsers.filter(u => !existingChatUserIds.has(u.id));

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setChatError(false);
      const data = await get('/chats');
      setChats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load chats:', err);
      setChatError(true);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();

    const socket = getSocket();
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleNewMessage = (msg) => {
      setChats((prev) => {
        const index = prev.findIndex(c => c.id === msg.chatId);
        if (index !== -1) {
          const updated = [...prev];
          const targetChat = { ...updated[index] };
          targetChat.lastMessage = {
            id: msg.id,
            content: msg.content,
            type: msg.type,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
          };
          if (msg.senderId !== user?.id && String(msg.chatId) !== String(activeChatId)) {
            targetChat.unreadCount = (targetChat.unreadCount || 0) + 1;
          } else {
            targetChat.unreadCount = 0;
          }
          updated.splice(index, 1);
          return [targetChat, ...updated];
        } else {
          fetchChats();
          return prev;
        }
      });
    };

    const handleUserOnline = ({ userId }) => {
      setChats((prev) => prev.map(c => 
        c.type === 'direct' && c.otherUser?.id === userId 
          ? { ...c, otherUser: { ...c.otherUser, isOnline: true } } 
          : c
      ));
    };

    const handleUserOffline = ({ userId }) => {
      setChats((prev) => prev.map(c => 
        c.type === 'direct' && c.otherUser?.id === userId 
          ? { ...c, otherUser: { ...c.otherUser, isOnline: false } } 
          : c
      ));
    };

    const handleTypingStart = ({ chatId, userId }) => {
      setChats((prev) => prev.map(c => 
        c.id === chatId && userId !== user?.id
          ? { ...c, isTyping: true } 
          : c
      ));
    };

    const handleTypingStop = ({ chatId, userId }) => {
      setChats((prev) => prev.map(c => 
        c.id === chatId && userId !== user?.id
          ? { ...c, isTyping: false } 
          : c
      ));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [user, fetchChats, activeChatId]);

  useEffect(() => {
    if (activeChatId) {
      setChats((prev) => prev.map(c => 
        String(c.id) === String(activeChatId)
          ? { ...c, unreadCount: 0 }
          : c
      ));
    }
  }, [activeChatId]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Backend logout failed, routing anyway:', err);
    }
    router.push('/auth/login');
  };

  const filteredChats = chats.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const regularChats = filteredChats.filter(c => !c.isPinned);

  const isRoomActive = pathname.startsWith('/chat/') && pathname !== '/chat';

  return (
    <div className={`split-layout ${isRoomActive ? 'in-room' : 'in-list'}`}>
      {/* LEFT SIDEBAR: Chat List & Search */}
      <aside className="sidebar-pane">
        {/* Sidebar Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'var(--surface-container-high)',
          borderBottom: '1px solid var(--outline-variant)', height: 60, flexShrink: 0
        }}>
          {/* User Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>
              {getInitials(user?.fullName || 'V')}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--on-surface)' }}>
              {user?.fullName?.split(' ')[0] || 'NexChat'}
            </span>
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Status Button */}
            <button className="btn-ghost" onClick={() => router.push('/status')} title="Status" style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" strokeDasharray="6 3" />
              </svg>
            </button>
            {/* Calls Button */}
            <button className="btn-ghost" onClick={() => router.push('/calls')} title="Calls" style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72" />
              </svg>
            </button>
            {/* Light / Dark Toggle */}
            <button
              id="theme-toggle-btn"
              className="btn-ghost"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}
            >
              {isDark ? (
                /* Sun icon – switch to light */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                /* Moon icon – switch to dark */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            {/* Settings Button */}
            <button className="btn-ghost" onClick={() => router.push('/settings')} title="Settings" style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            {/* Logout Button */}
            <button className="btn-ghost" onClick={handleLogout} title="Log Out" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Search Bar */}
        <div style={{ padding: '8px 12px', background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container-high)', borderRadius: 8, padding: '4px 10px', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              id="layout-sidebar-search"
              type="text"
              placeholder="Search or start new chat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, fontSize: '0.85rem', color: 'var(--on-surface)', outline: 'none', border: 'none', height: 28 }}
            />
          </div>
        </div>

        {/* Sidebar Scrollable Chats List */}
        <div className="scroll-y" style={{ flex: 1, paddingBottom: 64 }}>
          {loading && chats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>Loading conversations...</div>
          ) : (
            <>
              {/* Pinned */}
              {pinnedChats.length > 0 && (
                <div>
                  <span className="text-label" style={{ color: 'var(--primary)', fontSize: '0.65rem', display: 'block', padding: '10px 16px 4px 16px', fontWeight: 600 }}>PINNED</span>
                  {pinnedChats.map(c => (
                    <SidebarChatRow key={c.id} chat={c} activeChatId={activeChatId} onClick={() => router.push(`/chat/${c.id}`)} />
                  ))}
                </div>
              )}
              
              {/* All Chats */}
              {regularChats.length > 0 && (
                <div>
                  {pinnedChats.length > 0 && (
                    <span className="text-label" style={{ color: 'var(--on-surface-variant)', fontSize: '0.65rem', display: 'block', padding: '10px 16px 4px 16px', fontWeight: 600 }}>ALL CHATS</span>
                  )}
                  {regularChats.map(c => (
                    <SidebarChatRow key={c.id} chat={c} activeChatId={activeChatId} onClick={() => router.push(`/chat/${c.id}`)} />
                  ))}
                </div>
              )}

              {/* Empty state — no chats yet */}
              {!loading && !chatError && filteredChats.length === 0 && search.trim().length < 2 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'var(--surface-container-high)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 4,
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--on-surface)' }}>No conversations yet</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                    Search for a friend above<br/>to start your first chat
                  </p>
                </div>
              )}

              {/* Error state */}
              {!loading && chatError && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '40px 24px', textAlign: 'center', gap: 10,
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Could not load chats</p>
                  <button
                    onClick={fetchChats}
                    style={{
                      fontSize: '0.78rem', color: 'var(--primary)', background: 'none',
                      border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline',
                    }}
                  >Retry</button>
                </div>
              )}

              {/* Global Search Results */}
              {search.trim().length >= 2 && (
                <div style={{ borderTop: '1px solid var(--outline-variant)', marginTop: 8 }}>
                  <span className="text-label" style={{ color: '#00a884', fontSize: '0.65rem', display: 'block', padding: '12px 16px 4px 16px', fontWeight: 600 }}>
                    GLOBAL SEARCH
                  </span>
                  {searchingGlobal ? (
                    <div style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Searching NexChat users...</div>
                  ) : uniqueGlobalUsers.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>No users found matching &quot;{search}&quot;</div>
                  ) : (
                    uniqueGlobalUsers.map(u => (
                      <div 
                        key={u.id}
                        onClick={() => handleStartChat(u)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                          cursor: 'pointer', borderBottom: '1px solid var(--outline-variant)',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-container-low)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Avatar */}
                        <div className="avatar" style={{ background: getAvatarColor(u.fullName), width: 38, height: 38, fontSize: '0.8rem' }}>
                          {u.fullName.split(' ').map(w => w[0]).join('').toUpperCase() || '?'}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--on-surface)' }}>{u.fullName}</span>
                            {u.isOnline && <span style={{ fontSize: '0.68rem', color: '#00a884', fontWeight: 600 }}>Online</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }} className="truncate">@{u.username}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Bottom Navigation Tab Bar */}
        <nav className="bottom-nav" style={{ display: 'none' }}>
          <button className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => router.push('/chat')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Chats</span>
          </button>
          <button className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`} onClick={() => router.push('/calls')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72"/></svg>
            <span>Calls</span>
          </button>
          <button className={`nav-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => router.push('/status')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Status</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => router.push('/settings')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>Settings</span>
          </button>
        </nav>

        {/* Media Query styles to handle display of bottom nav on mobile */}
        <style jsx>{`
          @media (max-width: 767px) {
            nav.bottom-nav {
              display: flex !important;
            }
          }
        `}</style>
      </aside>

      {/* RIGHT DETAIL PANE: Content goes here */}
      <main className="detail-pane">
        {children}
      </main>
    </div>
  );
}

function SidebarChatRow({ chat, activeChatId, onClick }) {
  const isActive = String(chat.id) === String(activeChatId);
  const initials = getInitials(chat.name);
  const avatarBg = chat.avatarUrl ? 'transparent' : getAvatarColor(chat.name);

  // Message ticks
  const getTick = (status) => {
    switch (status) {
      case 'read': return <span style={{ color: '#53bdeb', marginLeft: 2 }}>✓✓</span>;
      case 'delivered': return <span style={{ color: 'var(--on-surface-variant)', opacity: 0.6, marginLeft: 2 }}>✓✓</span>;
      case 'sent': return <span style={{ color: 'var(--on-surface-variant)', opacity: 0.4, marginLeft: 2 }}>✓</span>;
      default: return null;
    }
  };

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      cursor: 'pointer', background: isActive ? 'var(--surface-container-high)' : 'transparent',
      borderBottom: '1px solid var(--outline-variant)', transition: 'background 0.1s ease',
    }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--surface-container-low)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Profile Photo */}
      <div style={{ position: 'relative' }}>
        <div className="avatar" style={{ background: avatarBg, width: 48, height: 48 }}>
          {chat.avatarUrl ? (
            <img src={chat.avatarUrl} alt={chat.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        {chat.type === 'direct' && chat.otherUser?.isOnline && (
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 11, height: 11, borderRadius: '50%',
            background: '#00a884', border: '2px solid var(--surface)',
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {chat.name}
          </div>
          {chat.lastMessage && (
            <span style={{ fontSize: '0.7rem', color: chat.unreadCount > 0 ? 'var(--accent)' : 'var(--on-surface-variant)' }}>
              {formatTime(chat.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            fontSize: '0.8rem', color: chat.unreadCount > 0 ? 'var(--on-surface)' : 'var(--on-surface-variant)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8,
            fontStyle: chat.isTyping ? 'italic' : 'normal',
            fontWeight: chat.unreadCount > 0 ? 500 : 400
          }}>
            {chat.isTyping ? (
              <span style={{ color: '#00a884' }}>typing...</span>
            ) : chat.lastMessage ? (
              <>
                {chat.lastMessage.senderId === chat.otherUser?.id ? null : getTick(chat.lastMessage.status)}
                <span style={{ marginLeft: 2 }}>{chat.lastMessage.content}</span>
              </>
            ) : (
              'No messages yet'
            )}
          </div>
          {chat.unreadCount > 0 && (
            <span style={{
              background: '#00a884', color: 'white', borderRadius: '50%',
              fontSize: '0.7rem', fontWeight: 'bold', minWidth: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            }}>
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
