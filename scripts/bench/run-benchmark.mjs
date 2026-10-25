/**
 * Runs the comparative layout benchmark over the generated dataset. Every graph is
 * laid out by each engine and scored with the SAME crossing metric (lib.mjs), so
 * the comparison is apples-to-apples.
 *
 *   node scripts/bench/run-benchmark.mjs
 *
 * Engines (representing the platforms):
 *   alphagraph — dagre + multi-candidate selection (network-simplex/tight-tree/
 *                longest-path with a greedy acyclifier) keeping the min-crossing trazado.
 *   dagre      — dagre single pass (the auto-layout of lightweight web tools, e.g. Mermaid).
 *   elk        — ELK 'layered' (elkjs): enterprise-grade layered engine.
 *   graphviz   — Graphviz 'dot' (@hpcc-js/wasm): the reference Sugiyama implementation.
 *   drawio     — draw.io's own engine: mxGraph mxHierarchicalLayout, run headless via jsdom.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dagre from '@dagrejs/dagre'
import ELK from 'elkjs/lib/elk.bundled.js'
import { Graphviz } from '@hpcc-js/wasm'
import cytoscape from 'cytoscape'
import klay from 'klayjs'
import { performance } from 'node:perf_hooks'
import { boundingArea, countCrossings, countOverlaps, totalEdgeLength } from './lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const DATA = process.env.DATASET_DIR
  ? resolve(process.env.DATASET_DIR)
  : resolve(here, '../../corpora/mixed')
const OUTDIR = resolve(here, '../../out')
const SUFFIX = process.env.OUT_SUFFIX ?? '' // e.g. "-standard" → results-standard.csv

const elk = new ELK()
let gvInstance = null
const gv = async () => (gvInstance ??= await Graphviz.load())

// draw.io's real engine: mxGraph mxHierarchicalLayout, run headless via jsdom.
const { JSDOM } = await import('jsdom')
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true })
global.window = dom.window
global.document = dom.window.document
global.XMLHttpRequest = dom.window.XMLHttpRequest
global.DOMParser = dom.window.DOMParser
global.Element = dom.window.Element
global.HTMLElement = dom.window.HTMLElement
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
const mxFactory = (await import('mxgraph')).default
const mx = mxFactory({ mxBasePath: 'node_modules/mxgraph/javascript/src' })

function drawioLayout(graph) {
  const g = new mx.mxGraph(document.createElement('div'))
  const parent = g.getDefaultParent()
  const model = g.getModel()
  const cells = {}
  model.beginUpdate()
  try {
    for (const n of graph.nodes) cells[n.id] = g.insertVertex(parent, n.id, '', 0, 0, n.width, n.height)
    for (const e of graph.edges) g.insertEdge(parent, e.id, '', cells[e.source], cells[e.target])
  } finally {
    model.endUpdate()
  }
  new mx.mxHierarchicalLayout(g).execute(parent)
  const centres = new Map()
  for (const n of graph.nodes) {
    const geo = model.getGeometry(cells[n.id])
    centres.set(n.id, { x: geo.x + geo.width / 2, y: geo.y + geo.height / 2 })
  }
  return centres
}

function dagreLayout(graph, config = {}) {
  const g = new dagre.graphlib.Graph({ multigraph: true })
  const cfg = { rankdir: 'TB', nodesep: 60, ranksep: 80, edgesep: 20, marginx: 20, marginy: 20, ...config }
  g.setGraph(cfg)
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of graph.nodes) g.setNode(n.id, { width: n.width, height: n.height })
  for (const e of graph.edges) g.setEdge(e.source, e.target, {}, e.id)
  dagre.layout(g)
  const centres = new Map()
  for (const n of graph.nodes) {
    const ln = g.node(n.id)
    centres.set(n.id, { x: ln.x, y: ln.y })
  }
  return centres
}

const engines = {
  dagre: async (graph) => dagreLayout(graph),
  drawio: async (graph) => drawioLayout(graph),
  cytoscape: async (graph) => {
    // Real node sizes (style) so the layout spaces nodes fairly; without them
    // headless Cytoscape collapses every node onto the origin (degenerate).
    const cy = cytoscape({
      headless: true,
      styleEnabled: true,
      style: [{ selector: 'node', style: { shape: 'rectangle', width: 180, height: 80 } }],
      elements: {
        nodes: graph.nodes.map((n) => ({ data: { id: n.id } })),
        edges: graph.edges.map((e) => ({ data: { id: e.id, source: e.source, target: e.target } })),
      },
    })
    const lay = cy.layout({ name: 'breadthfirst', directed: true, spacingFactor: 1.2, avoidOverlap: true })
    const done = lay.promiseOn('layoutstop')
    lay.run()
    await done
    const centres = new Map()
    cy.nodes().forEach((n) => { const p = n.position(); centres.set(n.id(), { x: p.x, y: p.y }) })
    cy.destroy()
    return centres
  },
  klay: async (graph) =>
    new Promise((resolve, reject) => {
      klay.layout({
        graph: {
          id: 'root',
          children: graph.nodes.map((n) => ({ id: n.id, width: n.width, height: n.height })),
          edges: graph.edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
        },
        options: { algorithm: 'de.cau.cs.kieler.klay.layered', direction: 'DOWN', spacing: 40 },
        success: (out) => {
          const centres = new Map()
          for (const ch of out.children ?? []) centres.set(ch.id, { x: ch.x + ch.width / 2, y: ch.y + ch.height / 2 })
          resolve(centres)
        },
        error: (e) => reject(new Error((e && e.message) || String(e))),
      })
    }),
  alphagraph: async (graph) => {
    const candidates = [
      { ranker: 'network-simplex', acyclicer: 'greedy' },
      { ranker: 'tight-tree', acyclicer: 'greedy' },
      { ranker: 'longest-path', acyclicer: 'greedy' },
      { ranker: 'network-simplex' },
    ]
    let best = null
    let bestX = Infinity
    for (const cfg of candidates) {
      const c = dagreLayout(graph, cfg)
      const x = countCrossings(c, graph.edges)
      if (x < bestX) { best = c; bestX = x }
      if (bestX === 0) break
    }
    return best
  },
  elk: async (graph) => {
    const g = {
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'DOWN' },
      children: graph.nodes.map((n) => ({ id: n.id, width: n.width, height: n.height })),
      edges: graph.edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
    }
    const res = await elk.layout(g)
    const centres = new Map()
    for (const ch of res.children ?? []) centres.set(ch.id, { x: ch.x + ch.width / 2, y: ch.y + ch.height / 2 })
    return centres
  },
  graphviz: async (graph) => {
    const g = await gv()
    const w = (180 / 72).toFixed(3)
    const h = (80 / 72).toFixed(3)
    let dot = `digraph G {\n rankdir=TB;\n node [shape=box, fixedsize=true, width=${w}, height=${h}];\n`
    for (const n of graph.nodes) dot += ` "${n.id}";\n`
    for (const e of graph.edges) dot += ` "${e.source}" -> "${e.target}";\n`
    dot += '}\n'
    const json = JSON.parse(g.layout(dot, 'json', 'dot'))
    const centres = new Map()
    for (const o of json.objects ?? []) {
      if (!o.name || o.pos === undefined) continue
      const [x, y] = String(o.pos).split(',').map(Number)
      centres.set(o.name, { x, y })
    }
    return centres
  },
}

const ENGINE_ORDER = ['alphagraph', 'dagre', 'drawio', 'cytoscape', 'klay', 'elk', 'graphviz']

function normalCdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp((-x * x) / 2)
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return x > 0 ? 1 - prob : prob
}

/** Wilcoxon signed-rank test (normal approximation) on paired differences. */
function wilcoxon(diffs) {
  const nz = diffs.filter((d) => d !== 0)
  const n = nz.length
  if (n === 0) return { n: 0, W: 0, z: 0, p: 1 }
  const sorted = nz.map((d) => ({ abs: Math.abs(d), sign: Math.sign(d) })).sort((a, b) => a.abs - b.abs)
  const ranks = new Array(n)
  let i = 0
  while (i < n) {
    let j = i
    while (j + 1 < n && sorted[j + 1].abs === sorted[i].abs) j++
    const avg = (i + 1 + (j + 1)) / 2
    for (let k = i; k <= j; k++) ranks[k] = avg
    i = j + 1
  }
  let wPos = 0, wNeg = 0
  for (let k = 0; k < n; k++) {
    if (sorted[k].sign > 0) wPos += ranks[k]
    else wNeg += ranks[k]
  }
  const W = Math.min(wPos, wNeg)
  const mean = (n * (n + 1)) / 4
  const sd = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24)
  const z = sd > 0 ? (W - mean) / sd : 0
  const p = Math.min(1, Math.max(0, 2 * (1 - normalCdf(Math.abs(z)))))
  return { n, W: Math.round(W), z: Number(z.toFixed(2)), p: Number(p.toFixed(4)) }
}

