---
 title: Build and Evaluate
 weight: 2
---

{{< date >}} Day 8 {{< /date >}}

# Final Project - Build and Evaluate

In a single notebook, build two pipelines. Ingestion: load and normalize your docs, chunk by sections, compute vectors, and upsert into one collection. Retrieval: implement `search(q)`. Embed the query, build the sparse vector, call the Query API with dense+sparse and server‑side fusion (RRF or DBSF) using a higher `limit` (≈100) to oversample, rerank with multivectors, then return page, section, a short snippet, and a score. 

Use one collection: a primary dense vector for retrieval (you can keep more than one if you want, e.g., body text, titles, etc), sparse enabled for lexical, and a multivector view used only for reranking (disable its index, e.g., HNSW m=0). Choose any docs you like; for a fast start, use the Qdrant docs. Briefly justify any deviations (models, distances, payloads, filters/tags) and report Recall@10, MRR, P50, and P95.

## Glossary

**Recall@k**: “Did a correct item show up in the top k?” Per query the score is 1 if yes, else 0; report the mean. Use k=10. Relevance is based on normalized URLs where the section/page equals or prefixes a gold URL. Example: hits@10 = [1, 0, 1] → R@10 = 2/3 = 0.667.

**MRR (Mean Reciprocal Rank)**: “How far do you scroll to the first correct item?” If the first correct result is at rank r, the score is 1/r; if none, 0. Report the mean across queries. Example: ranks = [1, 2, none] → scores = [1.0, 0.5, 0.0] → MRR = 0.5.

**Latency P50/P95 (ms)**: End‑to‑end wall‑clock time of `search(q)` (embed + hybrid retrieve + rerank + format). Report the median (P50) and the 95th percentile (P95). Warm up once; measure on many queries. Example: most ~80 ms, a few ~300 ms → P50 ≈ 80, P95 ≈ 300.

Tip: Prefer section‑level matching when anchors exist; fall back to page‑level otherwise.

## Result contract (what to return)

Return, per hit, `page_title`, `section_title`, `page_url`, `section_url` (when an anchor exists), a post‑rerank `score`, and a short `snippet` (≈360 chars). Optionally include `full_chunk_text` and a `code_snippet` if applicable. Normalize URLs (lowercase paths, strip trailing `/`, lowercase anchors) and evaluate by equality or prefix match.

## Hybrid search and multivector rerank

At query time compute dense embeddings for each dense view you indexed, build the sparse query vector. If you use a late‑interaction reranker (e.g., ColBERT), also encode the query with that model to produce query multivectors for MAX_SIM. Use the Query API to fuse dense and sparse with RRF or DBSF and retrieve a large candidate set (≈100 is a good start). If you store multiple dense vectors, fuse their dense scores when combining results (AVERAGE is a safe default; MAX favors strong section matches). Then rerank the candidates with the multivector using MAX_SIM and return page, section, snippet, and score.

## The eval

Create 20–30 realistic queries with gold URLs/anchors. For each query, time `search(q)` end‑to‑end, collect result URLs (prefer `section_url`, else `page_url`), normalize, and record the first rank where a candidate equals or prefixes a gold target. Aggregate Recall@1/3/10 and MRR across queries, and compute latency P50/P95 in milliseconds.

## Tuning 

You can also experiment with HNSW index‑time parameters `m` and `ef_construct` (e.g., m≈32, ef_construct≈256) to balance memory, build time, and recall/latency.

Increase `ef` at search time (64→128→256) until R@10 stops improving relative to latency. Compare RRF vs DBSF and adjust the candidate oversampling window (about 50–200). If you keep two dense views, try AVERAGE first, then MAX. Consider quantization only if memory is tight and quality stays acceptable. If the corpus has separable regions, enable filters by `tags` or `path` to let users scope their search.

## Ground truth

Take 20–30 real queries. For each, copy the expected page URL and anchor from your docs. When anchors are missing, evaluate at the page level. Keep one primary gold and optional alternates.

## What to submit

A single Jupyter notebook that runs end‑to‑end against Qdrant Cloud and includes data loading, embedding, collection creation, upload, hybrid retrieval, reranking, and result display (page + section + snippet); a tiny table with Recall@10, MRR, P50, and P95; and a short paragraph on the key decisions you made (chunking, payloads, rerank design, tuning). 