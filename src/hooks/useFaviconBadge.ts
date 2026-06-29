import { useEffect, useRef } from 'react'

const FAVICON_SIZE = 32
const BADGE_RADIUS = 10
const BADGE_X = FAVICON_SIZE - BADGE_RADIUS
const BADGE_Y = BADGE_RADIUS

function drawBadgeFavicon(count: number): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = FAVICON_SIZE
  canvas.height = FAVICON_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  if (count > 0) {
    const text = count > 99 ? '99+' : String(count)

    ctx.beginPath()
    ctx.arc(BADGE_X, BADGE_Y, BADGE_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#E24B4A'
    ctx.fill()

    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(BADGE_X, BADGE_Y, BADGE_RADIUS - 1, 0, Math.PI * 2)
    ctx.stroke()

    ctx.font = 'bold 10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(text, BADGE_X, BADGE_Y)
  }

  return canvas.toDataURL('image/png')
}

/**
 * Dessine un badge rouge avec le nombre de notifications sur le favicon de l'onglet.
 * Essaie d'abord de conserver le favicon original; si ça échoue (SVG, CORS),
 * affiche uniquement le badge sur fond transparent.
 */
export function useFaviconBadge(count: number) {
  const originalHref = useRef<string | null>(null)
  const originalType = useRef<string | null>(null)

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel*="icon"]')
    if (!link) return

    if (originalHref.current === null) {
      originalHref.current = link.href
      originalType.current = link.type || 'image/svg+xml'
    }

    if (count === 0) {
      link.href = originalHref.current!
      link.type = originalType.current!
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = FAVICON_SIZE
        canvas.height = FAVICON_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0, FAVICON_SIZE, FAVICON_SIZE)

        const text = count > 99 ? '99+' : String(count)

        ctx.beginPath()
        ctx.arc(BADGE_X, BADGE_Y, BADGE_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = '#E24B4A'
        ctx.fill()

        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(BADGE_X, BADGE_Y, BADGE_RADIUS - 1, 0, Math.PI * 2)
        ctx.stroke()

        ctx.font = 'bold 10px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(text, BADGE_X, BADGE_Y)

        link.href = canvas.toDataURL('image/png')
        link.type = 'image/png'
      } catch {
        const fallback = drawBadgeFavicon(count)
        if (fallback) {
          link.href = fallback
          link.type = 'image/png'
        }
      }
    }

    img.onerror = () => {
      const fallback = drawBadgeFavicon(count)
      if (fallback) {
        link.href = fallback
        link.type = 'image/png'
      }
    }

    img.src = originalHref.current

    // Cleanup: restaurer le favicon original uniquement au démontage
    return () => {
      link.href = originalHref.current!
      link.type = originalType.current!
    }
  }, [count])
}
