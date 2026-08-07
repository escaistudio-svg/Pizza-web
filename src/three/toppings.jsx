import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mulberry32, hashString, curedMap, organicMap, charredMap } from './textures.js'

/**
 * Toppings are built from thirteen shape primitives. Each entry in a flavor's
 * `toppings` array becomes one InstancedMesh, and every instance animates
 * independently so a flavor change reads as a shower of ingredients rather
 * than a crossfade.
 */

const PIZZA_R = 3.05 // outer crust radius, matches the base lathe profile
const FIELD_R = 2.08 // toppings stay inside the cornicione
const SURFACE_Y = 0.11 // toppings rest here, half-sunk into the cheese

/* ------------------------------------------------------------------ *
 * geometry primitives
 * ------------------------------------------------------------------ */

const geoCache = new Map()
const geo = (key, build) => {
  if (!geoCache.has(key)) geoCache.set(key, build())
  return geoCache.get(key)
}

/** Rounded rectangle profile, extruded — used for cubes, strips and sheets. */
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
    bevelSize: Math.min(r * 0.5, d * 0.4),
    bevelThickness: d * 0.35,
    bevelSegments: 2,
    curveSegments: 6,
  })
  g.rotateX(-Math.PI / 2)
  g.center()
  return g
}

/** A cupped pepperoni — flat centre, rim curled up by the heat. */
function cuppedDisc(cup) {
  const R = 0.32
  const thickness = 0.06
  const pts = []
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const lift = cup ? Math.pow(t, 3.2) * 0.15 : t * 0.008
    pts.push(new THREE.Vector2(t * R, lift))
  }
  // Close the underside so the disc has thickness.
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    const lift = cup ? Math.pow(t, 3.2) * 0.15 : t * 0.008
    pts.push(new THREE.Vector2(t * R, lift - thickness))
  }
  const g = new THREE.LatheGeometry(pts, 28)
  g.computeVertexNormals()
  return g
}

/** Basil / cilantro / curry leaf — a pointed shape with a downward curl. */
function leafGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.5)
  s.bezierCurveTo(0.42, -0.24, 0.36, 0.28, 0, 0.55)
  s.bezierCurveTo(-0.36, 0.28, -0.42, -0.24, 0, -0.5)

  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.035,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.015,
    bevelSegments: 1,
    curveSegments: 14,
  })
  g.rotateX(-Math.PI / 2)
  g.center()
  g.scale(0.52, 0.52, 0.52)

  // Cup the leaf so it catches light instead of reading as a flat sticker.
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, pos.getY(i) + (x * x * 0.9 + z * z * 0.4))
  }
  g.computeVertexNormals()
  return g
}

/** Irregular chunk — mozzarella, chicken, braised meat, roasted vegetables. */
function blobGeometry(seed) {
  const g = new THREE.IcosahedronGeometry(0.21, 2)
  const rand = mulberry32(seed)
  const pos = g.attributes.position
  const v = new THREE.Vector3()

  // Perturb along the normal using a cheap 3-band noise so chunks look torn.
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n =
      Math.sin(v.x * 5.1 + seed) * 0.5 +
      Math.sin(v.y * 6.7 + seed * 1.7) * 0.3 +
      Math.sin(v.z * 4.3 + seed * 2.3) * 0.4
    v.multiplyScalar(1 + n * 0.16 + (rand() - 0.5) * 0.05)
    pos.setXYZ(i, v.x, v.y * 0.3, v.z)
  }
  g.computeVertexNormals()
  return g
}

/** Prawn — a tube swept along a curl, tapered from head to tail. */
function shrimpGeometry() {
  const pts = []
  const turns = 1.45
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    const a = t * Math.PI * 2 * turns * 0.62 - 0.4
    const r = 0.42 - t * 0.06
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(t * Math.PI) * 0.06, Math.sin(a) * r))
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  const radial = 10
  const tubular = 40
  const g = new THREE.TubeGeometry(curve, tubular, 0.16, radial, false)

  // Taper: shrink each ring of the tube toward its point on the spine.
  const pos = g.attributes.position
  const v = new THREE.Vector3()
  const centre = new THREE.Vector3()
  for (let seg = 0; seg <= tubular; seg++) {
    const t = seg / tubular
    centre.copy(curve.getPointAt(Math.min(t, 1)))
    const taper = 0.45 + Math.sin(Math.pow(t, 0.75) * Math.PI) * 0.85
    for (let r = 0; r <= radial; r++) {
      const i = seg * (radial + 1) + r
      v.fromBufferAttribute(pos, i).sub(centre).multiplyScalar(taper).add(centre)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
  }
  g.computeVertexNormals()
  g.center()
  g.scale(0.6, 0.6, 0.6)
  return g
}

