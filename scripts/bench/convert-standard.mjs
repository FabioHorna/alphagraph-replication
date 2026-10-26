/**
 * Converts the REAL standard graph-drawing corpora (Rome-Lib and North DAGs) into the
 * benchmark JSON format, taking a size-stratified, deterministic sample so the run is
 * apples-to-apples with the synthetic dataset. This removes the earlier "calibrated"
 * limitation: the graphs are the community's public corpus, not chosen by us.
 *
 * Source (real): http://www.graphdrawing.org/data/rome-graphml.tgz   (11 534 undirected, 10–100 v)
 *                http://www.graphdrawing.org/data/north-graphml.tgz  (1 277 DAGs, 10–100 v)
 *
 *   # download + extract once, then:
 *   STD_SRC=/path/with/rome+north node apps/web/scripts/bench/convert-standard.mjs
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = process.env.STD_SRC ? resolve(process.env.STD_SRC) : resolve(here, 'standard-src')
const OUT = resolve(here, '../../corpora/public-standard')
const PER_TYPE = 50
const BUCKETS = [[10, 25], [26, 40], [41, 55], [56, 70], [71, 100]] // node-count strata

function parseGraphml(text) {
  const nodes = [...text.matchAll(/<node\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1])
  const edges = []
  for (const m of text.matchAll(/<edge\b[^>]*\bsource="([^"]+)"[^>]*\btarget="([^"]+)"/g)) {
    if (m[1] !== m[2]) edges.push({ source: m[1], target: m[2] }) // drop self-loops
  }
  return { nodes, edges }
}

/** Deterministic size-stratified pick of `quota` files from a corpus directory. */
// Size of each upstream collection, as shipped by graphdrawing.org and as cited in the
// paper. The sample is a stride over the sorted file list, so a partial extraction
// silently yields a DIFFERENT sample that still looks plausible. Refuse that.
const EXPECTED = { rome: 11534, north: 1277 }

function sample(dir, type, quota) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.graphml'))
  const expected = EXPECTED[type]
  if (expected && files.length !== expected) {
    const message =
      `${type}: found ${files.length} .graphml files in ${dir}, expected ${expected}. ` +
      'The sample is a stride over the file list, so an incomplete source produces a ' +
      'different sample from the one used in the study.'
    if (process.env.ALLOW_PARTIAL_SRC === '1') {
      console.warn(`WARNING: ${message} Continuing because ALLOW_PARTIAL_SRC=1.`)
    } else {
      console.error(`ERROR: ${message}`)
      console.error('Re-extract the archive, or set ALLOW_PARTIAL_SRC=1 to override.')
      process.exit(1)
    }
  }
  // Size token taken from the LAST numeric field of the file name. CAREFUL: that
  // field means different things in the two collections, as their own naming shows:
  //   rome : grafo<id>.<nodes>.graphml    -> this reads the node count. Correct.
  //   north: g.<nodes>.<serial>.graphml   -> this reads an arbitrary serial number.
  // So the Rome sample is stratified by node count (10 per stratum, exactly), while
  // the North sample is stratified by a number unrelated to the graph and its node
  // sizes just follow the collection's own skew towards small graphs (10-49 nodes,
  // median 16). This is the behaviour that produced the sample used in the paper and
  // is left unchanged on purpose; see INVENTORY.md finding 8 before altering it,
  // because changing it invalidates every result file in data/rq2-crossings/.
  const sized = files.map((f) => {
    const m = f.match(/\.(\d+)\.graphml$/) || f.match(/\.(\d+)\./)
    return { f, size: m ? Number(m[1]) : 0 }
  }).filter((x) => x.size >= 10 && x.size <= 100)

  const perBucket = Math.ceil(quota / BUCKETS.length)
  const picked = []
  for (const [lo, hi] of BUCKETS) {
    const inB = sized.filter((x) => x.size >= lo && x.size <= hi).sort((a, b) => a.f.localeCompare(b.f))
    if (inB.length === 0) continue
    const stepF = inB.length / perBucket
    for (let i = 0; i < perBucket && picked.length < quota; i++) {
      picked.push(inB[Math.floor(i * stepF)])
    }
  }

  const out = []
  picked.slice(0, quota).forEach((p, idx) => {
    const { nodes, edges } = parseGraphml(readFileSync(resolve(dir, p.f), 'utf8'))
    if (nodes.length === 0) return
    out.push({
      type,
      name: `${type}-${String(idx + 1).padStart(2, '0')}`,
      source: p.f,
      nodes: nodes.map((id) => ({ id, width: 180, height: 80 })),
      edges: edges.map((e, i) => ({ id: `e${i}`, source: e.source, target: e.target })),
    })
  })
  return out
}

function main() {
  mkdirSync(OUT, { recursive: true })
  const graphs = [
    ...sample(resolve(SRC, 'rome'), 'rome', PER_TYPE),
    ...sample(resolve(SRC, 'north'), 'north', PER_TYPE),
  ]
  const index = []
  for (const g of graphs) {
    writeFileSync(resolve(OUT, `${g.name}.json`), JSON.stringify({ type: g.type, name: g.name, source: g.source, nodes: g.nodes, edges: g.edges }, null, 2))
    index.push({ name: g.name, type: g.type, source: g.source, nodes: g.nodes.length, edges: g.edges.length })
  }
  writeFileSync(resolve(OUT, 'index.json'), JSON.stringify({
    provenance: {
      rome: 'http://www.graphdrawing.org/data/rome-graphml.tgz (11534 undirected graphs)',
      north: 'http://www.graphdrawing.org/data/north-graphml.tgz (1277 DAGs)',
      note:
        'Real public Graph Drawing corpora. Deterministic sample of 50 per collection, selected by a stride over the last numeric field of the file name. In Rome (grafo<id>.<nodes>.graphml) that field is the node count, so the Rome sample is size-stratified: 10 graphs in each of the strata 10-25, 26-40, 41-55, 56-70, 71-100 nodes. In North (g.<nodes>.<serial>.graphml) it is a serial number, so the North sample is NOT stratified by size: 10-49 nodes, median 16, distributed [43, 4, 3, 0, 0] over those strata. See INVENTORY.md finding 8.',
    },
    graphs: index,
  }, null, 2))
  const byType = (t) => index.filter((x) => x.type === t)
  console.log(`Wrote ${graphs.length} real standard graphs to ${OUT}`)
  for (const t of ['rome', 'north']) {
    const xs = byType(t)
    console.log(`  ${t}: ${xs.length} grafos, nodos ${Math.min(...xs.map((x) => x.nodes))}–${Math.max(...xs.map((x) => x.nodes))}, aristas ${Math.min(...xs.map((x) => x.edges))}–${Math.max(...xs.map((x) => x.edges))}`)
  }
}

main()
