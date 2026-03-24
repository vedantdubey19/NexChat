'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const MOCK_STATUSES = [
  { id: '1', user: 'Maya Patel', time: '2026-03-24T09:00:00Z', viewed: false, content: '🚀 Just shipped the new feature!', bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: '2', user: 'Alex Kumar', time: '2026-03-24T08:30:00Z', viewed: false, content: '☕ Morning vibes', bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: '3', user: 'Sarah Chen', time: '2026-03-24T07:00:00Z', viewed: true, content: '📚 Reading "Clean Code" — highly recommend!', bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: '4', user: 'Jake Wilson', time: '2026-03-23T22:00:00Z', viewed: true, content: '🎸 Jam session tonight 🎶', bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
];

const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';
const getAvatarColor = (name) => {
  const colors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatStatusTime = (dateStr) => {
  if (typeof window === 'undefined') return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return 'Yesterday';
};

export default function StatusPage() {
  const router = useRouter();
  const { user } = useAuth();

  const recentStatuses = MOCK_STATUSES.filter(s => !s.viewed);
  const viewedStatuses = MOCK_STATUSES.filter(s => s.viewed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div className="glass-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'var(--sp-4) var(--sp-4) var(--sp-3)',
      }}>
        <h1 className="text-headline">Status</h1>
      </div>

      <div className="main-content" style={{ padding: '0 var(--sp-4)' }}>
        {/* My Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
          padding: 'var(--sp-3) 0', cursor: 'pointer',
        }}>
          <div style={{ position: 'relative' }}>
            <div className="avatar" style={{ background: 'var(--gradient-primary)', width: 52, height: 52, fontSize: '1.1rem' }}>
              {user?.fullName?.charAt(0) || 'V'}
            </div>
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--primary)', border: '2px solid var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>My Status</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Tap to add status update</div>
          </div>
        </div>

        {/* Recent */}
        {recentStatuses.length > 0 && (
          <>
            <span className="text-label" style={{ color: 'var(--on-surface-variant)', fontSize: '0.65rem', display: 'block', marginTop: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>RECENT UPDATES</span>
            {recentStatuses.map(status => (
              <div key={status.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                padding: 'var(--sp-3) 0', cursor: 'pointer',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  padding: 2,
                  background: 'var(--gradient-primary)',
                }}>
                  <div className="avatar" style={{ background: getAvatarColor(status.user), width: '100%', height: '100%', fontSize: '1rem', border: '2px solid var(--surface)' }}>
                    {getInitials(status.user)}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{status.user}</div>
                  <div suppressHydrationWarning style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{formatStatusTime(status.time)}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Viewed */}
        {viewedStatuses.length > 0 && (
          <>
            <span className="text-label" style={{ color: 'var(--on-surface-variant)', fontSize: '0.65rem', display: 'block', marginTop: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>VIEWED UPDATES</span>
            {viewedStatuses.map(status => (
              <div key={status.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                padding: 'var(--sp-3) 0', cursor: 'pointer',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  padding: 2,
                  background: 'var(--outline-variant)',
                }}>
                  <div className="avatar" style={{ background: getAvatarColor(status.user), width: '100%', height: '100%', fontSize: '1rem', border: '2px solid var(--surface)', opacity: 0.7 }}>
                    {getInitials(status.user)}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', opacity: 0.7 }}>{status.user}</div>
                  <div suppressHydrationWarning style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{formatStatusTime(status.time)}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => router.push('/chat')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>Chats</span>
        </button>
        <button className="nav-item" onClick={() => router.push('/calls')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>Calls</span>
        </button>
        <button className="nav-item active" onClick={() => router.push('/status')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
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