/** Sauce swirl — a spiral tube laid over the cheese. */
function drizzleGeometry() {
  const pts = []
  for (let i = 0; i <= 60; i++) {
    const t = i / 60
    const a = t * Math.PI * 2.6
    const r = 0.35 + t * 1.5
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(t * 9) * 0.03, Math.sin(a) * r))
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.058, 7, false)
}

function geometryFor(shape, opts = {}) {
  switch (shape) {
    case 'disc':
      return geo(`disc:${opts.cup ? 1 : 0}`, () => cuppedDisc(opts.cup))
    case 'leaf':
      return geo('leaf', leafGeometry)
    case 'blob':
      return geo('blob', () => blobGeometry(91))
    case 'cube':
      return geo('cube', () => roundedSlab(0.3, 0.3, 0.2, 0.07))
    case 'ring':
      return geo('ring', () => {
        const g = new THREE.TorusGeometry(0.23, 0.042, 8, 26)
        g.rotateX(-Math.PI / 2)
        g.scale(1, 0.7, 1)
        return g
      })
    case 'strip':
      return geo('strip', () => roundedSlab(0.6, 0.17, 0.085, 0.06))
    case 'dome':
      return geo('dome', () => {
        const g = new THREE.SphereGeometry(0.25, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.62)
        g.scale(1, 0.78, 1)
        return g
      })
    case 'arc':
      return geo('arc', shrimpGeometry)
    case 'kernel':
      return geo('kernel', () => {
        const g = new THREE.CapsuleGeometry(0.055, 0.05, 3, 8)
        g.rotateZ(Math.PI / 2)
        g.scale(1, 0.8, 1)
        return g
      })
    case 'cone':
      return geo('cone', () => {
        const g = new THREE.ConeGeometry(0.055, 0.38, 10, 3)
        g.rotateZ(Math.PI / 2)
        return g
      })
    case 'sheet':
      return geo('sheet', () => roundedSlab(0.3, 0.25, 0.02, 0.04))
    case 'drizzle':
      return geo('drizzle', drizzleGeometry)
    case 'fleck':
      return geo('fleck', () => roundedSlab(0.085, 0.055, 0.02, 0.02))
    default:
      return geo('fallback', () => new THREE.SphereGeometry(0.2, 12, 10))
  }
}

/**
 * Roughly how much room each primitive needs, so the scatter can keep
 * ingredients from overlapping without knowing anything about geometry.
 */
const FOOTPRINT = {
  disc: 0.64,
  leaf: 0.42,
  blob: 0.44,
  cube: 0.34,
  ring: 0.5,
  strip: 0.5,
  dome: 0.5,
  arc: 0.52,
  kernel: 0.15,
  cone: 0.3,
  sheet: 0.32,
  fleck: 0.11,
}

/* ------------------------------------------------------------------ *
 * materials
 * ------------------------------------------------------------------ */

const matCache = new Map()

function materialFor(shape, color, accent) {
  const key = `${shape}:${color}:${accent || '-'}`
  if (matCache.has(key)) return matCache.get(key)

  let map = null
  let roughness = 0.55
  let clearcoat = 0.2
  let sheen = 0

  switch (shape) {
    case 'disc':
      map = curedMap()
      roughness = 0.36
      clearcoat = 0.55 // rendered fat pooling in the cup
      break
    case 'leaf':
      map = organicMap()
      roughness = 0.58
      clearcoat = 0.22
      sheen = 0.25
      break
    case 'blob':
      map = organicMap()
      roughness = 0.44
      clearcoat = 0.55
      break
    case 'cube':
      map = accent ? charredMap() : organicMap()
      roughness = 0.5
      clearcoat = 0.25
      break
    case 'arc':
      map = organicMap()
      roughness = 0.3
      clearcoat = 0.7 // prawns are wet
      break
    case 'dome':
      map = organicMap()
      roughness = 0.4
      clearcoat = 0.45
      break
    case 'drizzle':
      roughness = 0.25
      clearcoat = 0.8
      break
    case 'sheet':
      roughness = 0.62
      clearcoat = 0.15
      break
    case 'ring':
    case 'strip':
      map = organicMap()
      roughness = 0.44
      clearcoat = 0.4
      break
    case 'kernel':
      roughness = 0.38
      clearcoat = 0.5
      break
    default:
      roughness = 0.5
  }

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    map,
    envMapIntensity: 0.6,
    roughness,
    metalness: 0,
    clearcoat,
    clearcoatRoughness: 0.35,
    sheen,
    sheenColor: new THREE.Color('#ffffff'),
  })
  matCache.set(key, mat)
  return mat
}

