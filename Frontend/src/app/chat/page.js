'use client';

import MainLayout from '@/components/MainLayout';

export default function ChatListPage() {
  return (
    <MainLayout activeTab="chats">
      {/* Welcome Screen Placeholder (WhatsApp Web style) */}
      <div className="chat-bg" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, padding: '40px',
        textAlign: 'center', height: '100%', position: 'relative',
        background: 'var(--surface-container-low)',
      }}>
        <div style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {/* SVG Illustration */}
          <div style={{
            width: 250, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--outline)', opacity: 0.6, marginBottom: 20
          }}>
            <svg width="200" height="150" viewBox="0 0 240 180" fill="none">
              {/* Computer Screen */}
              <rect x="20" y="20" width="140" height="96" rx="6" stroke="currentColor" strokeWidth="4" />
              <line x1="90" y1="116" x2="90" y2="136" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <line x1="60" y1="136" x2="120" y2="136" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              {/* Phone overlapping */}
              <rect x="150" y="60" width="50" height="90" rx="8" fill="var(--surface-container-lowest)" stroke="currentColor" strokeWidth="4" />
              <circle cx="175" cy="135" r="4" fill="currentColor" />
              <line x1="168" y1="70" x2="182" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              {/* Chat bubbles */}
              <path d="M70,50 L110,50 C113,50 115,52 115,55 L115,65 C115,68 113,70 110,70 L78,70 L70,76 L70,50" fill="var(--primary-light)" />
              <circle cx="85" cy="60" r="2" fill="var(--primary)" />
              <circle cx="92" cy="60" r="2" fill="var(--primary)" />
              <circle cx="99" cy="60" r="2" fill="var(--primary)" />
            </svg>
          </div>

          <h1 className="text-display" style={{
            fontSize: '2rem', fontWeight: 300, color: 'var(--on-surface)',
            letterSpacing: '-0.5px'
          }}>
            NexChat Web
          </h1>

          <p style={{
            fontSize: '0.88rem', color: 'var(--on-surface-variant)',
            lineHeight: 1.6, textRendering: 'optimizeLegibility'
          }}>
            Send and receive messages in real-time. Keep your chats, calls, and statuses synchronized. Initiate high-quality voice/video calls directly from your web browser.
          </p>

          <div style={{
            width: '100%', height: '1px', background: 'var(--outline-variant)',
            margin: '20px 0', opacity: 0.8
          }} />

          {/* E2E encryption label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.75rem', color: 'var(--on-surface-variant)',
            opacity: 0.7, justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
