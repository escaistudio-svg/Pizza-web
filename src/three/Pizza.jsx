import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { SAUCES, CHEESES } from '../data/menu.js'
import { crustMap, crustBump, sauceMap, cheeseMap, cheeseRoughness, mulberry32 } from './textures.js'
import { Toppings, buildInstances } from './toppings.jsx'

/**
 * A pizza, assembled from a lathed crust, a sauce disc, a domed cheese layer
 * and instanced toppings.
 *
 * Changing `pizza` runs the flavor switch: toppings lift off outside-in, the
 * base spins through a quarter turn, sauce and cheese lerp to the new colours,
 * and the incoming ingredients rain back down.
 */

const OUT_TIME = 0.42 // seconds to clear the old toppings
const IN_TIME = 0.9 // seconds for the new ones to land

/* ------------------------------------------------------------------ *
 * geometry — built once, shared by every pizza on the page
 * ------------------------------------------------------------------ */

/** Hand-stretched asymmetry: nudge each vertex radially by a little noise. */
function warpRadially(geometry, amount, freqA, freqB) {
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const r = Math.hypot(x, z)
    if (r < 0.001) continue
    const a = Math.atan2(z, x)
    const k = 1 + (Math.sin(a * freqA) * 0.6 + Math.sin(a * freqB + 1.3) * 0.4) * amount
    pos.setX(i, x * k)
    pos.setZ(i, z * k)
  }
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Re-project UVs as a plan view of the pie. A lathe's default UVs wrap around
 * the axis, which puts a visible seam down one side and stretches the texture
 * over the rim; mapping from world XZ instead is how you'd actually photograph
 * a pizza, and it tiles with nothing.
 */
function planarUV(geometry, radius) {
  const pos = geometry.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / (2 * radius) + 0.5
    uv[i * 2 + 1] = pos.getZ(i) / (2 * radius) + 0.5
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geometry
}

let _base, _cheese, _sauce, _blister

function baseGeometry() {
  if (_base) return _base
  // A proper cornicione: about a sixth of the radius, puffed but not a bagel.
  const profile = [
    [0.0, -0.085],
    [1.8, -0.09],
    [2.5, -0.082],
    [2.82, -0.045],
    [2.98, 0.05],
    [3.04, 0.17],
    [2.96, 0.3],
    [2.8, 0.35],
    [2.66, 0.29],
    [2.58, 0.155],
    [2.52, 0.082],
    [2.1, 0.062],
    [1.2, 0.055],
    [0.0, 0.05],
  ].map(([x, y]) => new THREE.Vector2(x, y))

  _base = planarUV(warpRadially(new THREE.LatheGeometry(profile, 132), 0.024, 5, 9), 3.05)
  return _base
}

function cheeseGeometry() {
  if (_cheese) return _cheese
  // Nearly flat — melted cheese pools, it doesn't dome like a cake.
  const profile = [
    [0.0, 0.115],
    [1.0, 0.112],
    [1.7, 0.105],
    [2.12, 0.092],
    [2.3, 0.055],
    [2.4, 0.016],
  ].map(([x, y]) => new THREE.Vector2(x, y))

  _cheese = planarUV(warpRadially(new THREE.LatheGeometry(profile, 132), 0.032, 7, 13), 2.45)
  return _cheese
}

function sauceGeometry() {
  if (_sauce) return _sauce
  const g = new THREE.CircleGeometry(2.5, 128)
  g.rotateX(-Math.PI / 2)
  _sauce = planarUV(warpRadially(g, 0.028, 6, 11), 2.5)
  return _sauce
}

function blisterGeometry() {
  if (_blister) return _blister
  const g = new THREE.SphereGeometry(0.28, 14, 10)
  g.scale(1, 0.38, 1)
  _blister = g
  return _blister
}

/** Bubbles sitting proud of the cheese — pure geometric relief, no texture. */
function blisterPlacements() {
  const rand = mulberry32(4242)
  const out = []
  for (let i = 0; i < 11; i++) {
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * 1.95
    out.push({
      pos: [Math.cos(a) * r, 0.105, Math.sin(a) * r],
      scale: 0.2 + rand() * 0.3,
    })
  }
  return out
}

/* ------------------------------------------------------------------ *
 * component
 * ------------------------------------------------------------------ */

