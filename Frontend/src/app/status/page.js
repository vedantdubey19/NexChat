'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/MainLayout';

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
    <MainLayout activeTab="status">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--background)' }}>
        {/* Header */}
        <div className="glass-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: 'var(--surface-container-high)',
          borderBottom: '1px solid var(--outline-variant)', height: 60, flexShrink: 0
        }}>
          {/* Back Button (shown on mobile, hidden on desktop) */}
          <button 
            onClick={() => router.push('/chat')} 
            className="back-btn-responsive btn btn-icon btn-ghost" 
            style={{ width: 36, height: 36, flexShrink: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>

          <h1 className="text-headline" style={{ flex: 1, color: 'var(--on-surface)', fontSize: '1.2rem', paddingLeft: 4 }}>Status</h1>
        </div>

        {/* Content */}
        <div className="scroll-y" style={{ flex: 1, padding: '16px 24px' }}>
          {/* My Status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 8,
            background: 'var(--surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 20
          }}>
            <div style={{ position: 'relative' }}>
              <div className="avatar" style={{ background: 'var(--gradient-primary)', width: 48, height: 48, fontSize: '1rem' }}>
                {user?.fullName?.charAt(0) || 'V'}
              </div>
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 20, height: 20, borderRadius: '50%',
                background: '#00a884', border: '2px solid var(--surface-container-lowest)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--on-surface)' }}>My Status</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Tap to add status update</div>
            </div>
          </div>

          {/* Recent */}
          {recentStatuses.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <span className="text-label" style={{ color: 'var(--primary)', fontSize: '0.68rem', display: 'block', marginBottom: 12, fontWeight: 600 }}>RECENT UPDATES</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recentStatuses.map(status => (
                  <div key={status.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 8,
                    background: 'var(--surface-container-lowest)',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      padding: 2,
                      background: 'var(--gradient-primary)',
                    }}>
                      <div className="avatar" style={{ background: getAvatarColor(status.user), width: '100%', height: '100%', fontSize: '0.9rem', border: '2px solid var(--surface-container-lowest)' }}>
                        {getInitials(status.user)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--on-surface)' }}>{status.user}</div>
                      <div suppressHydrationWarning style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>{formatStatusTime(status.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Viewed */}
          {viewedStatuses.length > 0 && (
            <div>
              <span className="text-label" style={{ color: 'var(--on-surface-variant)', fontSize: '0.68rem', display: 'block', marginBottom: 12, fontWeight: 600 }}>VIEWED UPDATES</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {viewedStatuses.map(status => (
                  <div key={status.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 8,
                    background: 'var(--surface-container-lowest)',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: 0.85
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      padding: 2,
                      background: 'var(--outline-variant)',
                    }}>
                      <div className="avatar" style={{ background: getAvatarColor(status.user), width: '100%', height: '100%', fontSize: '0.9rem', border: '2px solid var(--surface-container-lowest)' }}>
                        {getInitials(status.user)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--on-surface)' }}>{status.user}</div>
                      <div suppressHydrationWarning style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>{formatStatusTime(status.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .back-btn-responsive {
          display: none !important;
        }
        @media (max-width: 767px) {
          .back-btn-responsive {
            display: flex !important;
          }
        }
      `}</style>
    </MainLayout>
  );
}
