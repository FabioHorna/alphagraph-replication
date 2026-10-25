#!/usr/bin/env python3
"""Fetch the public graph corpora and rebuild the sample used in this study.

The Rome-Lib and North collections carry no licence or terms of use (see
corpora/ATTRIBUTION.md), so this package does not redistribute them, not even in
derived form. It ships the sampling script, the manifest of which file was
selected, and the checksum of every graph the authors used. This script downloads
the archives from their original source, rebuilds the 100-graph sample, and checks
it against those checksums, so the corpus you run on is provably the corpus behind
Tables 4 and 5.

    python scripts/fetch_corpora.py

Needs Python 3.9+ (standard library only) and Node.js on PATH. About 5 MB of
download and 70 MB extracted; the extracted archives are deleted afterwards unless
--keep is given.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, "corpora", "public-standard")
MANIFEST = os.path.join(ROOT, "corpora", "public-standard.sha256")

# Canonical URLs as cited in the manuscript. They redirect to the collection's
# current host, graphdrawing.unipg.it, which is why redirects are followed.
ARCHIVES = {
    "rome": (
        "http://www.graphdrawing.org/data/rome-graphml.tgz",
        "94f0b300a347d4856b37e4650b6cdf6d2999d22159f5cc0d7aa9bedc42b16d89",
        4692225,
    ),
    "north": (
        "http://www.graphdrawing.org/data/north-graphml.tgz",
        "90d37399676041b07c68006f6a7e1a94c56fab17adea24a732c176a39b9df2a5",
        284630,
    ),
}


def sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(url: str, dest: str) -> None:
    print(f"  downloading {url}")
    # The archives are served over plain HTTP and redirect to HTTPS; urllib
    # follows that. The checksum below is what actually authenticates the file.
    with urllib.request.urlopen(url, timeout=180) as response, open(dest, "wb") as out:
        shutil.copyfileobj(response, out)


def fetch_and_extract(work: str) -> str:
    src = os.path.join(work, "src")
    os.makedirs(src, exist_ok=True)
    for name, (url, expected, size) in ARCHIVES.items():
        archive = os.path.join(work, f"{name}-graphml.tgz")
        download(url, archive)
        actual = sha256_file(archive)
        on_disk = os.path.getsize(archive)
        if actual != expected:
            print(f"  WARNING: {name}-graphml.tgz checksum differs from the one recorded")
            print(f"    expected {expected} ({size} bytes)")
            print(f"    got      {actual} ({on_disk} bytes)")
            print("    The upstream archive has changed since this study was run.")
            print("    The per-graph checks below will tell you whether the sample is affected.")
        else:
            print(f"  {name}-graphml.tgz: checksum matches ({on_disk} bytes)")
        with tarfile.open(archive) as tf:
            tf.extractall(src, filter="data")
    return src


def rebuild(src: str) -> None:
    script = os.path.join(ROOT, "scripts", "bench", "convert-standard.mjs")
    env = dict(os.environ, STD_SRC=src)
    print("  rebuilding the sample with scripts/bench/convert-standard.mjs")
    subprocess.run(["node", script], env=env, check=True)


def verify() -> bool:
    if not os.path.exists(MANIFEST):
        print(f"  no manifest at {MANIFEST}, nothing to verify against")
        return False

    expected = {}
    with open(MANIFEST, encoding="utf8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            digest, name = line.split(None, 1)
            expected[name.strip()] = digest

    missing, differing = [], []
    for name, digest in sorted(expected.items()):
        path = os.path.join(CORPUS, name)
        if not os.path.exists(path):
            missing.append(name)
        elif sha256_file(path) != digest:
            differing.append(name)

    print(f"\n  {len(expected) - len(missing) - len(differing)}/{len(expected)} graphs "
          "match the checksums recorded by the authors")
    if missing:
        print(f"  missing: {len(missing)} - {missing[:5]}")
    if differing:
        print(f"  DIFFERENT: {len(differing)} - {differing[:5]}")
        print("  The rebuilt sample is not the one used in the study. Do not compare")
        print("  benchmark numbers against data/rq2-crossings/ until this is resolved.")
    return not missing and not differing


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--keep", action="store_true",
                        help="keep the extracted GraphML archives for inspection")
    args = parser.parse_args()

    print("Fetching the public graph corpora from their original source")
    work = os.path.join(ROOT, "out", "upstream") if args.keep else tempfile.mkdtemp()
    os.makedirs(work, exist_ok=True)
    try:
        src = fetch_and_extract(work)
        counts = {d: len([f for f in os.listdir(os.path.join(src, d)) if f.endswith(".graphml")])
                  for d in sorted(os.listdir(src))}
        print(f"  extracted: {counts}")
        rebuild(src)
    finally:
        if not args.keep:
            shutil.rmtree(work, ignore_errors=True)
        else:
            print(f"  archives kept in {work}")

    ok = verify()
    index = os.path.join(CORPUS, "index.json")
    if os.path.exists(index):
        with open(index, encoding="utf8") as fh:
            graphs = json.load(fh)["graphs"]
        print(f"  index.json describes {len(graphs)} graphs")
    print()
    print("Corpus ready." if ok else "Corpus rebuilt WITH DIFFERENCES - see above.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
