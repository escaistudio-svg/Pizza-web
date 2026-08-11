import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { organicMap, mulberry32, hashString } from './textures.js'

/**
 * Desserts, built as actual desserts.
 *
 * The first pass reused the pizza renderer and called everything a "sweet
 * pie", which is how you end up with a gulab jamun pizza — an engineering
 * shortcut pretending to be a menu. These are modelled as the things they
 * are: a lava cake is a cake, a cannoli is a tube, gelato is scoops in a cup.
 *
 * Every form is composed from lathes, rounded slabs and spheres, so it stays
 * in the same no-assets budget as the pizzas.
 */

/* ------------------------------------------------------------------ *
 * geometry helpers
 * ------------------------------------------------------------------ */

const cache = new Map()
const geo = (key, build) => {
  if (!cache.has(key)) cache.set(key, build())
  return cache.get(key)
}

function roundedSlab(w, h, d, r) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)

  const g = new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelSize: Math.min(r * 0.4, d * 0.28),
    bevelThickness: d * 0.22,
    bevelSegments: 2,
    curveSegments: 10,
  })
  g.rotateX(-Math.PI / 2)
  g.center()
  return g
}

function lathe(points, segments = 64) {
  return new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments
  )
}

/** A scoop — a sphere squashed and lightly lumped so it isn't a billiard ball. */
function scoopGeometry() {
  return geo('scoop', () => {
    const g = new THREE.IcosahedronGeometry(0.52, 3)
    const pos = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const n = Math.sin(v.x * 7) * 0.5 + Math.sin(v.y * 6.2) * 0.3 + Math.sin(v.z * 8.1) * 0.4
      v.multiplyScalar(1 + n * 0.055)
      pos.setXYZ(i, v.x, v.y * 0.92, v.z)
    }
    g.computeVertexNormals()
    return g
  })
}

/* ------------------------------------------------------------------ *
 * materials
 * ------------------------------------------------------------------ */

const matCache = new Map()
function mat(color, { rough = 0.55, clear = 0.25, textured = true } = {}) {
  const key = `${color}:${rough}:${clear}:${textured}`
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        map: textured ? organicMap() : null,
        roughness: rough,
        metalness: 0,
        clearcoat: clear,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.6,
      })
    )
  }
  return matCache.get(key)
}

/* ------------------------------------------------------------------ *
 * scattered garnish (pistachio, cocoa nibs, sprinkles)
 * ------------------------------------------------------------------ */

function Garnish({ seed, count, color, radius, y, size = 1 }) {
  const ref = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const items = useMemo(() => {
    const rand = mulberry32(seed)
    return Array.from({ length: count }, () => {
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand()) * radius
      return {
        p: [Math.cos(a) * r, y + rand() * 0.02, Math.sin(a) * r],
        rot: [rand() * 3, rand() * 3, rand() * 3],
        s: (0.7 + rand() * 0.6) * size,
      }
    })
  }, [seed, count, radius, y, size])

  const geometry = useMemo(() => geo('nib', () => roundedSlab(0.075, 0.05, 0.03, 0.02)), [])
  const material = useMemo(() => mat(color, { rough: 0.6, clear: 0.2 }), [color])

  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    items.forEach((it, i) => {
      dummy.position.set(...it.p)
      dummy.rotation.set(...it.rot)
      dummy.scale.setScalar(it.s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [items, dummy])

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow
      frustumCulled={false}
    />
  )
}

/* ------------------------------------------------------------------ *
 * the five forms
 * ------------------------------------------------------------------ */

function LavaCake({ c }) {
  const body = useMemo(
    () =>
      geo('lava:body', () =>
        lathe([
          [0, -0.5],
          [0.86, -0.5],
          [0.96, -0.42],
          [1.02, -0.1],
          [1.0, 0.3],
          [0.92, 0.44],
          [0.6, 0.5],
          [0.34, 0.46],
          [0, 0.44],
        ])
      ),
    []
  )
  const pool = useMemo(
    () =>
      geo('lava:pool', () => {
        const g = new THREE.SphereGeometry(0.4, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55)
        g.scale(1, 0.42, 1)
        return g
      }),
    []
  )

  return (
    <group>
      <mesh geometry={body} material={mat(c.body, { rough: 0.72, clear: 0.16 })} castShadow receiveShadow />
      {/* molten centre welling out of the top */}
      <mesh
        geometry={pool}
        material={mat(c.molten, { rough: 0.22, clear: 0.85 })}
        position={[0, 0.44, 0]}
        castShadow
      />
      <Garnish seed={11} count={26} color={c.dust} radius={0.95} y={0.47} size={0.8} />
    </group>
  )
}

function Tiramisu({ c }) {
  const sponge = useMemo(() => geo('tira:sponge', () => roundedSlab(1.75, 1.2, 0.3, 0.09)), [])
  const cream = useMemo(() => geo('tira:cream', () => roundedSlab(1.78, 1.23, 0.26, 0.1)), [])

  return (
    <group>
      {/* alternating soak and mascarpone — the layers are the whole point */}
      <mesh geometry={sponge} material={mat(c.sponge, { rough: 0.78, clear: 0.1 })} position={[0, -0.42, 0]} castShadow receiveShadow />
      <mesh geometry={cream} material={mat(c.cream, { rough: 0.42, clear: 0.4 })} position={[0, -0.14, 0]} castShadow />
      <mesh geometry={sponge} material={mat(c.sponge, { rough: 0.78, clear: 0.1 })} position={[0, 0.14, 0]} castShadow />
      <mesh geometry={cream} material={mat(c.cream, { rough: 0.42, clear: 0.4 })} position={[0, 0.42, 0]} castShadow />
      {/* cocoa dusting */}
      <Garnish seed={23} count={44} color={c.dust} radius={0.82} y={0.56} size={0.9} />
    </group>
  )
}

