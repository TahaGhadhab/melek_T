import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, UserPlus, Eye, EyeOff, Mail, Lock } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  // Focus email on mount
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const result = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password)

      if (result.error) {
        setError(result.error)
      } else {
        // Sign-up: show confirmation message
        if (mode === 'signup') {
          setError(null)
          // Stay on page — Supabase will send onAuthStateChange event
          // or user needs to confirm email
        }
        // Sign-in: navigation happens via onAuthStateChange -> App.tsx redirect
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError(null)
  }

  return (
    <div
      className="flex min-h-screen w-screen items-center justify-center"
      style={{ backgroundColor: 'var(--surface-0)' }}
    >
      <div className="w-full max-w-sm px-6">
        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center rounded-lg mb-4"
            style={{
              width: 48,
              height: 48,
              backgroundColor: 'var(--fill-accent)',
            }}
          >
            <span className="text-xl font-bold text-white">O</span>
          </div>
          <h1
            className="text-lg font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            OpsHub
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Operational Communication Hub
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-card p-6"
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '0.5px solid var(--border)',
          }}
        >
          {/* Title */}
          <div className="mb-5">
            <h2
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {mode === 'signin'
                ? 'Sign in to your OpsHub account'
                : 'Register for a new OpsHub account'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-sm mb-4 text-[11px] font-medium"
              style={{
                backgroundColor: 'var(--bg-danger)',
                color: '#A32D2D',
              }}
            >
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success message after sign-up */}
          {mode === 'signup' && !error && isSubmitting === false && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-sm mb-4 text-[11px] font-medium"
              style={{
                backgroundColor: 'var(--bg-success)',
                color: '#27500A',
              }}
            >
              <span style={{ flexShrink: 0 }}>✓</span>
              <span>
                Account created! Check your email for a confirmation link, then sign in.
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <label
                className="block text-[11px] font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email
              </label>
              <div
                className="flex items-center gap-2 rounded-sm px-3 py-2"
                style={{
                  backgroundColor: 'var(--surface-0)',
                  border: '0.5px solid var(--border)',
                }}
              >
                <Mail size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="flex-1 text-xs bg-transparent border-none outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[11px] font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <div
                className="flex items-center gap-2 rounded-sm px-3 py-2"
                style={{
                  backgroundColor: 'var(--surface-0)',
                  border: '0.5px solid var(--border)',
                }}
              >
                <Lock size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="flex-1 text-xs bg-transparent border-none outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center justify-center cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 w-full text-xs font-medium rounded-sm px-4 py-2.5 cursor-pointer transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--fill-accent)',
                color: '#fff',
                transitionDuration: 'var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              {isSubmitting ? (
                <>
                  <div
                    className="w-3 h-3 rounded-full animate-spin"
                    style={{
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                    }}
                  />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'signin' ? <LogIn size={13} /> : <UserPlus size={13} />}
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          <div
            className="flex items-center gap-3 my-4"
          >
            <div className="flex-1 h-[0.5px]" style={{ backgroundColor: 'var(--border)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {mode === 'signin' ? 'New to OpsHub?' : 'Already have an account?'}
            </span>
            <div className="flex-1 h-[0.5px]" style={{ backgroundColor: 'var(--border)' }} />
          </div>

          {/* Mode toggle */}
          <button
            onClick={switchMode}
            className="w-full text-[11px] font-medium rounded-sm px-3 py-2 cursor-pointer transition-all"
            style={{
              color: 'var(--text-accent)',
              transitionDuration: 'var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Footer */}
        <p
          className="text-[10px] text-center mt-6"
          style={{ color: 'var(--text-muted)' }}
        >
          By continuing, you agree to OpsHub&apos;s terms of service.
        </p>
      </div>
    </div>
  )
}
