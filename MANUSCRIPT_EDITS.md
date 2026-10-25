# Manuscript edits made to match this package

Twelve sentence-level corrections plus the Data Availability declaration, applied to
`EMSE_Manuscript_EN (1).docx` as **tracked changes** under the author name
`Data availability revision`, so each one can be accepted or rejected individually.

- `EMSE_Manuscript_EN_rev2-tracked.docx` — with the tracked changes, for review
- `EMSE_Manuscript_EN_rev2-clean.docx` — the same document with every change accepted
- the original file is untouched

Both were checked against the OOXML schema, and the tracked version was verified to
reconstruct the original exactly when all changes are rejected, so no text was altered
outside a tracked change. The yellow highlight on the "Data Availability" heading, which
marked it as pending, was removed; that is a formatting change and is not tracked.

**Still to do by hand:** replace `[INSERT ARCHIVED DOI BEFORE SUBMISSION]` in the
declaration with the real DOI, and decide whether the application's source code gets a
sentence of its own (see [DATA_AVAILABILITY.md](DATA_AVAILABILITY.md), point 2 of
"Before pasting this"). Nothing else in the file is a placeholder.

**No reported number changes.** No table, figure or statistic was touched. All twelve
edits are descriptions of method, corpus and provenance.

## The edits

### 1 · Section 4.2 — what the stratification actually was

> ~~The stratification and the sampling seed are documented in the project's validation
> repository to ensure reproducibility.~~
>
> Stratification used five node-count strata (10-25, 26-40, 41-55, 56-70 and 71-100
> nodes) with ten graphs per stratum. This was achieved in the Rome-Lib sample, whose file
> names encode the node count; in the North collection the corresponding field is a serial
> number, so that sample is not stratified by size and its node counts range from 10 to 49
> (median 16), concentrated in the smallest stratum, a limitation revisited among the
> threats to validity. The sampling procedure, the identifier of the source file of every
> selected graph, and the scripts that rebuild and verify the sample are available in the
> replication package cited under Data Availability.

Why: Rome file names are `grafo<id>.<nodes>.graphml` and North file names are
`g.<nodes>.<serial>.graphml`, so the sampler's regex reads the node count in one
collection and a serial number in the other. There is also no "sampling seed" for the
public sample; the selection is a deterministic stride, and seeds belong to the synthetic
generators. INVENTORY.md finding 8, including the alternative of re-sampling and
re-running, which this edit does **not** assume.

### 2 · Section 4.2 — the second corpus is 100 synthetic graphs in five families

> For the objective KLM-GOMS estimations and for the AS-IS/TO-BE validations, ~~60
> synthetic graphs were additionally used, generated in three representative families:
> layered, tree, and cyclic.~~ **a separate corpus of 100 synthetic graphs was used,
> generated in five families of twenty graphs each: three representing architecture shapes
> (layered, tree, and cyclic) and two calibrated to the published statistics of the public
> collections and named after them. No graph of this corpus is taken from Rome-Lib or from
> the North collection.**

Why: `generate-graphs.mjs` has five generators, and its `rome` and `north` families are
imitations written when the upstream site was unreachable. This is finding 10, the most
consequential one in the inventory.

### 3 · Section 4.2 — which graphs the 6-59 range covers

> covering a size range from 6 to 59 nodes**, of which the three architecture families span
> 6 to 30**.

### 4 · Section 4.3 — the KLM-GOMS corpus

> ... using the KLM-GOMS model (Card et al. 1983) ~~over the 100 graphs of the public
> corpus plus 60 synthetic graphs~~ **over the separate corpus of 100 synthetic graphs
> described in Section 4.2, and not over the public sample used in the benchmark**, run
> under two assumptions ...

Why: the sentence implied 160 graphs, Section 5.1 reports n = 100, and the data file has
100 rows — none of them a public graph.

### 5 · Section 5.1 — which corpus the KLM figures describe

