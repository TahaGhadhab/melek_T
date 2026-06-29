import { useState, useEffect, useRef } from 'react'

/**
 * Animates a number from 0 to `target` using requestAnimationFrame.
 * Re-animates whenever `target` changes.
 */
export function useCountUp(target: number, duration = 800, delay = 0): number {
  const [value, setValue] = useState(0)
  const prevTargetRef = useRef<number | undefined>(undefined)
  const frameRef = useRef<number>()

  useEffect(() => {
    // Skip if target hasn't changed (and it's not the first run)
    if (prevTargetRef.current !== undefined && target === prevTargetRef.current) return
    prevTargetRef.current = target

    const delayTimer = setTimeout(() => {
      const startValue = 0
      let startTime: number | null = null

      function animate(timestamp: number) {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Cubic ease-out
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(startValue + (target - startValue) * eased))

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate)
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(delayTimer)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration, delay])

  return value
}
