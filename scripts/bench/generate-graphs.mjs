/**
 * Generates the reproducible benchmark dataset: 3 architecture-relevant graph
 * types × 20 each (60 graphs), deterministic via a seeded PRNG. Writes one JSON
 * per graph to corpora/mixed/.
 *
 *   node apps/web/scripts/bench/generate-graphs.mjs
 *
 * Types:
 *   layered — DAG en capas (pipelines/flujos): aristas hacia adelante + saltos de capa.
 *   tree    — árbol/jerarquía (descomposición/organización): un padre por nodo.
 *   cyclic  — grafo con ciclos/malla (microservicios con dependencias mutuas).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SIZE, mulberry32, randInt } from './lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '../../corpora/mixed')
const PER_TYPE = 20

const node = (i) => ({ id: `n${i}`, width: SIZE.width, height: SIZE.height })

function finalize(type, idx, nodeCount, edgePairs) {
  const seen = new Set()
  const edges = []
  let k = 0
  for (const [s, t] of edgePairs) {
    if (s === t) continue
    const key = `${s}->${t}`
    if (seen.has(key)) continue
    seen.add(key)
    edges.push({ id: `e${k++}`, source: `n${s}`, target: `n${t}` })
  }
  return {
    type,
    name: `${type}-${String(idx + 1).padStart(2, '0')}`,
    nodes: Array.from({ length: nodeCount }, (_, i) => node(i)),
    edges,
  }
}

function layered(rng, idx) {
  const layerCount = randInt(rng, 3, 6)
  const layers = []
  let id = 0
  for (let l = 0; l < layerCount; l++) {
    const count = randInt(rng, 2, 5)
    layers.push(Array.from({ length: count }, () => id++))
  }
  const pairs = []
  for (let l = 0; l < layers.length - 1; l++) {
    for (const s of layers[l]) {
      const fanout = randInt(rng, 1, 2)
      for (let f = 0; f < fanout; f++) {
        const next = layers[l + 1]
        pairs.push([s, next[randInt(rng, 0, next.length - 1)]])
      }
      // Occasional skip-layer edge (a frequent source of crossings).
      if (l + 2 < layers.length && rng() < 0.25) {
        const skip = layers[l + 2]
        pairs.push([s, skip[randInt(rng, 0, skip.length - 1)]])
      }
    }
  }
  return finalize('layered', idx, id, pairs)
}

function tree(rng, idx) {
  const size = randInt(rng, 6, 24)
  const pairs = []
  for (let i = 1; i < size; i++) pairs.push([randInt(rng, 0, i - 1), i])
  return finalize('tree', idx, size, pairs)
}

function cyclic(rng, idx) {
  const size = randInt(rng, 8, 24)
  const pairs = []
  // Base DAG: each node gets 1–2 incoming edges from earlier nodes.
  for (let i = 1; i < size; i++) {
    const indeg = randInt(rng, 1, 2)
    for (let e = 0; e < indeg; e++) pairs.push([randInt(rng, 0, i - 1), i])
  }
  // Back-edges create real cycles; cross-edges add mesh-like crossings.
  const backs = randInt(rng, 2, 4)
  for (let b = 0; b < backs; b++) {
    const from = randInt(rng, 1, size - 1)
    const to = randInt(rng, 0, from - 1)
    pairs.push([from, to])
  }
  const cross = randInt(rng, 2, 5)
  for (let c = 0; c < cross; c++) pairs.push([randInt(rng, 0, size - 1), randInt(rng, 0, size - 1)])
  return finalize('cyclic', idx, size, pairs)
}

// "Standard-like" sets calibrated to the documented statistics of the classic
// graph-drawing benchmarks (the originals at graphdrawing.org are offline):
//  - rome : undirected, real-world-derived, ~10–60 nodes, density ≈ 1.3 edges/node, connected.
//  - north: AT&T directed acyclic graphs (DAGs), ~10–60 nodes.
function rome(rng, idx) {
  const size = randInt(rng, 10, 60)
  const pairs = []
  for (let i = 1; i < size; i++) pairs.push([randInt(rng, 0, i - 1), i]) // spanning tree (connected)
  let extra = Math.max(0, Math.round(1.3 * size) - (size - 1))
  let guard = extra * 8
  while (extra > 0 && guard-- > 0) {
    const a = randInt(rng, 0, size - 1)
    const b = randInt(rng, 0, size - 1)
    if (a !== b) { pairs.push([Math.min(a, b), Math.max(a, b)]); extra-- }
  }
  return finalize('rome', idx, size, pairs)
}
function north(rng, idx) {
  const size = randInt(rng, 10, 60)
  const pairs = []
  for (let i = 1; i < size; i++) {
    const indeg = randInt(rng, 1, Math.min(3, i))
    for (let e = 0; e < indeg; e++) pairs.push([randInt(rng, 0, i - 1), i])
  }
  return finalize('north', idx, size, pairs)
}

const GENERATORS = { layered, tree, cyclic, rome, north }

function main() {
  mkdirSync(OUT, { recursive: true })
  let total = 0
  const index = []
  for (const [type, gen] of Object.entries(GENERATORS)) {
    for (let i = 0; i < PER_TYPE; i++) {
      // Deterministic, distinct seed per (type, index).
      const seed = (type.length * 1000003) ^ (i * 2654435761)
      const graph = gen(mulberry32(seed >>> 0), i)
      writeFileSync(resolve(OUT, `${graph.name}.json`), JSON.stringify(graph, null, 2))
      index.push({ name: graph.name, type, nodes: graph.nodes.length, edges: graph.edges.length })
      total++
    }
  }
  writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(index, null, 2))
  console.log(`Generated ${total} graphs (${PER_TYPE} per type) in ${OUT}`)
  for (const type of Object.keys(GENERATORS)) {
    const rows = index.filter((g) => g.type === type)
    const n = rows.reduce((a, g) => a + g.nodes, 0) / rows.length
    const e = rows.reduce((a, g) => a + g.edges, 0) / rows.length
    console.log(`  ${type}: ${rows.length} graphs, avg ${n.toFixed(1)} nodes / ${e.toFixed(1)} edges`)
  }
}

main()