/* ------------------------------------------------------------------ *
 * placement
 * ------------------------------------------------------------------ */

/**
 * Blue-noise-ish scatter: sample candidates in the topping field and keep the
 * one furthest from everything already placed. Cheap, deterministic, and it
 * never clumps the way pure random does.
 */
function scatter(count, rand, placed, minDist, inner = 0.12) {
  const out = []
  for (let i = 0; i < count; i++) {
    let best = null
    let bestScore = -1
    for (let attempt = 0; attempt < 14; attempt++) {
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(inner + rand() * (1 - inner)) * FIELD_R
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      let nearest = Infinity
      for (const p of placed) {
        const d = Math.hypot(p[0] - x, p[1] - z)
        if (d < nearest) nearest = d
      }
      if (nearest > bestScore) {
        bestScore = nearest
        best = [x, z]
      }
      if (nearest > minDist) break
    }
    placed.push(best)
    out.push(best)
  }
  return out
}

/**
 * Build every instance for one flavor. `placed` is shared across topping
 * groups so different ingredients don't stack on the same spot.
 */
export function buildInstances(pizza) {
  const rand = mulberry32(hashString(pizza.id))
  const placed = []
  const groups = []

  // Larger ingredients claim their space first.
  const order = [...pizza.toppings].map((t, i) => ({ ...t, _i: i }))
  order.sort((a, b) => (b.size || 1) - (a.size || 1))

  let delayCursor = 0
  const total = order.reduce((n, t) => n + t.count, 0)

  for (const entry of order) {
    const { shape, color, accent, count } = entry
    const size = entry.size ?? 1

    const isFleck = shape === 'fleck' || shape === 'kernel'
    const minDist = (FOOTPRINT[shape] ?? 0.4) * size * 0.88
    const instances = []

    if (shape === 'drizzle') {
      // Radial swirls rather than a scatter.
      for (let i = 0; i < count; i++) {
        instances.push({
          pos: [0, SURFACE_Y + 0.05 + i * 0.012, 0],
          rot: [0, (i / count) * Math.PI * 2, 0],
          scale: size,
          delay: (delayCursor++ / total) * 0.55,
          spin: 0,
        })
      }
    } else {
      const points = scatter(count, rand, placed, minDist, isFleck ? 0.02 : 0.14)
      for (const [x, z] of points) {
        const jitterScale = size * (0.86 + rand() * 0.3)
        // Ingredients settle into the cheese rather than balancing on it.
        const y = SURFACE_Y + (isFleck ? 0.012 : 0.055) * size
        instances.push({
          pos: [x, y, z],
          rot: [
            (rand() - 0.5) * (isFleck ? 0.9 : 0.34),
            rand() * Math.PI * 2,
            (rand() - 0.5) * (isFleck ? 0.9 : 0.34),
          ],
          scale: jitterScale,
          // Ingredients land outside-in, which reads as a spin settling down.
          delay: (delayCursor++ / total) * 0.55,
          spin: (rand() - 0.5) * 4,
        })
      }
    }

    groups.push({
      key: `${pizza.id}-${entry._i}`,
      shape,
      color,
      accent,
      cup: entry.cup,
      instances,
    })
  }

  return groups
}

/* ------------------------------------------------------------------ *
 * rendering
 * ------------------------------------------------------------------ */

const easeOutBack = (t) => {
  const c1 = 1.9
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

const SPAN = 0.45 // how long a single instance takes, in progress units

function ToppingCluster({ group, progressRef }) {
  const ref = useRef()
  const geometry = useMemo(
    () => geometryFor(group.shape, { cup: group.cup }),
    [group.shape, group.cup]
  )
  const material = useMemo(
    () => materialFor(group.shape, group.color, group.accent),
    [group.shape, group.color, group.accent]
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const progress = progressRef.current

    for (let i = 0; i < group.instances.length; i++) {
      const inst = group.instances[i]
      const local = clamp01((progress - inst.delay) / SPAN)
      const eased = easeOutBack(local)

      const s = Math.max(0.0001, eased * inst.scale)
      dummy.position.set(
        inst.pos[0],
        inst.pos[1] + (1 - local) * 2.6, // drop in from above
        inst.pos[2]
      )
      dummy.rotation.set(
        inst.rot[0] * local,
        inst.rot[1] + (1 - local) * inst.spin,
        inst.rot[2] * local
      )
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.visible = progress > 0.001
  })

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, group.instances.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}

export function Toppings({ groups, progressRef }) {
  return (
    <group>
      {groups.map((group) => (
        <ToppingCluster key={group.key} group={group} progressRef={progressRef} />
      ))}
    </group>
  )
}

export { PIZZA_R, FIELD_R, SURFACE_Y }
