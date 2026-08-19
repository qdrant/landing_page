# Grounding Inventory

One row per claim the article makes, with the artifact or source line behind it. A row with no citation does not ship. Rows whose number never reaches the article are kept, because the article's silence is also a decision.

Run: Qdrant v1.19.0 (`sha256:057ee3a8...`, commit `74f3e85b9`), five corpora, 3,581 labelled queries, candidate depth 200. Full environment in `manifest.json`.

## Mechanism, from the engine source

| Claim | Source |
| --- | --- |
| `position_score` is `1 / ((pos + 1) / weight + k - 1)`, positions zero-based | `lib/segment/src/common/reciprocal_rank_fusion.rs:32-39` |
| Default `k` is 2 | `reciprocal_rank_fusion.rs:14` |
| Qdrant's `k` equals the 2009 paper's `k` plus one, so porting `k=60` means `k=61` | Algebra over the two formulas. Cormack et al. score one-based ranks, and Elasticsearch's own docs state `rank_constant` defaults to 60 and score `1 / (rank + rank_constant)` on one-based ranks: https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion |
| `k` is validated at minimum 1; `weights` has no range validation | `lib/api/src/rest/schema.rs:546`, and `weights` at `:553` carries no range validation |
| Rank 1 outweighs rank 10 by 5.50x at `k=2` and 1.15x at `k=61` | `experiments/fusion/figure.py`, computed from the ported `position_scores` |
| A weight of zero keeps the leg's documents and scores them 0.0 | `reciprocal_rank_fusion.rs:34-36`, `test_rrf_scoring_zero_weight` |
| Weighted RRF is not scale-invariant: `(1,2)` and `(2,4)` can order differently | `test_replay.py` Gate A plus the measured split between `rrf_k5_w1-2` and `rrf_k5_w2-4` in `results/*.parquet` |
| Fusion sorts on score alone and leaves ties in hash order | `reciprocal_rank_fusion.rs:93-96`, doc comment "Does not break ties" |
| DBSF normalizes against mean +/- 3 sample standard deviations, via Welford | `lib/segment/src/common/score_fusion.rs:126-164` |
| DBSF imputes nothing for a document one leg missed | `score_fusion.rs:75-86` |
| A leg with zero standard deviation flattens to 0.5 for every point | `score_fusion.rs:97-102` |
| A query-less prefetch scores every point 1.0 | `lib/collection/src/shards/local_shard/scroll.rs:130` |
| Root-level fusion runs once at collection level, not per shard | `lib/shard/src/query/planned_query.rs`, `RescoreStages::collection_level` |
| Score fusion carries `weights` and a MinMax normalization with no public API | `score_fusion.rs:10-31`; `ScoreFusion::dbsf()` is the only constructor |

## Replay parity

| Claim | Artifact |
| --- | --- |
| The Python replay reproduces the engine's RRF and DBSF arithmetic | `test_replay.py`: seven ported Rust fixtures on exact equality, plus the repo's Welford property test and the degenerate normalization branches. 9/9 |
| Live server fusion and the offline replay agree | `parity/*.json`: four arms on 10 stratified queries per corpus, five corpora, maximum absolute deviation 0.000e+00, no id mismatches |
| DBSF parity needed no tolerance | Same files. The plan budgeted the repo's own 1e-5 / 1e-4 Welford tolerance; float32 Welford in Python matched bit for bit |

## Measured results

