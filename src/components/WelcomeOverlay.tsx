import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

interface WelcomeOverlayProps {
  name: string
  onFadeOut: () => void
}

export default function WelcomeOverlay({ name, onFadeOut }: WelcomeOverlayProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit' | 'gone'>('enter')

  useEffect(() => {
    // Enter → visible after entrance animation
    const enterTimer = setTimeout(() => setPhase('visible'), 600)
    // Visible → exit after showing for 2s
    const exitTimer = setTimeout(() => setPhase('exit'), 2600)
    // Exit → gone after fade-out animation
    const goneTimer = setTimeout(() => {
      setPhase('gone')
      onFadeOut()
    }, 3600)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(goneTimer)
    }
  }, [onFadeOut])

  if (phase === 'gone') return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{
        animation:
          phase === 'enter'
            ? 'welcomeFadeIn 500ms var(--ease-out-expo) both'
            : phase === 'exit'
            ? 'welcomeFadeOut 800ms var(--ease-out-expo) both'
            : 'none',
      }}
    >
      {/* Backdrop blur */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          animation:
            phase === 'enter'
              ? 'welcomeBackdropIn 400ms var(--ease-out-expo) both'
              : phase === 'exit'
              ? 'welcomeBackdropOut 600ms var(--ease-out-expo) both'
              : 'none',
        }}
      />

      {/* Card */}
      <div
        className="relative flex items-center gap-4 px-8 py-6 rounded-card shadow-lg"
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '0.5px solid var(--border)',
          animation:
            phase === 'enter'
              ? 'welcomeCardSlideIn 500ms var(--ease-overshoot) both'
              : phase === 'exit'
              ? 'welcomeCardFadeOut 700ms var(--ease-out-expo) both'
              : 'none',
        }}
      >
        {/* Decorative icon */}
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: 48,
            height: 48,
            backgroundColor: 'var(--bg-accent)',
          }}
        >
          <Sparkles size={22} style={{ color: 'var(--fill-accent)' }} />
        </div>

        {/* Text */}
        <div>
          <div
            className="text-[11px] font-medium uppercase tracking-wider mb-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Welcome back
          </div>
          <div
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {name}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Animation keyframes are defined in index.css */
