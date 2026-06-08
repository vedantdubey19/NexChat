'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { post, get } from '@/lib/api';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calling states
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const timerIntervalRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const stopPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
  }, []);

  const createPeerConnection = useCallback((targetUserId) => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        if (socket) {
          socket.emit('call:candidate', { to: targetUserId, candidate: event.candidate });
        }
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
    };

    return pc;
  }, []);

  // Timer handler for active connected calls
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      timerIntervalRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeCall]);

  const startMedia = async (type) => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get media devices:', err);
      throw new Error('Could not access microphone or camera. Please check your browser permissions.');
    }
  };

  const stopMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    stopPeerConnection();
  }, [stopPeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      stopPeerConnection();
    };
  }, [stopPeerConnection]);

  useEffect(() => {
    // Check for saved user on mount
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      connectSocket(token);
      // Apply saved theme preference (localStorage wins; fall back to backend setting)
      const savedTheme = localStorage.getItem('nexchat-theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        // Check backend setting as fallback
        get('/settings').then(s => {
          const theme = s?.theme === 'dark' ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', theme);
          localStorage.setItem('nexchat-theme', theme);
        }).catch(() => {});
      }
    }
    setLoading(false);
  }, []);

  // Listen to call events via socket
  useEffect(() => {
    if (!user) {
      setIncomingCall(null);
      setActiveCall(null);
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleCallIncoming = async ({ callerId, type }) => {
      try {
        const contactsList = await get('/contacts');
        const contact = contactsList.find(c => c.user?.id === callerId);
        const callerName = contact ? (contact.nickname || contact.user?.fullName) : 'NexChat User';
        setIncomingCall({ callerId, callerName, type });
      } catch (err) {
        setIncomingCall({ callerId, callerName: 'Incoming Caller', type });
      }
    };

    const handleCallAnswered = () => {
      setActiveCall((prev) => prev ? { ...prev, status: 'connected' } : null);
    };

    const handleCallEnded = () => {
      setIncomingCall(null);
      setActiveCall(null);
      stopMedia();
    };

    const handleCallOffer = async ({ from, offer }) => {
      pendingOfferRef.current = offer;
    };

    const handleCallAnswerSdp = async ({ from, answer }) => {
      const pc = pcRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }
    };

    const handleCallCandidate = async ({ from, candidate }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    socket.on('call:incoming', handleCallIncoming);
    socket.on('call:answered', handleCallAnswered);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:offer', handleCallOffer);
    socket.on('call:answer-sdp', handleCallAnswerSdp);
    socket.on('call:candidate', handleCallCandidate);

    return () => {
      socket.off('call:incoming', handleCallIncoming);
      socket.off('call:answered', handleCallAnswered);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:offer', handleCallOffer);
      socket.off('call:answer-sdp', handleCallAnswerSdp);
      socket.off('call:candidate', handleCallCandidate);
    };
  }, [user, stopMedia]);

  const login = useCallback(async (identifier, password) => {
    const data = await post('/auth/login', { identifier, password });
    if (data.verificationRequired) {
      return data;
    }
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.accessToken);
    return data.user;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await post('/auth/register', userData);
    if (data.verificationRequired) {
      return data;
    }
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.accessToken);
    return data.user;
  }, []);

  const verifyOtp = useCallback(async (userId, emailOtp, phoneOtp) => {
    const data = await post('/auth/verify-otp', { userId, emailOtp, phoneOtp });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.accessToken);
    return data.user;
  }, []);

  const resendOtp = useCallback(async (userId) => {
    const data = await post('/auth/resend-otp', { userId });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await post('/auth/logout', { refreshToken });
    } catch {
      // Ignore errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    disconnectSocket();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  // Initiate Call
  const initiateCall = useCallback(async (calleeId, calleeName, type = 'voice') => {
    try {
      const stream = await startMedia(type);

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isMock = !UUID_REGEX.test(calleeId);

      const socket = getSocket();
      if (!isMock && socket && socket.connected) {
        await post('/calls/initiate', { calleeId, type });
        socket.emit('call:initiate', { calleeId, type });

        // WebRTC peer connection creation & offer
        const pc = createPeerConnection(calleeId);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', { to: calleeId, offer });
      }

      setActiveCall({
        otherUser: { id: calleeId, fullName: calleeName },
        type,
        status: 'ringing',
      });

      if (isMock) {
        setTimeout(() => {
          setActiveCall((prev) => {
            if (prev && prev.otherUser.id === calleeId && prev.status === 'ringing') {
              return { ...prev, status: 'connected' };
            }
            return prev;
          });
        }, 3000);
      }
    } catch (err) {
      console.error('Call initiation failed', err);
      stopMedia();
      alert(err.message || 'Failed to initiate call');
    }
  }, [stopMedia, createPeerConnection]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const stream = await startMedia(incomingCall.type);

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isMock = !UUID_REGEX.test(incomingCall.callerId);

      const socket = getSocket();
      if (!isMock && socket && socket.connected) {
        const pc = createPeerConnection(incomingCall.callerId);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        if (pendingOfferRef.current) {
          await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:answer-sdp', { to: incomingCall.callerId, answer });
          
          for (const candidate of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current = [];
        }

        socket.emit('call:answer', { callerId: incomingCall.callerId });
      }

      setActiveCall({
        otherUser: { id: incomingCall.callerId, fullName: incomingCall.callerName },
        type: incomingCall.type,
        status: 'connected',
      });
      setIncomingCall(null);
    } catch (err) {
      console.error('Failed to answer call:', err);
      setIncomingCall(null);
      alert(err.message || 'Failed to answer call');
    }
  }, [incomingCall, startMedia, createPeerConnection]);

  // Decline incoming call
  const declineCall = useCallback(() => {
    if (!incomingCall) return;

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('call:end', { otherUserId: incomingCall.callerId });
    }
    setIncomingCall(null);
    stopMedia();
  }, [incomingCall, stopMedia]);

  // End active connected call
  const endCall = useCallback(() => {
    if (!activeCall) return;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isMock = !UUID_REGEX.test(activeCall.otherUser.id);

    if (!isMock) {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('call:end', { otherUserId: activeCall.otherUser.id });
      }
    }
    setActiveCall(null);
    stopMedia();
  }, [activeCall, stopMedia]);

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateProfile,
      initiateCall, acceptCall, declineCall, endCall,
      activeCall, incomingCall, callTimer,
      verifyOtp, resendOtp
    }}>
      {children}
      
      {/* Global calling UI overlay */}
      {(incomingCall || activeCall) && (
        <CallingOverlay
          incomingCall={incomingCall}
          activeCall={activeCall}
          callTimer={callTimer}
          acceptCall={acceptCall}
          declineCall={declineCall}
          endCall={endCall}
          localStream={localStream}
          remoteStream={remoteStream}
        />
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Calling Visual Component
function CallingOverlay({ incomingCall, activeCall, callTimer, acceptCall, declineCall, endCall, localStream, remoteStream }) {
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 11, 15, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      fontFamily: 'var(--font-family)',
    }}>
      {incomingCall ? (
        // INCOMING CALL SCREEN
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-6)', textAlign: 'center', width: '100%', maxWidth: 360 }}>
          {/* Avatar with pulsing rings */}
          <div style={{
            position: 'relative',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: 700,
            boxShadow: '0 0 40px rgba(37, 99, 235, 0.3)',
          }}>
            {getInitials(incomingCall.callerName)}
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>{incomingCall.callerName}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--outline-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Incoming {incomingCall.type} Call...
            </p>
          </div>

          {/* Accept / Decline actions */}
          <div style={{ display: 'flex', gap: 'var(--sp-12)', marginTop: 'var(--sp-8)' }}>
            <button
              onClick={declineCall}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#EF4444',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/></svg>
            </button>
            <button
              onClick={acceptCall}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#10B981',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
          </div>
        </div>
      ) : (
        // ACTIVE CALL SCREEN
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-6)', textAlign: 'center', width: '100%', maxWidth: 360, position: 'relative' }}>
          
          {/* Main call avatar / camera container */}
          <div style={{
            position: 'relative',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: 700,
            boxShadow: activeCall.status === 'connected' ? '0 0 40px rgba(16, 185, 129, 0.3)' : '0 0 40px rgba(37, 99, 235, 0.3)',
            overflow: 'hidden',
          }}>
            {activeCall.type === 'video' && remoteStream && activeCall.status === 'connected' ? (
              <LocalVideoPreview stream={remoteStream} />
            ) : activeCall.type === 'video' && localStream && activeCall.status === 'ringing' ? (
              <LocalVideoPreview stream={localStream} />
            ) : (
              getInitials(activeCall.otherUser.fullName)
            )}
          </div>

          {/* Picture-in-picture floating local preview for connected video call */}
          {activeCall.type === 'video' && activeCall.status === 'connected' && localStream && (
            <div style={{
              position: 'fixed',
              bottom: 120,
              right: 30,
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: '2px solid white',
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
              background: '#202c33',
              zIndex: 10000,
            }}>
              <LocalVideoPreview stream={localStream} />
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>{activeCall.otherUser.fullName}</h2>
            <p style={{
              fontSize: '0.9rem',
              color: activeCall.status === 'connected' ? '#10B981' : 'var(--outline-variant)',
              fontWeight: 500,
            }}>
              {activeCall.status === 'connected' ? (
                <span>Call Active • {formatTimer(callTimer)}</span>
              ) : (
                'Ringing...'
              )}
            </p>
          </div>

          {/* End Call action */}
          <div style={{ display: 'flex', gap: 'var(--sp-6)', marginTop: 'var(--sp-8)', alignItems: 'center' }}>
            <button
              onClick={endCall}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#EF4444',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Media stream helper component
function LocalVideoPreview({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
}
