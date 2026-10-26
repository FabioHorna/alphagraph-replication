#!/usr/bin/env python3
"""Check the corpora against the result files and against what the paper claims.

`reproduce.py` shows that the statistics follow from the result files. This script
checks the step before that: that the graphs are well formed, that they are the exact
graphs the authors used (by SHA-256, down to the edge list), that every result row
refers to one of them, and that the corpus properties stated in Section 4.2 hold.

    python scripts/fetch_corpora.py     # once, to rebuild the public corpus
    python scripts/analysis/verify_corpora.py

The public corpus is not redistributed (see corpora/ATTRIBUTION.md), so its checks
cannot run until `fetch_corpora.py` has rebuilt it. That counts as a failure, so that
exit code 0 always means the whole verification ran and passed; pass --allow-partial to
accept a run without those checks. Exits non-zero if any check fails.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CORPORA = ROOT / "corpora"
DATA = ROOT / "data"

failures: list[str] = []
skipped: list[str] = []


def check(ok: bool, label: str, detail: str = "") -> bool:
    print(f"  [{'OK  ' if ok else 'FAIL'}] {label}" + (f" - {detail}" if detail else ""))
    if not ok:
        failures.append(label)
    return ok


def header(title: str) -> None:
    print()
    print(title)
    print("-" * len(title))


def load_graphs(folder: Path) -> dict[str, dict]:
    return {
        path.stem: json.loads(path.read_text("utf8"))
        for path in sorted(folder.glob("*.json"))
        if path.name != "index.json"
    }


def is_acyclic(graph: dict) -> bool:
    """Kahn's algorithm on the directed edges as stored."""
    indegree = {node["id"]: 0 for node in graph["nodes"]}
    outgoing = defaultdict(list)
    for edge in graph["edges"]:
        outgoing[edge["source"]].append(edge["target"])
        indegree[edge["target"]] += 1

    queue = [node for node, deg in indegree.items() if deg == 0]
    seen = 0
    while queue:
        node = queue.pop()
        seen += 1
        for nxt in outgoing[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return seen == len(indegree)


def checksums_match(name: str, folder: Path, graphs: dict[str, dict]) -> None:
    """Every graph file must hash to what the authors recorded.

    This is the check that makes the corpus identifiable rather than merely
    plausible: two graphs with the same node and edge counts are not the same
    graph, but two files with the same SHA-256 are the same bytes, which pins the
    node ids and the ordered edge list exactly.
    """
    manifest = folder.with_suffix(".sha256")
    if not manifest.exists():
        check(False, f"{name}: checksum manifest present", str(manifest))
        return

    expected = {}
    for line in manifest.read_text("utf8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            digest, filename = line.split(None, 1)
            expected[filename.strip()] = digest

    differing, missing = [], []
    for filename, digest in sorted(expected.items()):
        path = folder / filename
        if not path.exists():
            missing.append(filename)
        elif hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            differing.append(filename)

    check(len(expected) == len(graphs) and not differing and not missing,
          f"{name}: all {len(expected)} graph files match the recorded SHA-256",
          f"{len(differing)} differing, {len(missing)} missing")


def structural_checks(name: str, folder: Path) -> dict[str, dict]:
    header(f"{name}: structure and identity")
    graphs = load_graphs(folder)
    check(len(graphs) == 100, f"{name}: 100 graph files", f"found {len(graphs)}")
    checksums_match(name, folder, graphs)

    malformed, loops, duplicate_edges = [], [], []
    for key, graph in graphs.items():
        ids = [node["id"] for node in graph["nodes"]]
        edges = [(edge["source"], edge["target"]) for edge in graph["edges"]]
        if len(set(ids)) != len(ids) or any(
            src not in set(ids) or dst not in set(ids) for src, dst in edges
        ):
            malformed.append(key)
        if any(src == dst for src, dst in edges):
            loops.append(key)
        if len(set(edges)) != len(edges):
            duplicate_edges.append(key)

    check(not malformed, f"{name}: node ids unique and every edge endpoint exists",
          ", ".join(malformed[:5]))
    check(not loops, f"{name}: no self-loops", ", ".join(loops[:5]))
    check(not duplicate_edges, f"{name}: no duplicate edges", ", ".join(duplicate_edges[:5]))

    index = json.loads((folder / "index.json").read_text("utf8"))
    entries = index["graphs"] if isinstance(index, dict) else index
    mismatched = [
        entry["name"] for entry in entries
        if len(graphs[entry["name"]]["nodes"]) != entry["nodes"]
        or len(graphs[entry["name"]]["edges"]) != entry["edges"]
    ]
    check(len(entries) == len(graphs) and not mismatched,
          f"{name}: index.json node and edge counts match the graph files",
          ", ".join(mismatched[:5]))
    return graphs


def results_match_corpus(results: Path, graphs: dict[str, dict], label: str) -> None:
    header(f"{label}: results were computed on these graphs")
    with results.open(encoding="utf8") as fh:
        rows = list(csv.DictReader(fh))

    missing = sorted({row["graph"] for row in rows} - graphs.keys())
    check(not missing, f"{label}: every graph in the CSV is shipped here",
          ", ".join(missing[:5]))

    mismatched = [
        row["graph"] for row in rows
        if row["graph"] in graphs
        and (int(row["nodes"]) != len(graphs[row["graph"]]["nodes"])
             or int(row["edges"]) != len(graphs[row["graph"]]["edges"]))
    ]
    check(not mismatched, f"{label}: node and edge counts in the CSV match the graph files",
          f"{len(mismatched)} rows, e.g. {sorted(set(mismatched))[:5]}")


def paper_claims(public: dict[str, dict], mixed: dict[str, dict]) -> None:
    header("Section 4.2: corpus properties stated in the paper")

    if not public:
        print("  public corpus absent - run scripts/fetch_corpora.py for its checks")
        paper_claims_mixed(mixed, public)
        return

    kinds = Counter(graph["type"] for graph in public.values())
    check(kinds == {"rome": 50, "north": 50},
          "public corpus: 50 Rome-Lib + 50 North", str(dict(kinds)))

    sizes = sorted(len(graph["nodes"]) for graph in public.values())
    check(10 <= sizes[0] and sizes[-1] <= 100,
          "public corpus: graphs of 10 to 100 nodes", f"{sizes[0]}-{sizes[-1]} nodes")

    buckets = [(10, 25), (26, 40), (41, 55), (56, 70), (71, 100)]

    def per_stratum(kind: str) -> list[int]:
        counts = Counter()
        for graph in public.values():
            if graph["type"] != kind:
                continue
            size = len(graph["nodes"])
            for low, high in buckets:
                if low <= size <= high:
                    counts[(low, high)] += 1
        return [counts[b] for b in buckets]

    rome_strata = per_stratum("rome")
    check(rome_strata == [10] * 5, "Rome sample: size-stratified, 10 graphs per stratum",
          f"{rome_strata} over strata {buckets}")

    # Known deviation, documented in INVENTORY.md finding 8: the sampler reads the
    # last numeric token of the file name. Rome files are grafo<id>.<nodes>.graphml,
    # so that is the node count; North files are g.<nodes>.<serial>.graphml, so it is
    # an arbitrary serial number. The North sample is therefore not stratified by any
    # property of the graph, and its node sizes follow the collection's own skew
    # towards small graphs. The comparison itself is unaffected, since every engine
    # laid out the same graphs, but the sample is not node-size-stratified as
    # Section 4.2 says.
    north_strata = per_stratum("north")
    north_sizes = sorted(len(graph["nodes"]) for graph in public.values()
                         if graph["type"] == "north")
    check(sum(north_strata) == 50,
          "North sample: 50 graphs, strata reported not asserted",
          f"{north_strata} over strata {buckets}; "
          f"{north_sizes[0]}-{north_sizes[-1]} nodes, median {north_sizes[25]}")
    print("    (expected: the North sampler reads the file's serial number, not its "
          "size - INVENTORY.md finding 8)")

    sources = [graph.get("source") for graph in public.values()]
    check(all(sources) and len(set(sources)) == 100,
          "public corpus: every graph records a distinct source GraphML file")

    acyclic = [key for key, graph in public.items()
               if graph["type"] == "north" and is_acyclic(graph)]
    check(len(acyclic) == 50,
          "North sample: all 50 graphs are acyclic, as the paper's wording requires",
          f"{len(acyclic)}/50 acyclic")

    paper_claims_mixed(mixed, public)


def paper_claims_mixed(mixed: dict[str, dict], public: dict[str, dict]) -> None:
    # The mixed corpus is synthetic throughout. Its "rome" and "north" families are
    # generated imitations calibrated to the published statistics of those
    # collections, not graphs taken from them: generate-graphs.mjs produces all five
    # families, and none of these files carries a `source`. INVENTORY.md finding 10.
    kinds = Counter(graph["type"] for graph in mixed.values())
    check(kinds == {"layered": 20, "tree": 20, "cyclic": 20, "rome": 20, "north": 20},
          "mixed corpus: 100 synthetic graphs in five families", str(dict(kinds)))
    check(not any(graph.get("source") for graph in mixed.values()),
          "mixed corpus: no graph claims a source file, as none comes from a corpus")

    # Section 4.2 gives "6 to 59 nodes" for 60 synthetic graphs in three families.
    # The three architecture families span 6-30 nodes; 6-59 is the range of all 100
    # synthetic graphs, the two corpus-imitating families included. Findings 9 and 10.
    three = [len(graph["nodes"]) for graph in mixed.values()
             if graph["type"] in ("layered", "tree", "cyclic")]
    everything = [len(graph["nodes"]) for graph in mixed.values()]
    check((min(three), max(three)) == (6, 30),
          "the three architecture families: 6 to 30 nodes", f"{min(three)}-{max(three)}")
    check((min(everything), max(everything)) == (6, 59),
          "all 100 synthetic graphs: 6 to 59 nodes, the range Section 4.2 reports",
          f"{min(everything)}-{max(everything)} nodes")

    def topology(graph):
        return (len(graph["nodes"]),
                tuple(sorted((e["source"], e["target"]) for e in graph["edges"])))

    if public:
        shapes = {topology(graph) for graph in public.values()}
        shared = [key for key, graph in mixed.items() if topology(graph) in shapes]
        check(not shared,
              "the two corpora share no graph, compared by full edge set",
              f"{len(shared)} shared: {shared[:5]}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--allow-partial", action="store_true",
        help="succeed even though the public corpus is absent and its checks cannot run. "
             "Without this flag a missing public corpus is a failure, so that an exit "
             "code of 0 always means the whole verification ran.")
    args = parser.parse_args()

    print("AlphaGraph - corpus and result-file verification")

    public_folder = CORPORA / "public-standard"
    has_public = any(p.name != "index.json" for p in public_folder.glob("*.json"))
    if has_public:
        public = structural_checks("public corpus", public_folder)
    else:
        public = {}
        header("public corpus: not present")
        print("  The 100 derived public graphs are not redistributed with this package")
        print("  (corpora/ATTRIBUTION.md). Run:")
        print("      python scripts/fetch_corpora.py")
        print("  to rebuild them from the original archives and verify their checksums.")
        skipped.append("public corpus checks: SHA-256 identity, structure, provenance "
                       "against index.json, the Section 4.2 sampling claims, and whether "
                       "data/rq2-crossings/ was computed on these graphs")

    mixed = structural_checks("mixed corpus", CORPORA / "mixed")

    if public:
        results_match_corpus(DATA / "rq2-crossings" / "results-standard.csv", public,
                             "RQ2 crossings")
    results_match_corpus(DATA / "rq2-mixed-corpus" / "results.csv", mixed,
                         "mixed-corpus benchmark")
    results_match_corpus(DATA / "rq1-klm-goms" / "time-klm.csv", mixed, "KLM-GOMS")

    paper_claims(public, mixed)

    print()
    if failures:
        print(f"{len(failures)} check(s) FAILED:")
        for item in failures:
            print(f"  - {item}")
        if skipped:
            print(f"...and {len(skipped)} group(s) of checks never ran.")
        return 1

    if skipped:
        print("PARTIAL VERIFICATION - not every check ran.")
        for item in skipped:
            print(f"  skipped: {item}")
        print()
        print("  Everything that did run passed, but this is not a verified package:")
        print("  run `python scripts/fetch_corpora.py` and then this script again.")
        if args.allow_partial:
            print("  --allow-partial given, so exiting 0 anyway.")
            return 0
        return 1

    print("All checks passed, with no part of the verification skipped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
