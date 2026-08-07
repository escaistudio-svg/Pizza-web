import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { scrollState } from '../scroll.js'

/**
 * Lenis-driven smooth scrolling, plus a `data-speed` parallax pass that runs
 * inside the same rAF tick so layers never drift out of sync with the page.
 *
 *   <div data-speed="0.18">  // moves against the scroll
 *   <div data-speed="-0.1">  // moves with it
 */
export function useSmoothScroll(enabled = true) {
  const lenisRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6,
      lerp: 0.09,
    })
    lenisRef.current = lenis
    window.__lenis = lenis

    let layers = []
    const collect = () => {
      layers = Array.from(document.querySelectorAll('[data-speed]')).map((el) => ({
        el,
        speed: parseFloat(el.dataset.speed) || 0,
      }))
    }
    collect()

    const applyParallax = () => {
      const vh = window.innerHeight
      for (const { el, speed } of layers) {
        const rect = el.getBoundingClientRect()
        // -1 above the fold, 0 centred, 1 below — keeps motion symmetric.
        const centre = (rect.top + rect.height / 2 - vh / 2) / vh
        el.style.transform = `translate3d(0, ${(-centre * speed * 100).toFixed(2)}px, 0)`
      }
    }

    lenis.on('scroll', ({ scroll, velocity, limit }) => {
      scrollState.y = scroll
      scrollState.velocity = velocity
      scrollState.progress = limit > 0 ? scroll / limit : 0
    })

    let frame
    const raf = (time) => {
      lenis.raf(time)
      applyParallax()
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    const onResize = () => {
      collect()
      lenis.resize()
    }
    window.addEventListener('resize', onResize)

    // Anchor links route through Lenis so they inherit the easing.
    const onClick = (e) => {
      const anchor = e.target.closest?.('a[href^="#"]')
      if (!anchor) return
      const id = anchor.getAttribute('href')
      if (!id || id === '#') return
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { offset: -70, duration: 1.5 })
    }
    document.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('click', onClick)
      lenis.destroy()
      delete window.__lenis
      lenisRef.current = null
    }
  }, [enabled])

  return lenisRef
}

/** Freeze the page behind an overlay (the bag drawer, the loader). */
export function useScrollLock(locked) {
  useEffect(() => {
    const lenis = window.__lenis
    if (locked) {
      lenis?.stop()
      document.body.classList.add('is-locked')
    } else {
      lenis?.start()
      document.body.classList.remove('is-locked')
    }
    return () => {
      document.body.classList.remove('is-locked')
    }
  }, [locked])
}
