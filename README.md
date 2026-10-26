# AlphaGraph — replication package

Data, corpora and analysis code behind *"Automatic layout of software architecture
diagrams with the Sugiyama algorithm: an empirical study in industry"* (submitted to
*Empirical Software Engineering*). This is the replication package only; the AlphaGraph
application's source code is not part of it, and the benchmark does not need it.

Everything reported in the manuscript that can be recomputed from the records that exist
is recomputed here by one script, which prints every figure next to the value printed in
the paper and exits non-zero if any of them disagrees. One reported result cannot be
recomputed at all: the 92 % task-success rate and the mean of two errors per task in
Section 5.3, for which no per-task record was found.

| Read this | For |
|---|---|
| [data/PROVENANCE.md](data/PROVENANCE.md) | where every file came from, and what a reproduced figure from it does and does not prove |
| [INVENTORY.md](INVENTORY.md) | the claim-by-claim status and the findings to settle before submission |
| [DATA_AVAILABILITY.md](DATA_AVAILABILITY.md) | the statement to publish with the article |
| [MANUSCRIPT_EDITS.md](MANUSCRIPT_EDITS.md) | the corrections this package made necessary in the paper |
| [AUDIT.md](AUDIT.md) | the pre-publication audit: privacy, secrets, licences |
| [corpora/ATTRIBUTION.md](corpora/ATTRIBUTION.md) | origin, derivation and licence status of the graph data |
| [LICENSE.md](LICENSE.md) | MIT for `scripts/`, CC BY 4.0 for the data and docs, nothing for third-party graphs |

## Reproducing the reported statistics

```bash
python -m pip install -r requirements.txt
python scripts/fetch_corpora.py          # rebuilds the public corpus, ~5 MB download
python scripts/analysis/reproduce.py
python scripts/analysis/verify_corpora.py
```

The first command is needed because the public graph collections carry no licence, so
this package does not redistribute them; it rebuilds the exact sample from the original
archives and verifies every graph against the authors' checksums. See
[corpora/ATTRIBUTION.md](corpora/ATTRIBUTION.md). Everything else works without it.

`reproduce.py` reads only the files under `data/` and prints, for each statistic, the
recomputed value, the value printed in the manuscript, and `OK` or `MISMATCH`. It covers
RQ1 (field times and KLM-GOMS), RQ2 (crossings, head-to-head Wilcoxon, AS-IS/TO-BE) and
RQ3 (SUS, expert rubric), and labels each section with the provenance of the file it
reads. It **exits non-zero** if any check disagrees or any sanity check warns, so the
exit code is the result; all 20 checks currently reproduce.

`verify_corpora.py` checks the step before that: that the graphs are well formed, that
**every graph file matches the SHA-256 the authors recorded** — which pins the node ids
and the ordered edge list, where equal counts would not — that every result row refers to
a graph in the corpus it names, and that the corpus properties stated in Section 4.2
hold. It exits non-zero on any failure, and also when the public corpus is absent and its
checks could not run — a partial verification is reported as such and does not pass.
Use `--allow-partial` to accept a run without it.

What was verified once, by hand, rather than on every run: the 100 public graphs were
compared against the GraphML files they name in the upstream archives (identical, all
100), and all seven engines were re-run over both corpora on a different machine (1,400
rows, identical in every deterministic column; only wall-clock `layoutMs` differs).
[INVENTORY.md](INVENTORY.md) section 3 records exactly what that does and does not
establish.

## Regenerating the data from the corpora

The measurement scripts are the ones that produced the shipped CSV files. They write
to `out/`, which is not tracked, so a re-run never overwrites the published data —
compare `out/` with `data/` instead.

```bash
# KLM-GOMS estimation: no dependencies, reproduces data/rq1-klm-goms/ byte for byte
node scripts/bench/time-klm.mjs

# layout benchmark: needs the engines
cd scripts/bench && npm install && cd ../..
node scripts/bench/run-benchmark.mjs                                    # mixed corpus
DATASET_DIR=corpora/public-standard OUT_SUFFIX=-standard \
  node scripts/bench/run-benchmark.mjs                                  # public corpus
node scripts/bench/scalability.mjs                                      # 20-400 nodes
node scripts/bench/judges-stats.mjs data/rq3-expert-ratings/expert-ratings.csv
```

`generate-graphs.mjs` regenerates all 100 synthetic graphs from their seeded PRNG, and
`convert-standard.mjs` re-draws the sample of 100 public graphs from the original GraphML
archives (`fetch_corpora.py` calls it with `STD_SRC` already set). Both write straight
into `corpora/`, so run them only to check that the corpora are what the scripts produce;
`verify_corpora.py` then confirms the checksums still match.

