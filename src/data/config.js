/**
 * Everything a client swaps before launch lives here — nothing else in the app
 * hard-codes a phone number, an address, or a licence.
 *
 * ⚠ The contact details below are DELIBERATELY FAKE. The X's are there so a
 * placeholder can never be mistaken for a real number in a screenshot or a
 * staging build. Replace them before going live.
 */

export const BRAND = {
  name: 'FLOURCHILD',
  tagline: 'Seven signatures, seven countries.',
  city: 'Mumbai',
  since: 2019,
}

export const CONTACT = {
  // tel: links strip spaces automatically — keep the display format readable.
  phoneDisplay: '+91 98XXX XXXXX',
  phoneHref: 'tel:+9198XXXXXXXX',

  // wa.me needs the country code with no + and no spaces.
  whatsappDisplay: '+91 98XXX XXXXX',
  whatsappHref: 'https://wa.me/9198XXXXXXXX',
  whatsappMessage: 'Hi Flourchild! I would like to place an order.',

  email: 'hello@flourchild.in',
  instagram: '@flourchild',
  instagramHref: 'https://instagram.com/',
}

export const OUTLET = {
  line1: 'Shop 4, Pali Naka',
  line2: 'Bandra West, Mumbai 400050',
  maharashtra: 'Maharashtra, India',
  mapsHref: 'https://maps.google.com/?q=Pali+Naka+Bandra+West+Mumbai',

  // FSSAI licence display is mandatory for food businesses in India.
  fssai: '1XXXXXXXXXXXX',

  /** Local time, 24h. The kitchen runs an afternoon break. */
  hours: [
    { day: 'Mon', open: null, close: null, note: 'Closed' },
    { day: 'Tue', open: '12:00', close: '23:00' },
    { day: 'Wed', open: '12:00', close: '23:00' },
    { day: 'Thu', open: '12:00', close: '23:00' },
    { day: 'Fri', open: '12:00', close: '23:59' },
    { day: 'Sat', open: '12:00', close: '23:59' },
    { day: 'Sun', open: '12:00', close: '23:00' },
  ],
}

/* ------------------------------------------------------------------ *
 * delivery
 * ------------------------------------------------------------------ */

export const DELIVERY = {
  fee: 49,
  freeAbove: 999,
  minOrder: 299,
  prepMins: 25,
}

/**
 * Serviceable Mumbai pincodes, grouped by hub so the checker can quote a real
 * ETA rather than a flat number. `zones` is ordered nearest-first.
 */
export const ZONES = [
  {
    id: 'bandra',
    label: 'Bandra · Khar · Santacruz',
    etaMins: [30, 40],
    pincodes: ['400050', '400051', '400052', '400054', '400055', '400098'],
  },
  {
    id: 'andheri',
    label: 'Andheri · Juhu · Vile Parle',
    etaMins: [40, 55],
    pincodes: ['400049', '400053', '400056', '400057', '400058', '400059', '400061', '400069'],
  },
  {
    id: 'worli',
    label: 'Worli · Lower Parel · Prabhadevi',
    etaMins: [45, 60],
    pincodes: ['400013', '400018', '400025', '400028', '400030'],
  },
  {
    id: 'town',
    label: 'Dadar · Matunga · Sion',
    etaMins: [50, 65],
    pincodes: ['400014', '400016', '400019', '400022'],
  },
]

/** Pincodes we know of but don't reach yet — worth a warmer "not yet". */
export const WAITLIST_PREFIX = '400'

export function checkPincode(raw) {
  const pin = String(raw ?? '').trim()

  if (!/^\d{6}$/.test(pin)) {
    return { status: 'invalid', message: 'A pincode is six digits.' }
  }

  const zone = ZONES.find((z) => z.pincodes.includes(pin))
  if (zone) {
    return {
      status: 'yes',
      zone,
      message: `We deliver to ${pin}.`,
      eta: `${zone.etaMins[0]}–${zone.etaMins[1]} min`,
    }
  }

  if (pin.startsWith(WAITLIST_PREFIX)) {
    return {
      status: 'soon',
      message: `${pin} is on the list — we're not there yet.`,
    }
  }

  return {
    status: 'no',
    message: `We only deliver inside Mumbai for now.`,
  }
}

/* ------------------------------------------------------------------ *
 * money
 * ------------------------------------------------------------------ */

/** ₹ with Indian digit grouping (1,00,000 rather than 100,000). */
export const inr = (n) =>
  '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const GST_NOTE = 'All prices inclusive of GST'

export const PAYMENTS = ['UPI', 'Cards', 'Net banking', 'Cash on delivery']

/* ------------------------------------------------------------------ *
 * store hours
 * ------------------------------------------------------------------ */

/**
 * Whether the kitchen is open right now, in Asia/Kolkata regardless of where
 * the visitor is. Returns the next opening when closed.
 */
export function storeStatus(now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]))
  const weekday = parts.weekday
  const mins = Number(parts.hour) * 60 + Number(parts.minute)

  const toMins = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  const today = OUTLET.hours.find((h) => h.day === weekday)

  if (today?.open && mins >= toMins(today.open) && mins <= toMins(today.close)) {
    return { open: true, label: 'Open now', until: today.close }
  }

  // Walk forward to the next day that opens.
  const order = OUTLET.hours.map((h) => h.day)
  const start = order.indexOf(weekday)
  for (let i = 0; i < 7; i++) {
    const day = OUTLET.hours[(start + i) % 7]
    if (!day.open) continue
    if (i === 0 && mins < toMins(day.open)) {
      return { open: false, label: 'Opens at ' + day.open }
    }
    if (i > 0) return { open: false, label: `Opens ${day.day} ${day.open}` }
  }
  return { open: false, label: 'Closed' }
}