export default function Pizza({
  pizza,
  scale = 1,
  autoSpin = 0.16,
  tilt = 0,
  onPhase,
  ...props
}) {
  const root = useRef()
  const sauceMat = useRef()
  const cheeseMat = useRef()
  const cheeseGroup = useRef()
  const blisterMesh = useRef()
  const blisterMat = useRef()

  // What's currently on the board (lags `pizza` while the old toppings exit).
  const [rendered, setRendered] = useState(pizza)
  const groups = useMemo(() => buildInstances(rendered), [rendered])

  const progress = useRef(1) // topping animation, 0..1
  const phase = useRef('idle') // 'out' | 'in' | 'idle'
  const spinBoost = useRef(0)
  const lift = useRef(0)
  const pending = useRef(pizza)

  useEffect(() => {
    pending.current = pizza
    if (pizza.id === rendered.id) return
    phase.current = 'out'
    spinBoost.current = 1
    onPhase?.('out')
  }, [pizza, rendered.id, onPhase])

  /* target colours — lerped every frame so the base cross-fades smoothly */
  const target = useMemo(() => {
    const sauce = SAUCES[pizza.sauce] ?? SAUCES.tomato
    const cheese = CHEESES[pizza.cheese] ?? CHEESES.mozzarella
    return {
      sauce: new THREE.Color(sauce.color),
      cheese: new THREE.Color(cheese.color),
      // Blisters are the same cheese, just further along in the oven.
      blister: new THREE.Color(cheese.melt).multiplyScalar(0.72),
      coverage: cheese.coverage,
    }
  }, [pizza])

  const blisters = useMemo(blisterPlacements, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const cheeseAmt = useRef(target.coverage > 0 ? 1 : 0)

  /* one-time material inputs */
  const maps = useMemo(
    () => ({
      crust: crustMap(),
      crustBump: crustBump(),
      sauce: sauceMap(),
      cheese: cheeseMap(),
      cheeseRough: cheeseRoughness(),
    }),
    []
  )

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05) // survive tab switches

    /* ---- flavor switch state machine ---- */
    if (phase.current === 'out') {
      progress.current -= delta / OUT_TIME
      if (progress.current <= 0) {
        progress.current = 0
        setRendered(pending.current)
        phase.current = 'in'
        onPhase?.('in')
      }
    } else if (phase.current === 'in') {
      progress.current += delta / IN_TIME
      if (progress.current >= 1) {
        progress.current = 1
        phase.current = 'idle'
        onPhase?.('idle')
      }
    }

    /* ---- base motion ---- */
    spinBoost.current = THREE.MathUtils.damp(spinBoost.current, 0, 2.6, delta)
    const t = state.clock.elapsedTime

    if (root.current) {
      root.current.rotation.y += (autoSpin + spinBoost.current * 7) * delta
      // Lift and tip the pie while ingredients are in the air.
      const busy = 1 - Math.abs(progress.current * 2 - 1)
      lift.current = THREE.MathUtils.damp(lift.current, busy, 8, delta)
      root.current.position.y = Math.sin(t * 0.8) * 0.05 + lift.current * 0.28
      root.current.rotation.z = THREE.MathUtils.damp(
        root.current.rotation.z,
        tilt + lift.current * 0.07,
        6,
        delta
      )
      root.current.rotation.x = THREE.MathUtils.damp(
        root.current.rotation.x,
        Math.sin(t * 0.6) * 0.02,
        4,
        delta
      )
    }

    /* ---- colour cross-fade ---- */
    if (sauceMat.current) sauceMat.current.color.lerp(target.sauce, 1 - Math.exp(-6 * delta))
    if (cheeseMat.current) cheeseMat.current.color.lerp(target.cheese, 1 - Math.exp(-6 * delta))
    if (blisterMat.current) blisterMat.current.color.lerp(target.blister, 1 - Math.exp(-6 * delta))

    /* ---- cheese presence (Marinara and clam pies have none) ---- */
    cheeseAmt.current = THREE.MathUtils.damp(
      cheeseAmt.current,
      target.coverage > 0 ? 1 : 0,
      5,
      delta
    )
    if (cheeseGroup.current) {
      const s = Math.max(0.0001, cheeseAmt.current)
      cheeseGroup.current.scale.set(s, s, s)
      cheeseGroup.current.visible = cheeseAmt.current > 0.01
    }

    /* ---- blisters ride the cheese ---- */
    if (blisterMesh.current) {
      for (let i = 0; i < blisters.length; i++) {
        const b = blisters[i]
        dummy.position.set(b.pos[0], b.pos[1], b.pos[2])
        dummy.scale.setScalar(b.scale * cheeseAmt.current)
        dummy.updateMatrix()
        blisterMesh.current.setMatrixAt(i, dummy.matrix)
      }
      blisterMesh.current.instanceMatrix.needsUpdate = true
      blisterMesh.current.visible = cheeseAmt.current > 0.05
    }
  })

  return (
    <group ref={root} scale={scale} {...props}>
      {/* crust */}
      <mesh geometry={baseGeometry()} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={maps.crust}
          bumpMap={maps.crustBump}
          bumpScale={0.14}
          envMapIntensity={0.55}
          color="#FFF6E8"
          roughness={0.86}
          metalness={0}
          clearcoat={0.06}
          clearcoatRoughness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* sauce */}
      <mesh geometry={sauceGeometry()} position={[0, 0.088, 0]} receiveShadow>
        <meshPhysicalMaterial
          ref={sauceMat}
          map={maps.sauce}
          color={SAUCES[rendered.sauce]?.color ?? '#A4241A'}
          envMapIntensity={0.5}
          roughness={0.5}
          metalness={0}
          clearcoat={0.3}
          clearcoatRoughness={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* cheese */}
      <group ref={cheeseGroup}>
        <mesh geometry={cheeseGeometry()} castShadow receiveShadow>
          <meshPhysicalMaterial
            ref={cheeseMat}
            map={maps.cheese}
            roughnessMap={maps.cheeseRough}
            color={CHEESES[rendered.cheese]?.color ?? '#EBD296'}
            envMapIntensity={0.7}
            roughness={1}
            metalness={0}
            clearcoat={0.5}
            clearcoatRoughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>

        <instancedMesh
          ref={blisterMesh}
          args={[blisterGeometry(), undefined, blisters.length]}
          castShadow
          frustumCulled={false}
        >
          <meshPhysicalMaterial
            ref={blisterMat}
            color="#D6A954"
            roughness={0.42}
            clearcoat={0.7}
            clearcoatRoughness={0.28}
          />
        </instancedMesh>
      </group>

      {/* toppings */}
      <Toppings groups={groups} progressRef={progress} />
    </group>
  )
}
