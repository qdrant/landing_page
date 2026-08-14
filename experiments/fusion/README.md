# Hybrid Fusion Experiment

The harness behind the Tuning Retrieval in Qdrant series. Every claim in those articles traces to a file here through [`grounding.md`](grounding.md).

`run.py` owns the measurement layer: corpora, indexes, the 45-arm fusion replay, and the two parity gates. `study.py` answers one series question per task on top of it.

## Run it

```bash
docker run -d --name fusion-qdrant -p 6360:6333 -p 6361:6334 qdrant/qdrant:v1.19.0
./download.sh                      # five corpora into data/raw/, about 1.3 GB
python test_replay.py              # Gate A: the seven Rust fixtures, exact equality
python run.py t1                   # corpora, avg_len, manifest.json
python run.py t3                   # build indexes, cache dense and sparse top-200
python run.py t4                   # Gate B: live parity against the server
python run.py t5                   # replay 45 arms
python run.py t6                   # candidate-breadth sweep, SciFact
python run.py t7                   # four more SciFact builds, then the floor
python run.py t8 && python run.py exhibit
python figure.py && python build_notebook.py
```

Full run is about 25 minutes on a laptop, most of it embedding 207,000 documents.

Then the series tasks, which read what the above produced:

```bash
python study.py e1                 # held-out split, 200 random splits per corpus
python study.py e2                 # how wide an interval each labeled-set size buys
python study.py e5                 # what a second prefetch adds, and what fusion keeps
python study.py e3                 # depth and hnsw_ef against ceiling and score, five corpora
python study.py e3_latency         # one fused request per query, randomized across settings
python study.py e4_score           # cross-encoder scores, three models. The slow one, hours
python study.py e4                 # reranking quality, selected and reported on different halves
python study.py e6                 # rebuild quantized, re-run the sweep, compare the verdicts
python verify_articles.py          # every figure in the five articles against its artifact
```

`e1`, `e2` and `e5` are pure replay and take seconds. `e3` and `e6` need the container. `e4_score` caches to `study/rerank/` per corpus and model, so it resumes rather than restarting.

## What is here

| Path | Contents |
| --- | --- |
| `harness/replay.py` | RRF and DBSF reproduced from the Rust, in float32 |
| `harness/corpora.py` | The five loaders, subsampling at seed 42, `avg_len` measurement |
| `harness/qio.py` | Index building and retrieval |
| `harness/metrics.py` | nDCG@10, Recall@100, MRR@10, bootstrap intervals |
| `run.py` | Tasks T1 to T8, one function each |
| `study.py` | Tasks E1 to E6, one series question each |
| `verify_articles.py` | Checks all 190 published figures two ways: against the artifact, and that the article file contains the value |
| `test_replay.py` | Gate A |
| `figure.py`, `build_notebook.py` | The article figure and the companion notebook |
| `grounding.md` | Every claim, with the artifact or source line behind it |
| `engineering-question.md` | Weighted score fusion has no API; drafted for the engine team |
| `manifest.json`, `results/`, `fused/`, `diag/`, `floor/`, `breadth/`, `parity/`, `exhibit.json` | `run.py` outputs |
| `study/` | `study.py` outputs, one JSON per task, plus cached reranker scores |

`data/` and `cache/` are gitignored. `cache/` regenerates from `download.sh` plus T1 and T3.

## Two setup traps

Both would have produced quiet, wrong numbers.

`full_scan_threshold` is in KiloBytes and the server rejects anything below 10 (`config_diff.rs:57`). Separately, an HNSW graph is only built for a segment larger than `optimizers_config.indexing_threshold`, which defaults to 10,000 KB (`lib/shard/src/optimizers/config.rs:17`, v1.19.0). That is about 6,700 vectors at 384 dimensions, and it is measured per segment rather than per collection, so SciFact sits under it outright and a larger corpus can sit under it on every segment. Without setting it, dense search would have been a full scan and the `hnsw_ef` sweep would have measured nothing.

T3 gates on `indexed_vectors_count` against `points_count`, which is the direct read of whether a graph exists. It also runs the same query at `hnsw_ef` 64 and 512 and records whether they agree, but that comparison never gates: recall saturates, so SciFact returns byte-identical lists at both settings on a graph that is demonstrably HNSW.

## Two implementations, same numbers

The notebook computes nDCG@10 and the fusion arithmetic independently of the harness, which uses `pytrec_eval`. On SciFact both give 0.7175 for the default arm, 0.7323 for DBSF, 0.7067 for `k=61`, 0.9820 for the candidate ceiling, and 0.0313 for the median bootstrap interval.
