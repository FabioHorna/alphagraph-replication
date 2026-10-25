# Inventory: what is in this package, where it came from, what is missing

Status of every quantitative claim in the manuscript, the file that supports it, and
how that file came to be. `reproduce.py` recomputes every row marked *reproduced*.

Provenance levels are distinguished, because they are not equally strong:

- **measured** — the file is the output of a script in `scripts/bench/`, re-runnable
  over the corpora shipped here.
- **derived from primary records** — transcribed item by item from the signed
  instruments, so the published aggregate follows from it rather than being copied.
- **transcribed** — the file is a digitisation of a results table (the manuscript's own
  tables, the internal evidence report). The numbers are the study's numbers; the raw
  collection instrument is not a data file, and a reproduced figure from such a file
  confirms the arithmetic, not the measurement.

[data/PROVENANCE.md](data/PROVENANCE.md) states the level of every file and what each
level does and does not warrant; `reproduce.py` prints the level of each section as it
runs. [AUDIT.md](AUDIT.md) is the pre-publication audit of all 235 files, and
[corpora/ATTRIBUTION.md](corpora/ATTRIBUTION.md) the origin and licence status of the
graph data.

## 1. Claim by claim

| § | Claim in the paper | File | Provenance | Status |
|---|---|---|---|---|
| 5.1, Table 3 | R̄ = 28.8 %, CI [25.9, 31.7], t(11) = 11.8, d = 3.4, 9/12 ≥ 25 % | `data/rq1-field-timing/timing-per-participant.csv` | transcribed from Table 3 | reproduced, all figures |
| 5.1 | Shapiro-Wilk W = 0.951, p = 0.658 | same | same | reproduced |
| 5.1 | KLM-GOMS 41.2 % full flow, 35.6 % floor, 100/100 ≥ 25 % | `data/rq1-klm-goms/time-klm.csv` | measured (`time-klm.mjs`) | reproduced; the CSV regenerates byte for byte from `corpora/mixed` |
| 5.2, Table 4 | mean crossings per corpus and engine, AlphaGraph 54.95 | `data/rq2-crossings/results-standard.csv` | measured (`run-benchmark.mjs`) | reproduced, all 21 cells |
| 5.2 | −13.7 % vs. dagre, −22.0 % vs. draw.io | same | same | reproduced |
| 5.2, Table 5 | better/tie/worse, mean Δ and Wilcoxon p for the 6 engines | same | same | reproduced, all rows |
| 5.2 | zero node overlaps in all 7 engines | same (`overlaps` column) | same | reproduced |
| 5.2 | AS-IS/TO-BE 84.19 % mean (D1 87.66 %, D2 80.72 %), 29 ms | `data/rq2-asis-tobe/asis-tobe-per-diagram.csv` | transcribed from the OE3 evidence report | reproduced |
| 5.2 | judges 3.93/5, W = 0.92, χ²(4) = 11.04, ICC(2,3) = 0.93, ICC(2,1) = 0.81 | `data/rq3-expert-ratings/expert-ratings.csv` | transcribed from the OE3 evidence report | reproduced, see finding 4 |
| 5.3, Table 6 | SUS 76.9, per-participant 70.0–87.5, 12/12 ≥ 68 | `data/rq3-sus/sus-responses.csv` | derived from the signed questionnaires (anonymised) | reproduced from the item level, all 12 scores |
| 4.2 | stratified sample of 100 public graphs, with the sampling criterion | `corpora/public-standard/index.json` | measured (`convert-standard.mjs`) | source GraphML file recorded per graph |
| 4.2 | 60 synthetic graphs, deterministic generators | `corpora/mixed/` + `generate-graphs.mjs` | measured | seeded PRNG, regenerable |
| 5.4 | scalability 20–400 nodes | `data/rq2-mixed-corpus/scalability.csv` | measured (`scalability.mjs`) | available, not a claim checked by the script |

## 2. Not in this package

| § | Claim | Why it is absent |
|---|---|---|
| 5.4 | 92 % task success, ~2 errors per task, errors concentrated in tasks 16 and 18 | The per-task records were not found. The twenty-task list itself is not in `protocols/INSTRUMENTOS.md` either; the paper cites "the appendices of the validation report" for it. |
| 4.5 | counterbalancing order and manual tool actually used per participant | The per-participant form in `protocols/INSTRUMENTOS.md` §1 records both, but the filled forms were not found; only the consolidated times survive. |
| 4.7 | number of corrections per condition | Same form, same situation. |
| 5.4 | complementary technical results (test suites, SAST/SCA, security probes) | They live in the project's own evidence folder, not in the research package. They are software-engineering artefacts of AlphaGraph, not research data, and the Data Availability statement does not promise them. |

