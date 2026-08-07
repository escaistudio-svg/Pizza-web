import { useEffect } from 'react'

/**
 * Adds `is-in` to anything carrying a `.reveal` class as it enters the
 * viewport. One observer for the whole page; elements are unobserved once
 * they've played so nothing thrashes on the way back up.
 */
export function useReveal(active = true) {
  useEffect(() => {
    if (!active) return

    const targets = Array.from(document.querySelectorAll('.reveal, .mask'))
    if (!targets.length) return

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    )

    // Anything already on screen plays right away — the observer's bottom
    // margin is there to hold back content you haven't scrolled to yet, and it
    // would otherwise strand elements sitting just above the fold.
    const vh = window.innerHeight
    const pending = []
    for (const el of targets) {
      if (el.getBoundingClientRect().top < vh) el.classList.add('is-in')
      else pending.push(el)
    }

    pending.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [active])
}

/**
 * Reports which of a set of sections is currently centred in the viewport.
 * Drives the atlas — the pizza on the left follows the chapter you're reading.
 */
export function useActiveSection(selector, onChange, active = true) {
  useEffect(() => {
    if (!active) return
    const sections = Array.from(document.querySelectorAll(selector))
    if (!sections.length) return

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the most visible section rather than the first to cross.
        let best = null
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry
        }
        if (best) onChange(best.target.dataset.section)
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    sections.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [selector, onChange, active])
}
