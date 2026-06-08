'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { get, put } from '@/lib/api';
import MainLayout from '@/components/MainLayout';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  
  const [stats, setStats] = useState({ contactCount: 0, groupCount: 0, memberSince: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch full profile info including DB statistics
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const data = await get('/users/profile');
        
        // Sync values
        setFullName(data.fullName || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        
        // Set stats
        const date = new Date(data.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '");
        setStats({
          contactCount: data.contactCount || 0,
          groupCount: data.groupCount || 0,
          memberSince: formattedDate,
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const updatedUser = await put('/users/profile', {
        fullName,
        username,
        bio,
      });

      // Update in AuthContext
      await updateProfile(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <MainLayout activeTab="settings">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--background)' }}>
        {/* Header */}
        <div className="glass-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: 'var(--surface-container-high)',
          borderBottom: '1px solid var(--outline-variant)', height: 60, flexShrink: 0
        }}>
          {/* Back Button (shown on mobile, hidden on desktop) */}
          <button 
            onClick={() => router.back()} 
            className="back-btn-responsive btn btn-icon btn-ghost" 
            style={{ width: 36, height: 36, flexShrink: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>

          <h1 className="text-headline" style={{ flex: 1, color: 'var(--on-surface)', fontSize: '1.2rem', paddingLeft: 4 }}>Profile</h1>
          
          {isEditing ? (
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="btn btn-icon btn-ghost" 
              style={{ width: 36, height: 36, color: 'var(--primary)' }}
            >
              {saving ? (
                <span className="animate-pulse">...</span>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="btn btn-icon btn-ghost" 
              style={{ width: 36, height: 36, color: 'var(--primary)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="scroll-y" style={{ flex: 1, padding: '16px 24px' }}>
          {error && (
            <div style={{
              padding: 'var(--sp-3) var(--sp-4)',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              fontSize: '0.8rem',
              marginBottom: 'var(--sp-4)'
            }}>{error}</div>
          )}

          {/* Avatar & Edit Info */}
          <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <div className="avatar avatar-xl" style={{ background: 'var(--gradient-primary)', fontSize: '2.5rem', display: 'inline-flex' }}>
                {getInitials(fullName || user?.fullName)}
              </div>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', maxWidth: 360, margin: '0 auto', textAlign: 'left' }}>
                <div>
                  <label className="text-label" style={{ display: 'block', fontSize: '0.68rem', color: 'var(--primary)', marginBottom: 6, fontWeight: 600 }}>FULL NAME</label>
                  <input
                    id="profile-fullname"
                    className="input-field"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
                  />
                </div>
                <div>
                  <label className="text-label" style={{ display: 'block', fontSize: '0.68rem', color: 'var(--primary)', marginBottom: 6, fontWeight: 600 }}>USERNAME</label>
                  <input
                    id="profile-username"
                    className="input-field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
                  />
                </div>
                <div>
                  <label className="text-label" style={{ display: 'block', fontSize: '0.68rem', color: 'var(--primary)', marginBottom: 6, fontWeight: 600 }}>STATUS / BIO</label>
                  <textarea
                    id="profile-bio"
                    className="input-field"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Enter your status bio"
                    style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', minHeight: 80, resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                  <button className="btn btn-outline w-full" onClick={() => {
                    setFullName(user?.fullName || '');
                    setUsername(user?.username || '');
                    setBio(user?.bio || '');
                    setIsEditing(false);
                  }}>Cancel</button>
                  <button className="btn btn-primary w-full" onClick={handleSave} disabled={saving}>Save</button>
                </div>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>{fullName || user?.fullName}</h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>@{username || user?.username}</p>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginTop: 'var(--sp-2)', maxWidth: 300, margin: 'var(--sp-2) auto 0' }}>
                  {bio || 'Hey there! I am using NexChat.'}
                </p>
              </>
            )}
          </div>

          {/* Live Stats */}
          <div className="card animate-slide-up" style={{
            display: 'flex', justifyContent: 'space-around',
            marginBottom: 'var(--sp-6)', padding: 'var(--sp-4)',
            border: '1px solid var(--outline-variant)',
            background: 'var(--surface-container-lowest)'
          }}>
            {[
              { label: 'Contacts', count: stats.contactCount },
              { label: 'Groups', count: stats.groupCount },
              { label: 'Member since', count: stats.memberSince || '...' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{stat.count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginTop: 2, textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Account', 'Privacy', 'Notifications', 'Appearance', 'Help & Support', 'About'].map((item, i) => {
              const icons = [
                'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
                'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
                'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
                'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688',
                'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z M12 16v-4',
                'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z',
              ];
              return (
                <div key={item} className="card" onClick={() => router.push('/settings')} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                  padding: '14px 16px', cursor: 'pointer',
                  border: '1px solid var(--outline-variant)',
                  background: 'var(--surface-container-lowest)'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-container-low)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-container-lowest)';
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-container)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"><path d={icons[i]}/></svg>
                  </div>
                  <span style={{ flex: 1, fontSize: '0.92rem', fontWeight: 500, color: 'var(--on-surface)' }}>{item}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--outline-variant)" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              );
            })}
          </div>

          {/* Logout */}
          <button onClick={() => router.push('/settings')} className="btn btn-ghost w-full" style={{ color: 'var(--danger)', marginTop: 24, justifyContent: 'center', fontWeight: 'bold' }}>
            Back to Settings
          </button>
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
