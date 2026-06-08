'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { get, put } from '@/lib/api';
import MainLayout from '@/components/MainLayout';

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  // Form states
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Action states
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Load user settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        const data = await get('/settings');
        setSettings(data);
      } catch (err) {
        console.warn('Failed to load settings from server, using mock settings:', err);
        setSettings({
          theme: 'light',
          language: 'en',
          last_seen_visibility: 'everyone',
          profile_photo_visibility: 'everyone',
          notification_messages: true,
          notification_groups: true
        });
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Backend logout failed, routing anyway:', err);
    }
    router.push('/auth/login');
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalError('');
    setModalSuccess('');
    setPhoneInput('');
    setEmailInput('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Profile Field Updates (Phone / Email)
  const handlePhoneUpdate = async (e) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    try {
      const updatedUser = await put('/users/profile', { phone: phoneInput });
      updateProfile(updatedUser);
      setModalSuccess('Phone number updated successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      setModalError(err.message || 'Failed to update phone number');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    try {
      const updatedUser = await put('/users/profile', { email: emailInput });
      updateProfile(updatedUser);
      setModalSuccess('Email address updated successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      setModalError(err.message || 'Failed to update email address');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setModalError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setModalError('New password must be at least 6 characters');
      return;
    }
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    try {
      await put('/users/change-password', { currentPassword, newPassword });
      setModalSuccess('Password changed successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      setModalError(err.message || 'Failed to change password');
    } finally {
      setModalLoading(false);
    }
  };

  // Settings Privacy updates
  const handleVisibilityUpdate = async (isLastSeen, option) => {
    setModalError('');
    setModalSuccess('');
    try {
      const payload = isLastSeen 
        ? { lastSeenVisibility: option }
        : { profilePhotoVisibility: option };
      await put('/settings/privacy', payload);
      setSettings(prev => ({
        ...prev,
        [isLastSeen ? 'last_seen_visibility' : 'profile_photo_visibility']: option
      }));
      setModalSuccess('Privacy setting updated!');
      setTimeout(() => closeModal(), 800);
    } catch (err) {
      setModalError('Failed to update privacy visibility');
    }
  };

  const handleLanguageUpdate = async (code) => {
    setModalError('');
    setModalSuccess('');
    try {
      await put('/settings', { language: code });
      setSettings(prev => ({ ...prev, language: code }));
      setModalSuccess('Language updated!');
      setTimeout(() => closeModal(), 800);
    } catch (err) {
      setModalError('Failed to update language');
    }
  };

  const handleToggleMessages = async (checked) => {
    try {
      await put('/settings/notifications', { notificationMessages: checked });
      setSettings(prev => ({ ...prev, notification_messages: checked }));
    } catch (err) {
      setSettings(prev => ({ ...prev, notification_messages: checked }));
    }
  };

  const handleToggleGroups = async (checked) => {
    try {
      await put('/settings/notifications', { notificationGroups: checked });
      setSettings(prev => ({ ...prev, notification_groups: checked }));
    } catch (err) {
      setSettings(prev => ({ ...prev, notification_groups: checked }));
    }
  };

  const SettingRow = ({ icon, label, value, onClick }) => (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      padding: '14px 16px', cursor: onClick ? 'pointer' : 'default',
      borderBottom: '1px solid var(--outline-variant)'
    }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = 'var(--surface-container-low)';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--on-surface)' }}>{label}</div>
      </div>
      {value && <span style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', marginRight: 4 }}>{value}</span>}
      {onClick && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--outline)" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 'var(--sp-4)' }}>
      <span className="text-label" style={{ color: 'var(--primary)', fontSize: '0.68rem', display: 'block', padding: '0 var(--sp-4)', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>{title}</span>
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--outline-variant)' }}>{children}</div>
    </div>
  );

  const ico = (d) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={d}/></svg>;

  const getVisibilityDisplay = (val) => {
    if (!val) return 'Everyone';
    if (val === 'contacts') return 'My Contacts';
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const getLanguageDisplay = (val) => {
    switch (val) {
      case 'es': return 'Español';
      case 'fr': return 'Français';
      case 'de': return 'Deutsch';
      case 'hi': return 'Hindi';
      default: return 'English';
    }
  };

  const renderModal = () => {
    if (!activeModal) return null;

    let title = '';
    let content = null;

    switch (activeModal) {
      case 'phone':
        title = 'Phone Number';
        content = (
          <form onSubmit={handlePhoneUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Enter your new phone number:</div>
            <input
              id="phone-edit-input"
              className="input-field"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              required
              style={{ background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' }}
            />
            <button className="btn btn-primary" type="submit" disabled={modalLoading} style={{ width: '100%', justifyContent: 'center' }}>
              {modalLoading ? 'Saving...' : 'Update Phone'}
            </button>
          </form>
        );
        break;

      case 'email':
        title = 'Email Address';
        content = (
          <form onSubmit={handleEmailUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Enter your new email address:</div>
            <input
              id="email-edit-input"
              className="input-field"
              type="email"
              placeholder="e.g. email@domain.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              style={{ background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' }}
            />
            <button className="btn btn-primary" type="submit" disabled={modalLoading} style={{ width: '100%', justifyContent: 'center' }}>
              {modalLoading ? 'Saving...' : 'Update Email'}
            </button>
          </form>
        );
        break;

      case 'password':
        title = 'Change Password';
        content = (
          <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <input
              id="current-password-input"
              className="input-field"
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{ background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' }}
            />
            <input
              id="new-password-input"
              className="input-field"
              type="password"
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' }}
            />
            <input
              id="confirm-password-input"
              className="input-field"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' }}
            />
            <button className="btn btn-primary" type="submit" disabled={modalLoading} style={{ width: '100%', justifyContent: 'center' }}>
              {modalLoading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        );
        break;

      case 'lastSeen':
      case 'profilePhoto':
        const isLastSeen = activeModal === 'lastSeen';
        title = isLastSeen ? 'Last Seen Visibility' : 'Profile Photo Visibility';
        const currentVal = isLastSeen 
          ? settings?.last_seen_visibility 
          : settings?.profile_photo_visibility;
        content = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {['everyone', 'contacts', 'nobody'].map(option => (
              <div 
                key={option} 
                className="grouped-item" 
                onClick={() => handleVisibilityUpdate(isLastSeen, option)}
                style={{ cursor: 'pointer', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}
              >
                <span style={{ textTransform: 'capitalize', color: 'var(--on-surface)', fontSize: '0.9rem' }}>
                  {option === 'contacts' ? 'My Contacts' : option}
                </span>
                {currentVal === option && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
            ))}
          </div>
        );
        break;

      case 'language':
        title = 'App Language';
        const currentLang = settings?.language || 'en';
        const langs = [
          { code: 'en', name: 'English' },
          { code: 'es', name: 'Español' },
          { code: 'fr', name: 'Français' },
          { code: 'de', name: 'Deutsch' },
          { code: 'hi', name: 'Hindi' }
        ];
        content = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {langs.map(l => (
              <div 
                key={l.code} 
                className="grouped-item" 
                onClick={() => handleLanguageUpdate(l.code)}
                style={{ cursor: 'pointer', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}
              >
                <span style={{ color: 'var(--on-surface)', fontSize: '0.9rem' }}>{l.name}</span>
                {currentLang === l.code && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
            ))}
          </div>
        );
        break;

      case 'blocked':
        title = 'Blocked Contacts';
        content = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', textAlign: 'center', padding: 'var(--sp-4) 0' }}>
            <svg style={{ color: 'var(--primary)', opacity: 0.6, margin: '0 auto' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            <div style={{ fontWeight: 'bold', color: 'var(--on-surface)' }}>No Blocked Contacts</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', maxWidth: 280, margin: '0 auto' }}>
              Blocked contacts will not be able to call you or send you messages.
            </div>
          </div>
        );
        break;

      case 'help':
        title = 'Help & Support';
        content = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--on-surface)' }}>How do I change my settings?</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Simply tap the setting field you wish to edit and confirm the change in the popup.</div>
            </div>
            <div style={{ borderBottom: '1px solid var(--outline-variant)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--on-surface)' }}>Is my verification code secure?</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Yes. Verification OTP codes are generated on demand and invalidated immediately after use.</div>
            </div>
            <div style={{ borderBottom: '1px solid var(--outline-variant)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--on-surface)' }}>How do calls work?</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Open a direct chat room and tap the Voice or Video call icons in the top right header.</div>
            </div>
          </div>
        );
        break;

      case 'terms':
        title = 'Terms & Privacy';
        content = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px', fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.85rem' }}>1. Terms of Service</div>
            <div>NexChat provides secure real-time messaging, status updates, and audio/video calling. By using our service, you agree to follow our code of conduct.</div>
            <div style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.85rem' }}>2. Privacy Policy</div>
            <div>We respect your privacy. All chat messages are sent in real-time. We do not sell your personal statistics or activity logs to third parties.</div>
            <div style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.85rem' }}>3. Data Security</div>
            <div>Accounts require email or phone OTP verification to ensure that only authorized owners can log in to their chats.</div>
          </div>
        );
        break;

      default:
        return null;
    }

    return (
      <div className="modal-overlay" onClick={() => closeModal()} style={{ background: 'rgba(0,0,0,0.4)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--sp-4)' }}>
        <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', boxShadow: 'var(--shadow-lg)', background: 'var(--surface-container-lowest)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 'var(--sp-2)' }}>
            <h3 className="text-title" style={{ color: 'var(--primary)' }}>{title}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => closeModal()} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              Done
            </button>
          </div>

          {modalError && (
            <div style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.75rem' }}>{modalError}</div>
          )}
          {modalSuccess && (
            <div style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--accent)', fontSize: '0.75rem' }}>{modalSuccess}</div>
          )}

          {/* Body */}
          <div>
            {content}
          </div>
        </div>
      </div>
    );
  };

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
            onClick={() => router.push('/chat')} 
            className="back-btn-responsive btn btn-icon btn-ghost" 
            style={{ width: 36, height: 36, flexShrink: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>

          <h1 className="text-headline" style={{ flex: 1, color: 'var(--on-surface)', fontSize: '1.2rem', paddingLeft: 4 }}>Settings</h1>
        </div>

        {/* Settings Body */}
        <div className="scroll-y" style={{ flex: 1, padding: '16px 24px' }}>
          {/* Profile card */}
          <div onClick={() => router.push('/profile')} className="card" style={{
            marginBottom: '20px', display: 'flex', alignItems: 'center',
            gap: 16, cursor: 'pointer', border: '1px solid var(--outline-variant)',
            padding: 16, background: 'var(--surface-container-lowest)'
          }}>
            <div className="avatar avatar-lg" style={{ background: 'var(--gradient-primary)' }}>
              {user?.fullName?.charAt(0) || 'V'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--on-surface)' }}>{user?.fullName || 'Vedant Dubey'}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>@{user?.username || 'vedant'}</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          {loadingSettings ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
              Loading preferences...
            </div>
          ) : (
            <>
              <Section title="ACCOUNT">
                <SettingRow 
                  icon={ico("M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72")} 
                  label="Phone Number" 
                  value={user?.phone || 'Not set'} 
                  onClick={() => {
                    setPhoneInput(user?.phone || '');
                    setActiveModal('phone');
                  }} 
                />
                <SettingRow 
                  icon={ico("M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6")} 
                  label="Email" 
                  value={user?.email || 'Not set'} 
                  onClick={() => {
                    setEmailInput(user?.email || '');
                    setActiveModal('email');
                  }} 
                />
                <SettingRow 
                  icon={ico("M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4")} 
                  label="Change Password" 
                  onClick={() => {
                    setActiveModal('password');
                  }} 
                />
              </Section>

              <Section title="PRIVACY">
                <SettingRow 
                  icon={ico("M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z")} 
                  label="Last Seen" 
                  value={getVisibilityDisplay(settings?.last_seen_visibility)} 
                  onClick={() => setActiveModal('lastSeen')} 
                />
                <SettingRow 
                  icon={ico("M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 13a4 4 0 100-8 4 4 0 000 8z")} 
                  label="Profile Photo" 
                  value={getVisibilityDisplay(settings?.profile_photo_visibility)} 
                  onClick={() => setActiveModal('profilePhoto')} 
                />
                <SettingRow 
                  icon={ico("M18 6L6 18 M6 6l12 12")} 
                  label="Blocked Contacts" 
                  value="0" 
                  onClick={() => setActiveModal('blocked')} 
                />
              </Section>

              <Section title="NOTIFICATIONS">
                <SettingRow 
                  icon={ico("M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0")} 
                  label="Message Notifications" 
                  value={settings?.notification_messages ? 'Enabled' : 'Disabled'} 
                  onClick={() => handleToggleMessages(!settings?.notification_messages)}
                />
                <SettingRow 
                  icon={ico("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75")} 
                  label="Group Notifications" 
                  value={settings?.notification_groups ? 'Enabled' : 'Disabled'} 
                  onClick={() => handleToggleGroups(!settings?.notification_groups)}
                />
              </Section>

              <Section title="APPEARANCE">
                <SettingRow 
                  icon={ico("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z M2 12h20")} 
                  label="Language" 
                  value={getLanguageDisplay(settings?.language)} 
                  onClick={() => setActiveModal('language')} 
                />
              </Section>

              <Section title="ABOUT">
                <SettingRow 
                  icon={ico("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z M12 16v-4 M12 8h.01")} 
                  label="Help & Support" 
                  onClick={() => setActiveModal('help')} 
                />
                <SettingRow 
                  icon={ico("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5")} 
                  label="Terms & Privacy" 
                  onClick={() => setActiveModal('terms')} 
                />
                <SettingRow 
                  icon={ico("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z")} 
                  label="App Version" 
                  value="NexChat v2.4.0 (Build 992)" 
                />
              </Section>
            </>
          )}

          {/* Logout */}
          <div style={{ padding: '20px 0 40px 0' }}>
            <button onClick={handleLogout} className="btn btn-ghost w-full" style={{ color: 'var(--danger)', justifyContent: 'center', fontWeight: 'bold' }}>
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Modal sheet */}
      {renderModal()}

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
