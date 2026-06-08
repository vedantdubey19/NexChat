'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification states
  const [verificationData, setVerificationData] = useState(null); // { userId, email, phone, emailOtp, phoneOtp }
  const [otpInputs, setOtpInputs] = useState({ emailOtp: '', phoneOtp: '' });
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(identifier, password);
      if (res && res.verificationRequired) {
        setVerificationData(res);
        setOtpInputs({
          emailOtp: res.emailOtp || '',
          phoneOtp: res.phoneOtp || '',
        });
      } else {
        router.push('/chat');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationSuccess('');
    setVerifying(true);
    try {
      await verifyOtp(verificationData.userId, otpInputs.emailOtp, otpInputs.phoneOtp);
      router.push('/chat');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setVerificationSuccess('');
    try {
      const res = await resendOtp(verificationData.userId);
      setVerificationSuccess('New verification codes sent successfully!');
      setOtpInputs({
        emailOtp: res.emailOtp || '',
        phoneOtp: res.phoneOtp || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to resend verification codes');
    }
  };

  return (
    <div className="web-auth-page">
      {/* Top Banner */}
      <div className="web-auth-banner" style={{ display: 'flex', alignItems: 'center', padding: '0 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            NEXCHAT WEB
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="web-auth-card">
        {/* Left Side: Form */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {verificationData ? (
            // OTP Verification Form
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div style={{ marginBottom: '10px' }}>
                <h1 className="text-headline" style={{ marginBottom: 4, color: 'var(--on-surface)', fontSize: '1.4rem' }}>Verify OTP</h1>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                  We have sent a verification code to authenticate your login.
                  {verificationData.email && <div style={{ marginTop: 4 }}>Email: <strong>{verificationData.email}</strong></div>}
                  {verificationData.phone && <div style={{ marginTop: 2 }}>Phone: <strong>{verificationData.phone}</strong></div>}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {error && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</div>
                )}
                {verificationSuccess && (
                  <div style={{ padding: '8px 12px', background: 'rgba(0, 168, 132, 0.1)', borderRadius: 8, color: 'var(--primary)', fontSize: '0.8rem' }}>{verificationSuccess}</div>
                )}

                {verificationData.email && (
                  <div>
                    <label className="text-label" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: 600 }}>
                      EMAIL CODE
                    </label>
                    <input
                      id="email-otp-input"
                      className="input-field"
                      type="text"
                      placeholder="Enter email code"
                      value={otpInputs.emailOtp}
                      onChange={(e) => setOtpInputs(prev => ({ ...prev, emailOtp: e.target.value }))}
                      required
                      maxLength={6}
                      style={{ textAlign: 'center', letterSpacing: 4, fontSize: '1.1rem', fontWeight: 600, background: 'var(--surface-container-low)', height: 40 }}
                    />
                  </div>
                )}

                {verificationData.phone && (
                  <div>
                    <label className="text-label" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: 600 }}>
                      PHONE CODE
                    </label>
                    <input
                      id="phone-otp-input"
                      className="input-field"
                      type="text"
                      placeholder="Enter phone code"
                      value={otpInputs.phoneOtp}
                      onChange={(e) => setOtpInputs(prev => ({ ...prev, phoneOtp: e.target.value }))}
                      required
                      maxLength={6}
                      style={{ textAlign: 'center', letterSpacing: 4, fontSize: '1.1rem', fontWeight: 600, background: 'var(--surface-container-low)', height: 40 }}
                    />
                  </div>
                )}

                <div style={{
                  fontSize: '0.72rem',
                  background: 'var(--surface-container-low)',
                  padding: 10,
                  borderRadius: 6,
                  color: 'var(--on-surface-variant)',
                  textAlign: 'center',
                  border: '1px solid var(--outline-variant)'
                }}>
                  ℹ️ Codes are pre-filled and logged in server terminal.
                </div>

                <button id="otp-verify-submit" className="btn btn-primary w-full" type="submit" disabled={verifying} style={{ height: 42, justifyContent: 'center' }}>
                  {verifying ? 'Verifying...' : 'Verify & Log In'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <button type="button" className="btn-ghost" onClick={handleResendOtp} style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                    Resend Code
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setVerificationData(null)} style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem' }}>
                    Back to Log In
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Login Form
            <>
              {/* Header */}
              <div className="animate-fade-in" style={{ marginBottom: 24 }}>
                <h1 className="text-headline" style={{ marginBottom: 4, color: 'var(--on-surface)', fontSize: '1.5rem' }}>Welcome Back</h1>
                <p className="text-body" style={{ color: 'var(--on-surface-variant)', fontSize: '0.88rem' }}>Sign in to continue to NexChat Web</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="animate-slide-up" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}>
                {error && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 8,
                    color: 'var(--danger)',
                    fontSize: '0.82rem',
                  }}>{error}</div>
                )}

                {/* Identifier */}
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: 6, color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: 600 }}>
                    EMAIL, PHONE, OR USERNAME
                  </label>
                  <input
                    id="login-identifier"
                    className="input-field"
                    type="text"
                    placeholder="Enter your email, phone, or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', height: 40 }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: 6, color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: 600 }}>
                    PASSWORD
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
                      style={{ paddingRight: 48, background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', height: 40 }}
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
                  <a href="#" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Forgot Password?</a>
                </div>

                {/* Submit */}
                <button
                  id="login-submit"
                  className="btn btn-primary w-full"
                  type="submit"
                  disabled={loading}
                  style={{ height: 42, justifyContent: 'center', fontWeight: 'bold' }}
                >
                  {loading ? 'Signing in...' : 'Log In'}
                </button>
              </form>

              {/* Sign up link */}
              <p style={{
                textAlign: 'center',
                marginTop: 20,
                fontSize: '0.85rem',
                color: 'var(--on-surface-variant)',
              }}>
                Don&apos;t have an account?{' '}
                <a href="/auth/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign up</a>
              </p>
            </>
          )}
        </div>

        {/* Right Side: Visual/Branding (hidden on mobile) */}
        <div className="desktop-only-branding" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 16,
          borderLeft: '1px solid var(--outline-variant)',
          paddingLeft: 40
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--on-surface)' }}>Using NexChat on your computer</h2>
          <ol style={{
            fontSize: '0.88rem', color: 'var(--on-surface-variant)',
            lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10,
            margin: 0
          }}>
            <li>Open NexChat on your mobile device.</li>
            <li>Verify your email or phone number with a secure one-time password (OTP).</li>
            <li>Connect instantly to your friends, groups, and status updates in real-time.</li>
          </ol>
          <div style={{ marginTop: 20 }}>
            <a href="#" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Need help getting started?</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          .desktop-only-branding {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