async function main() {
  const files = readdirSync(DATA).filter((f) => f.endsWith('.json') && f !== 'index.json').sort()
  const rows = []
  for (const file of files) {
    const graph = JSON.parse(readFileSync(resolve(DATA, file), 'utf8'))
    for (const name of ENGINE_ORDER) {
      let crossings = NaN, length = NaN, area = NaN, overlaps = NaN, ms = NaN
      try {
        const t0 = performance.now()
        const centres = await engines[name](graph)
        ms = Number((performance.now() - t0).toFixed(2))
        crossings = countCrossings(centres, graph.edges)
        length = totalEdgeLength(centres, graph.edges)
        area = boundingArea(centres)
        overlaps = countOverlaps(centres)
      } catch (err) {
        console.error(`  ! ${name} failed on ${graph.name}: ${err.message}`)
      }
      rows.push({ type: graph.type, graph: graph.name, nodes: graph.nodes.length, edges: graph.edges.length, engine: name, crossings, length, area, overlaps, ms })
    }
  }

  // CSV
  const header = 'type,graph,nodes,edges,engine,crossings,edgeLength,area,overlaps,layoutMs'
  const csv = [header, ...rows.map((r) => `${r.type},${r.graph},${r.nodes},${r.edges},${r.engine},${r.crossings},${r.length},${r.area},${r.overlaps},${r.ms}`)].join('\n')
  mkdirSync(OUTDIR, { recursive: true })
  writeFileSync(resolve(OUTDIR, `results${SUFFIX}.csv`), csv)

  // Summary: mean crossings per engine per type + overall, and AlphaGraph head-to-head.
  const types = [...new Set(rows.map((r) => r.type))]
  const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
  const summary = { crossingsPerType: {}, overlapsPerType: {}, layoutMsPerType: {}, overall: {}, headToHead: {} }
  const meanMetric = (metric, t, e, dp = 2) => {
    const xs = rows.filter((r) => r.engine === e && (t === 'ALL' || r.type === t) && Number.isFinite(r[metric])).map((r) => r[metric])
    return Number(mean(xs).toFixed(dp))
  }
  for (const t of [...types, 'ALL']) {
    summary.crossingsPerType[t] = {}
    summary.overlapsPerType[t] = {}
    summary.layoutMsPerType[t] = {}
    for (const e of ENGINE_ORDER) {
      summary.crossingsPerType[t][e] = meanMetric('crossings', t, e)
      summary.overlapsPerType[t][e] = meanMetric('overlaps', t, e)
      summary.layoutMsPerType[t][e] = meanMetric('ms', t, e)
    }
  }
  summary.overall = summary.crossingsPerType.ALL
  // Head-to-head: AlphaGraph vs each other engine (per-graph crossings).
  const byGraph = {}
  for (const r of rows) (byGraph[r.graph] ??= {})[r.engine] = r.crossings
  for (const e of ENGINE_ORDER.filter((x) => x !== 'alphagraph')) {
    let win = 0, tie = 0, loss = 0, diff = 0, n = 0
    const diffs = []
    for (const g of Object.values(byGraph)) {
      if (!Number.isFinite(g.alphagraph) || !Number.isFinite(g[e])) continue
      n++; diff += g[e] - g.alphagraph
      diffs.push(g[e] - g.alphagraph) // positive ⇒ AlphaGraph has fewer crossings
      if (g.alphagraph < g[e]) win++; else if (g.alphagraph === g[e]) tie++; else loss++
    }
    const w = wilcoxon(diffs)
    summary.headToHead[`alphagraph_vs_${e}`] = {
      graphs: n, alphagraph_better: win, tie, alphagraph_worse: loss,
      mean_crossing_diff: Number((diff / Math.max(n, 1)).toFixed(2)),
      wilcoxon_p: w.p, wilcoxon_z: w.z, pairs: w.n,
    }
  }
  writeFileSync(resolve(OUTDIR, `summary${SUFFIX}.json`), JSON.stringify(summary, null, 2))

  console.log('Mean edge crossings per engine (lower is better):')
  console.table(summary.crossingsPerType)
  console.log('\nMean node overlaps per engine (lower is better):')
  console.table(summary.overlapsPerType)
  console.log('\nMean layout time (ms) per engine (lower is faster):')
  console.table(summary.layoutMsPerType)
  console.log('\nAlphaGraph head-to-head (per-graph crossings):')
  console.table(summary.headToHead)
  console.log(`\nWrote results.csv and summary.json to ${OUTDIR}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
