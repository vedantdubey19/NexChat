'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      router.push('/chat');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: 'var(--sp-8) var(--sp-6)',
      justifyContent: 'center',
    }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 'var(--sp-10)' }}>
        <h1 className="text-headline" style={{ marginBottom: 'var(--sp-2)' }}>Welcome Back</h1>
        <p className="text-body" style={{ color: 'var(--on-surface-variant)' }}>Sign in to continue</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="animate-slide-up" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-4)',
      }}>
        {error && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
          }}>{error}</div>
        )}

        {/* Identifier */}
        <div>
          <label className="text-label" style={{ display: 'block', marginBottom: 'var(--sp-2)', color: 'var(--on-surface-variant)' }}>
            Email, Phone, or Username
          </label>
          <input
            id="login-identifier"
            className="input-field"
            type="text"
            placeholder="Enter your email, phone, or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-label" style={{ display: 'block', marginBottom: 'var(--sp-2)', color: 'var(--on-surface-variant)' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              className="input-field"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--on-surface-variant)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Forgot Password */}
        <div style={{ textAlign: 'right' }}>
          <a href="#" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Forgot Password?</a>
        </div>

        {/* Submit */}
        <button
          id="login-submit"
          className="btn btn-primary btn-lg w-full"
          type="submit"
          disabled={loading}
          style={{ marginTop: 'var(--sp-2)' }}
        >
          {loading ? 'Signing in...' : 'Log In'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-4)',
          margin: 'var(--sp-4) 0',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)', opacity: 0.3 }} />
          <span className="text-small">Or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)', opacity: 0.3 }} />
        </div>

        {/* Social Login */}
        <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'center' }}>
          <button type="button" className="btn btn-outline" style={{ flex: 1, gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
          <button type="button" className="btn btn-outline" style={{ flex: 1, gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            Apple
          </button>
        </div>
      </form>

      {/* Sign up link */}
      <p style={{
        textAlign: 'center',
        marginTop: 'var(--sp-8)',
        fontSize: '0.875rem',
        color: 'var(--on-surface-variant)',
      }}>
        Don&apos;t have an account?{' '}
        <a href="/auth/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign up</a>
      </p>
    </div>
  );
}
