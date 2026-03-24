'use client';

import { useRouter } from 'next/navigation';

const MOCK_CALLS = [
  { id: '1', name: 'Sarah Chen', type: 'incoming', callType: 'voice', time: '2026-03-24T09:30:00Z', duration: '5:23', missed: false },
  { id: '2', name: 'Alex Kumar', type: 'outgoing', callType: 'video', time: '2026-03-24T08:15:00Z', duration: '12:45', missed: false },
  { id: '3', name: 'Maya Patel', type: 'incoming', callType: 'voice', time: '2026-03-23T18:00:00Z', duration: null, missed: true },
  { id: '4', name: 'Jake Wilson', type: 'outgoing', callType: 'voice', time: '2026-03-23T14:20:00Z', duration: '2:10', missed: false },
  { id: '5', name: 'Dev Team', type: 'incoming', callType: 'video', time: '2026-03-22T11:00:00Z', duration: '45:02', missed: false },
  { id: '6', name: 'Design Squad', type: 'incoming', callType: 'voice', time: '2026-03-21T16:30:00Z', duration: null, missed: true },
];

const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';
const getAvatarColor = (name) => {
  const colors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatCallTime = (dateStr) => {
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

export default function CallsPage() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div className="glass-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'var(--sp-4) var(--sp-4) var(--sp-3)',
      }}>
        <h1 className="text-headline">Calls</h1>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-icon btn-ghost">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </div>
      </div>

      {/* Call List */}
      <div className="main-content" style={{ padding: '0 var(--sp-4)' }}>
        <span className="text-label" style={{ color: 'var(--on-surface-variant)', fontSize: '0.65rem', display: 'block', marginBottom: 'var(--sp-2)' }}>RECENT</span>
        {MOCK_CALLS.map(call => (
          <div key={call.id} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
            padding: 'var(--sp-3) 0', cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
          }}>
            {/* Avatar */}
            <div className="avatar" style={{ background: getAvatarColor(call.name), width: 48, height: 48, fontSize: '1rem' }}>
              {getInitials(call.name)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: call.missed ? 'var(--danger)' : 'var(--on-surface)' }}>
                {call.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                {/* Direction arrow */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={call.missed ? 'var(--danger)' : call.type === 'incoming' ? 'var(--accent)' : 'var(--primary)'} strokeWidth="2" strokeLinecap="round">
                  {call.type === 'incoming' ? (
                    <path d="M17 7L7 17M7 17V7M7 17h10"/>
                  ) : (
                    <path d="M7 17L17 7M17 7v10M17 7H7"/>
                  )}
                </svg>
                <span>{call.missed ? 'Missed' : call.duration}</span>
              </div>
            </div>

            {/* Time + Call button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <span suppressHydrationWarning style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>
                {formatCallTime(call.time)}
              </span>
              <button className="btn btn-icon btn-ghost" style={{ width: 36, height: 36 }}>
                {call.callType === 'video' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => router.push('/chat')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>Chats</span>
        </button>
        <button className="nav-item active" onClick={() => router.push('/calls')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
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
