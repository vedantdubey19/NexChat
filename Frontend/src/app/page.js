'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SplashPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/chat');
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 'var(--sp-8)',
      background: 'linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--primary-light) 30%, var(--surface)) 100%)',
    }}>
      {/* Logo */}
      <div className="animate-fade-in" style={{
        width: 120,
        height: 120,
        borderRadius: 'var(--radius-2xl)',
        background: 'var(--gradient-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--sp-8)',
        boxShadow: 'var(--shadow-xl)',
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01" />
          <path d="M12 10h.01" />
          <path d="M16 10h.01" />
        </svg>
      </div>

      {/* Branding */}
      <h1 className="text-display animate-slide-up" style={{
        background: 'var(--gradient-primary)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: 'var(--sp-3)',
      }}>
        NexChat
      </h1>

      <p className="text-body animate-slide-up" style={{
        color: 'var(--on-surface-variant)',
        marginBottom: 'var(--sp-16)',
        textAlign: 'center',
        maxWidth: 280,
        animationDelay: '0.1s',
        animationFillMode: 'backwards',
      }}>
        Connect. Chat. Share.
      </p>

      {/* Decorative dots */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 'var(--sp-12)',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i === 1 ? 'var(--primary)' : 'var(--outline-variant)',
            animation: 'pulse 2s infinite',
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="animate-slide-up" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-4)',
        width: '100%',
        maxWidth: 320,
        animationDelay: '0.2s',
        animationFillMode: 'backwards',
      }}>
        <button
          className="btn btn-primary btn-lg w-full"
          onClick={() => router.push('/auth/signup')}
          style={{ fontSize: '1rem', padding: 'var(--sp-4)' }}
        >
          Get Started
        </button>

        <button
          className="btn btn-ghost w-full"
          onClick={() => router.push('/auth/login')}
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Already have an account? <span style={{ color: 'var(--primary)', fontWeight: 600, marginLeft: 4 }}>Log in</span>
        </button>
      </div>

      {/* Footer */}
      <p className="text-small" style={{
        position: 'absolute',
        bottom: 'var(--sp-8)',
        opacity: 0.5,
      }}>
        Powered by NexChat • v2.1.0
      </p>
    </div>
  );
}
