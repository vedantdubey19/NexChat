'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { get } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import MainLayout from '@/components/MainLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';


const formatMessageTime = (dateStr) => {
  if (typeof window === 'undefined') return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getTick = (status) => {
  switch (status) {
    case 'read': return <span style={{ color: '#53bdeb', marginLeft: 2, fontSize: '0.7rem' }}>✓✓</span>;
    case 'delivered': return <span style={{ color: 'var(--on-surface-variant)', opacity: 0.6, marginLeft: 2, fontSize: '0.7rem' }}>✓✓</span>;
    case 'sent': return <span style={{ color: 'var(--on-surface-variant)', opacity: 0.4, marginLeft: 2, fontSize: '0.7rem' }}>✓</span>;
    default: return null;
  }
};

export default function ChatViewPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, initiateCall } = useAuth();
  
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [amITyping, setAmITyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);   // { file, previewUrl, type }
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msg: null });
  const [editingMsgId, setEditingMsgId] = useState(null);
  const longPressTimer = useRef(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    setSelectedFile({
      file,
      name: file.name,
      size: file.size,
      isImage,
      previewUrl: isImage ? URL.createObjectURL(file) : null
    });
  };

  const clearSelectedFile = () => {
    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadAndSendFile = async () => {
    if (!selectedFile) return;
    try {
      setUploadingFile(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', selectedFile.file);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const media = await response.json();
      
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('message:send', {
          chatId: id,
          content: selectedFile.isImage ? media.url : selectedFile.name,
          type: media.type,
          metadata: {
            url: media.url,
            size: media.sizeBytes || media.size_bytes,
            filename: media.filename,
            mimeType: media.mimeType || media.mime_type
          }
        });
      }
      clearSelectedFile();
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      msg
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, msg: null });
  };

  const handleTouchStart = (e, msg) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      handleContextMenu({
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY
      }, msg);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: null, is_deleted: true } : m));
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/messages/${msgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch chat metadata & initial messages
  const loadChatData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_REGEX.test(id)) {
        // Not a valid chat UUID — redirect back
        router.replace('/chat');
        return;
      }

      const [msgsData, chatsList] = await Promise.all([
        get(`/chats/${id}/messages`),
        get('/chats'),
      ]);
      setMessages(Array.isArray(msgsData) ? msgsData : []);
      const activeChat = (chatsList || []).find(c => String(c.id) === String(id));
      setChat(activeChat || null);

      const socket = getSocket();
      if (socket && socket.connected) {
        (msgsData || []).forEach(m => {
          if (m.senderId !== user?.id && m.status !== 'read') {
            socket.emit('message:seen', { messageId: m.id, chatId: id });
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [id, user, router]);

  useEffect(() => {
    loadChatData();

    const socket = getSocket();
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleNewMessage = (msg) => {
      if (String(msg.chatId) === String(id)) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (msg.senderId !== user?.id) {
          socket.emit('message:seen', { messageId: msg.id, chatId: id });
        }
      }
    };

    const handleMessageStatus = ({ messageId, userId, status }) => {
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, status } : m
      ));
    };

    const handleTypingStart = ({ chatId, userId }) => {
      if (String(chatId) === String(id) && userId !== user?.id) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = ({ chatId, userId }) => {
      if (String(chatId) === String(id) && userId !== user?.id) {
        setIsTyping(false);
      }
    };

    const handleUserOnline = ({ userId }) => {
      setChat((prev) => {
        if (prev?.type === 'direct' && prev.otherUser?.id === userId) {
          return { ...prev, otherUser: { ...prev.otherUser, isOnline: true } };
        }
        return prev;
      });
    };

    const handleUserOffline = ({ userId }) => {
      setChat((prev) => {
        if (prev?.type === 'direct' && prev.otherUser?.id === userId) {
          return { ...prev, otherUser: { ...prev.otherUser, isOnline: false } };
        }
        return prev;
      });
    };

    const handleMessageEdit = ({ messageId, content, updatedAt }) => {
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, content, is_edited: true, updatedAt } : m
      ));
    };

    const handleMessageDelete = ({ messageId }) => {
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, content: null, is_deleted: true } : m
      ));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:status', handleMessageStatus);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('message:edit', handleMessageEdit);
    socket.on('message:delete', handleMessageDelete);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:status', handleMessageStatus);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('message:edit', handleMessageEdit);
      socket.off('message:delete', handleMessageDelete);
    };
  }, [id, user, loadChatData]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    const socket = getSocket();
    if (!socket || !socket.connected) return;

    if (!amITyping && val.trim()) {
      setAmITyping(true);
      socket.emit('typing:start', { chatId: id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { chatId: id });
      setAmITyping(false);
    }, 2000);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    if (editingMsgId) {
      const msgId = editingMsgId;
      const originalContent = input.trim();
      
      setEditingMsgId(null);
      setInput('');
      
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: originalContent, is_edited: true } : m));

      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`${API_URL}/messages/${msgId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content: originalContent })
        });
      } catch (err) {
        console.error('Failed to edit message:', err);
      }
      return;
    }

    const socket = getSocket();
    if (!socket || !socket.connected) {
      setError('Not connected. Please check your connection.');
      return;
    }

    const newMsg = {
      id: `msg-${Date.now()}`,
      chatId: id,
      senderId: user?.id,
      content: input.trim(),
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString()
    };

    // Optimistically add to UI
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Emit over socket
    socket.emit('message:send', {
      chatId: id,
      content: newMsg.content,
      type: 'text',
    });

    // Stop typing indicator
    if (amITyping) {
      socket.emit('typing:stop', { chatId: id });
      setAmITyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';
  const getAvatarColor = (name) => {
    const colors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const avatarBg = chat?.avatarUrl ? 'transparent' : getAvatarColor(chat?.name || '');

  return (
    <MainLayout activeTab="chats" activeChatId={id}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        {/* Chat Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', background: 'var(--surface-container-high)',
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

          {/* User Avatar */}
          <div className={`avatar ${chat?.type === 'direct' && chat?.otherUser?.isOnline ? 'avatar-online' : ''}`}
            style={{ background: avatarBg, width: 40, height: 40, fontSize: '0.85rem', flexShrink: 0 }}>
            {chat?.type === 'group' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            ) : getInitials(chat?.name || '')}
          </div>

          {/* User Name & Status */}
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--on-surface)' }} className="truncate">
              {chat?.name || 'Loading Chat...'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>
              {isTyping ? (
                <span style={{ color: '#00a884', fontWeight: 500 }}>typing...</span>
              ) : chat?.type === 'group' ? (
                `${chat?.memberCount || 2} members`
              ) : chat?.otherUser?.isOnline ? (
                <span style={{ color: '#00a884', fontWeight: 500 }}>Online</span>
              ) : (
                'Offline'
              )}
            </div>
          </div>

          {/* Calling actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {chat?.type === 'direct' && (
              <>
                <button 
                  id="call-voice-btn" 
                  onClick={() => initiateCall(chat.otherUser.id, chat.name, 'voice')} 
                  className="btn btn-icon btn-ghost" 
                  title="Voice Call"
                  style={{ width: 36, height: 36, color: 'var(--primary)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </button>
                <button 
                  id="call-video-btn" 
                  onClick={() => initiateCall(chat.otherUser.id, chat.name, 'video')} 
                  className="btn btn-icon btn-ghost" 
                  title="Video Call"
                  style={{ width: 36, height: 36, color: 'var(--primary)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </button>
              </>
            )}
            <button className="btn btn-icon btn-ghost" style={{ width: 36, height: 36, color: 'var(--on-surface-variant)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
        </div>

        {/* Message Log viewport */}
        <div className="chat-bg scroll-y" style={{
          flex: 1,
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {error && (
            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--on-surface-variant)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              No messages yet. Say hello! 👋
            </div>
          ) : (
            <>
              <div style={{
                textAlign: 'center', padding: '4px 12px',
                fontSize: '0.7rem', color: 'var(--on-surface-variant)',
                background: 'var(--surface-container-high)',
                borderRadius: 4, alignSelf: 'center',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: 10, fontWeight: 500
              }}>
                Conversation Started
              </div>

              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                const isImage = msg.type === 'image';
                const isFile = msg.type === 'file';
                const mediaUrl = msg.metadata?.url || msg.content;

                return (
                  <div key={msg.id}
                    className={isMe ? 'bubble bubble-outgoing' : 'bubble bubble-incoming'}
                    style={{ maxWidth: isImage ? 280 : undefined, cursor: 'pointer' }}
                    onContextMenu={(e) => handleContextMenu(e, msg)}
                    onTouchStart={(e) => handleTouchStart(e, msg)}
                    onTouchEnd={handleTouchEnd}
                  >
                    {!isMe && chat?.type === 'group' && (
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 2 }}>
                        {msg.sender?.fullName}
                      </div>
                    )}

                    {msg.is_deleted || msg.isDeleted ? (
                      <div style={{ fontStyle: 'italic', color: 'var(--on-surface-variant)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        This message was deleted
                      </div>
                    ) : (
                      <>
                        {/* Image bubble */}
                        {isImage && (
                          <a href={mediaUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                            <img
                              src={mediaUrl}
                              alt="shared image"
                              style={{
                                width: '100%', maxWidth: 260, borderRadius: 8,
                                display: 'block', objectFit: 'cover',
                                opacity: msg.uploading ? 0.5 : 1,
                                cursor: 'pointer',
                              }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            {msg.uploading && (
                              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>Uploading...</div>
                            )}
                          </a>
                        )}

                        {/* File bubble */}
                        {isFile && (
                          <a
                            href={msg.uploading ? '#' : (msg.metadata?.url || '#')}
                            target="_blank"
                            rel="noreferrer"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}
                          >
                            <div style={{
                              width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                              background: isMe ? 'rgba(255,255,255,0.2)' : 'var(--surface-container)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isMe ? 'white' : 'var(--primary)'} strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                              </svg>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isMe ? 'white' : 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                {msg.content}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--on-surface-variant)' }}>
                                {msg.uploading ? 'Uploading...' : (msg.metadata?.size ? formatBytes(msg.metadata.size) : 'File')}
                              </div>
                            </div>
                          </a>
                        )}

                        {/* Text bubble */}
                        {!isImage && !isFile && (
                          <div style={{ wordBreak: 'break-word', fontSize: '0.9rem', color: 'var(--bubble-text)' }}>
                            {msg.content}
                            {(msg.is_edited || msg.isEdited) && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', marginLeft: 6, fontStyle: 'italic' }}>
                                (edited)
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <div className="bubble-time" style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                      <span suppressHydrationWarning>{formatMessageTime(msg.createdAt)}</span>
                      {isMe && !msg.is_deleted && !msg.isDeleted && getTick(msg.status)}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="bubble bubble-incoming" style={{ padding: '8px 12px', width: 60 }}>
              <div className="typing-dots"><span></span><span></span><span></span></div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input bottom bar */}
        <div style={{
          background: 'var(--surface-container-high)',
          borderTop: '1px solid var(--outline-variant)',
          flexShrink: 0,
        }}>

          {/* Editing Message Banner */}
          {editingMsgId && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 16px',
              background: 'var(--surface-container-low)',
              borderBottom: '1px solid var(--outline-variant)',
            }}>
              <div style={{
                width: 4, height: 32, borderRadius: 2,
                background: 'var(--primary)', flexShrink: 0
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Edit Message
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {messages.find(m => m.id === editingMsgId)?.content}
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingMsgId(null);
                  setInput('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: 4 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {/* File preview bar — shown when a file is selected */}
          {selectedFile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 16px',
              background: 'var(--surface-container-low)',
              borderBottom: '1px solid var(--outline-variant)',
            }}>
              {selectedFile.isImage ? (
                <img src={selectedFile.previewUrl} alt="preview"
                  style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                  background: 'var(--surface-container)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>
                  {formatBytes(selectedFile.size)}
                </div>
              </div>
              <button
                onClick={clearSelectedFile}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: 4 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {/* Input row */}
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Emoji */}
            <button className="btn btn-icon btn-ghost" style={{ width: 36, height: 36, flexShrink: 0, color: 'var(--on-surface-variant)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              id="file-attach-input"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.mp3,.wav"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Attachment clip button */}
            <button
              id="attach-btn"
              className="btn btn-icon btn-ghost"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              style={{ width: 36, height: 36, flexShrink: 0, color: selectedFile ? 'var(--primary)' : 'var(--on-surface-variant)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>

            {/* Text input */}
            <div style={{ flex: 1, display: 'flex' }}>
              <input
                id="message-input"
                className="input-field"
                placeholder="Type a message"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                style={{
                  background: 'var(--surface-container-lowest)',
                  borderRadius: 8, padding: '10px 16px',
                  height: 42, fontSize: '0.9rem',
                  border: 'none', color: 'var(--on-surface)',
                  outline: 'none', width: '100%'
                }}
              />
            </div>

            {/* Send / Upload / Mic button */}
            {selectedFile ? (
              <button
                id="send-file-button"
                onClick={uploadAndSendFile}
                disabled={uploadingFile}
                style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: uploadingFile ? 'var(--outline)' : 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: 'none',
                  cursor: uploadingFile ? 'not-allowed' : 'pointer',
                }}
              >
                {uploadingFile ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                )}
              </button>
            ) : input.trim() ? (
              <button
                id="send-button"
                onClick={sendMessage}
                style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--primary)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            ) : (
              <button className="btn btn-icon btn-ghost" style={{ width: 40, height: 40, flexShrink: 0, color: 'var(--on-surface-variant)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {contextMenu.visible && contextMenu.msg && (
        <>
          <div 
            onClick={closeContextMenu} 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
          />
          <div style={{
            position: 'fixed',
            top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 100 : contextMenu.y),
            left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 150 : contextMenu.x),
            background: 'var(--surface-container-high)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.24)',
            padding: '6px 0',
            zIndex: 999,
            minWidth: 130,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Only allow editing own text messages */}
            {contextMenu.msg.senderId === user?.id && contextMenu.msg.type === 'text' && !contextMenu.msg.is_deleted && !contextMenu.msg.isDeleted && (
              <button
                type="button"
                onClick={() => {
                  setEditingMsgId(contextMenu.msg.id);
                  setInput(contextMenu.msg.content);
                  closeContextMenu();
                }}
                style={{
                  background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left',
                  fontSize: '0.85rem', color: 'var(--on-surface)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-container-low)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit
              </button>
            )}
            {/* Only allow deleting own messages */}
            {contextMenu.msg.senderId === user?.id && !contextMenu.msg.is_deleted && !contextMenu.msg.isDeleted && (
              <button
                type="button"
                onClick={() => {
                  handleDeleteMessage(contextMenu.msg.id);
                  closeContextMenu();
                }}
                style={{
                  background: 'none', border: 'none', padding: '8px 16px', textAlign: 'left',
                  fontSize: '0.85rem', color: 'var(--danger)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-container-low)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                Delete
              </button>
            )}
          </div>
        </>
      )}

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
