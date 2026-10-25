/**
 * Inter-judge agreement for the visual-quality rubric (Purchase aesthetics) — computes
 * Kendall's W (concordance) and ICC(2,1)/ICC(2,k) (intraclass correlation) from a panel
 * of INDEPENDENT external judges. The judges' scores are human input; this script only
 * computes the statistics. It does NOT generate scores.
 *
 *   node scripts/bench/judges-stats.mjs <scores.csv>
 *
 * CSV: first column = item id, remaining columns = one judge each (ratings 1–5).
 *   item,J1,J2,J3
 *   diagram-01,4,5,4
 *   ...
 */
import { readFileSync } from 'node:fs'

function avgRanks(values) {
  const idx = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0])
  const ranks = new Array(values.length)
  let i = 0
  while (i < idx.length) {
    let j = i
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++
    const r = (i + j + 2) / 2 // average rank for ties (1-based)
    for (let k = i; k <= j; k++) ranks[idx[k][1]] = r
    i = j + 1
  }
  return ranks
}

/**
 * Kendall's W, both conventions. With tied ranks the two differ, and rubric data on a
 * 1-5 scale has many ties, so the convention has to be stated: the paper reports the
 * tie-corrected coefficient. Returns { plain, corrected }.
 */
function kendallW(matrix, n, m) {
  // matrix[item][judge]; rank items within each judge, sum ranks per item.
  const Ri = new Array(n).fill(0)
  let tieTerm = 0
  for (let j = 0; j < m; j++) {
    const col = matrix.map((row) => row[j])
    const ranks = avgRanks(col)
    for (let i = 0; i < n; i++) Ri[i] += ranks[i]
    // T = sum(t^3 - t) over this judge's groups of tied ranks.
    const groups = new Map()
    for (const r of ranks) groups.set(r, (groups.get(r) ?? 0) + 1)
    for (const t of groups.values()) tieTerm += t ** 3 - t
  }
  const Rbar = (m * (n + 1)) / 2
  const S = Ri.reduce((acc, r) => acc + (r - Rbar) ** 2, 0)
  const span = m * m * (n ** 3 - n)
  return { plain: (12 * S) / span, corrected: (12 * S) / (span - m * tieTerm) }
}

function icc(matrix, n, k) {
  const flat = matrix.flat()
  const grand = flat.reduce((a, b) => a + b, 0) / flat.length
  const rowMean = matrix.map((r) => r.reduce((a, b) => a + b, 0) / k)
  const colMean = Array.from({ length: k }, (_, j) => matrix.reduce((a, r) => a + r[j], 0) / n)
  const SSR = k * rowMean.reduce((a, m) => a + (m - grand) ** 2, 0)
  const SSC = n * colMean.reduce((a, m) => a + (m - grand) ** 2, 0)
  const SST = flat.reduce((a, x) => a + (x - grand) ** 2, 0)
  const SSE = SST - SSR - SSC
  const MSR = SSR / (n - 1)
  const MSC = SSC / (k - 1)
  const MSE = SSE / ((n - 1) * (k - 1))
  const icc21 = (MSR - MSE) / (MSR + (k - 1) * MSE + (k * (MSC - MSE)) / n)
  const icc2k = (MSR - MSE) / (MSR + (MSC - MSE) / n)
  return { icc21, icc2k, MSR, MSC, MSE }
}

function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Uso: node scripts/bench/judges-stats.mjs <scores.csv>')
    process.exit(1)
  }
  const lines = readFileSync(file, 'utf8').trim().split(/\r?\n/)
  const header = lines[0].split(',')
  const judges = header.slice(1)
  const matrix = lines.slice(1).map((l) => l.split(',').slice(1).map(Number))
  const n = matrix.length
  const m = judges.length
  if (n < 2 || m < 2) {
    console.error('Se requieren ≥2 ítems y ≥2 jueces.')
    process.exit(1)
  }
  const { plain: Wplain, corrected: W } = kendallW(matrix, n, m)
  const { icc21, icc2k } = icc(matrix, n, m)
  const mean = matrix.flat().reduce((a, b) => a + b, 0) / (n * m)
  const interpW = W >= 0.7 ? 'fuerte' : W >= 0.5 ? 'moderada' : 'débil'
  const interpICC = icc2k >= 0.75 ? 'buena-excelente' : icc2k >= 0.5 ? 'moderada' : 'pobre'
  console.log(`Panel: ${m} jueces × ${n} ítems`)
  console.log(`Rúbrica — puntuación media: ${mean.toFixed(2)} / 5`)
  console.log(`Kendall's W: ${W.toFixed(3)}  (corregida por empates; concordancia ${interpW})`)
  console.log(`  chi2 = m(n-1)W: ${(m * (n - 1) * W).toFixed(2)}  gl = ${n - 1}`)
  console.log(`  W sin corregir: ${Wplain.toFixed(3)}  (no es la cifra del articulo)`)
  console.log(`ICC(2,1):    ${icc21.toFixed(3)}  (un juez)`)
  console.log(`ICC(2,k):    ${icc2k.toFixed(3)}  (promedio de ${m} jueces, fiabilidad ${interpICC})`)
}

main()
