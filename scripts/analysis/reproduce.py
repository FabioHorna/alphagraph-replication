#!/usr/bin/env python3
"""Reproduce the statistics reported in the AlphaGraph manuscript.

Reads only the CSV/JSON files shipped in ../../data and prints, next to every
figure, the value printed in the manuscript, so that a reader can check them
side by side.

    python -m pip install -r ../../requirements.txt
    python reproduce.py

Each section states which table or paragraph of the paper it reproduces.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

DATA = Path(__file__).resolve().parents[2] / "data"

# Figures as printed in the manuscript, for side-by-side checking.
PAPER = {
    "rq1_mean_reduction": 28.8,
    "rq1_ci": (25.9, 31.7),
    "rq1_shapiro_w": 0.951,
    "rq1_shapiro_p": 0.658,
    "rq1_t": 11.8,
    "rq1_d": 3.4,
    "rq1_above_threshold": 9,
    "klm_full": 41.2,
    "klm_floor": 35.6,
    "rq2_alphagraph_mean": 54.95,
    "rq2_vs_dagre_pct": 13.7,
    "rq2_vs_drawio_pct": 22.0,
    "asis_tobe_mean": 84.19,
    "sus_mean": 76.9,
    "judges_mean": 3.93,
    "judges_w": 0.92,
    "judges_chi2": 11.04,
    "judges_icc3": 0.93,
    "judges_icc1": 0.81,
}


def header(title: str, provenance: str = "") -> None:
    print()
    print(title)
    print("-" * len(title))
    if provenance:
        print(f"  provenance: {provenance}  (see data/PROVENANCE.md)")


checks: list[str] = []
mismatches: list[str] = []
warnings: list[str] = []


def cmp(label: str, got: float, expected: float, unit: str = "", tol: float = 0.05) -> None:
    checks.append(label)
    ok = abs(got - expected) <= tol
    if not ok:
        mismatches.append(f"{label}: recomputed {got:.4f}{unit}, paper {expected:.4f}{unit}")
    print(f"  {label:<34} {got:>9.3f}{unit}   paper: {expected:>7.3f}{unit}   "
          f"[{'OK' if ok else 'MISMATCH'}]")


def warn(message: str) -> None:
    warnings.append(message)
    print(f"  WARNING: {message}")


def rq1_field_timing() -> None:
    """Section 5.1 and Table 3: layout time per participant (n = 12)."""
    header("RQ1 - field study, layout time (Table 3)",
           "TRANSCRIBED from Table 3; the per-participant timing forms were not found")
    df = pd.read_csv(DATA / "rq1-field-timing" / "timing-per-participant.csv")
    print(f"  participants: {len(df)}")

    # Reduction recomputed from the raw times, not taken from the file's column.
    reduction = (df["t_manual_s"] - df["t_app_s"]) / df["t_manual_s"] * 100
    if np.abs(df["reduction_pct"] - reduction).max() > 0.1:
        warn("reduction_pct column disagrees with the recomputed value")

    n = len(reduction)
    sem = stats.sem(reduction, ddof=1)
    ci = stats.t.interval(0.95, n - 1, loc=reduction.mean(), scale=sem)

    cmp("mean reduction", reduction.mean(), PAPER["rq1_mean_reduction"], " %")
    cmp("95% CI lower", ci[0], PAPER["rq1_ci"][0], " %", tol=0.1)
    cmp("95% CI upper", ci[1], PAPER["rq1_ci"][1], " %", tol=0.1)

    # Paired test on the raw times (manual vs. AlphaGraph), as pre-registered.
    diff = df["t_manual_s"] - df["t_app_s"]
    sw = stats.shapiro(diff)
    cmp("Shapiro-Wilk W (time diffs)", sw.statistic, PAPER["rq1_shapiro_w"], "", tol=0.02)
    cmp("Shapiro-Wilk p (time diffs)", sw.pvalue, PAPER["rq1_shapiro_p"], "", tol=0.05)

    tt = stats.ttest_rel(df["t_manual_s"], df["t_app_s"])
    cmp("paired t", tt.statistic, PAPER["rq1_t"], "", tol=0.2)
    print(f"  {'paired t p-value':<34} {tt.pvalue:>9.2e}   paper: p < 0.001")

    d = diff.mean() / diff.std(ddof=1)
    cmp("Cohen's d (paired)", d, PAPER["rq1_d"], "", tol=0.1)

    above = int((reduction >= 25).sum())
    cmp("participants with R >= 25%", above, PAPER["rq1_above_threshold"], "", tol=0)
    print(f"  mean T_manual = {df['t_manual_s'].mean():.0f} s, "
          f"mean T_app = {df['t_app_s'].mean():.0f} s   paper: 420 s / 297 s")


def rq1_klm() -> None:
    """Section 5.1: KLM-GOMS estimation over the mixed 100-graph corpus."""
    header("RQ1 - KLM-GOMS estimation (n = 100 mixed corpus)",
           "MEASURED by time-klm.mjs; regenerates byte for byte from corpora/mixed")
    df = pd.read_csv(DATA / "rq1-klm-goms" / "time-klm.csv")
    summary = json.loads((DATA / "rq1-klm-goms" / "time-klm-summary.json").read_text("utf8"))

    print(f"  graphs: {len(df)}  ({', '.join(f'{k}={v}' for k, v in df['type'].value_counts().sort_index().items())})")
    cmp("mean reduction, full flow", df["red_full_pct"].mean(), PAPER["klm_full"], " %", tol=0.1)
    cmp("mean reduction, no templates", df["red_no_template_pct"].mean(), PAPER["klm_floor"], " %", tol=0.1)
    print(f"  graphs >= 25% (full flow):     {int((df['red_full_pct'] >= 25).sum())}/100   paper: 100/100")
    print(f"  graphs >= 25% (no templates):  {int((df['red_no_template_pct'] >= 25).sum())}/100   paper: 100/100")

    per_type = df.groupby("type")["red_full_pct"].mean().round(1)
    print("  per type (full flow):", per_type.to_dict())
    print("  per type in summary.json:", summary["full_flow_perType_mean_pct"])


def rq2_crossings() -> None:
    """Section 5.2, Tables 4 and 5: crossings over the public corpus (n = 100)."""
    header("RQ2 - edge crossings, public corpus (Tables 4 and 5)",
           "MEASURED by run-benchmark.mjs over corpora/public-standard")
    df = pd.read_csv(DATA / "rq2-crossings" / "results-standard.csv")
    graphs = df["graph"].nunique()
    print(f"  graphs: {graphs}   engines: {df['engine'].nunique()}   rows: {len(df)}")

    wide = df.pivot(index="graph", columns="engine", values="crossings")
    means = wide.mean().sort_values()
    print("  mean crossings per engine (lower is better):")
    for engine, value in means.items():
        print(f"    {engine:<12} {value:>8.2f}")

    cmp("AlphaGraph mean crossings", wide["alphagraph"].mean(), PAPER["rq2_alphagraph_mean"], "", tol=0.01)
    for engine, expected in (("dagre", PAPER["rq2_vs_dagre_pct"]), ("drawio", PAPER["rq2_vs_drawio_pct"])):
        pct = (wide[engine].mean() - wide["alphagraph"].mean()) / wide[engine].mean() * 100
        cmp(f"reduction vs {engine}", pct, expected, " %", tol=0.1)

    print("  per corpus (mean crossings):")
    print(df.pivot_table(index="type", columns="engine", values="crossings").round(2).to_string())

    print("  head-to-head, Wilcoxon signed-rank (AlphaGraph vs. engine):")
    for engine in [c for c in wide.columns if c != "alphagraph"]:
        a, b = wide["alphagraph"], wide[engine]
        nonzero = (a - b) != 0
        res = stats.wilcoxon(a[nonzero], b[nonzero], zero_method="wilcox")
        better, worse = int((a < b).sum()), int((a > b).sum())
        print(f"    {engine:<12} pairs={int(nonzero.sum()):>3}  better={better:>3}  "
              f"tie={graphs - better - worse:>3}  worse={worse:>3}  "
              f"mean diff={(b - a).mean():>7.2f}  p={res.pvalue:.2e}")


def rq3_sus() -> None:
    """Section 5.3 and Table 6: SUS score per participant (n = 12)."""
    header("RQ3 - System Usability Scale (Table 6)",
           "DERIVED from the signed questionnaires, item by item, anonymised")
    df = pd.read_csv(DATA / "rq3-sus" / "sus-responses.csv")
    items = [f"q{i}" for i in range(1, 11)]

    # Brooke (1996): odd items score x-1, even items 5-x, sum x 2.5.
    odd = df[[f"q{i}" for i in (1, 3, 5, 7, 9)]].sub(1).sum(axis=1)
    even = df[[f"q{i}" for i in (2, 4, 6, 8, 10)]].rsub(5).sum(axis=1)
    score = (odd + even) * 2.5

    if (df[items].min().min() < 1) or (df[items].max().max() > 5):
        warn("item responses outside the 1-5 Likert range")
    if np.abs(score - df["sus_score"]).max() > 0.01:
        warn("sus_score column disagrees with the recomputed score")

    print(f"  participants: {len(df)}")
    cmp("mean SUS", score.mean(), PAPER["sus_mean"], "", tol=0.05)
    print(f"  median {score.median():.1f}   min {score.min():.1f}   max {score.max():.1f}   "
          f"sd {score.std(ddof=1):.2f}")
    print(f"  participants >= 68 (Bangor et al. 2009 'good'): {int((score >= 68).sum())}/{len(df)}")
    print("  per participant:", dict(zip(df["participant"], score.round(1))))


def icc2(ratings: np.ndarray) -> tuple[float, float]:
    """ICC(2,1) and ICC(2,k): two-way random effects, absolute agreement.

    Shrout and Fleiss (1979). Rows are subjects (the rubric criteria), columns
    are raters (the judges).
    """
    n, k = ratings.shape
    grand = ratings.mean()
    ss_total = ((ratings - grand) ** 2).sum()
    ss_rows = k * ((ratings.mean(axis=1) - grand) ** 2).sum()
    ss_cols = n * ((ratings.mean(axis=0) - grand) ** 2).sum()
    ms_rows = ss_rows / (n - 1)
    ms_cols = ss_cols / (k - 1)
    ms_err = (ss_total - ss_rows - ss_cols) / ((n - 1) * (k - 1))

    single = (ms_rows - ms_err) / (ms_rows + (k - 1) * ms_err + k * (ms_cols - ms_err) / n)
    average = (ms_rows - ms_err) / (ms_rows + (ms_cols - ms_err) / n)
    return single, average


def kendall_w(ratings: np.ndarray) -> tuple[float, float]:
    """Kendall's W without and with correction for tied ranks.

    Rows are the objects being ranked (the rubric criteria), columns the raters.
    Each rater ranks the criteria; ties take the average rank.
    """
    n, m = ratings.shape
    ranks = np.apply_along_axis(stats.rankdata, 0, ratings)       # per rater
    rank_sums = ranks.sum(axis=1)
    s = ((rank_sums - rank_sums.mean()) ** 2).sum()

    plain = 12 * s / (m ** 2 * (n ** 3 - n))

    # Tie correction: T = sum(t^3 - t) over each rater's groups of tied ranks.
    tie_term = 0.0
    for rater in range(m):
        _, counts = np.unique(ranks[:, rater], return_counts=True)
        tie_term += float((counts ** 3 - counts).sum())
    corrected = 12 * s / (m ** 2 * (n ** 3 - n) - m * tie_term)
    return plain, corrected


def rq3_expert_ratings() -> None:
    """Section 5.2: rubric ratings by the panel of three expert judges."""
    header("RQ3 - expert judges, visual-quality rubric (Purchase criteria, 1-5)",
           "TRANSCRIBED from the OE3 validation report; rubric sheets were not found")
    df = pd.read_csv(DATA / "rq3-expert-ratings" / "expert-ratings.csv")
    judges = ["J1", "J2", "J3"]
    ratings = df[judges].to_numpy(dtype=float)
    n_criteria, n_judges = ratings.shape

    print(df.assign(mean=df[judges].mean(axis=1).round(2)).to_string(index=False))
    print("  per judge mean:", dict(zip(judges, df[judges].mean().round(2))))
    cmp("overall mean", ratings.mean(), PAPER["judges_mean"], " /5", tol=0.01)

    plain, corrected = kendall_w(ratings)
    cmp("Kendall's W, tie-corrected", corrected, PAPER["judges_w"], "", tol=0.005)
    print(f"  {'Kendall W, no tie correction':<34} {plain:>9.3f}"
          f"   (the value judges-stats.mjs prints; see INVENTORY.md)")
    cmp("chi2 = m(n-1)W, tie-corrected", n_judges * (n_criteria - 1) * corrected,
        PAPER["judges_chi2"], "", tol=0.01)
    print(f"  {'Friedman p-value (scipy)':<34} "
          f"{stats.friedmanchisquare(*ratings).pvalue:>9.4f}   paper: p ~ 0.026")

    single, average = icc2(ratings)
    cmp("ICC(2,1), single judge", single, PAPER["judges_icc1"], "", tol=0.005)
    cmp("ICC(2,3), panel", average, PAPER["judges_icc3"], "", tol=0.005)


def rq2_asis_tobe() -> None:
    """Section 5.2: per-diagram AS-IS/TO-BE validation."""
    header("RQ2 - AS-IS/TO-BE per diagram",
           "TRANSCRIBED from the OE3 validation report")
    df = pd.read_csv(DATA / "rq2-asis-tobe" / "asis-tobe-per-diagram.csv")
    reduction = (df["crossings_asis"] - df["crossings_tobe"]) / df["crossings_asis"] * 100
    for row, value in zip(df.itertuples(), reduction):
        print(f"  {row.diagram} ({row.graph}): {row.crossings_asis} -> {row.crossings_tobe} "
              f"crossings = {value:.2f}% in {row.layout_ms} ms")
    cmp("mean crossing reduction", reduction.mean(), PAPER["asis_tobe_mean"], " %", tol=0.01)
    print(f"  mean layout time: {df['layout_ms'].mean():.0f} ms   paper: 29 ms")


def main() -> int:
    print("AlphaGraph - reproduction of the reported statistics")
    print(f"data directory: {DATA}")
    rq1_field_timing()
    rq1_klm()
    rq2_crossings()
    rq2_asis_tobe()
    rq3_sus()
    rq3_expert_ratings()
    print()
    print("A reproduced figure from a TRANSCRIBED file shows that the published")
    print("inferential statistics follow from the published per-unit values; it is not")
    print("an independent record of the measurement. data/PROVENANCE.md explains why.")
    print()
    print("Not covered by this script: the 92% task-success rate and the mean of two")
    print("errors per task reported in Section 5.4. No per-task record was found, so")
    print("those two figures cannot be recomputed from this package at all.")
    print()

    if mismatches or warnings:
        for item in mismatches:
            print(f"MISMATCH: {item}")
        for item in warnings:
            print(f"WARNING:  {item}")
        print()
        print(f"{len(mismatches)} mismatch(es), {len(warnings)} warning(s).")
        return 1
    print(f"All {len(checks)} checks reproduce the published values.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
