/**
 * A tiny mutable scroll record. Lenis writes to it once per frame and both the
 * DOM parallax layer and the R3F scenes read from it, so nothing re-renders
 * React on scroll.
 */
export const scrollState = {
  y: 0,
  velocity: 0,
  progress: 0, // 0..1 through the whole document
}
