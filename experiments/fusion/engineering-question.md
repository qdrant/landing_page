# Engineering Question: Weighted Score Fusion Has No API

**Closed 2026-08-11. The `k=2` default is by design, per DevRel. No engineering question is being raised.**

Kept as a record of the measurement, and because two things follow from the answer: the documentation should explain what the default does rather than leave a reader to find it in a formula legend, and the API reference should state the default instead of rendering it as `null`. Both are in `DOCS-FIXES-HYBRID-FUSION.md`.

## What the measurement found

`ScoreFusion` (`lib/segment/src/common/score_fusion.rs:10-31`) carries four fields: `method`, `norm`, `weights: Vec<f32>`, and `order`. `ScoreFusion::dbsf()` is the only constructor anywhere in the tree, and it hardcodes `weights: vec![]` and `Normalization::Distr`. A `Normalization::MinMax` variant and a public `min_max_norm` exist with no callers outside the file. So the sum-of-normalized-scores machinery is complete, and DBSF is the single point in its configuration space that an API request can reach.

We replayed the reachable and unreachable configurations over the same candidate lists on five corpora, at candidate depth 200. nDCG@10, best in each family:

| Corpus | Best of 30 RRF settings | DBSF | Weighted score fusion |
| --- | --- | --- | --- |
| SciFact | 0.7175 | 0.7323 | **0.7371** |
| ArguAna | 0.5332 | 0.5171 | **0.5370** |
| WANDS | 0.7616 | 0.7637 | **0.7637** |
| CodeSearchNet | 0.6676 | 0.6716 | **0.6874** |
| DBPedia-entity | 0.4741 | 0.4822 | **0.4872** |

Weighted score fusion is the best available setting on four of five corpora and ties on the fifth. On CodeSearchNet it beats the best RRF setting by 0.0198 and DBSF by 0.0158, both well outside that corpus's 95% interval of plus or minus 0.0102. This is the configuration Bruch et al. (ACM TOIS 2023, arXiv:2210.11934) report beating every RRF setting on all nine of their datasets, so the result is expected rather than surprising. Qdrant has the parts and no way to ask for them.

One property makes it easier to expose than weighted RRF: summing normalized scores is scale-invariant for ranking, so `(1, 2)` and `(2, 4)` produce identical orderings. Weighted RRF is not scale-invariant, which is why our own documentation has to insist that weights are absolute pairs.

Replay artifacts: `results/<corpus>.parquet`, arms under the `unreachable_` prefix. The replay is checked against the server in `parity/<corpus>.json`, maximum deviation 0.000e+00.

## The questions

1. **Is the absence of an API for `weights` and `Normalization::MinMax` deliberate?** If it is a deliberate narrowing, the reason belongs in the documentation, because a reader who finds `ScoreFusion` in the source will ask.
2. **Should `ScoreFusion` lose the fields it cannot use, or gain a request shape that reaches them?** Either resolves the gap. Keeping unreachable fields costs maintenance and invites this question again.
3. **Is `DEFAULT_RRF_K = 2` deliberate?** Qdrant's `k` equals the classic constant plus one, so the default is the paper's `k=1`. Rank 1 outweighs rank 10 by 5.50x there, against 1.15x at the `k=60` the 2009 paper settled on and Elasticsearch documents as its `rank_constant` default. On the two corpora here with many relevant documents per query, our default was among the worst settings measured. A default matching the literature would be `k=61`.

## What is not being asked

No change is being requested. The article ships against current behavior and teaches `k` as a knob the reader sets. If the answer to question 3 is "the default stands", the article needs no edit.
