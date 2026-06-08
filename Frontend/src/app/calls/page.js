'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

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
    <MainLayout activeTab="calls">
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

          <h1 className="text-headline" style={{ flex: 1, color: 'var(--on-surface)', fontSize: '1.2rem', paddingLeft: 4 }}>Calls</h1>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <button className="btn btn-icon btn-ghost" style={{ color: 'var(--on-surface-variant)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          </div>
        </div>

        {/* Call List */}
        <div className="scroll-y" style={{ flex: 1, padding: '16px 24px' }}>
          <span className="text-label" style={{ color: 'var(--primary)', fontSize: '0.68rem', display: 'block', marginBottom: 12, fontWeight: 600 }}>RECENT</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {MOCK_CALLS.map(call => (
              <div key={call.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 8,
                background: 'var(--surface-container-lowest)',
                boxShadow: 'var(--shadow-sm)',
                borderBottom: '1px solid var(--outline-variant)',
              }}>
                {/* Avatar */}
                <div className="avatar" style={{ background: getAvatarColor(call.name), width: 44, height: 44, fontSize: '0.9rem' }}>
                  {getInitials(call.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: call.missed ? 'var(--danger)' : 'var(--on-surface)' }}>
                    {call.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>
                    {/* Direction arrow */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={call.missed ? 'var(--danger)' : call.type === 'incoming' ? 'var(--accent)' : 'var(--primary)'} strokeWidth="2.5" strokeLinecap="round">
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span suppressHydrationWarning style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>
                    {formatCallTime(call.time)}
                  </span>
                  <button className="btn btn-icon btn-ghost" style={{ width: 36, height: 36, color: 'var(--primary)' }}>
                    {call.callType === 'video' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
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
