'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const SettingRow = ({ icon, label, value, onClick }) => (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      padding: 'var(--sp-3) 0', cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.9rem' }}>{label}</div>
      </div>
      {value && <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{value}</span>}
      {onClick && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 'var(--sp-4)' }}>
      <span className="text-label" style={{ color: 'var(--on-surface-variant)', fontSize: '0.65rem', display: 'block', padding: '0 var(--sp-4)', marginBottom: 'var(--sp-1)' }}>{title}</span>
      <div className="card" style={{ margin: '0 var(--sp-4)' }}>{children}</div>
    </div>
  );

  const ico = (d) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2" strokeLinecap="round"><path d={d}/></svg>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="glass-header"><h1 className="text-headline">Settings</h1></div>

      <div className="main-content">
        {/* Profile card */}
        <div onClick={() => router.push('/profile')} className="card" style={{ margin: 'var(--sp-3) var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', cursor: 'pointer' }}>
          <div className="avatar avatar-lg" style={{ background: 'var(--gradient-primary)' }}>
            {user?.fullName?.charAt(0) || 'V'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{user?.fullName || 'Vedant Dubey'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>@{user?.username || 'vedant'}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        <Section title="ACCOUNT">
          <SettingRow icon={ico("M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72")} label="Phone Number" value="+91 98765 43210" onClick={() => {}} />
          <SettingRow icon={ico("M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6")} label="Email" value="vedant@email.com" onClick={() => {}} />
          <SettingRow icon={ico("M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4")} label="Change Password" onClick={() => {}} />
        </Section>

        <Section title="PRIVACY">
          <SettingRow icon={ico("M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z")} label="Last Seen" value="Everyone" onClick={() => {}} />
          <SettingRow icon={ico("M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 13a4 4 0 100-8 4 4 0 000 8z")} label="Profile Photo" value="My Contacts" onClick={() => {}} />
          <SettingRow icon={ico("M18 6L6 18 M6 6l12 12")} label="Blocked Contacts" value="3" onClick={() => {}} />
        </Section>

        <Section title="NOTIFICATIONS">
          <SettingRow icon={ico("M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0")} label="Message Notifications" value="On" onClick={() => {}} />
          <SettingRow icon={ico("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75")} label="Group Notifications" value="On" onClick={() => {}} />
        </Section>

        <Section title="APPEARANCE">
          <SettingRow icon={ico("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z")} label="Theme" value="Light" onClick={() => {}} />
          <SettingRow icon={ico("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z M2 12h20")} label="Language" value="English" onClick={() => {}} />
        </Section>

        <Section title="ABOUT">
          <SettingRow icon={ico("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z M12 16v-4 M12 8h.01")} label="Help & Support" onClick={() => {}} />
          <SettingRow icon={ico("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5")} label="Terms & Privacy" onClick={() => {}} />
          <SettingRow icon={ico("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z")} label="App Version" value="NexChat v2.1.0" />
        </Section>

        {/* Logout */}
        <div style={{ padding: '0 var(--sp-4)', marginBottom: 'var(--sp-16)' }}>
          <button onClick={handleLogout} className="btn btn-ghost w-full" style={{ color: 'var(--danger)', justifyContent: 'center' }}>
            Log Out
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => router.push('/chat')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>Chats</span>
        </button>
        <button className="nav-item" onClick={() => router.push('/calls')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72"/></svg>
          <span>Calls</span>
        </button>
        <button className="nav-item" onClick={() => router.push('/status')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Status</span>
        </button>
        <button className="nav-item active" onClick={() => router.push('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
