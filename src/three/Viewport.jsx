import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'

/**
 * A self-contained WebGL region.
 *
 * Each 3D moment on the page owns its canvas rather than sharing one scissored
 * context. That keeps the page's stacking honest — a section can have its own
 * background and its own text above the pizza without any z-index gymnastics.
 *
 * The cost is managed: a canvas isn't created until it's near the viewport, and
 * its render loop drops to `demand` the moment it scrolls away.
 */
export default function Viewport({
  className = '',
  fill = false,
  eager = false,
  dpr = [1, 1.75],
  children,
  ...canvasProps
}) {
  const holder = useRef(null)
  const [mounted, setMounted] = useState(eager)
  const [active, setActive] = useState(eager)

  useEffect(() => {
    const el = holder.current
    if (!el) return

    if (!('IntersectionObserver' in window)) {
      setMounted(true)
      setActive(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
        setActive(entry.isIntersecting)
      },
      { rootMargin: '30% 0px 30% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={holder}
      className={`viewport ${fill ? 'viewport--fill' : ''} ${className}`}
      aria-hidden="true"
    >
      {mounted && (
        <Canvas
          frameloop={active ? 'always' : 'demand'}
          dpr={dpr}
          shadows
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.NeutralToneMapping
            gl.toneMappingExposure = 1.0
          }}
          {...canvasProps}
        >
          {children}
        </Canvas>
      )}
    </div>
  )
}
