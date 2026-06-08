'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('email');

  // Verification states
  const [verificationData, setVerificationData] = useState(null); // { userId, email, phone, emailOtp, phoneOtp }
  const [otpInputs, setOtpInputs] = useState({ emailOtp: '', phoneOtp: '' });
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState('');

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
      // Clear email or phone if it was not in the active tab to prevent registering both
      const payload = { ...form };
      if (tab === 'email') payload.phone = '';
      else payload.email = '';

      const res = await register(payload);
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
      setError(err.message || 'Registration failed');
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
                  We have sent a verification code to complete your signup.
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
                    Back to Sign Up
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Signup Form
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <button onClick={() => router.back()} className="btn-icon btn btn-ghost" style={{ width: 32, height: 32, color: 'var(--on-surface)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <h1 className="text-headline" style={{ color: 'var(--on-surface)', fontSize: '1.4rem', margin: 0 }}>Create Account</h1>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {error && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</div>
                )}

                <input id="signup-fullname" className="input-field" placeholder="Full Name" value={form.fullName} onChange={handleChange('fullName')} required style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', height: 38 }} />
                <input id="signup-username" className="input-field" placeholder="Username" value={form.username} onChange={handleChange('username')} required style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', height: 38 }} />

                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: 0, background: 'var(--surface-container-high)', borderRadius: 8, padding: 3, marginBottom: 4 }}>
                  {['email', 'phone'].map(t => (
                    <button key={t} type="button" onClick={() => setTab(t)} style={{
                      flex: 1, padding: '6px', borderRadius: 6,
                      background: tab === t ? 'var(--surface-container-lowest)' : 'transparent',
                      color: tab === t ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                      fontWeight: tab === t ? 600 : 400, fontSize: '0.8rem',
                      border: 'none', cursor: 'pointer', transition: 'all var(--transition-fast)',
                      boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                    }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>

                {tab === 'email' ? (
                  <input id="signup-email" className="input-field" type="email" placeholder="Email address" value={form.email} onChange={handleChange('email')} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', height: 38 }} />
                ) : (
                  <input id="signup-phone" className="input-field" type="tel" placeholder="Phone number" value={form.phone} onChange={handleChange('phone')} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', height: 38 }} />
                )}

                <div style={{ position: 'relative' }}>
                  <input id="signup-password" className="input-field" type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 characters)" value={form.password} onChange={handleChange('password')} required style={{ paddingRight: 48, background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', height: 38 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: '0.75rem' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <input id="signup-confirm" className="input-field" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} required style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', height: 38 }} />

                <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textAlign: 'center', margin: '4px 0' }}>
                  By signing up, you agree to our <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms</a> & <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</a>
                </p>

                <button id="signup-submit" className="btn btn-primary w-full" type="submit" disabled={loading} style={{ height: 42, justifyContent: 'center', fontWeight: 'bold' }}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                Already have an account? <a href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</a>
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--on-surface)' }}>Create a NexChat account</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
            Sign up to start chatting with your friends and family using real-time secure messaging, share statuses, and make voice/video calls from any device.
          </p>
          <ul style={{
            fontSize: '0.85rem', color: 'var(--on-surface-variant)',
            lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6,
            margin: 0
          }}>
            <li>Real-time message synchronization</li>
            <li>Voice and video calling directly in-app</li>
            <li>Status updates with custom backgrounds</li>
            <li>Email or Phone one-time code (OTP) security</li>
          </ul>
          <div style={{ marginTop: 10 }}>
            <a href="/auth/login" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Already registered? Log in here</a>
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
