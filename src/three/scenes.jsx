import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, ContactShadows } from '@react-three/drei'
import Pizza from './Pizza.jsx'
import Stage from './Stage.jsx'
import { scrollState } from '../scroll.js'

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)

/**
 * drei's PerspectiveCamera keeps whatever rotation it was born with, so every
 * scene aims it at the pie explicitly.
 */
function Camera({ position, fov }) {
  return (
    <PerspectiveCamera
      makeDefault
      position={position}
      fov={fov}
      near={0.1}
      far={60}
      onUpdate={(cam) => cam.lookAt(0, 0, 0)}
    />
  )
}

/* ------------------------------------------------------------------ *
 * hero — the pie drifts and tips as the page scrolls away from it
 * ------------------------------------------------------------------ */

function HeroRig({ children }) {
  const rig = useRef()

  useFrame((state, delta) => {
    if (!rig.current) return
    const vh = window.innerHeight || 1
    const p = clamp(scrollState.y / vh, 0, 1)
    const d = Math.min(delta, 0.05)

    rig.current.position.y = THREE.MathUtils.damp(rig.current.position.y, -p * 3.4, 8, d)
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, 0.2 - p * 0.75, 8, d)
    const s = 1 - p * 0.18
    rig.current.scale.setScalar(THREE.MathUtils.damp(rig.current.scale.x, s, 8, d))

    // A whisper of pointer parallax — enough to feel alive, not enough to notice.
    const { x, y } = state.pointer
    rig.current.rotation.z = THREE.MathUtils.damp(rig.current.rotation.z, x * 0.07, 4, d)
    rig.current.position.x = THREE.MathUtils.damp(rig.current.position.x, x * 0.22, 4, d)
    rig.current.position.z = THREE.MathUtils.damp(rig.current.position.z, y * 0.12, 4, d)
  })

  return <group ref={rig}>{children}</group>
}

export function HeroScene({ pizza }) {
  return (
    <>
      <Camera position={[0, 11.4, 15.2]} fov={34} />
      <Stage />
      <HeroRig>
        <Pizza pizza={pizza} scale={1.02} autoSpin={0.13} />
      </HeroRig>
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.34}
        scale={17}
        blur={3.2}
        far={7}
        resolution={512}
        color="#7A5A32"
      />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * atlas — one pizza for all seven countries, morphing as you travel
 * ------------------------------------------------------------------ */

function AtlasRig({ children }) {
  const rig = useRef()

  useFrame((state, delta) => {
    if (!rig.current) return
    const d = Math.min(delta, 0.05)
    const { x, y } = state.pointer
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, 0.24 + y * 0.12, 4, d)
    rig.current.rotation.z = THREE.MathUtils.damp(rig.current.rotation.z, x * 0.1, 4, d)
  })

  return <group ref={rig}>{children}</group>
}

export function AtlasScene({ pizza }) {
  return (
    <>
      <Camera position={[0, 9.8, 13.1]} fov={36} />
      <Stage />
      <AtlasRig>
        <Pizza pizza={pizza} scale={1.06} autoSpin={0.2} />
      </AtlasRig>
      <ContactShadows
        position={[0, -1.7, 0]}
        opacity={0.32}
        scale={16}
        blur={3}
        far={7}
        resolution={512}
        color="#7A5A32"
      />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * studio — hero framing, contact shadow, the flavor switch lives here
 * ------------------------------------------------------------------ */

function StudioRig({ children }) {
  const rig = useRef()

  useFrame((state, delta) => {
    if (!rig.current) return
    const d = Math.min(delta, 0.05)
    const { x, y } = state.pointer
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, 0.28 + y * 0.16, 4, d)
    rig.current.rotation.z = THREE.MathUtils.damp(rig.current.rotation.z, x * 0.14, 4, d)
  })

  return <group ref={rig}>{children}</group>
}

export function StudioScene({ pizza, onPhase }) {
  return (
    <>
      <Camera position={[0, 9.4, 12.6]} fov={35} />
      <Stage intensity={1.1} />
      <StudioRig>
        <Pizza pizza={pizza} scale={1.12} autoSpin={0.26} onPhase={onPhase} />
      </StudioRig>
      <ContactShadows
        position={[0, -2.6, 0]}
        opacity={0.62}
        scale={16}
        blur={2.6}
        far={6}
        resolution={512}
        color="#0d0705"
      />
    </>
  )
}