Nothing in group 2 is needed to recompute a figure that the paper reports as a result,
except the 92 % / 2-errors pair, which cannot be verified from this package.

## 3. What has actually been verified, and what has not

The word "reproduced" is used narrowly here. Three different things were checked, and
they are not equally strong.

**Verified end to end — the RQ2 benchmark.** The chain from the original archives to
Tables 4 and 5 was re-executed in full:

1. `rome-graphml.tgz` and `north-graphml.tgz` were downloaded from the source cited in
   the paper, which now redirects to `graphdrawing.unipg.it`. They hold 11,534 and 1,277
   GraphML files, the counts the paper's references give. Their SHA-256 values are
   recorded in `scripts/fetch_corpora.py`.
2. The sample was rebuilt with `convert-standard.mjs` and compared with the 100 graphs
   used in the study **by node id list and ordered edge list, not by counts**: identical
   for all 100. Each one was then compared against the GraphML file it names: node ids
   and edge list identical for all 100. The corpus is therefore the public corpus, graph
   by graph, and `corpora/public-standard.sha256` pins it.
3. All seven engines were re-run over that corpus on a different machine and day. Every
   one of the 700 rows matches the published file in `nodes`, `edges`, `crossings`,
   `edgeLength`, `area` and `overlaps`, and `summary-standard.json` comes out identical,
   head-to-head Wilcoxon table included. Only `layoutMs` differs, being wall-clock time
   (mean 21.7 ms published, 30.8 ms on the re-run).
4. The same was done for the mixed corpus: 700 rows, same six columns, no differences.

**Verified as deterministic — the synthetic corpus and the KLM estimation.** All 100
graphs of `corpora/mixed` regenerate exactly from the seeded generator, and
`time-klm.mjs` reproduces `time-klm.csv` byte for byte from them. That makes the KLM
figures reproducible; it says nothing about whether the cognitive model is a good model
of the task, which is a separate question the paper discusses.

**Not verifiable from this package — the human-subject data.** The field times, the SUS
responses and the rubric ratings cannot be re-measured. What was checked is that the
published inferential statistics follow from the published per-unit values, which is
arithmetic, not corroboration. `data/PROVENANCE.md` sets out what each level warrants.
The 92 % task-success figure of §5.4 has no record here at all.

## 4. Findings to settle before submission

**1. The paper promises a repository and does not name one.** §4.2, §4.7 and §6 refer to
"the project's validation repository" three times with no URL and no DOI. Those three
sentences must point at this package's archived DOI, and the Data Availability statement
must give it.

**2. The KLM-GOMS corpus is described three different ways, and it is not the public
corpus at all.** §4.3 says the estimation ran over "the 100 graphs of the public corpus
plus 60 synthetic graphs" (160); §5.1 reports it with n = 100; and the data file has
exactly 100 rows. Those 100 graphs are **entirely synthetic** — see finding 10, which is
the substantive version of this problem. §4.3 and §4.2 need wording that distinguishes
the two corpora, which this package keeps apart as `corpora/mixed` (synthetic) and
`corpora/public-standard` (the real public sample).

**3. The paper says Python, the measurement pipeline is Node.** §4.7 states that the
analyses were performed in Python 3 with SciPy, Pandas and NumPy. The scripts that
produced the measurements are JavaScript (`scripts/bench/`). `scripts/analysis/reproduce.py`
now makes the statistical layer genuinely Python with those three libraries, so the
sentence is accurate for the statistics; it should say that the layout benchmark and the
KLM-GOMS estimation are computed in Node, since a reader opening the package will see it.

**4. Kendall's W: say that it is corrected for ties.** The reported W = 0.92 with
χ²(4) = 11.04 is the tie-corrected coefficient, and it is reproduced exactly. Both
scripts in this package now compute that coefficient and also print the uncorrected
W = 0.828, labelled as not being the published figure; `judges-stats.mjs` previously
printed only the uncorrected value, which is why the two disagreed. Rubric data on a 1–5
scale is full of tied ranks, so §5.2 still has to state which convention it reports.

**5. Two figures are transcriptions, not records.** The field times (Table 3) and the
expert ratings exist as tables in the manuscript and in the OE3 evidence report, not as
collection data files; this package digitises them and the statistics check out, but no
stopwatch sheet or rubric sheet backs them as a dataset. If a reviewer asks for the
primary records, the answer has to be the signed certification form, held by the
corresponding author. Worth checking before submission whether those originals can be
located and added.

**6. The signed questionnaires are not anonymous and are in the project history.** The
source annex of `sus-responses.csv` carries the twelve participants' full names and the
judges' names and employers, and it is committed in the private repository's history
(branch `stage/07-final-integration`). That history must not be published. Publishing
this package as a new repository, as prepared here, avoids it; rewriting the existing
history does not, and should not be attempted as a way of publishing the project
repository instead.

