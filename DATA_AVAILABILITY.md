# Data Availability — statement to publish

Text for the `Data Availability` heading of the manuscript's *Declarations*, which is
currently a placeholder. It describes exactly what this package contains and nothing
else. Replace `[DOI]` with the archived identifier and check the three points in
§"Before pasting this" below; do not submit it with the placeholder in place.

---

### Data Availability

The public graph corpora used in this study are available from the Graph Drawing
community: Rome-Lib (http://www.graphdrawing.org/data/rome-graphml.tgz) and North DAGs
(http://www.graphdrawing.org/data/north-graphml.tgz).

The replication package for this article is openly available at [DOI]. Because those two
collections are distributed without a licence or terms of use, the package does not
redistribute their graphs: it provides the sampling script, the identifier of the source
file selected for each of the 100 sampled graphs, the SHA-256 checksum of every graph as
used in this study, and a script that downloads the archives from the address above and
rebuilds the sample, reporting whether each rebuilt graph matches its recorded checksum.
The package further contains the 100 synthetic graphs and the seeded generators that
produce them; the per-graph, per-engine benchmark results for the seven layout engines,
with edge crossings, edge length, layout area, node overlaps and layout time, which
underlie Tables 4 and 5; the per-graph KLM-GOMS estimates and the operator constants used;
the per-participant layout times of Table 3; the item-level anonymised SUS responses of
Table 6; the rubric ratings of the three expert judges; the AS-IS/TO-BE per-diagram
measurements; and the scripts that recompute every statistic reported in Sections 5.1 to
5.3, each printed next to the value published here.

Participant-level records that could permit re-identification are not publicly available,
in accordance with the informed consent obtained: this covers the signed SUS
questionnaires, the judges' rubric sheets, and the names, employers and session dates of
the participants and judges. The anonymised item-level responses required to recompute the
reported statistics are included in the replication package. Additional research records
may be requested from the corresponding author and will be shared subject to the terms of
the participants' consent and to institutional approval. Diagrams and architectural
artefacts belonging to the participating organisations are proprietary and are not
disclosed; the quantitative evaluation was conducted on the public corpora and synthetic
graphs described above, so no organisational material is needed to reproduce the results.

### Code Availability

The analysis and benchmark code is included in the replication package at [DOI]. The
benchmark harness implements the AlphaGraph layout condition itself, as hierarchical
layout with multi-candidate ranker selection on top of the open-source dagre library, and
runs the six comparison engines (draw.io's mxGraph hierarchical layout, Cytoscape, KLAY,
ELK and Graphviz, besides single-pass dagre) through their public APIs. The benchmark can
therefore be re-executed in full without access to the AlphaGraph application. [The
AlphaGraph application source code is not publicly released. | The AlphaGraph application
source code is available at <URL> under the <NAME> licence.]

---

## Before pasting this

1. **The DOI must exist and resolve.** Archive the package (for example a GitHub
   repository with a Zenodo release) and put the resulting DOI in both paragraphs. A
   statement naming a repository that a reviewer cannot open is worse than no statement.
2. **Decide the Code Availability bracket.** The project has no licence file, so the
   sentence about the application's source is a decision, not a fact to be copied. Pick
   one of the two options and delete the other.
3. **Fix the three sentences that promise an unnamed repository.** §4.2, §4.7 and §6 of
   the manuscript each refer to "the project's validation repository"; they should cite
   the DOI. [INVENTORY.md](INVENTORY.md) §3 lists these and the other wording changes the
   package makes necessary, including the KLM-GOMS corpus description and the Kendall's W
   convention.
4. **Do not publish the project repository's history** as the replication package. It
   contains the participants' and judges' real names in the SUS annex; see INVENTORY.md
   finding 6. Publish this directory as a fresh repository instead.

## If the package is not archived in time

EMSE accepts restricted availability when it is stated truthfully. The honest fallback,
given that the benchmark data and the synthetic graphs carry no personal information, is
to publish those and restrict only the human-subject records:

> The public graph corpora are available from the Graph Drawing community (Rome-Lib and
> North DAGs, http://www.graphdrawing.org/data/). The sampling and benchmark scripts, the
> synthetic graphs, the per-graph evaluation results, the KLM-GOMS estimates and the
> analysis scripts generated in this study are available from the corresponding author on
> reasonable request. Participant-level records are not publicly available because they
> contain information that could compromise the privacy of the participants, and may be
> shared only in anonymised form, subject to the terms of the informed consent obtained
> and to institutional approval.

Prefer the archived version: the data that supports Tables 4, 5 and 6 and the KLM-GOMS
estimates exists, is anonymous or non-personal, and reproduces the published figures.
"Available on reasonable request" understates what can be shown.
