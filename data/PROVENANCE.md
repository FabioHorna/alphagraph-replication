# Provenance of every file in `data/`

Read this before citing any of these files as experimental evidence. Two of the six
groups are **transcriptions of record documents, not instrument-level data**, and that
difference matters more than the fact that every statistic recomputes: recomputing a
mean from a transcribed table shows the arithmetic is right, not that the measurement
happened as described. The distinction is kept here, in `INVENTORY.md`, and in the
output of `scripts/analysis/reproduce.py`, which prints the provenance level of each
section as it runs.

| Group | Level | Came from | Can be regenerated? |
|---|---|---|---|
| `rq1-klm-goms/` | measured | `scripts/bench/time-klm.mjs` over `corpora/mixed`, which is **synthetic throughout** | yes — byte for byte |
| `rq2-crossings/` | measured | `scripts/bench/run-benchmark.mjs` over `corpora/public-standard`, the real public sample | yes — re-run reproduces all 700 rows except wall-clock timing |
| `rq2-mixed-corpus/` | measured | same script over `corpora/mixed` (synthetic), plus `scalability.mjs` | yes — re-run matches in every deterministic column |
| `rq3-sus/sus-responses.csv` | derived from primary records | the twelve signed SUS questionnaires, transcribed item by item and anonymised | no — the signed originals are not published |
| `rq1-field-timing/timing-per-participant.csv` | transcribed | Table 3 of the manuscript | no |
| `rq2-asis-tobe/asis-tobe-per-diagram.csv` | transcribed | the AS-IS/TO-BE table of the internal OE3 validation report | no |
| `rq3-expert-ratings/expert-ratings.csv` | transcribed | the judges' rubric table of the same report | no |

## What each level means

**measured.** The file is the output of a script in `scripts/bench/`, run over the
corpora in this package. This level has been checked as far as it can be:

- Every graph file matches the SHA-256 the authors recorded, so the corpus is identified
  down to its node ids and ordered edge list, not merely by node and edge counts.
- The 100 public graphs were compared against the GraphML files they name in the upstream
  archives: identical, all 100. The 100 synthetic graphs regenerate exactly from their
  seeded generator.
- All seven engines were re-run over both corpora on a different machine: 1,400 rows,
  identical in `nodes`, `edges`, `crossings`, `edgeLength`, `area` and `overlaps`.
  `time-klm.mjs` reproduces its CSV byte for byte.
- `layoutMs` is wall-clock time and does differ between machines (mean 21.7 ms published,
  30.8 ms on the re-run). No reported claim rests on it.

One caveat about what "measured" covers here: `corpora/mixed` is synthetic throughout,
its `rome` and `north` families included, so the KLM-GOMS figures and the mixed-corpus
benchmark describe generated graphs. See INVENTORY.md finding 10.

**derived from primary records.** The SUS file is a faithful item-level transcription of
the twelve signed paper questionnaires, with every identifier removed. The ten Likert
answers per participant are the primary data; `reproduce.py` re-scores them with Brooke's
(1996) formula and obtains the twelve scores of Table 6 and the 76.9 mean. Because the
scores follow from the item responses rather than being copied, an error in transcription
would in general show up as a disagreement with the published table. The signed
originals, which carry names and employers, stay with the corresponding author.

**transcribed.** The file is a digitisation of a results table. The underlying
collection instruments — the per-participant timing forms of `protocols/INSTRUMENTOS.md`
§1, with condition order, manual tool and number of corrections, and the judges' signed
rubric sheets — were not located in the project's records. For these three files:

- The numbers are the study's reported numbers; they are not an independent record of
  the measurement sessions.
- Agreement with the manuscript is therefore expected by construction for anything that
  is a direct copy, and informative only for quantities the paper derives from them. The
  reproduced t, CI, Shapiro-Wilk, Cohen's d, Kendall's W and both ICCs are of the second
  kind: they are recomputed from the per-unit values, so they confirm that the published
  inferential statistics follow from the published per-unit data. They do not
  corroborate the per-unit data itself.
- If a reviewer asks for primary records, the honest answer is the signed certification
  form (`protocols/ACTA_CERTIFICACION_PRUEBAS.md` is the blank template) held by the
  corresponding author, not these CSV files.

## Still missing

The twenty-task protocol results (92 % success rate, about two errors per task, errors
concentrated in tasks 16 and 18, Section 5.4) have no file here and no record was found;
the task list itself is not in `protocols/INSTRUMENTOS.md` either. That claim cannot be
checked from this package.
