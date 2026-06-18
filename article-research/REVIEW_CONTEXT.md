# Review context: verified facts for "Route Retrieval by Evidence"

Reference sheet so the review session can check the article against known-good numbers
without re-deriving everything. All numbers below were computed this session from the
workshop artifacts and the live Qdrant. Re-run to confirm; expect ~1-2 label drift from
floating-point/ANN variation (the AUCs and the qualitative picture are stable).

## Paths
- Article: `qdrant-landing/content/articles/route-retrieval-by-evidence.md` (branch `signal-driven-retrieval-article`)
- Figures: `qdrant-landing/static/articles_data/route-retrieval-by-evidence/` (loop diagram, signal-separation, gate-histogram, routing-distribution, cost-quality-frontier)
- Workshop (source of truth): `/Users/dylanc/Documents/GitHub/self-correcting-loops-workshop/`
  - `notebooks/lab.ipynb` (CP2 = the signal benchmark), `artifacts/headline_final_v25.json`, `artifacts/targeted_stop_v25.json`, `artifacts/mixed_manifest.json`, `data/corpus.jsonl`, `data/questions_mixed.jsonl`
- Research copies: `article-research/` (notebook + both scorecards)
- Live Qdrant: `http://localhost:6333` — `musique` (22,808 docs, `dense`+`minicoil`), `musique_colbert` (`dense`+`colbert`)
- Python with deps: `/Users/dylanc/Documents/GitHub/self-correcting-loops-workshop/.venv/bin/python` (qdrant-client, fastembed, litellm, sklearn)
- Keys: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` in `landing_page/.env`
- Hugo preview: `http://localhost:1313/articles/route-retrieval-by-evidence/`

## Stack / config (workshop)
- Dense: `BAAI/bge-base-en-v1.5` (768-d, cosine) | Sparse: `Qdrant/minicoil-v1` (IDF modifier)
- ColBERT action: `answerdotai/answerai-colbert-small-v1` (96-d/token, MaxSim multivector)
- Fusion: RRF, server-side. RETRIEVE_N=50, TOP_K=10, ANSWER_K=3 (the answer window)
- Agent: Claude Sonnet 4.6 (decompose+answer); STOP autorater: Claude Haiku 4.5
- Note: workshop `config.py` comments RRF "k=60"; Qdrant's RRF default is k=2. Article does NOT cite k. Verify if any version ever does.

## Headline frontier (`headline_final_v25.json`, overall; 321 test Qs = 180 answerable + 141 unanswerable)
| policy | recall@3 | full_gold@3 | mrr_first | llm_calls | latency_s |
|---|---|---|---|---|---|
| always_answer | 0.8167 | 0.700 | 0.8798 | 0 | 0.15 |
| always_rerank | 0.8079 | 0.6944 | 0.9051 | 0 | 0.15 |
| always_colbert | 0.8023 | 0.6833 | 0.8921 | 0 | 0.30 |
| always_decompose | 0.8773 | 0.7944 | 0.9006 | 1.883 | 3.296 |
| ladder | 0.8523 | 0.7611 | 0.9131 | 0.778 | 1.498 |

CIs (`ci_vs`): ladder vs always_answer — recall@3 +0.0356 [0.0032, 0.0676], full_gold@3 +0.0611 [0.0111, 0.1111], em +0.05 [0.0111, 0.0889]. ladder vs always_decompose — recall@3 -0.025 [-0.0509, -0.0028], full_gold@3 -0.0333 [-0.0667, -0.0056], em -0.0111 [-0.0444, 0.0222] (not significant).

tier_dist: single_hop {1:70, 2:44, 3:6}; multi_hop {1:9, 2:4, 3:47}; unanswerable {1:19, 2:22, 3:100}.

## Signal benchmark (live, full corpus, 150 calibration Qs, ~100 good / ~50 weak)
AUCs (direction-agnostic): dense_variance **0.74**, score_variance **0.70**, max_score **0.66**, evidence_coverage **0.59**, retriever_divergence **0.53**. Bar = 0.65; correlation drop bar = 0.85.
- KEPT: dense_variance, score_variance. Dropped: max_score (correlation), coverage + divergence (below bar).
- Floors (Youden): DV ≈ 0.039, SV ≈ 0.238 (article does not hardcode these).

Correlations (Pearson |r|): dense_variance × score_variance = **0.54**; score_variance × max_score = **0.92** (why max_score is dropped); dense × max_score = 0.51; coverage/divergence ≈ 0 with all.

Gate operating points: dense_variance alone catches **78%** / escalates **49%**; OR of both floors catches **80%** / escalates **57%**. Fired-set Jaccard(dense, score) = 0.52; 12 escalations unique to score, 29 unique to dense.

evidence_coverage saturation: good mean 0.88, **87% score exactly 1.0**; weak mean 0.82, **69% score exactly 1.0**. A `coverage < 0.99` threshold catches only 16/51 weak (recall 0.31) with 13 false alarms — confirms the AUC is the number that matters.

## STOP (`targeted_stop_v25.json`)
| variant | selective_accuracy | abstain_unans | false_stop_ans |
|---|---|---|---|
| baseline_hybrid_gentle | 0.5296 | 0.5461 | 0.2111 |
| ladder_gentle | 0.4984 | 0.4113 | 0.15 |
| ladder_autorater_all | 0.6293 | 0.8652 | 0.4111 |
| ladder_targeted | 0.6168 | 0.8085 | 0.3667 |

## Known open items (already identified, not yet resolved)
1. The article links `#query-decomposition-for-multi-hop-questions` (×3) — that anchor lives in a SEPARATE committed-but-unmerged PR (branch `self-correcting-retrieval`, commit `2e2371c30`). Resolves once that PR merges; not a master defect.
2. `social_preview_image` + `preview/` assets are referenced in frontmatter but not created (design/publisher item).
3. The article calls the variance signals "Normalized Query Commitment (NQC)" — verify against the QPP literature; raw score variance is closer to UQC (unnormalized). Likely imprecise.
4. Prior art not yet cited: CRAG, Self-RAG, Adaptive-RAG, FLARE. The "route by evidence not shape" thesis is in direct dialogue with these; positioning gap is the top review risk.
5. All numbers come from ONE MuSiQue workload (single dataset). Generalization to non-QA use cases in the article is reasoned, not measured.