function Brownie({ c }) {
  const slab = useMemo(() => geo('brownie:slab', () => roundedSlab(1.7, 1.35, 0.62, 0.12)), [])
  const scoop = scoopGeometry()

  return (
    <group>
      <mesh geometry={slab} material={mat(c.body, { rough: 0.74, clear: 0.18 })} castShadow receiveShadow />
      <mesh
        geometry={scoop}
        material={mat(c.scoop, { rough: 0.5, clear: 0.3 })}
        position={[0.12, 0.62, 0.05]}
        castShadow
      />
      <Garnish seed={37} count={22} color={c.dust} radius={0.7} y={0.33} size={1.1} />
    </group>
  )
}

function Cannoli({ c }) {
  const shell = useMemo(
    () =>
      geo('cannoli:shell', () => {
        const g = new THREE.CylinderGeometry(0.42, 0.42, 1.7, 40, 1, true)
        g.rotateZ(Math.PI / 2)
        return g
      }),
    []
  )
  const filling = useMemo(
    () =>
      geo('cannoli:fill', () => {
        const g = new THREE.SphereGeometry(0.4, 28, 18)
        g.scale(0.5, 1, 1)
        return g
      }),
    []
  )

  return (
    <group rotation={[0, 0.35, 0.12]}>
      <mesh
        geometry={shell}
        material={
          new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(c.body),
            map: organicMap(),
            roughness: 0.62,
            clearcoat: 0.3,
            envMapIntensity: 0.6,
            side: THREE.DoubleSide,
          })
        }
        castShadow
        receiveShadow
      />
      {/* ricotta piped out of both ends */}
      <mesh geometry={filling} material={mat(c.cream, { rough: 0.44, clear: 0.4 })} position={[0.86, 0, 0]} castShadow />
      <mesh geometry={filling} material={mat(c.cream, { rough: 0.44, clear: 0.4 })} position={[-0.86, 0, 0]} castShadow />
      <Garnish seed={53} count={16} color={c.dust} radius={0.28} y={0.26} size={1} />
    </group>
  )
}

function Gelato({ c }) {
  const cup = useMemo(
    () =>
      geo('gelato:cup', () =>
        lathe([
          [0, -0.62],
          [0.5, -0.62],
          [0.58, -0.5],
          [0.74, 0.1],
          [0.8, 0.44],
          [0.78, 0.5],
          [0.72, 0.44],
          [0.66, 0.1],
          [0.5, -0.5],
          [0, -0.5],
        ])
      ),
    []
  )
  const scoop = scoopGeometry()

  return (
    <group>
      <mesh geometry={cup} material={mat(c.body, { rough: 0.55, clear: 0.3, textured: false })} castShadow receiveShadow />
      <mesh geometry={scoop} material={mat(c.scoop, { rough: 0.48, clear: 0.32 })} position={[-0.22, 0.6, 0.06]} castShadow />
      <mesh geometry={scoop} material={mat(c.scoop2 ?? c.scoop, { rough: 0.48, clear: 0.32 })} position={[0.26, 0.66, -0.08]} scale={0.92} castShadow />
      <Garnish seed={71} count={20} color={c.dust} radius={0.5} y={0.98} size={0.9} />
    </group>
  )
}

const FORMS = { lava: LavaCake, tiramisu: Tiramisu, brownie: Brownie, cannoli: Cannoli, gelato: Gelato }

/* ------------------------------------------------------------------ *
 * component
 * ------------------------------------------------------------------ */

const OUT_TIME = 0.34
const IN_TIME = 0.62
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)

export default function Dessert({ dessert, scale = 1, autoSpin = 0.3, ...props }) {
  const root = useRef()
  const [rendered, setRendered] = useState(dessert)
  const progress = useRef(1)
  const phase = useRef('idle')
  const pending = useRef(dessert)

  useEffect(() => {
    pending.current = dessert
    if (dessert.id === rendered.id) return
    phase.current = 'out'
  }, [dessert, rendered.id])

  useFrame((state, rawDelta) => {
    const d = Math.min(rawDelta, 0.05)

    if (phase.current === 'out') {
      progress.current -= d / OUT_TIME
      if (progress.current <= 0) {
        progress.current = 0
        setRendered(pending.current)
        phase.current = 'in'
      }
    } else if (phase.current === 'in') {
      progress.current += d / IN_TIME
      if (progress.current >= 1) {
        progress.current = 1
        phase.current = 'idle'
      }
    }

    if (root.current) {
      const p = progress.current
      const eased = Math.max(0.0001, easeOutBack(p))
      root.current.scale.setScalar(eased * scale)
      // Drops in and spins up as it lands.
      root.current.position.y = (1 - p) * 2.2
      root.current.rotation.y += (autoSpin + (1 - p) * 6) * d
      root.current.rotation.z = (1 - p) * 0.5
    }
  })

  const Form = FORMS[rendered.form] ?? LavaCake

  return (
    <group ref={root} {...props}>
      <Form c={rendered.colors} />
    </group>
  )
}
