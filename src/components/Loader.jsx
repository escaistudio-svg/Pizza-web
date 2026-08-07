import { useEffect, useRef, useState } from 'react'
import PizzaO from './PizzaO.jsx'
import { useStore } from '../store.js'

const NOTES = [
  'Weighing the flour',
  '72 hours in the cold',
  'Stretched by hand',
  'Into the fire — 480°',
  'Ninety seconds',
  'Ready',
]

const BEFORE = 'FL'
const AFTER = 'URCHILD'

/**
 * The loading page. Progress fills the wordmark's pizza-O with toppings, then
 * the whole panel wipes upward to reveal the hero.
 */
export default function Loader() {
  const setLoaded = useStore((s) => s.setLoaded)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)
  const startedAt = useRef(performance.now())

  useEffect(() => {
    const DURATION = 2400
    let frame

    const tick = (now) => {
      const elapsed = now - startedAt.current
      // Ease out so it sprints early and settles on the last few percent.
      const t = Math.min(1, elapsed / DURATION)
      const eased = 1 - Math.pow(1 - t, 2.4)
      setProgress(eased)

      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setDone(true)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!done) return
    const a = setTimeout(() => setGone(true), 260)
    const b = setTimeout(() => setLoaded(true), 420)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [done, setLoaded])

  const pct = Math.round(progress * 100)
  const note = NOTES[Math.min(NOTES.length - 1, Math.floor(progress * NOTES.length))]

  return (
    <div className={`loader ${gone ? 'is-done' : ''}`} aria-hidden={gone}>
      <div className="loader__mark">
        {BEFORE.split('').map((c, i) => (
          <span key={`b${i}`} className="loader__letter" style={{ '--i': i }}>
            {c}
          </span>
        ))}
        <PizzaO progress={progress} spin counter="var(--cream)" />
        {AFTER.split('').map((c, i) => (
          <span key={`a${i}`} className="loader__letter" style={{ '--i': i + 3 }}>
            {c}
          </span>
        ))}
      </div>

      <div className="loader__meter">
        <div className="loader__track">
          <div className="loader__fill" style={{ '--p': progress }} />
        </div>
        <div className="loader__pct num">{String(pct).padStart(3, '0')}</div>
      </div>

      <p className="loader__note mono">{note}</p>
    </div>
  )
}
