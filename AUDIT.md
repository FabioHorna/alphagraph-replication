# Pre-publication audit

Audit of every file in this package before it is published as a public repository and
archived for a DOI. Run again if files are added.

Scope: the 141 tracked files that will be published — 102 corpus and manifest JSON, 10
CSV, 10 Markdown, 7 Node scripts, 3 Python scripts, 2 checksum manifests, a lockfile, a
requirements file and two `.gitignore`. No binaries, no images, no office documents, no
archives. `node_modules/` and `out/` are ignored, not published.

## 1. Personal data — clear

- **Participants.** Present only as `P01`-`P12`, with a coarse role category
  (`software-architect`, `it-auditor`, …) and the sector already published in Table 1.
  No names, no employers, no session dates, no free-text answers.
- **Judges.** Present only as `J1`-`J3` with a role category; `judges-panel.csv` keeps
  one `years_experience` value (12) that the manuscript does not print. It is not
  identifying on its own, but it can be dropped if preferred.
- **Searched for and not found:** the eleven participant and judge names known from the
  source documents, employer names (including the audit firm that appears in the source
  annex), email addresses, phone numbers, national ID numbers, and the session month.
  Zero matches across all 235 files.
- The anonymisation of the SUS responses was done by a script that reads the signed
  annex and writes only the ten Likert answers plus a mapped role. That script is **not**
  in this package, because it would carry the path to the file containing the names.

## 2. Credentials and infrastructure — clear

Searched for passwords, secrets, API keys, tokens, private-key headers, JDBC and
database URLs, cloud hostnames, the production domain, and localhost ports. Four
matches, all false positives, all reviewed:

| File | Match | What it actually is |
|---|---|---|
| `protocols/INSTRUMENTOS.md` | "secreto fuerte", "token efímero" | names of the project's own JUnit test classes in a requirements matrix |
| `protocols/PLAN_DE_VALIDACION.md` | same | same matrix |
| `scripts/bench/convert-standard.mjs` | "token" | a code comment about a file-name token |
| `data/rq1-klm-goms/time-klm-summary.json`, `time-klm.mjs` | `KEY` | the KLM keystroke operator constant, 0.28 s |

No credential, endpoint or deployment detail of the AlphaGraph production environment
appears anywhere in the package.

## 3. Organisational and proprietary material — clear

No diagram, architecture or document belonging to a participating organisation is
included. The evaluation ran on public and synthetic graphs, so none is needed. The
AS-IS/TO-BE diagrams referenced in Section 5.2 are corpus graphs (`rome-10`,
`cyclic-03`), not client material.

Two judgements worth recording:

- `protocols/` holds the three Spanish validation documents as they were written for the
  thesis the system originated in, so they mention a thesis, an advisor's sign-off and
  "Lima Metropolitana", and `INSTRUMENTOS.md` and `PLAN_DE_VALIDACION.md` also carry the
  project's internal test and security matrices. They were kept complete rather than
  trimmed, because they are what the paper means by a pre-registered protocol and a
  trimmed protocol is weaker evidence. They contain no participant identity and no
  secrets. Trim them only if the venue requires anonymised supplementary material.
- Three scripts that sit next to the benchmark in the project were deliberately **not**
  copied here: `confidentiality-check.mjs`, `seed-evidencia-prod.mjs` and
  `seed-tesis-account.mjs`. They act on the running system and support no claim in the
  paper.

## 4. Corpus licences — resolved: not redistributed

`graphdrawing.org` states **no licence and no terms of use**, and neither archive
contains a licence, readme or copyright file: only a `Graph.log` of statistics. Checked
against the page and against the archive contents, not inferred.

Public accessibility is not permission to redistribute, and permission could not be
confirmed, so the 100 derived public graphs were **removed from the package**. In their
place it ships `scripts/fetch_corpora.py` (downloads from the source cited in the paper
and rebuilds the sample), the sampling script that produced it, `index.json` naming the
file selected for each graph, and `corpora/public-standard.sha256` with the checksum of
every graph as the authors used it. A rebuilt corpus that matches those 100 checksums is
the same corpus, so nothing is lost for reproduction. `corpora/ATTRIBUTION.md` documents
all of it.

The 100 synthetic graphs in `corpora/mixed/` are the authors' own and stay in full.

## 5. Data authenticity checks — pass, and stronger than counts

`scripts/analysis/verify_corpora.py` and the one-off verification recorded in
INVENTORY.md section 3 check identity, not resemblance:

- Every graph file matches the SHA-256 the authors recorded, which pins the node ids and
  the ordered edge list exactly. Equal node and edge counts would not have been enough,
  and the earlier version of this audit relied on counts alone.
- The 100 public graphs were compared against the GraphML files they name in the upstream
  archives: node ids and edge lists identical for all 100.
- All 100 synthetic graphs regenerate exactly from their seeded generator.
- All seven engines were re-run over both corpora: 1,400 rows, identical in `crossings`,
  `edgeLength`, `area`, `overlaps`, `nodes` and `edges`; only wall-clock `layoutMs`
  differs.
- Every result row refers to a graph in the corpus it names, and the two corpora share no
  graph by full edge set.
- All 50 North graphs sampled are acyclic.

It also surfaced three inaccuracies in Sections 4.2, 4.3 and 5.1, recorded as findings 8,
9 and 10 in [INVENTORY.md](INVENTORY.md). None affects a computed result; finding 10
changes what the KLM-GOMS numbers may be said to be about.

## 6. Verdict

No blocker to publication from a privacy, security or proprietary-content standpoint.
The outstanding items before the DOI is minted are editorial, and all of them are in
INVENTORY.md section 4: the manuscript's wording has to match what this package shows, and the
Code Availability bracket has to be decided.
