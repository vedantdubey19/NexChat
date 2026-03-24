'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('email');

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await register(form);
      router.push('/chat');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: 'var(--sp-6)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        <button onClick={() => router.back()} className="btn-icon btn btn-ghost" style={{ width: 36, height: 36 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-headline">Create Account</h1>
      </div>

      {/* Avatar placeholder */}
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-6)' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 'var(--radius-full)',
          background: 'var(--surface-container-high)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--surface)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        {error && (
          <div style={{ padding: 'var(--sp-3) var(--sp-4)', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</div>
        )}

        <input id="signup-fullname" className="input-field" placeholder="Full Name" value={form.fullName} onChange={handleChange('fullName')} required />
        <input id="signup-username" className="input-field" placeholder="Username" value={form.username} onChange={handleChange('username')} required />

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: 4 }}>
          {['email', 'phone'].map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              flex: 1, padding: 'var(--sp-2)', borderRadius: 'var(--radius-md)',
              background: tab === t ? 'var(--surface-container-lowest)' : 'transparent',
              color: tab === t ? 'var(--on-surface)' : 'var(--on-surface-variant)',
              fontWeight: tab === t ? 600 : 400, fontSize: '0.875rem',
              border: 'none', cursor: 'pointer', transition: 'all var(--transition-fast)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {tab === 'email' ? (
          <input id="signup-email" className="input-field" type="email" placeholder="Email address" value={form.email} onChange={handleChange('email')} />
        ) : (
          <input id="signup-phone" className="input-field" type="tel" placeholder="Phone number" value={form.phone} onChange={handleChange('phone')} />
        )}

        <div style={{ position: 'relative' }}>
          <input id="signup-password" className="input-field" type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 characters)" value={form.password} onChange={handleChange('password')} required style={{ paddingRight: 48 }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: '0.75rem' }}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <input id="signup-confirm" className="input-field" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} required />

        <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textAlign: 'center' }}>
          By signing up, you agree to our <a href="#">Terms</a> & <a href="#">Privacy Policy</a>
        </p>

        <button id="signup-submit" className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--sp-6)', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
        Already have an account? <a href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</a>
      </p>
    </div>
  );
}