Measured engines: AlphaGraph (dagre plus multi-candidate ranker selection), dagre,
draw.io (its own mxGraph `mxHierarchicalLayout`, headless under jsdom), Cytoscape,
KLAY, ELK `layered`, and Graphviz `dot`. Every engine's output is scored with the same
crossing, edge-length, area and overlap metrics from `scripts/bench/lib.mjs`, so the
comparison is like for like.

## Layout

```
data/
  rq1-field-timing/timing-per-participant.csv   manual vs. AlphaGraph time, P01-P12 (Table 3)
  rq1-klm-goms/                                 KLM-GOMS per graph + operator constants
  rq2-crossings/                                public corpus, 100 graphs x 7 engines (Tables 4-5)
  rq2-mixed-corpus/                             mixed corpus benchmark + scalability run
  rq2-asis-tobe/                                per-diagram AS-IS/TO-BE crossing reduction
  rq3-sus/sus-responses.csv                     SUS, 10 items per participant, anonymised (Table 6)
  rq3-expert-ratings/                           rubric ratings of the 3 judges + panel profiles
corpora/
  ATTRIBUTION.md                                origin, derivation and licence status
  public-standard/index.json                    which GraphML file each of the 100 graphs came from
  public-standard.sha256                        checksum of every graph, for the rebuild
  mixed/                                        100 synthetic graphs in five families, + index.json
  mixed.sha256                                  checksum of every graph
protocols/                                      validation plan, instruments, certification form (Spanish)
scripts/
  fetch_corpora.py                              rebuilds the public corpus from the original archives
  analysis/reproduce.py                         recomputes every reported statistic
  analysis/verify_corpora.py                    checks corpus identity and the Section 4.2 claims
  bench/                                        generation and measurement scripts (Node)
out/                                            re-run outputs, untracked
```

### The two corpora, which are disjoint and not the same 100 graphs

- **`corpora/public-standard`** — RQ2. A deterministic sample of 50 graphs from Rome-Lib
  and 50 from the North collection, the real ones (`index.json` records the source
  GraphML file, node count and edge count of every graph). This is the n = 100 of Tables
  4 and 5. Rebuilt by `fetch_corpora.py`, not shipped. The Rome half is stratified by
  node count, 10 per stratum; the North half is not stratified by size at all and spans
  10-49 nodes — read INVENTORY.md finding 8 before describing it anywhere.
- **`corpora/mixed`** — the KLM-GOMS estimation and the exploratory benchmark. **100
  synthetic graphs**, 20 in each of five families. Three model architecture shapes
  (`layered`, `tree`, `cyclic`); the other two, named `rome` and `north`, are
  **imitations** calibrated to the public collections' statistics, not graphs from them.
  This is the n = 100 of the KLM-GOMS figures, and it is synthetic throughout —
  INVENTORY.md finding 10, which affects how §4.3 and §5.1 may be worded.

Both sets have 100 graphs, they are different sets, and they share no graph by full edge
set. `verify_corpora.py` checks that.

### Engine versions

The re-run that reproduced Tables 4 and 5 used dagre 1.1.8, elkjs 0.9.3, @hpcc-js/wasm
2.36.0 (Graphviz), cytoscape 3.34.4, klayjs 0.4.1, mxgraph 4.2.2 (draw.io's engine) and
jsdom 29.1.1, pinned in `scripts/bench/package-lock.json`.

## Participant privacy

The twelve participants and the three judges are published only as `P01`-`P12` and
`J1`-`J3`, with a coarse role category and no employer, no name, no date and no
free-text comment. The signed SUS questionnaires and the judges' rubric sheets carry
real names and employers: they are kept by the corresponding author, are not part of
this package, and the file that holds them is not published. The derivation from those
sheets to `data/rq3-sus/sus-responses.csv` drops every identifier and keeps only the
ten Likert answers, which `reproduce.py` re-scores.

## Licence

`scripts/` is MIT; the data, corpora and documentation are CC BY 4.0; the Rome-Lib and
North collections are third-party data that this repository does not contain and does not
license. [LICENSE.md](LICENSE.md) says exactly what falls where.

Sources: Rome-Lib and North DAGs are public corpora of the Graph Drawing community
(`graphdrawing.org`); the synthetic graphs, the measurements and the scripts are the
authors' own work.
