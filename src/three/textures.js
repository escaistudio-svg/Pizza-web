import * as THREE from 'three'

/**
 * Every surface on the pizza is painted at runtime into a 2D canvas and handed
 * to three.js as a CanvasTexture. Nothing is downloaded, nothing is baked, and
 * a new sauce or cheese colour costs one function call.
 */

/* ------------------------------------------------------------------ *
 * seeded randomness — same pizza looks the same on every reload
 * ------------------------------------------------------------------ */

export function mulberry32(seed) {
  let a = seed >>> 0
  return function rand() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/* ------------------------------------------------------------------ *
 * canvas helpers
 * ------------------------------------------------------------------ */

function makeCanvas(size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return { canvas, ctx: canvas.getContext('2d') }
}

/** Soft-edged blob — the workhorse for anything organic. */
function blot(ctx, x, y, r, color, alpha = 1, falloff = 0.35) {
  const g = ctx.createRadialGradient(x, y, r * falloff, x, y, r)
  g.addColorStop(0, hexToRgba(color, alpha))
  g.addColorStop(1, hexToRgba(color, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function hexToRgba(hex, alpha) {
  const c = new THREE.Color(hex)
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`
}

function finish(canvas, { repeat = 1, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, 1)
  tex.anisotropy = 8
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/* ------------------------------------------------------------------ *
 * cache — textures are shared across every pizza on the page
 * ------------------------------------------------------------------ */

const cache = new Map()
function cached(key, build) {
  if (!cache.has(key)) cache.set(key, build())
  return cache.get(key)
}

/* ------------------------------------------------------------------ *
 * crust — golden dough, leopard char across the cornicione band
 * ------------------------------------------------------------------ */

/**
 * Painted as a plan view of the pie: pale dough in the middle, a golden
 * cornicione ring, and leopard char concentrated where the rim actually
 * catches the flame. The mesh is UV-mapped top-down (see Pizza.jsx), so this
 * lines up with the geometry and never shows a wrap seam.
 */
function paintCrust(size, mode) {
  const { canvas, ctx } = makeCanvas(size)
  const rand = mulberry32(7717)
  const C = size / 2
  const R = size / 2

  const colour = mode === 'color'
  ctx.fillStyle = colour ? '#C08A38' : '#8C8C8C'
  ctx.fillRect(0, 0, size, size)

  // Dough → rim gradient.
  const g = ctx.createRadialGradient(C, C, R * 0.1, C, C, R)
  if (colour) {
    g.addColorStop(0.0, '#C99A55')
    g.addColorStop(0.62, '#CE9A4C')
    g.addColorStop(0.78, '#D9A854')
    g.addColorStop(0.9, '#C98A38')
    g.addColorStop(1.0, '#A96E28')
  } else {
    g.addColorStop(0.0, '#8C8C8C')
    g.addColorStop(0.78, '#9C9C9C')
    g.addColorStop(1.0, '#7A7A7A')
  }
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  // Leopard spotting around the cornicione.
  for (let i = 0; i < 260; i++) {
    const a = rand() * Math.PI * 2
    const rr = (0.76 + rand() * 0.26) * R
    const x = C + Math.cos(a) * rr
    const y = C + Math.sin(a) * rr
    const heat = rand()
    const blotR = 3 + rand() * 20
    const col = colour
      ? heat > 0.78
        ? '#20100A'
        : heat > 0.48
          ? '#5A2C13'
          : '#96591F'
      : heat > 0.7
        ? '#2E2E2E'
        : '#5E5E5E'
    blot(ctx, x, y, blotR, col, 0.35 + heat * 0.55, 0.1)
  }

  // Airy bubbles catching light on the rim.
  for (let i = 0; i < 150; i++) {
    const a = rand() * Math.PI * 2
    const rr = (0.74 + rand() * 0.28) * R
    blot(
      ctx,
      C + Math.cos(a) * rr,
      C + Math.sin(a) * rr,
      3 + rand() * 11,
      colour ? '#F0CE8E' : '#DCDCDC',
      0.3 + rand() * 0.38,
      0.1
    )
  }

  // Flour dust and semolina, everywhere but heavier in the middle.
  for (let i = 0; i < 320; i++) {
    const a = rand() * Math.PI * 2
    const rr = Math.sqrt(rand()) * R * 0.8
    blot(
      ctx,
      C + Math.cos(a) * rr,
      C + Math.sin(a) * rr,
      2 + rand() * 7,
      colour ? '#E9D2A6' : '#B4B4B4',
      0.22,
      0.1
    )
  }

  // Fine grain.
  for (let i = 0; i < 3000; i++) {
    const x = rand() * size
    const y = rand() * size
    ctx.fillStyle = hexToRgba(rand() > 0.5 ? '#F2D9A8' : '#7A5326', 0.05 + rand() * 0.08)
    ctx.fillRect(x, y, 1.5, 1.5)
  }

  return canvas
}

export const crustMap = () => cached('crust:color', () => finish(paintCrust(1024, 'color')))
export const crustBump = () =>
  cached('crust:bump', () => finish(paintCrust(1024, 'bump'), { srgb: false }))

/* ------------------------------------------------------------------ *
 * sauce — mottled, slightly translucent, pulled toward the edge
 * ------------------------------------------------------------------ */

/**
 * Painted neutral and multiplied by the material colour at render time, so a
 * flavor change can lerp tomato → curry → mole on a single shared texture.
 */
export function sauceMap(seed = 11) {
  return cached('sauce:neutral', () => {
    const size = 512
    const { canvas, ctx } = makeCanvas(size)
    const rand = mulberry32(seed)

    ctx.fillStyle = '#A6A6A6'
    ctx.fillRect(0, 0, size, size)

    for (let i = 0; i < 260; i++) {
      const r = 8 + rand() * 52
      blot(ctx, rand() * size, rand() * size, r, rand() > 0.45 ? '#6E6E6E' : '#D8D8D8', 0.18 + rand() * 0.3, 0.2)
    }
    // Crushed pulp.
    for (let i = 0; i < 420; i++) {
      blot(ctx, rand() * size, rand() * size, 2 + rand() * 6, rand() > 0.6 ? '#EDEDED' : '#5E5E5E', 0.3, 0.1)
    }
    return finish(canvas, { repeat: 1 })
  })
}

/* ------------------------------------------------------------------ *
 * cheese — melted mottling, browned blisters, glossy pools
 * ------------------------------------------------------------------ */

export function cheeseMap(seed = 23) {
  return cached('cheese:neutral', () => {
    const size = 1024
    const { canvas, ctx } = makeCanvas(size)
    const rand = mulberry32(seed)

    // Bright base. Melted cheese is pale — the interest is in a handful of
    // blisters, not an all-over grey mottle, which just reads as dirty.
    ctx.fillStyle = '#EDEDED'
    ctx.fillRect(0, 0, size, size)

    // Gentle unevenness in the melt.
    for (let i = 0; i < 130; i++) {
      blot(ctx, rand() * size, rand() * size, 40 + rand() * 150, '#CFCFCF', 0.12 + rand() * 0.16, 0.15)
    }
    for (let i = 0; i < 90; i++) {
      blot(ctx, rand() * size, rand() * size, 25 + rand() * 100, '#FFFFFF', 0.16 + rand() * 0.2, 0.15)
    }

    // Blisters: few, small, genuinely dark, with a bright rim of bubbled fat.
    for (let i = 0; i < 46; i++) {
      const x = rand() * size
      const y = rand() * size
      const r = 5 + rand() * 17
      const heat = rand()
      blot(ctx, x, y, r, heat > 0.7 ? '#4E4034' : '#8A7358', 0.45 + heat * 0.4, 0.3)
      blot(ctx, x - r * 0.25, y - r * 0.3, r * 0.45, '#FFFFFF', 0.3, 0.1)
    }

    // Oil beading.
    for (let i = 0; i < 120; i++) {
      blot(ctx, rand() * size, rand() * size, 3 + rand() * 9, '#FFFFFF', 0.2 + rand() * 0.25, 0.1)
    }

    return finish(canvas, { repeat: 1 })
  })
}

/**
 * Roughness is fully map-driven (the material sets roughness to 1), so this is
 * the only thing deciding where the pie glistens: wet pools of oil against dry,
 * bubbled cheese.
 */
export function cheeseRoughness(seed = 23) {
  return cached('cheese:rough', () => {
    const size = 512
    const { canvas, ctx } = makeCanvas(size)
    const rand = mulberry32(seed)

    ctx.fillStyle = '#7A7A7A' // mid — satin
    ctx.fillRect(0, 0, size, size)

    for (let i = 0; i < 110; i++) {
      blot(ctx, rand() * size, rand() * size, 18 + rand() * 80, '#2E2E2E', 0.45, 0.2) // oil pools
    }
    for (let i = 0; i < 90; i++) {
      blot(ctx, rand() * size, rand() * size, 8 + rand() * 26, '#D8D8D8', 0.55, 0.2) // dry blisters
    }
    return finish(canvas, { repeat: 1, srgb: false })
  })
}

/* ------------------------------------------------------------------ *
 * cured meats — pepperoni and friends need visible fat marbling
 * ------------------------------------------------------------------ */

/**
 * Topping maps are neutral greyscale for the same reason the sauce map is: the
 * material's colour carries the hue, so a texture never squares a colour with
 * itself and turns basil into tar.
 */
export function curedMap() {
  return cached('cured:neutral', () => {
    const size = 256
    const { canvas, ctx } = makeCanvas(size)
    const rand = mulberry32(0x5a1c)

    ctx.fillStyle = '#D2D2D2'
    ctx.fillRect(0, 0, size, size)

    // Marbled fat.
    for (let i = 0; i < 90; i++) {
      blot(ctx, rand() * size, rand() * size, 3 + rand() * 12, '#FFFFFF', 0.5 + rand() * 0.4, 0.25)
    }
    for (let i = 0; i < 60; i++) {
      blot(ctx, rand() * size, rand() * size, 5 + rand() * 20, '#7A7A7A', 0.2 + rand() * 0.2, 0.2)
    }
    // Charred edge.
    for (let i = 0; i < 40; i++) {
      blot(ctx, rand() * size, rand() * size, 4 + rand() * 10, '#4E4E4E', 0.3, 0.2)
    }
    return finish(canvas)
  })
}

/** Gentle mottling so flat colours stop looking like plastic. */
export function organicMap() {
  return cached('organic:neutral', () => {
    const size = 256
    const { canvas, ctx } = makeCanvas(size)
    const rand = mulberry32(0x9e37)

    ctx.fillStyle = '#DCDCDC'
    ctx.fillRect(0, 0, size, size)

    for (let i = 0; i < 70; i++) {
      blot(ctx, rand() * size, rand() * size, 8 + rand() * 40, rand() > 0.5 ? '#FFFFFF' : '#A6A6A6', 0.3, 0.2)
    }
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = hexToRgba(rand() > 0.5 ? '#FFFFFF' : '#909090', 0.12)
      ctx.fillRect(rand() * size, rand() * size, 2, 2)
    }
    return finish(canvas)
  })
}

/** Grill striping — tandoori paneer, charred peppers, kebab. */
export function charredMap() {
  return cached('charred:neutral', () => {
    const size = 256
    const { canvas, ctx } = makeCanvas(size)
    const rand = mulberry32(0x51ed)

    ctx.fillStyle = '#D8D8D8'
    ctx.fillRect(0, 0, size, size)

    ctx.strokeStyle = hexToRgba('#4A4A4A', 0.55)
    ctx.lineWidth = 10
    for (let i = 0; i < 5; i++) {
      const y = (i + 0.5) * (size / 5) + (rand() - 0.5) * 14
      ctx.beginPath()
      ctx.moveTo(-10, y)
      ctx.lineTo(size + 10, y + (rand() - 0.5) * 20)
      ctx.stroke()
    }
    for (let i = 0; i < 60; i++) {
      blot(ctx, rand() * size, rand() * size, 4 + rand() * 16, '#5E5E5E', 0.2 + rand() * 0.3, 0.2)
    }
    return finish(canvas)
  })
}

export function disposeTextureCache() {
  cache.forEach((tex) => tex.dispose?.())
  cache.clear()
}
