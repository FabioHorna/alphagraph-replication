/**
 * Scalability: how layout time and crossings grow with graph size. Generates a
 * layered graph at increasing sizes and times each engine. Focuses on the
 * headless pure-JS / wasm engines (AlphaGraph, dagre, ELK, Graphviz).
 *
 *   node apps/web/scripts/bench/scalability.mjs
 */
import { performance } from 'node:perf_hooks'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dagre from '@dagrejs/dagre'
import ELK from 'elkjs/lib/elk.bundled.js'
import { Graphviz } from '@hpcc-js/wasm'
import { countCrossings, mulberry32, randInt } from './lib.mjs'

const OUTDIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../out')
const SIZES = [20, 50, 100, 200, 400]
const W = 180, H = 80

function layeredGraph(n) {
  const rng = mulberry32(n * 7919)
  const nodes = Array.from({ length: n }, (_, i) => ({ id: `n${i}`, width: W, height: H }))
  const width = Math.max(2, Math.round(Math.sqrt(n)))
  const edges = []
  let k = 0
  for (let i = 0; i < n; i++) {
    const fan = randInt(rng, 1, 2)
    for (let f = 0; f < fan; f++) {
      const t = i + width + randInt(rng, 0, width - 1) // forward, ~next layer (+ skips)
      if (t < n) edges.push({ id: `e${k++}`, source: `n${i}`, target: `n${t}` })
    }
  }
  return { nodes, edges }
}

function dagreLayout(graph, config = {}) {
  const g = new dagre.graphlib.Graph({ multigraph: true })
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80, edgesep: 20, ...config })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of graph.nodes) g.setNode(n.id, { width: n.width, height: n.height })
  for (const e of graph.edges) g.setEdge(e.source, e.target, {}, e.id)
  dagre.layout(g)
  const c = new Map()
  for (const n of graph.nodes) { const ln = g.node(n.id); c.set(n.id, { x: ln.x, y: ln.y }) }
  return c
}

const elk = new ELK()
let gv
const engines = {
  dagre: async (g) => dagreLayout(g),
  alphagraph: async (g) => {
    // Same guard as the app: multi-candidate only for bounded graphs.
    const cands = g.nodes.length <= 200 && g.edges.length <= 300
      ? [{ ranker: 'network-simplex', acyclicer: 'greedy' }, { ranker: 'tight-tree', acyclicer: 'greedy' }, { ranker: 'longest-path', acyclicer: 'greedy' }, { ranker: 'network-simplex' }]
      : [{ ranker: 'network-simplex', acyclicer: 'greedy' }]
    let best = null, bestX = Infinity
    for (const cfg of cands) { const c = dagreLayout(g, cfg); const x = countCrossings(c, g.edges); if (x < bestX) { best = c; bestX = x } if (bestX === 0) break }
    return best
  },
  elk: async (g) => {
    const res = await elk.layout({ id: 'root', layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'DOWN' },
      children: g.nodes.map((n) => ({ id: n.id, width: n.width, height: n.height })), edges: g.edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })) })
    const c = new Map(); for (const ch of res.children ?? []) c.set(ch.id, { x: ch.x + ch.width / 2, y: ch.y + ch.height / 2 }); return c
  },
  graphviz: async (g) => {
    gv ??= await Graphviz.load()
    let dot = `digraph G {\n rankdir=TB; node [shape=box,fixedsize=true,width=2.5,height=1.1];\n`
    for (const n of g.nodes) dot += ` "${n.id}";\n`
    for (const e of g.edges) dot += ` "${e.source}" -> "${e.target}";\n`
    dot += '}\n'
    const j = JSON.parse(gv.layout(dot, 'json', 'dot'))
    const c = new Map(); for (const o of j.objects ?? []) { if (o.name && o.pos !== undefined) { const [x, y] = String(o.pos).split(',').map(Number); c.set(o.name, { x, y }) } } return c
  },
}
const ORDER = ['alphagraph', 'dagre', 'elk', 'graphviz']

async function main() {
  const rows = []
  const timeTable = {}
  const crossTable = {}
  for (const n of SIZES) {
    const g = layeredGraph(n)
    timeTable[`n=${n} (e=${g.edges.length})`] = {}
    crossTable[`n=${n} (e=${g.edges.length})`] = {}
    for (const name of ORDER) {
      const t0 = performance.now()
      const centres = await engines[name](g)
      const ms = Number((performance.now() - t0).toFixed(1))
      const crossings = countCrossings(centres, g.edges)
      rows.push({ n, edges: g.edges.length, engine: name, ms, crossings })
      timeTable[`n=${n} (e=${g.edges.length})`][name] = ms
      crossTable[`n=${n} (e=${g.edges.length})`][name] = crossings
    }
  }
  mkdirSync(OUTDIR, { recursive: true })
  writeFileSync(resolve(OUTDIR, 'scalability.csv'),
    ['nodes,edges,engine,layoutMs,crossings', ...rows.map((r) => `${r.n},${r.edges},${r.engine},${r.ms},${r.crossings}`)].join('\n'))
  console.log('Layout time (ms) vs graph size:')
  console.table(timeTable)
  console.log('\nCrossings vs graph size:')
  console.table(crossTable)
  console.log(`\nWrote scalability.csv to ${OUTDIR}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
