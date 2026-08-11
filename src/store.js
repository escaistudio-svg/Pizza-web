import { create } from 'zustand'
import { SIGNATURE_IDS, SIZES, CRUSTS, getPizza, getDessert } from './data/menu.js'

const lineId = (pizzaId, size, crust) => `${pizzaId}::${size}::${crust}`

/** Bag lines cover pizzas and desserts; desserts are a fixed single size. */
export const lineItem = (pizzaId) => getPizza(pizzaId) ?? getDessert(pizzaId)
export const isDessert = (pizzaId) => !getPizza(pizzaId) && !!getDessert(pizzaId)

export const linePrice = (line) => {
  const item = lineItem(line.pizzaId)
  if (!item) return 0
  if (isDessert(line.pizzaId)) return item.price

  const size = SIZES.find((s) => s.id === line.size)
  const crust = CRUSTS.find((c) => c.id === line.crust)
  if (!size || !crust) return 0
  return Math.round(item.price * size.mult + crust.add)
}

export const useStore = create((set, get) => ({
  /* ---- boot ---- */
  loaded: false,
  setLoaded: (loaded) => set({ loaded }),

  /* ---- order studio ---- */
  flavorId: SIGNATURE_IDS[0],
  size: 'pair',
  crust: 'classic',
  qty: 1,

  setFlavor: (flavorId) => {
    if (get().flavorId === flavorId) return
    set({ flavorId })
  },
  stepFlavor: (dir) => {
    const i = SIGNATURE_IDS.indexOf(get().flavorId)
    const next = (i + dir + SIGNATURE_IDS.length) % SIGNATURE_IDS.length
    set({ flavorId: SIGNATURE_IDS[next] })
  },
  setSize: (size) => set({ size }),
  setCrust: (crust) => set({ crust }),
  setQty: (qty) => set({ qty: Math.max(1, Math.min(12, qty)) }),

  /* ---- bag ---- */
  bag: [],
  bagOpen: false,
  lastAdded: null,
  openBag: () => set({ bagOpen: true }),
  closeBag: () => set({ bagOpen: false }),

  addToBag: ({ pizzaId, size, crust, qty = 1 }) => {
    const id = lineId(pizzaId, size, crust)
    set((state) => {
      const existing = state.bag.find((l) => l.id === id)
      const bag = existing
        ? state.bag.map((l) => (l.id === id ? { ...l, qty: Math.min(24, l.qty + qty) } : l))
        : [...state.bag, { id, pizzaId, size, crust, qty }]
      return { bag, lastAdded: id }
    })
    // Clear the "just added" pulse so the bag badge can re-trigger it later.
    setTimeout(() => {
      if (get().lastAdded === id) set({ lastAdded: null })
    }, 1200)
  },

  removeLine: (id) => set((state) => ({ bag: state.bag.filter((l) => l.id !== id) })),
  bumpLine: (id, delta) =>
    set((state) => ({
      bag: state.bag
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    })),
  clearBag: () => set({ bag: [] }),
}))

export const selectBagCount = (state) => state.bag.reduce((n, l) => n + l.qty, 0)
export const selectSubtotal = (state) =>
  Math.round(state.bag.reduce((sum, l) => sum + linePrice(l) * l.qty, 0))
