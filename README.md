# FLOURCHILD

A personal pizza studio. Seven signature pies, one from each of the world's
great pizza cities — ordered through a 3D flavor switcher.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## What's here

| Section    | What it does                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| **Loader** | The wordmark's "O" is a pizza. Toppings land on it as the progress bar fills, then the panel wipes upward.     |
| **Hero**   | A pie that tips and drifts against the scroll, with the headline split around it.                             |
| **Atlas**  | Seven country chapters. One sticky pizza on the left morphs to whichever flavor you're reading or hovering.   |
| **Studio** | The order room. Seven signatures on a rail; picking one runs the full flavor switch.                          |
| **Bag**    | Drawer with line items, size/crust, quantities, subtotal and delivery.                                        |

## The pizza is generated, not modelled

There are no `.glb` files, no textures, no image requests. Every pie is built
from primitives at runtime:

- **`src/three/textures.js`** paints the crust, sauce and cheese into 2D
  canvases and hands them to three.js as `CanvasTexture`s. The crust is painted
  as a plan view — pale dough in the middle, leopard char on the cornicione —
  and the mesh is UV-mapped top-down so there's no wrap seam.
- **`src/three/toppings.jsx`** has thirteen shape primitives (`disc`, `leaf`,
  `blob`, `cube`, `ring`, `strip`, `dome`, `arc`, `kernel`, `cone`, `sheet`,
  `drizzle`, `fleck`). Each entry in a flavor becomes one `InstancedMesh`,
  scattered with a blue-noise-ish placement so ingredients never clump.
- **`src/three/Pizza.jsx`** assembles the lathed crust, sauce disc and cheese
  layer, and owns the flavor-switch state machine.

Sauce and cheese maps are painted **neutral greyscale** and tinted by the
material colour. That's what lets a flavor change lerp tomato → curry → mole on
one shared texture, and it stops a coloured map from squaring its own colour.

### Adding a pizza

Add an entry to `src/data/menu.js`. Nothing else needs to change:

```js
{
  id: 'nduja-honey',
  name: "'Nduja & Honey",
  tagline: 'Spreadable salami · hot honey · basil',
  price: 27,
  spice: 2,
  sauce: 'tomato',        // key in SAUCES
  cheese: 'mozzarella',   // key in CHEESES
  toppings: [
    { shape: 'blob', color: '#B0402A', count: 9, size: 1.1 },
    { shape: 'drizzle', color: '#E8A63C', count: 2, size: 1 },
    { shape: 'leaf', color: '#2F6B3C', count: 5, size: 1 },
  ],
}
```

## The flavor switch

Changing the flavor runs one sequence across three layers:

1. **3D** — toppings lift off outside-in over 0.42s, the base spins through a
   burst of extra rotation and lifts, then the new ingredients rain back down
   over 0.9s on a per-instance stagger (`src/three/Pizza.jsx`).
2. **Colour** — sauce, cheese and blister colours lerp every frame rather than
   cutting, so the base cross-fades underneath the topping shower.
3. **DOM** — the rail indicator slides, the section's `--accent` re-points
   (glow, pills, origin label), the name re-mounts and rolls in per character
   (`SwapText`), and a ring pulses out of the pie.

Arrow keys cycle flavors while the studio has focus.

## Rendering notes

- **One canvas per 3D moment**, not a shared scissored context. Each section
  keeps its own background and its own text above the pizza with no z-index
  gymnastics. A canvas isn't created until it's near the viewport and drops to
  `frameloop="demand"` when it scrolls away (`src/three/Viewport.jsx`).
- **Khronos PBR Neutral tone mapping.** ACES desaturates bright warm tones —
  it turned the cheese khaki. Neutral holds hue through the highlights.
- **Procedural environment.** The IBL is built from `Lightformer`s in a single
  cube-camera pass, so there's no HDRI to download.

## Scroll and motion

`lenis` drives smooth scrolling, and the same rAF tick applies a `data-speed`
parallax pass so layers never drift out of sync with the page
(`src/hooks/useSmoothScroll.js`).

Reveals use one `IntersectionObserver` over `.reveal` and `.mask`
(`src/hooks/useReveal.js`). Masked line reveals put the clip on an **inner**
span — a `clip-path` that collapses the element also collapses the box the
observer measures, so a self-clipping element can never learn it's on screen.
Anything already above the fold on load plays immediately instead of waiting
for a scroll that may never come.

`prefers-reduced-motion` disables smooth scroll, parallax and every transition.

## Layout

```
src/
├── data/menu.js          7 regions × 6 pizzas, plus sizes and crusts
├── store.js              zustand: flavor, options, bag
├── scroll.js             mutable scroll record shared by DOM and R3F
├── hooks/                smooth scroll + parallax, reveals, active section
├── three/
│   ├── textures.js       canvas-painted maps
│   ├── toppings.jsx      shape primitives, scatter, instanced rendering
│   ├── Pizza.jsx         assembly + flavor-switch state machine
│   ├── Stage.jsx         lighting rig and procedural environment
│   ├── scenes.jsx        per-section camera and rig
│   └── Viewport.jsx      lazy, self-pausing canvas
├── components/           Loader, Nav, Hero, Ticker, Ethos, Atlas, Studio, Bag, Footer
└── styles/               tokens, base, chrome, sections
```

## Not wired up

Checkout is a demo button — there's no payment or backend. The bag lives in
memory and resets on reload.