> ... the KLM-GOMS model of Card et al. (1983), applied to the 100 **synthetic** graphs of
> ~~the~~ **that** corpus, yields a mean reduction of 41.2% ...

### 6 · Section 5.1 — the per-family breakdown

> **By synthetic family**, the full-workflow reduction is distributed as follows: layered
> 42.4%, tree 44.4%, cyclic 41.0%, **and, for the two families calibrated to the public
> collections rather than drawn from them,** rome 39.3% and north 38.8%.

Why: as printed, the last two entries read as results on Rome-Lib and North.

### 7 · Section 5.2 — which corpus each AS-IS/TO-BE diagram belongs to

> the mean crossing reduction was 84.19% in the **two** evaluated diagrams (**D1, a
> Rome-Lib graph of the public sample:** 87.66%; **D2, a synthetic cyclic graph:** 80.72%)

### 8 · Section 4.7 — which language computes what

> The statistical analyses were performed in Python 3 with SciPy, Pandas and NumPy**, while
> the layout benchmark and the KLM-GOMS estimation are computed in Node.js**.

### 9 · Section 4.7 — where the data is, and its provenance

> ... ~~are kept in the project's validation repository~~ **are available in the
> replication package cited under Data Availability, which also records, for every file,
> whether it is the output of the measurement scripts or a transcription of the study's
> record documents**.

### 10 · Section 5.2 — the Kendall's W convention

> ... with very high agreement among evaluators**, measured with the coefficient corrected
> for tied ranks**: Kendall's W = 0.92 (χ²(4) = 11.04, p ≈ 0.026) ...

Why: with ties the two conventions differ, 0.92 against 0.83.

### 11 · Threats to validity — the reach of the RQ2 corpus

> ... and the Wilcoxon signed-rank test is robust to deviations from normality. **Within
> that corpus, the North half is not stratified by size and concentrates on graphs of 10 to
> 49 nodes, while the Rome-Lib half spans 13 to 99, so the RQ2 result is best supported for
> small and medium directed graphs.**

Why: the honest consequence of edit 1. The paired comparison is unaffected — all seven
engines laid out the same graphs — but generalisation to large directed graphs is not
supported by this sample.

### 12 · Threats to validity — where the scripts are

> ... executed with ~~scripts available in the project repository~~ **the scripts available
> in the replication package cited under Data Availability**.

### 13 · Declarations — Data Availability

The placeholder `…` is replaced by the statement in
[DATA_AVAILABILITY.md](DATA_AVAILABILITY.md), as one paragraph that also covers the code,
since the Declarations of this manuscript have no separate Code Availability heading. If
the journal asks for one, split the last sentence out under that heading. The statement
describes what the package actually does with the public graphs: it does not redistribute
them, and it ships the sampling script, the per-graph source identifiers, the checksums
and a rebuild script instead.

## Not changed

- **Tables 4 and 5 and the 100 public graphs** stay exactly as published. Their provenance
  was verified graph by graph against the upstream archives and the engines were re-run
  with identical results (INVENTORY.md section 3). Re-sampling the North half is the
  authors' decision, not a correction (finding 8).
- **"North DAGs"** is kept. graphdrawing.org labels that archive "directed graphs", but
  the collection's own `Graph.log` marks every entry acyclic and the 50 sampled graphs were
  checked independently, so the description holds.
- **The 92 % task success rate and the two errors per task** (Section 5.4) are left as they
  are, because no record was found to support or correct them. They are the one reported
  result this package cannot back.
- **Table 2 has no engine versions.** Worth adding, since Di Bartolomeo et al. (2024),
  which the paper cites, recommends reporting them: dagre 1.1.8, elkjs 0.9.3, @hpcc-js/wasm
  2.36.0 (Graphviz), cytoscape 3.34.4, klayjs 0.4.1, mxgraph 4.2.2 (draw.io's engine). Those
  are the versions that reproduce Tables 4 and 5. Left alone because it means editing a
  table, not a sentence.
