# Deep review: "Route Retrieval by Evidence" article

You are doing a rigorous, research-backed review of a draft technical article for the Qdrant website. The bar is a gatekeeping CTO (Andrey): accurate, measurable, lean, in the right channel, honest about tradeoffs, and aware of prior art. Work in two phases — **deep external research first, then strong prioritized feedback**. Do not rewrite the article; produce findings and concrete recommended fixes, and only edit if the user approves.

Before anything else, read **`article-research/REVIEW_CONTEXT.md`** — it has every artifact path, the environment, and the verified numbers so you can check the article against known-good values instead of re-deriving them.

## The artifact
- Article: `/Users/dylanc/Documents/GitHub/landing_page/qdrant-landing/content/articles/route-retrieval-by-evidence.md` (git branch `signal-driven-retrieval-article`).
- Figures: `qdrant-landing/static/articles_data/route-retrieval-by-evidence/` (loop diagram, signal-separation boxplots, gate histogram, routing distribution, cost/quality frontier).
- Live Hugo preview: `http://localhost:1313/articles/route-retrieval-by-evidence/`.
- **Read the whole article first.** Then verify it against the source rather than trusting it.

## What the article argues (orientation)
A "self-correcting retrieval loop": retrieve once with hybrid search (dense `bge-base` + sparse miniCOIL, RRF), judge the result with a **cheap signal** computed from the result with no extra model call, and escalate to a more expensive action (ColBERT rerank, or query decomposition / IRCoT) only when the signal predicts weak retrieval. Thesis: **route by evidence, not by question shape.** The differentiated core is the *signals* plus an AUC-based method to pick which ones predict weak retrieval on your data, then a threshold gate. Benchmarked on a MuSiQue workload recast as single-hop / multi-hop / unanswerable, and generalized to non-QA use cases.

## Source material and environment
See `REVIEW_CONTEXT.md`. In short: the workshop repo at `/Users/dylanc/Documents/GitHub/self-correcting-loops-workshop/` is the source of truth (lab notebook + `artifacts/*.json` scorecards + `data/`); the live Qdrant on `:6333` has the full `musique` and `musique_colbert` collections so you can re-run the signal benchmark; the workshop `.venv` has the deps; API keys are in `landing_page/.env`.

## Phase 1 — deep research (do this first, with sub-agents)
Fan out cheap-model research sub-agents (one topic each; keep conclusions, drop raw dumps). The point is to find **prior art we may have missed, concepts we skipped, and claims that don't hold up against the literature.** Investigate at least:

1. **Adaptive / corrective / self-correcting RAG — prior art (highest priority).** Map and read: **CRAG (Corrective RAG)**, **Self-RAG**, **Adaptive-RAG (Jeong et al.)**, **FLARE**, **Self-Ask**, **IRCoT**, least-to-most. For each: what it routes on, and how close it is to "cheap signal + gate." Be skeptical of any novelty claim — CRAG uses a lightweight *retrieval evaluator* to grade retrieval and trigger correction (very close to our signal+gate); Adaptive-RAG routes by a *query-complexity classifier* (exactly the "question shape" approach we position against). Does the article engage this prior art honestly, mis-credit it, or reinvent it without citation? This is the likeliest fatal gap.
2. **Query Performance Prediction (QPP).** Post-retrieval predictors (NQC, UQC, Clarity, WIG, SMV, UEF, query feedback, coherence-based) and dense/neural QPP (BERT-QPP, ADG-QPP). Verify the article's claim that the variance signals are "Normalized Query Commitment (NQC)" — check whether raw score variance is actually **UQC (unnormalized)** and NQC requires normalization by a collection score. Identify any cheap, strong predictor we omitted that a reviewer would expect.
3. **Selective prediction / abstention / confidence in retrieval and RAG** — how the field frames "know when retrieval failed," to test our "good retrieval = needed evidence in the consumed window" framing against standard IR metrics (recall@k, nDCG) and calibration work.
4. **Product-fact grounding** against canonical Qdrant docs: RRF (and `k`), DBSF, ColBERT / late interaction / MaxSim, miniCOIL. Confirm nothing is misstated.
5. **Multi-hop QA + decomposition** (IRCoT and relatives) to check our decomposition description is accurate and fairly credited.

Prefer **web-only** research agents and **cheap models** for this fan-out. Reserve full-strength reasoning for synthesis and critique.

## Phase 2 — verify accuracy (check the numbers, don't trust them)
Extract every quantitative and technical claim from the article and verify it against `REVIEW_CONTEXT.md` and the artifacts; re-run the live signal benchmark on the full `musique` collection if anything looks off (CP2 logic in the workshop notebook; the collection is ready). Confirm the frontier table, signal AUCs, correlations (dense×score ≈ 0.54, max_score×score ≈ 0.92), gate operating points (78%/49% dense alone, 80%/57% OR), and the coverage-saturation stat. Verify every technical claim from first principles. Flag anything stated as universal that is corpus-specific, and any place the single-dataset evidence is overreached.

## Phase 3 — strong feedback (then, and only then)
Deliver, in this order:
1. **Research findings** — what the field says, the prior art that matters, the concepts we missed, with sources.
2. **Inaccuracies / corrections** (highest priority) — each with the evidence and the concrete fix.
3. **Missed concepts / prior art to engage** — what the article must cite or position against to survive expert review.
4. **Improvements** — framing, depth, lean (cut anything off-topic), structure.
5. **Hygiene** — links (the `#query-decomposition-...` anchor used 3× lives in a separate unmerged PR: a known merge-order dependency, not a master defect), figure/asset sizes, channel fit (it's an `articles/` piece modeled on `miniCOIL`/`bm42`), and the missing `social_preview_image`/`preview` asset.

Andrey register: terse, specific, no flattery; lead each finding with the problem, name the fix, cite the source. Conclude the piece is solid where it is.

## Guardrails
- **Do not rewrite the article.** Produce the review and recommended changes; edit only on approval.
- Invoke the `qdrant-landing-page` and `qdrant-messaging` skills before proposing any copy (voice: "vector search engine" not "vector database"; no em dashes; problem-first; numbers over adjectives).
- **macOS file-access caveat:** the repo and workshop live under `~/Documents`; a burst of parallel local sub-agents reading that path can trigger `Operation not permitted` (TCC) mid-session and block reads / venv launches. Keep research agents **web-only**; avoid large parallel bursts of local-file agents; if reads or `.venv` launches start failing with EPERM, stop and ask the user to restart the terminal.
- Don't touch other branches or the separate hybrid-queries PR.
