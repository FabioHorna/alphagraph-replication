/**
 * Shared metrics for the comparative layout benchmark. The crossing count uses the
 * exact same definition as AlphaGraph (countCrossings.ts) and its backend
 * (LayoutCrossingCounter.java, HU-22): edges are segments between node centres; a
 * crossing is a proper interior intersection of two edges that share no endpoint.
 * Applied identically to every engine's output → apples-to-apples.
 */
const EPSILON = 1e-9
const NODE_W = 180
const NODE_H = 80

function orientation(ax, ay, bx, by, cx, cy) {
  const v = (by - ay) * (cx - bx) - (bx - ax) * (cy - by)
  if (v > EPSILON) return 1
  if (v < -EPSILON) return -1
  return 0
}
function properlyIntersect(s1, s2) {
  const o1 = orientation(s1[0], s1[1], s1[2], s1[3], s2[0], s2[1])
  const o2 = orientation(s1[0], s1[1], s1[2], s1[3], s2[2], s2[3])
  const o3 = orientation(s2[0], s2[1], s2[2], s2[3], s1[0], s1[1])
  const o4 = orientation(s2[0], s2[1], s2[2], s2[3], s1[2], s1[3])
  return o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0 && o1 !== o2 && o3 !== o4
}

/** centres: Map<id,{x,y}>; edges: [{source,target}] → number of crossings. */
export function countCrossings(centres, edges) {
  const segs = []
  const ends = []
  for (const e of edges) {
    const a = centres.get(e.source)
    const b = centres.get(e.target)
    if (!a || !b) continue
    segs.push([a.x, a.y, b.x, b.y])
    ends.push([e.source, e.target])
  }
  let n = 0
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const a = ends[i], b = ends[j]
      if (a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1]) continue
      if (properlyIntersect(segs[i], segs[j])) n++
    }
  }
  return n
}

export function totalEdgeLength(centres, edges) {
  let total = 0
  for (const e of edges) {
    const a = centres.get(e.source), b = centres.get(e.target)
    if (a && b) total += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return Math.round(total)
}

/** Node overlaps: pairs of node rectangles (uniform NODE_W×NODE_H) that intersect. */
export function countOverlaps(centres) {
  const pts = [...centres.values()]
  let n = 0
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      if (Math.abs(pts[i].x - pts[j].x) < NODE_W && Math.abs(pts[i].y - pts[j].y) < NODE_H) n++
    }
  }
  return n
}

export function boundingArea(centres) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const { x, y } of centres.values()) {
    minX = Math.min(minX, x); minY = Math.min(minY, y)
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  if (!Number.isFinite(minX)) return 0
  return Math.round((maxX - minX + NODE_W) * (maxY - minY + NODE_H))
}

export const SIZE = { width: NODE_W, height: NODE_H }

/** Deterministic PRNG (mulberry32) for reproducible graph generation. */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))
