'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

const MOCK_MESSAGES = [
  { id: '1', senderId: 'other', sender: { fullName: 'Sarah Chen' }, content: 'Hey! How\'s the project going? 🚀', type: 'text', createdAt: '2024-01-15T10:30:00Z', status: 'read' },
  { id: '2', senderId: 'me', content: 'Going great! Just finished the backend API', type: 'text', createdAt: '2024-01-15T10:32:00Z', status: 'read' },
  { id: '3', senderId: 'other', sender: { fullName: 'Sarah Chen' }, content: 'That\'s awesome! Can you show me a demo later today?', type: 'text', createdAt: '2024-01-15T10:33:00Z', status: 'read' },
  { id: '4', senderId: 'me', content: 'Sure! I\'ll set up a call around 3 PM. The real-time messaging is working perfectly with Socket.IO 💬', type: 'text', createdAt: '2024-01-15T10:35:00Z', status: 'read' },
  { id: '5', senderId: 'other', sender: { fullName: 'Sarah Chen' }, content: 'Perfect! I\'ll also review the design docs you shared', type: 'text', createdAt: '2024-01-15T10:36:00Z', status: 'read' },
  { id: '6', senderId: 'me', content: 'Sounds good. I\'ve also added dark mode support 🌙', type: 'text', createdAt: '2024-01-15T10:38:00Z', status: 'delivered' },
  { id: '7', senderId: 'other', sender: { fullName: 'Sarah Chen' }, content: 'Nice! Our users have been requesting that for a while', type: 'text', createdAt: '2024-01-15T10:40:00Z', status: 'read' },
  { id: '8', senderId: 'me', content: 'Yeah, it uses CSS custom properties so the whole theme switches instantly ⚡', type: 'text', createdAt: '2024-01-15T10:41:00Z', status: 'sent' },
];

const formatMessageTime = (dateStr) => {
  if (typeof window === 'undefined') return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getTick = (status) => {
  switch (status) {
    case 'read': return <span className="tick tick-read">✓✓</span>;
    case 'delivered': return <span className="tick tick-delivered">✓✓</span>;
    case 'sent': return <span className="tick tick-sent">✓</span>;
    default: return null;
  }
};

export default function ChatViewPage() {
  const router = useRouter();
  const params = useParams();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      senderId: 'me',
      content: input,
      type: 'text',
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Chat Header */}
      <div className="glass-header" style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
        padding: 'var(--sp-3) var(--sp-4)',
      }}>
        <button onClick={() => router.push('/chat')} className="btn btn-icon btn-ghost" style={{ width: 36, height: 36 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>

        <div className="avatar avatar-online" style={{ background: '#2563EB', width: 40, height: 40, fontSize: '0.85rem' }}>SC</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Sarah Chen</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>
            {isTyping ? (
              <span>typing<span className="typing-dots" style={{ marginLeft: 2 }}><span></span><span></span><span></span></span></span>
            ) : 'Online'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
          <button className="btn btn-icon btn-ghost" style={{ width: 36, height: 36 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
          <button className="btn btn-icon btn-ghost" style={{ width: 36, height: 36 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>
          <button className="btn btn-icon btn-ghost" style={{ width: 36, height: 36 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--sp-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-2)',
        scrollbarWidth: 'none',
      }}>
        {/* Date header */}
        <div style={{
          textAlign: 'center', padding: 'var(--sp-2)',
          fontSize: '0.7rem', color: 'var(--on-surface-variant)',
          background: 'color-mix(in srgb, var(--surface-container) 60%, transparent)',
          borderRadius: 'var(--radius-full)', alignSelf: 'center',
          padding: 'var(--sp-1) var(--sp-3)',
        }}>
          Today
        </div>

        {messages.map(msg => (
          <div key={msg.id}
            className={msg.senderId === 'me' ? 'bubble bubble-outgoing' : 'bubble bubble-incoming'}
          >
            <div>{msg.content}</div>
            <div className="bubble-time">
              <span suppressHydrationWarning>{formatMessageTime(msg.createdAt)}</span>
              {msg.senderId === 'me' && <> {getTick(msg.status)}</>}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="bubble bubble-incoming" style={{ padding: 'var(--sp-2) var(--sp-4)' }}>
            <div className="typing-dots"><span></span><span></span><span></span></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{
        padding: 'var(--sp-3) var(--sp-4)',
        background: 'var(--surface-container-lowest)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 'var(--sp-2)',
        borderTop: '1px solid color-mix(in srgb, var(--outline-variant) 15%, transparent)',
      }}>
        <button className="btn btn-icon btn-ghost" style={{ width: 36, height: 36, flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            id="message-input"
            className="input-field"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              background: 'var(--surface-container)',
              borderRadius: 'var(--radius-2xl)',
              paddingRight: 80,
            }}
          />
          <div style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', gap: 'var(--sp-1)',
          }}>
            <button className="btn btn-icon btn-ghost" style={{ width: 28, height: 28 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <button className="btn btn-icon btn-ghost" style={{ width: 28, height: 28 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          </div>
        </div>

        {input.trim() ? (
          <button
            id="send-button"
            onClick={sendMessage}
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'var(--primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              animation: 'bubbleIn 0.2s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        ) : (
          <button className="btn btn-icon btn-ghost" style={{ width: 40, height: 40, flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