**7. Minor.** `summary.json` rounds the KLM reduction for the `tree` family to 44.4 %
where the per-graph mean is 44.345 %; the paper repeats 44.4 %. Harmless, worth knowing
if a reader recomputes it.

**8. The North sample is not stratified by node size, although §4.2 says both samples
are.** `convert-standard.mjs` reads the last numeric field of the file name. Rome files
are `grafo<id>.<nodes>.graphml`, so that is the node count and the Rome sample came out
exactly stratified: 10 graphs in each of the five node-count strata. North files are
`g.<nodes>.<serial>.graphml` — verified against the collection's own `Graph.log`, where
`g.10.11` has 10 nodes and 14 edges — so the same regex reads an arbitrary serial number
there. The North sample is therefore stratified by nothing to do with the graph, and its
node sizes simply follow the collection's skew towards small graphs: 10–49 nodes, median
16, distributed [43, 4, 3, 0, 0] over the strata 10–25, 26–40, 41–55, 56–70, 71–100. **No
North graph above 49 nodes was evaluated in RQ2.**

This does not invalidate anything computed. All seven engines laid out the same 100
graphs and the tests are paired, so Tables 4 and 5 stand as a comparison. What it changes
is the description and the reach of the RQ2 result: the North half probes small graphs
only, and §4.2's "deterministic size-stratified sample of 50 graphs ... from each
collection" is accurate for Rome-Lib and not for North. Two ways out, and it is a
decision, not a fix to apply silently:

- *Describe the realised sample* — say that the Rome sample is node-size stratified and
  the North sample spans 10–49 nodes with the distribution above, and add the skew to the
  threats to validity. Nothing is re-run and no published number changes. This is the
  recommended option.
- *Re-sample and re-run* — correct the regex, draw a node-stratified North sample and
  re-run the benchmark. Every number in Tables 4 and 5 and in Fig. 5 and 6 changes, as
  will the −13.7 % and −22.0 % headline figures, because larger North graphs have more
  crossings. Only worth it if the paper wants to claim stratification over the full size
  range.

The sampler is left exactly as it is, with the token semantics now documented in its own
comment: changing it would invalidate every file in `data/rq2-crossings/`.

**9. "6 to 59 nodes" describes all 100 synthetic graphs, not the 60 of three families.**
§4.2 gives that range for the 60 synthetic graphs in the layered, tree and cyclic
families. Those span 6–30 nodes (tree 6–23, cyclic 8–24, layered 8–30); 6–59 is the range
once the other two synthetic families are included, the largest being a 59-node graph of
the `north` family. Same root cause as finding 10.

**10. The KLM-GOMS estimation ran on 100 synthetic graphs, and two of its five families
are imitations named after the public corpora.** This is the most consequential finding
in this document.

`generate-graphs.mjs` has five generators, not three: `layered`, `tree`, `cyclic`, `rome`
and `north`, 20 graphs each. Its own comment says what the last two are:

> "Standard-like" sets calibrated to the documented statistics of the classic
> graph-drawing benchmarks (the originals at graphdrawing.org are offline):
> rome: undirected, real-world-derived, ~10–60 nodes, density ≈ 1.3 edges/node,
> connected. north: AT&T directed acyclic graphs (DAGs), ~10–60 nodes.

So `corpora/mixed/rome-*.json` and `corpora/mixed/north-*.json` are **generated
imitations** of those collections, written when the upstream site was unreachable. They
carry no `source` field, and a full edge-set comparison confirms that not one of them
appears in the real public sample. Verified both ways: all 100 regenerate exactly from
the seeded PRNG, and all 100 are structurally disjoint from `corpora/public-standard`.

What this means for the paper:

- The KLM-GOMS figures (41.2 %, 35.6 %, 100/100 graphs over 25 %) stand as computed, but
  they are computed over **synthetic** graphs only. §4.3's "100 graphs of the public
  corpus plus 60 synthetic" is wrong twice: the count is 100, and none of them is public.
- The per-family breakdown in §5.1 — "layered 42.4 %, tree 44.4 %, cyclic 41.0 %, rome
  39.3 %, north 38.8 %" — reads as though `rome` and `north` were the public corpora.
  They are the imitations and must be labelled as such.
- **RQ2 is unaffected.** Tables 4 and 5, Fig. 5 and 6 and the −13.7 % / −22.0 % headline
  figures come from `data/rq2-crossings/`, which was computed on the real public sample,
  and that sample's provenance is now proven graph by graph (see section 3 above).
- The AS-IS/TO-BE pair in §5.2 mixes the two: D1 is `rome-10` from the real public sample,
  D2 is `cyclic-03` from the synthetic set. The sentence should say so.
