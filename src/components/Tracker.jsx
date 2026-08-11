import { useEffect, useRef, useState } from 'react'
import Reveal from './Reveal.jsx'
import PizzaO from './PizzaO.jsx'
import { TRACK_STAGES, ORDER_MODES } from '../data/menu.js'
import { useStore } from '../store.js'

const STEP_MS = 2600

/**
 * The order tracker.
 *
 * Domino's proved the point years ago: people will watch a progress bar for
 * their dinner. This is the demo version — it runs the five stages on a loop
 * so you can see what the real thing looks like, and says so plainly rather
 * than pretending there's a live order behind it.
 *
 * Takeaway and dine-in skip the last stage, because nobody is delivering it.
 */
export default function Tracker() {
  const mode = useStore((s) => s.orderMode)
  const [stage, setStage] = useState(0)
  const [running, setRunning] = useState(true)
  const holder = useRef(null)

  const stages = mode === 'delivery' ? TRACK_STAGES : TRACK_STAGES.slice(0, -1)
  const last = stages.length - 1

  // Only tick while it's on screen — no point animating a section nobody sees.
  useEffect(() => {
    const el = holder.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), {
      threshold: 0.25,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setStage((s) => (s + 1) % (last + 1)), STEP_MS)
    return () => clearInterval(id)
  }, [running, last])

  // Clamp when switching to a mode with fewer stages.
  useEffect(() => {
    setStage((s) => Math.min(s, last))
  }, [last])

  const modeLabel = ORDER_MODES.find((m) => m.id === mode)?.label ?? 'Delivery'
  const progress = last > 0 ? stage / last : 0

  return (
    <section className="track" id="track" ref={holder}>
      <div className="shell track__inner">
        <div className="track__head">
          <div>
            <span className="eyebrow">Order tracking</span>
            <Reveal as="h2" className="track__title">
              Watch it get made.
            </Reveal>
          </div>
          <p className="track__aside reveal">
            A live tracker from the moment you order — {modeLabel.toLowerCase()} orders
            update at every stage. This one&apos;s a demo, running on a loop.
          </p>
        </div>

        <ol
          className="track__rail"
          style={{ '--count': stages.length, '--progress': progress }}
        >
          <span className="track__line" aria-hidden="true">
            <span className="track__line-fill" />
          </span>

          {stages.map((s, i) => {
            const state = i < stage ? 'done' : i === stage ? 'now' : 'todo'
            return (
              <li key={s.id} className={`track__step is-${state}`}>
                <span className="track__dot" aria-hidden="true">
                  {state === 'now' && <PizzaO progress={1} spin counter="var(--cream)" />}
                </span>
                <span className="track__label">{s.label}</span>
                <span className="track__note">{s.note}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