| Claim | Artifact |
| --- | --- |
| The best `k` at equal weights differs across all five corpora: 2, 5, 5, 20, 61 | `diag/*.json` `move3_which_way_to_move_k`; the article's table |
| Corpora with about one relevant document per query prefer low `k`; corpora with tens or hundreds prefer high `k` | `manifest.json` `relevant_per_query` against the same `move3` block. Five corpora, so this is a pattern to test, not a rule |
| On SciFact, no arm's 95% interval clears zero | `diag/scifact.json` `move4_when_to_stop`, `arms_clearing: 0` |
| Median 95% interval half-width per corpus: 0.0157, 0.0085, 0.0066, 0.0102, 0.0083 | `diag/*.json` `bootstrap_vs_default`, 1,000 resamples, paired per-query differences against the default arm |
| DBSF beats the RRF default on four of five corpora and clears the interval on three | `diag/*.json` `bootstrap_vs_default["dbsf"]`. ArguAna is the exception at -0.0045, interval [-0.0137, +0.0049] |
| Five rebuilds of the same SciFact index give identical mean nDCG@10 per arm, to six decimals | `floor/scifact.json`, per-arm SD across builds is 0.0 for every arm. Re-measured 2026-08-11 |
| A rebuild moves 0.04% of ranks 1 to 10, 2.2% of ranks 11 to 100 and 11.5% of ranks 101 to 200, with top-10 set agreement 99.99% | Computed from `cache/scifact_dense_b1.parquet` against builds 2 to 5 via `qio.compare_runs`. Re-measured 2026-08-11 |
| BM25 scores are identical across rebuilds; only the order of equal scores moves | Same caches, sparse prefetch, through `floor/scifact.json` `sparse_caches_across_builds`, which now reports positions moved, whether every move sits at an equal score, and the maximum score deviation instead of a bare boolean |
| At depth 200, `hnsw_ef` 512 is identical to 128 and `hnsw_ef` 16 moves every arm by at most 0.0012 | `breadth/scifact.json`: Kendall tau against the depth-200, `hnsw_ef` 128 baseline is 1.000 for 512 and 0.987 for 16 |
| Candidate depth moves the arm ordering: tau 0.645 at depth 20 and 0.823 at depth 50 | `breadth/scifact.json` |
| The winning arm changes with depth, from `rrf_k2_w1-2` at 20 to DBSF at 200 | `breadth/scifact.json` `best_arm` |
| Tie rate in the fused top 10 on SciFact: 12.5% at `k=2`, 2.8% at `k=61`, 0% under DBSF | `diag/scifact.json` `tie_rate_build1` |
| On SciFact, 97.5% of relevant top-10 results were found by both legs, against 79.2% of all top-10 results | `diag/scifact.json` `move2_where_results_come_from` |
| WANDS query "entrance table": `k=2` ranks an irrelevant dense-only product first, `k=61` ranks an Exact product found by both legs first | `exhibit.json` |
| `k=2` and `k=61` disagree on the top result for 202 of 480 WANDS queries | `exhibit.json` `queries_where_they_disagree` |
| Candidate ceilings at depth 200 leave 0.25 to 0.49 of headroom on every corpus | `diag/*.json` `move1_can_fusion_help` |

## E1 to E6, the series tasks

Code in `study.py`, artifacts in `study/`. One JSON per task.

