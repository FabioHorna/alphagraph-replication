/**
 * Objective time-reduction estimate (OE3.I6, ≥25%) with the Keystroke-Level Model
 * (KLM-GOMS; Card, Moran & Newell, 1983) over the real benchmark dataset. Reproducible
 * complement to the field study with users (does not replace it).
 *
 *   node apps/web/scripts/bench/time-klm.mjs
 *
 * The reduction comes from the WHOLE manual diagramming flow being faster, not from a
 * text mode and not from the layout algorithm alone. A user still draws by hand, but in
 * AlphaGraph each step costs fewer operations:
 *   - start from a TEMPLATE (one action creates several named, typed, connected nodes);
 *   - create with the ARMED PALETTE (one click to place; auto-named/typed/styled; the
 *     layout positions it — no dragging a shape, no manual placement);
 *   - connect by dragging a handle and pick a PRESET LABEL (no typing the label);
 *   - ONE auto-layout click arranges the whole diagram + auto-fit (no manual untangling);
 *   - duplicate/copy repeated elements.
 * We compare against a generic manual diagrammer that must scan a palette, drag each
 * shape in, type each name, draw + label each edge, and reposition every node.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const DATA = resolve(here, '../../corpora/mixed')
const OUTDIR = resolve(here, '../../out')

// KLM operators (seconds), Card/Moran/Newell.
const CLICK = 0.2, POINT = 1.1, MENTAL = 1.35, HOME = 0.4, KEY = 0.28
const DRAG = 1.5
const NAME = 12            // avg characters per node name
const LABEL = 6            // avg characters per edge label
const REPOS = 1.0          // manual repositions per node to arrange/untangle (conservative)
const TEMPLATE_NODES = 4   // nodes a starting template typically provides

const PC = POINT + CLICK
const typeText = (chars) => HOME + chars * KEY + HOME

// --- Generic manual diagrammer: create + connect + arrange by hand ---
const nodeManual = MENTAL + PC /*scan+select palette*/ + (POINT + DRAG) /*drag shape in*/ + PC /*open label*/ + typeText(NAME)
const edgeManual = MENTAL + (POINT + DRAG) /*draw edge*/ + PC /*open label*/ + typeText(LABEL)
const arrangeManual = (n) => n * REPOS * (POINT + DRAG)

// --- AlphaGraph full manual flow ---
const nodeAlpha = PC /*arm type*/ + PC /*click to place; auto-named/typed/styled, auto-positioned*/ + PC /*dbl-click to rename*/ + typeText(NAME)
const edgeAlpha = MENTAL + (POINT + DRAG) /*connect handle*/ + PC /*pick preset label*/
const layoutAlpha = MENTAL + PC /*one auto-layout click; auto-fit is free*/
const templateInsert = MENTAL + PC /*open gallery*/ + PC /*pick template*/
const nodeRename = PC /*dbl-click*/ + typeText(NAME)

function manualTime(n, e) {
  return n * nodeManual + e * edgeManual + arrangeManual(n)
}
function alphaTime(n, e, useTemplate) {
  const t = useTemplate ? Math.min(n, TEMPLATE_NODES) : 0
  const coveredEdges = t > 0 ? t - 1 : 0
  return (useTemplate ? templateInsert : 0)
    + t * nodeRename
    + (n - t) * nodeAlpha
    + Math.max(0, e - coveredEdges) * edgeAlpha
    + layoutAlpha
}

function main() {
  const files = readdirSync(DATA).filter((f) => f.endsWith('.json') && f !== 'index.json').sort()
  const rows = []
  const byType = {}
  for (const file of files) {
    const g = JSON.parse(readFileSync(resolve(DATA, file), 'utf8'))
    const n = g.nodes.length, e = g.edges.length
    const tManual = manualTime(n, e)
    const tFull = alphaTime(n, e, true)
    const tFloor = alphaTime(n, e, false)
    const red = (t) => ((tManual - t) / tManual) * 100
    rows.push({ type: g.type, graph: g.name, nodes: n, edges: e,
      t_manual_s: Math.round(tManual), t_alpha_s: Math.round(tFull),
      red_full_pct: Number(red(tFull).toFixed(1)), red_no_template_pct: Number(red(tFloor).toFixed(1)) })
    ;(byType[g.type] ??= []).push(red(tFull))
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length
  const col = (k) => Number(mean(rows.map((r) => r[k])).toFixed(1))

  mkdirSync(OUTDIR, { recursive: true })
  writeFileSync(resolve(OUTDIR, 'time-klm.csv'),
    ['type,graph,nodes,edges,t_manual_s,t_alpha_s,red_full_pct,red_no_template_pct',
      ...rows.map((r) => `${r.type},${r.graph},${r.nodes},${r.edges},${r.t_manual_s},${r.t_alpha_s},${r.red_full_pct},${r.red_no_template_pct}`)].join('\n'))

  // Illustrative single case in the user's terms (~100 s manual).
  const sample = rows.reduce((best, r) => (Math.abs(r.t_manual_s - 100) < Math.abs(best.t_manual_s - 100) ? r : best))

  const summary = {
    model: 'KLM-GOMS (Card, Moran & Newell, 1983) — flujo de diagramación completo',
    operators_s: { CLICK, POINT, MENTAL, HOME, KEY, DRAG },
    assumptions: { name_chars: NAME, label_chars: LABEL, manual_repositions_per_node: REPOS, template_nodes: TEMPLATE_NODES },
    paths: {
      'AlphaGraph full flow (template + armed palette + auto-layout + preset labels)':
        { mean_reduction_pct: col('red_full_pct'), graphs_meeting_25pct: rows.filter((r) => r.red_full_pct >= 25).length },
      'AlphaGraph WITHOUT templates (floor)':
        { mean_reduction_pct: col('red_no_template_pct'), graphs_meeting_25pct: rows.filter((r) => r.red_no_template_pct >= 25).length },
    },
    graphs_total: rows.length,
    full_flow_perType_mean_pct: Object.fromEntries(Object.entries(byType).map(([t, a]) => [t, Number(mean(a).toFixed(1))])),
    illustrative_case: { type: sample.type, nodes: sample.nodes, edges: sample.edges, manual_s: sample.t_manual_s, alphagraph_s: sample.t_alpha_s, reduction_pct: sample.red_full_pct },
  }
  writeFileSync(resolve(OUTDIR, 'time-klm-summary.json'), JSON.stringify(summary, null, 2))

  console.log('KLM-GOMS — reducción del flujo de diagramación (manual vs AlphaGraph):')
  console.log(`  Flujo completo (con plantillas):  ${col('red_full_pct')}%  → ${rows.filter((r) => r.red_full_pct >= 25).length}/${rows.length} grafos ≥25%`)
  console.log(`  Sin plantillas (piso):            ${col('red_no_template_pct')}%  → ${rows.filter((r) => r.red_no_template_pct >= 25).length}/${rows.length} grafos ≥25%`)
  console.log('  Por tipo (flujo completo):', summary.full_flow_perType_mean_pct)
  console.log(`  Caso ilustrativo (~100s manual): manual ${sample.t_manual_s}s → AlphaGraph ${sample.t_alpha_s}s (${sample.red_full_pct}% menos)`)
  console.log(`  Wrote time-klm.csv + time-klm-summary.json`)
}

main()
