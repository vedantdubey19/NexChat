'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const displayUser = user || { fullName: 'Vedant Dubey', username: 'vedant', bio: 'Building the future, one line of code at a time 🚀' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div className="glass-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <button onClick={() => router.back()} className="btn btn-icon btn-ghost" style={{ width: 36, height: 36 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-headline" style={{ flex: 1 }}>Profile</h1>
        <button className="btn btn-icon btn-ghost" style={{ width: 36, height: 36 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>

      <div className="main-content" style={{ padding: 'var(--sp-6) var(--sp-4)' }}>
        {/* Avatar & Name */}
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 'var(--sp-4)' }}>
            <div className="avatar avatar-xl" style={{ background: 'var(--gradient-primary)', fontSize: '2.5rem' }}>
              {displayUser.fullName?.charAt(0)}
            </div>
            <button style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary)', border: '3px solid var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{displayUser.fullName}</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>@{displayUser.username}</p>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginTop: 'var(--sp-2)', maxWidth: 300, margin: 'var(--sp-2) auto 0' }}>
            {displayUser.bio}
          </p>
        </div>

        {/* Stats */}
        <div className="card animate-slide-up" style={{
          display: 'flex', justifyContent: 'space-around',
          marginBottom: 'var(--sp-6)', padding: 'var(--sp-5)',
        }}>
          {[
            { label: 'Contacts', count: '128' },
            { label: 'Groups', count: '24' },
            { label: 'Member since', count: 'Jan \'24' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{stat.count}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Settings */}
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
            <div key={item} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
              marginBottom: 'var(--sp-2)', cursor: 'pointer',
              animation: `slideUp 0.4s ease ${0.1 * i}s backwards`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'var(--surface-container)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2" strokeLinecap="round"><path d={icons[i]}/></svg>
              </div>
              <span style={{ flex: 1, fontSize: '0.9rem' }}>{item}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--outline-variant)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          );
        })}

        {/* Logout */}
        <button onClick={() => router.push('/settings')} className="btn btn-ghost w-full" style={{ color: 'var(--danger)', marginTop: 'var(--sp-4)', justifyContent: 'center' }}>
          Log Out
        </button>
      </div>
    </div>
  );
}