| Claim | Artifact |
| --- | --- |
| A swept winner keeps 67% to 95% of its gain on held-out queries, and clears zero there on 20% to 100% of splits depending on corpus | `study/e1_held_out.json`, 200 random splits per corpus, winner selected on one half and scored on the other |
| The selected arm lands at median held-out rank 1 to 4 of 30, and is worse than the default on 0% to 6% of splits | Same file, `median_held_out_rank` and `hurts_on_held_out_share`. This is why the piece says sweeping finds something real |
| Median interval half-width by labeled set size, across corpora: 0.047 at 25, 0.035 at 50, 0.025 at 100, 0.018 at 200, 0.015 at 300 | `study/e2_labeled_set_size.json` `across_corpora`. Cells where the subsample equals the whole corpus are flagged `is_whole_corpus` and excluded from that median |
| Detecting a 0.015 gain took 200 to 1,000 queries; a 0.04 gain took 25 to 100 | Same file, `queries_needed`. Subsamples come from one query pool, so this is the width a set of that size gives rather than an independent replication |
| Prefetch `limit` 10 to 500 moves the ceiling 0.10 to 0.28 and the default arm 0.002 to 0.010, and the gap widens at every step on all five corpora | `study/e3_breadth.json`, depth swept at `hnsw_ef` 128 |
| Depth is not monotonic on the realized score: CodeSearchNet's best arm peaks at `limit` 100, DBPedia's at 200 | Same file, `best_ndcg_10` per setting |
| Across `hnsw_ef` 16 to 512 at depth 200, the default arm moves at most 0.0022 and union recall at most 0.0040, on all five corpora | Same file, `hnsw_ef_sweep` spans |
| On SciFact, dense recall against exact search is 0.986 at `hnsw_ef` 16 and 1.000 by 256 | Run directly against the live collection over 50 queries, the snippet the article prints. Re-run on an unloaded machine |
| Prefetch `limit` 10 to 500 costs 37% to 43% more median latency, which is 27% to 30% read as a saving from depth 500; `hnsw_ef` 16 to 512 costs 4% to 49% for at most 0.0022 of quality | `study/e3_latency.json`, one fused `query_points` per request, randomized across settings, warmup discarded, 100 queries times 3 repeats. Apple M5 Pro, single shard, no concurrent load |
| A second prefetch costs +0.60 to +1.47 ms over the dense prefetch alone at `limit` 200 | Same file, `dense_only` against `fused` |
| Holding either prefetch fixed, admitting the other's exclusive documents moves nDCG@10 by -0.013 to +0.004 in nine of ten corpus and direction cells, while reordering is worth +0.028 to +0.103 | `study/e5_second_prefetch.json` `directions`. Both directions are reported because the split is a sequential accounting identity, not a symmetric attribution |
| The union's relevant recall at depth 200 and its ceiling both beat the leading prefetch alone on every corpus | Same file, `candidate_set`. This is the falsifier for "the new documents are worthless": they are present and relevant, and fusion does not promote them |
| Admitting them hurts more queries than it helps at rank 10, and the damage shrinks or reverses by rank 100 | Same file, `per_query_admission` and `from_new_candidates` at cutoffs 10, 20 and 100 |
| The result is not an artifact of the default `k`: under `k=61` and DBSF the new candidates still contribute -0.001 to +0.004 | Same file, per-arm entries under each direction |
| Int8 scalar quantization changes none of the fusion conclusions on SciFact or DBPedia: best `k` holds at 2 and 20, DBSF still beats the default, tie rates move under 0.005, fused nDCG@10 moves at most 0.0002 | `study/e6_quantization.json` `verdicts`. Dense top-10 agreement with unquantized is 0.984 without rescoring and 0.997 to 1.000 with it |
| Reranking beats tuned fusion on two corpora of five (+0.135 CodeSearchNet, +0.115 DBPedia, both 100% of held-out splits), stays unconfirmed on two (SciFact 37%, ArguAna 2.5%), and loses on WANDS | `study/e4_reranking.json`, four models. Each split selects both the reranker configuration and fusion arm on one query half, then compares them on the other |
| The three 512-token models lose to tuned fusion on four corpora of five; `jina-reranker-v2` turns CodeSearchNet from -0.032 to +0.135 over the same candidates | Same file, `configurations` filtered by model |
| No configuration that lost at 10 candidates was positive at 200, for any model on any corpus | Same file, `configurations` at counts 10 and 200; `verify_articles.py` re-derives it |
| Cross-encoder throughput on CPU: 64 to 212 docs/sec for MiniLM-L6, 34 to 117 for L12, 16 to 45 for bge-reranker-base; jina-reranker-v2's ONNX export runs under 2 docs/sec on CPU (single-threaded Einsum kernel, measured as 62 minutes without completing 25 SciFact queries) | `study/rerank/throughput.json`. The range is document length across corpora. Apple M5 Pro, one process, 15 threads |
| `jina-reranker-v2` quality scores come from PyTorch on Apple MPS at 32 to 310 docs/sec; torch scores are the sigmoid of the ONNX logits (parity checked on 5 pairs), so rankings are identical and `e4` only sorts within one model's list | `study/rerank/throughput_mps.json`, parquets written by `score_jina_mps.py`, which mirrors `study.e4_score` (same `_sample_queries`, same `replay.run_arm` candidates, `max_length=1024`, sentence-transformers 3.3.1 + transformers 4.46.3) |
| The Lennon example: for `INEX_LD-2012311`, point 10310 sits at fused rank 49 of 200 and reranks to first | `study/rerank/dbpedia-entity__jina-reranker-v2-base-multilingual.parquet`; grade-2 relevant in `cache/dbpedia-entity_qrels.parquet` |

## Measured, deliberately not published

| Finding | Why it stays out |
| --- | --- |
| Weighted score fusion is the top arm on four of five corpora, above every RRF setting and above plain DBSF | No public API, so it becomes an engineering question rather than reader advice. Numbers in `results/*.parquet` under the `unreachable_` prefix |
| `full_scan_threshold` cannot be set below 10 | Setup hygiene. `lib/collection/src/operations/config_diff.rs:57` |
| An HNSW graph is only built above `optimizers_config.indexing_threshold`, default 10,000 KB, about 6,700 vectors at 384 dimensions, evaluated per segment | Setup hygiene, and the reason T3 gates on `indexed_vectors_count`. `lib/shard/src/optimizers/config.rs:17` and `lib/shard/src/optimizers/indexing_optimizer.rs:53-90` at v1.19.0, plus a read-back from a fresh collection on the running server |
| Measured `avg_len` per corpus: 151.4, 96.5, 46.7, 54.0, 35.3 | Supports the BM25 `avg_len` docs note; the article links rather than re-explains |

## Outstanding before publication

- Competitor `k` defaults: Elasticsearch verified from its own docs on 2026-08-10. The article names only the paper and Elasticsearch, so OpenSearch, Milvus, and LangChain need no citation.
