#!/usr/bin/env bash
# Phase 1, unattended: wait out the embedding pass, ingest once, then measure
# steady state at both candidate limits. Runs no E7a or E7b cell.
#
# Every wait has a deadline and every step has a preflight, because the failure
# that costs the most here is a script still sleeping in the morning.
set -uo pipefail
cd "$(dirname "$0")"
PY=../../.venv/bin/python
STALL_MINUTES=20
log() { echo "[$(date +%H:%M:%S)] $*"; }
die() { log "FAILED: $*"; exit 1; }

log "preflight"
for f in cache/dbpedia-full_corpus.parquet cache/dbpedia-full_qdense.npy \
         cache/dbpedia-full_qrels.parquet e7/corpus.json e7/cells.json; do
  [ -s "$f" ] || die "missing $f"
done
docker info >/dev/null 2>&1 || die "docker is not running"

log "waiting for the embedding pass"
last=-1
stalled=0
while :; do
  rows=$($PY -c 'import json;print(json.load(open("cache/dbpedia-full_dense.progress.json"))["rows"])' 2>/dev/null) || rows=-1
  total=$($PY -c 'import json;print(json.load(open("e7/corpus.json"))["docs"])')
  [ "$rows" -ge "$total" ] 2>/dev/null && break
  if [ "$rows" = "$last" ]; then
    stalled=$((stalled + 1))
    [ "$stalled" -ge "$STALL_MINUTES" ] && die "embedding stalled at $rows for ${STALL_MINUTES}m"
  else
    stalled=0
  fi
  last=$rows
  sleep 60
done
log "embedding done at $rows rows"

log "verifying vectors against a fresh embed"
$PY - <<'EOF' || die "vector verification"
import numpy as np, pyarrow.parquet as pq
from fastembed import TextEmbedding

f = pq.ParquetFile("cache/dbpedia-full_corpus.parquet")
v = np.load("cache/dbpedia-full_dense.npy", mmap_mode="r")
assert v.shape == (f.metadata.num_rows, 384) and v.dtype == np.float32, v.shape
m = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
# Sampled across the file, not only the tail: a stale middle would otherwise
# pass every check and reach the collection attached to the wrong doc_ids.
start = 0
for group in range(f.num_row_groups):
    rows = f.metadata.row_group(group).num_rows
    texts = f.read_row_group(group, columns=["text"]).column("text").to_pylist()[:4]
    ref = np.asarray(list(m.embed(texts, batch_size=4)), np.float32)
    diff = float(np.abs(ref - v[start : start + 4]).max())
    assert diff == 0.0, f"row group {group} at row {start} differs by {diff}"
    start += rows

# Sampling four rows per group would miss a hole between the samples, and an
# unwritten row in a memmap is exactly zero, so every row's norm is checked.
worst = 1.0
for i in range(0, len(v), 200_000):
    norms = np.linalg.norm(np.asarray(v[i : i + 200_000]), axis=1)
    worst = min(worst, float(norms.min()))
    assert norms.min() > 0.99, f"unwritten or unnormalised vector near row {i}"
print(f"verified 4 rows in each of {f.num_row_groups} row groups, min norm {worst:.6f}")
EOF

# 10 GiB is the candidate "fits" limit; the collection is built once, here.
log "starting the container at 10g and ingesting"
$PY e7.py up 10g            || die "container at 10g"
$PY e7.py ingest            || die "ingest"
$PY e7.py mem loaded-10g    || die "mem loaded-10g"
$PY e7.py warm              || die "warm at 10g"
$PY e7.py mem steady-10g    || die "mem steady-10g"

# The same storage, reopened under the candidate "does not fit" limit. `up`
# stops the container gracefully first, so this is not a crash recovery.
log "reopening at 4g"
$PY e7.py up 4g             || die "container at 4g"
$PY e7.py mem loaded-4g     || die "mem loaded-4g"
$PY e7.py warm              || die "warm at 4g"
$PY e7.py mem steady-4g     || die "mem steady-4g"

log "phase 1 done"
