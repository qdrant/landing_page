# Retrieval Tuning Series: Article And Experiment Plan

Revision 28, 2026-08-17. Branch `hybrid-fusion-experiment-plan`. Written for a session with no access to the conversation that produced it. Everything here is current instruction; nothing describes how the plan got this way.

**The five articles are done and reviewed.** E1 to E7 are run and their artifacts are on disk. The five are drafted, gated, cross-linked and checked against the v1.19.0 API surface, and `verify_articles.py` passes 207/207, which is every published figure in all five. Dylan finished his narration and review pass on 2026-08-14 and committed it through `e1e619cf0`, so these are reviewed articles and any further edit changes reviewed work. All five hero image sets are built. A sixth article, `hybrid-search-recall-candidate-list`, was retired on 2026-08-14; 4a carries what moved and what that orphaned. Treat any later finding as a defect to fix rather than an opening to revisit scope, structure, or voice.

**Run `verify_articles.py` through `experiments/fusion/.venv`.** The venv was recreated on 2026-08-12 with numpy, pandas, pyarrow, pytrec_eval and qdrant-client, and it is gitignored. `python3` alone has no pandas and the script will not import.

**The brief.** A seasoned software engineer owns a Qdrant collection that works and now has to make it better. They are strong at engineering and new to search. They read a config reference without help, they know what p95 costs them, they have shipped sharded systems, and they can reason about a memory budget. What they have not done is information retrieval: they may not know what nDCG measures, why a reranker exists, or that sparse and dense retrieve for different reasons. They need to know what they can change, in what order, and what each change costs.

**Enterprise first, and a solo developer has to get value too.** Many of these readers run tens of millions to billions of vectors, sharded, replicated, quantized, often multi-tenant, with a relevance bar their business depends on. The series serves them first. It stays useful to a solo developer because most of what it teaches is scale-free, and section 3d says exactly which parts are not.

**Thesis.** The series owns the argument and the order. The documentation owns the mechanism. A reader can act on any part without opening a tab, and every link carries the parameter surface behind a knob we have already told them how to set.

**Quality outranks coverage.** A knob we cannot advise on is worse than a knob we leave out. Every knob gets named; only the ones we can say something useful about get a full treatment. Section 5 carries the triage.

**Never explain engineering. Always explain search.** That one line settles most calibration questions in drafting.

Assume without a word: latency budgets and percentiles, memory and disk trade-offs, sharding and replication as concepts, reading an API reference, batching, and the idea that a default is a guess someone else made. Do not write "p95 means the 95th percentile" or walk them through a config file.

Introduce on first use, in one sentence, functionally rather than academically: nDCG, MRR, Recall, and what each is good for; what a reranker does and why it cannot be the first stage; why dense and sparse retrieve different documents; what fusion is and that it has a constant; approximate against exact search. One sentence, then use the term freely. A reader who already knows skims that sentence and loses nothing.

Some of these readers arrive carrying an Elasticsearch or Lucene configuration, which is why the `k=60` to `k=61` porting note in section 6 earns its place, but do not assume that background.

**The reader is tuning, not building.** Every example acts on a collection that already exists. No part opens with "create a collection". Where a knob needs a rebuild, say so, because for this reader a rebuild is a cost and not a step.

**Numbers before prose.** Run the measurement, lock the table, then write around it. Never draft around a number that does not exist yet. Every question the series asks is framed so both outcomes are publishable, which is why "a reranker loses on four of five corpora" shipped as an article instead of sinking one.

**Hybrid search is where this reader starts, not where they arrive.** They already run two prefetches and a fusion. Anything shaped like "should you adopt X" reads as basics to them and is the fastest way to lose the audience the series is written for. Say what their working setup is costing them, then teach the knob. The one-sentence introductions in the paragraph above stay, because a definition of nDCG costs a skimmer nothing while a four-step adoption ladder insults them. Dylan's call, 2026-08-11; section 13 records what it changed.

**Not every reader runs hybrid, and only one article requires it.** `how-to-tune-hybrid-search` is hybrid-only by construction, since it is about combining two ranked lists, and that is fine, it doesn't need to accommodate a single-leg reader. The other four, `before-tuning-a-qdrant-collection`, `candidate-depth`, `when-your-collection-outgrows-ram` and `when-a-reranker-is-worth-it`, apply just as much to a dense-only or sparse-only collection: candidate depth, memory placement, and reranking don't care how many legs fed the candidate set. Write and review those four so a single-leg reader isn't addressed as if they must already be running two prefetches. Dylan's call, 2026-08-14; some edits are already going in during the Codex review pass in progress.

## 1. How To Run This Session

- **Run `cd experiments/fusion && .venv/bin/python verify_articles.py` first.** It checks all 207 published figures two ways: against the artifact that produced them, and that the article file still contains the value. If it passes, the articles and the measurements agree and you can trust both. If it fails, fix that before anything else.
- **Do not re-derive sections 6 or 7, and do not re-run E1 to E6.** They are done and their numbers are already in the articles. Re-verify section 6 only against a Qdrant release later than v1.19.0. Checked 2026-08-17: v1.19.0 is still the latest release, the local checkout is on its tag at commit `74f3e85b9`, and section 6 holds there.
- **A release Qdrant has already shipped is not covered by that exemption.** The 1.19 memory placement rework was in the pinned build the whole time and still reached a draft as the deprecated `on_disk`. When a section 6 entry names an API, grep the deprecations in the checkout before quoting it: `grep -rn 'deprecated(since' lib/ src/ --include='*.rs'`.
- **Do not rebuild the measurement layer.** Gate A (`test_replay.py`, 9/9) and Gate B (`parity/*.json`, deviation 0.000e+00) both pass.
- The harness is at `experiments/fusion/`; `README.md` there has the run order for both `run.py` and `study.py`.
- Write experiment code only into `experiments/fusion/`.
- **Never commit or push without explicit approval in that turn.**

**What is outstanding: pass one below, the PR, and three calls that belong to Dylan and Neil.** Nothing else is queued.

1. **Pass one, continuity and narration, with no evidence it has run.** Do the five read in a logical order, and does the set say each thing once? **Continuity:** every cross-link resolves, points at an article that delivers what the link promises, and the reading order in 4a still holds after the retirement. **Repetition:** a finding stated in two articles is a defect per section 13's one-home-each rule, and so is the same sentence shape recurring across section openers and closers. Give the fusion article's `Confirm Fusion Beats Either Prefetch` extra attention, since it arrived from the retired article and is the newest prose in the set. **Vocabulary:** one name per thing across all five, per section 11. **Emphasis:** promote points important enough to risk a reader skimming past into an aside or a warning callout; Dylan's sense is that the five underuse both right now.
2. **Pass two, technical accuracy and the gates, ran on 2026-08-14** in commit `99eb3230b`: `/humanizer` and `/andrey-review` on all five, `/neil-review` on the diff, then `verify_articles.py`. Two checks belonged to it. **Code snippet parity across all five:** consistent collection name, params, imports and API usage between articles, and no snippet contradicting a row in 4c. **The four technical items below**, closed 2026-08-17.
3. **The PR.** `experiments/` does not ship in it and the notebook moves separately, both per section 13.

**The four technical items pass two owned, all closed 2026-08-17**, one line each so none gets reopened.

- **The E4 reranker baseline.** The held-out comparison already selects both sides on the same half; 3a carries the check that settled it.
- **The three tier 2 knobs the retirement orphaned**, Matryoshka `mrl`, SPLADE and miniCOIL, and ColBERT as a retriever. The audit article's rebuild tier gained the paragraph at `before-tuning-a-qdrant-collection.md:131`, each with a rebuild condition. 4a carries the decision.
- **The `score_threshold` row** for the audit article's silent-settings table. It landed as a check rather than a value, at lines 100 and 105 to 106 of the same article.
- **5c's tier 3 pointers**, which none of the five delivered. 5c narrowed to `score_threshold`, the one that shipped.

**The PR description carries these six points, all Dylan's and all added 2026-08-14.**

- **No implementation to copy.** The reader is an adult who already runs a Qdrant collection and has an AI coding agent on hand. The series teaches what to check, what to measure, and what question to ask next, the way an experienced colleague briefs someone before they go write the code themselves or hand the task to their agent. That is why these articles favor instructions and checks over full code, and saying so in the PR body stops a reviewer reading them as tutorials that happen to be light on code.
- **Teachable over exhaustive.** Every claim is measured, verified, and checked against the source, the same bar as any other Qdrant content. Where a technically complete treatment and a teachable one pulled apart, on scope, depth, or what to link out to, this series chose teachable. The goal is a reader who can reason about their own collection afterward.
- **The small numbers, for Neil to decide on.** Every gain is measured against a fusion setting that was tuned first, so the swept gains are small by construction, which is why 3a's clearing counts and interval widths run tight. The baseline is a well-optimized hybrid search rather than a naive default, a second reason the numbers come in small. The corpora and their embeddings are still cached and the containers restart from their volumes, so a rerun on a more realistic dataset is cheap; it would not change the conclusions, but it would make the numbers look better. Leave that call to Neil.
- **Written for readers and for agents.** A reader working through their own collection may well be doing it through an agent, so the series is written to be as useful read by one as by a person.
- **Input from other teams is welcome.** These articles can be shared with new and existing customers, so they are material for pre-sales and post-sales too. Given the size of the diff, reviewers should feel free to propose direct inline suggestions rather than comments to respond to.
- **The experiments are not being released.** `experiments/` does not ship in this PR and Dylan does not plan to publish it separately. The series is about the learnings and the methodology, and he sees no point releasing the harness for numbers that are not the point.

**Three calls that are not blockers.** **Hero images:** all five sets are built, per section 2, but they don't match the site's current hero style, so ask Neil whether they need a redo before the PR ships rather than assuming either way. **Series positioning:** whether to name the set publicly as a retrieval-quality series, leaving collection architecture and operations to a companion series, which is the structural review's Option 1 and still Dylan's to make. **Length:** Neil flagged the set as possibly too comprehensive on 2026-08-11 at 8,000 words; the five now run 8,581, down from six at 12,209 before the retirement and the narration pass, so that note is effectively answered. Two articles sit under the 1,500-word floor, per 4a. The independent-articles decision in section 13 stands unless Neil reopens it himself.

**Polish backlog**, none of it blocking: a shared pipeline diagram each article can point at; WANDS threaded as the consistent worked example wherever a corpus is named without a reason; a standardized short "How We Measured" block replacing each article's bespoke setup paragraph.

**The tier 3 pointer question, closed and not to be re-litigated.** Two review rounds declined a block of links for the tier 3 knobs, because a list with no decision attached to any entry is the section a reader skips. `score_threshold` was the one with a case, and it shipped on 2026-08-14 as a binary check rather than a value: don't carry a `score_threshold` into a fused query uncalibrated, because Qdrant compares it with whatever score the returning stage produces, which for root-level RRF or DBSF is the fused score rather than either leg's raw score, so a threshold copied from a single-vector setup can silently truncate or empty the result list. Choosing the value itself is a tier 1 decision that depends on the score distribution and the product's acceptance rule. `is_tenant` also landed, beside ACORN at `candidate-depth.md:170`. 5c narrowed to what shipped on 2026-08-17.

**Rejected by a review round, do not resurrect:** a workload worksheet in the hub, which belongs to the ops companion series; a running example that evolves across articles, since the WANDS threading above is the cheap version; and the reproducibility review's asks in section 13.

**`turbo4` is a storage datatype, not a rename of TurboQuant quantization.** `Datatype::Turbo4` (`lib/segment/src/types.rs:2048`) keeps no float32 copy at all, so Qdrant cannot rescore against it, confirmed against the 1.19 release post (`qdrant-landing/content/blog/qdrant-1.19.x.md`). `TurboQuantization`, which the article's E7 measurements cover, does keep one. It reads as a rename if you skip the Rust, which is how it missed the first draft. It shipped on 2026-08-14 as one paragraph in the RAM article's "Turbo4 Removes the Rescoring Option", named and linked with no measurement, because E7 never ran it and section 5's triage rule gives an unmeasured knob no table.

## 2. State Of The Artifacts

| Artifact | State |
| --- | --- |
| Five articles in `qdrant-landing/content/articles/` | Drafted, gated, all code executed. Slugs, titles and word counts in 4a. Independent articles, not a consecutive series; the decision is in section 13. All five are cross-linked |
| `experiments/fusion/study.py` and `study/` | Tasks E1 to E6 and their artifacts. `study/rerank/` holds cached cross-encoder scores |
| `qdrant-landing/static/articles_data/how-to-tune-hybrid-search/rrf-k-rank-weight.png` | The `k` weighting figure, correct |
| `experiments/fusion/` | Harness, five cached corpora, results, diagnostics, grounding |
| `experiments/fusion/notebook/Tuning_Hybrid_Fusion.ipynb` | 28 cells, destination `qdrant/examples/fusion-methods/` |
| `experiments/fusion/e7.py`, `e7_cells.py`, `e7_run.py`, `e7_phase1.sh` | E7. Corpus, embedding pass, container, ingest and memory measurement; the pre-registered cell list; the runner; the unattended Phase 1 chain |
| `experiments/fusion/e7/` and `e7/results/` | E7 artifacts: `corpus.json`, `ingest.json`, `cells.json`, the `memory-*.json` readings, the `pass-*.json` timings, and `exact.json`, `e7a.json`, `e7a_float32.json`, `decision.json`, `e7b.json`, `e7b_check.json`. **The float32 row of `e7a.json` measured int8 and is superseded by `e7a_float32.json`**, per section 8. `decision.json` was re-applied against the corrected reference on 2026-08-13 |
| `experiments/fusion/.venv` | Gitignored. Recreated 2026-08-12 because the earlier one was deleted. `verify_articles.py` needs it |
| `e7-qdrant` container and `e7-qdrant-storage` volume | The 4,635,922-document dense-only collection. Separate from `fusion-qdrant` on port 6370, so E1 to E6 are never touched |
| `experiments/fusion/engineering-question.md` | Closed. The `k=2` default is deliberate; kept as a record of the measurement |

Gate A, `experiments/fusion/test_replay.py`: seven RRF fixtures ported from the Rust on exact equality, plus the repo's Welford property test. 9/9 passing. Gate B, `experiments/fusion/parity/*.json`: live server fusion against the offline replay across five corpora, maximum deviation 0.000e+00.

The measurement layer is sound. Do not rebuild it.

**The corpora are cached and the containers are stopped, checked 2026-08-17.** `fusion-qdrant` and `e7-qdrant` both exited on 2026-08-13 and need `docker start` before any live query; the five collections are in their volumes on the manifest's build (v1.19.0, commit `74f3e85b9`), and document embeddings are cached in `cache/*_dense.npy`. `verify_articles.py` reads artifacts and needs no server. E6 also leaves `scifact_sq` and `dbpedia-entity_sq` behind, which are the int8 scalar quantized rebuilds. Nothing here needs re-embedding.

## 3. What We Know

### 3a. Measured

From `results/*.parquet`, `diag/*.json`, `breadth/*.json`, `floor/scifact.json` and `study/*.json`. Five corpora, candidate depth 200 unless a row says otherwise.

The Part column is the original ordinal from when the series was six pieces. 1 is the audit, 2 the retired second-prefetch article, 3 candidate depth and memory, 4 fusion, 5 reranking. 4a has the slugs. **Part 2 no longer names an article.** Its rows are still measured and still true; where each one now lives, or that it lives nowhere, is in the unpublished-findings note after this table.

| Finding | Number | Part |
| --- | --- | --- |
| The metric decides the winner | On WANDS and DBPedia, nDCG@10, MRR@10 and Recall@100 each pick a different best setting; Recall@100 disagrees with nDCG@10 on four of five corpora | 1 |
| 95% interval on a paired difference | Median half-width: SciFact 0.0157, ArguAna 0.0085, WANDS 0.0066, CodeSearchNet 0.0102, DBPedia 0.0083 | 1, 4 |
| Settings clearing that interval | SciFact 0 of 31, ArguAna 5, CodeSearchNet 5, DBPedia 6, WANDS 19 | 1, 4 |
| A 50-query labeled set cannot see a fusion-sized gain | E2. Median interval half-width by set size, across corpora: 0.047 at 25, 0.035 at 50, 0.025 at 100, 0.018 at 200. At n=50 the corpus's true best gain is confirmed in 7 to 38% of draws on the four corpora whose gain is under 0.02, and 93% on WANDS where it is 0.038 | 1 |
| A swept winner does not always survive new queries | E1, 200 random splits. The winner keeps 67 to 95% of its swept gain on the held-out half, and its interval clears zero there on 20 to 30% of splits for SciFact, ArguAna and CodeSearchNet, 78% for DBPedia, 100% for WANDS | 1 |
| A sweep still picks something real | E1. The arm selected on half the queries lands at median rank 1 to 4 of 30 when scored on the other half, and is worse than the default on 0 to 6% of splits. The problem is confirming the gain, not finding it | 1 |
| Index rebuilds are not the noise | Five SciFact builds from identical vectors: mean nDCG@10 per arm is identical across all five to six decimals. Movement is confined to the tail, 0.04% of ranks 1 to 10 and 11.5% of ranks 101 to 200, with top-10 set agreement 99.99% | 1 |
| Which leg wins, per corpus | Dense against sparse nDCG@10: SciFact 0.624/0.689, ArguAna 0.491/0.422, WANDS 0.692/0.710, CodeSearchNet 0.630/0.513, DBPedia 0.468/0.386 | 2 |
| Leg agreement, share of top 10 found by both | ArguAna 0.900, DBPedia 0.901, SciFact 0.792, WANDS 0.775, CodeSearchNet 0.418 | 2 |
| Candidate depth moves the ceiling far more than the score | E3, all five corpora, prefetch `limit` 10 to 500. The ceiling rises 0.10 to 0.28 and the default arm rises 0.002 to 0.010. The gap between them grows at every step on every corpus | 3, 5 |
| More candidates can lower the realized score | E3. CodeSearchNet's best arm peaks at depth 100 (0.6745) and falls to 0.6675 at 500; DBPedia's peaks at 200. Depth is not monotonic on the number a reader sees | 3, 5 |
| `hnsw_ef` is not a lever at this scale | E3, all five corpora at depth 200. Across `hnsw_ef` 16, 64, 128 and 512 the default arm moves by at most 0.0022 and union recall by at most 0.0040 | 3 |
| Best `k` per corpus | ArguAna 5, CodeSearchNet 5, SciFact 2, DBPedia 20, WANDS 61 | 4 |
| Relevant documents per query | 1.0, 1.0, 1.1, 38.2, 358.9 in the same order | 4 |
| DBSF against the RRF default | Wins on four of five corpora, clears the interval on three | 4 |
| Fused top-10 tie rate | SciFact 12.5% at `k=2`, 2.8% at `k=61`, 0% under DBSF | 4 |
| The exhibit query | WANDS "entrance table": `k=2` ranks an irrelevant dense-only product first, `k=61` an Exact product both legs found. 202 of 480 WANDS queries disagree on rank 1 | 4 |
| A second prefetch pays by reordering, not by adding documents | E5. Holding either prefetch fixed and admitting the other's exclusive documents moves nDCG@10 by -0.013 to +0.004 in nine of ten corpus and direction cells. Reordering the documents the held prefetch already had is worth +0.028 to +0.103 in all ten | 2 |
| The documents it adds are real, and fusion leaves them behind | E5. The union's relevant recall at depth 200 beats the leading prefetch alone on every corpus (SciFact 0.982 against 0.940, WANDS 0.622 against 0.514, DBPedia 0.871 against 0.796), and the union's ceiling is 0.014 to 0.041 higher. None of that reaches rank 10 | 2, 5 |
| Admitting them hurts more queries than it helps | E5, at rank 10: CodeSearchNet 128 hurt against 10 helped, ArguAna 61 against 6, WANDS 105 against 49, DBPedia 63 against 21, SciFact 10 against 4. The damage shrinks by rank 100 and turns positive on SciFact and DBPedia | 2, 5 |
| A cross-encoder pays on one corpus of five | E4, measured against a fusion that was tuned first. DBPedia-entity is worth +0.090 over the best fusion setting and clears on 100% of held-out splits; the other four clear on 0%. Where the reranker beats the fusion the gain rises with candidate count, and where it loses the deficit grows with it, so ten candidates is the cheap test | 5 |
| Reranker cost does not track reranker quality | E4. A MiniLM beats `bge-reranker-base` on three of five corpora, and bge runs roughly 2.5x slower than MiniLM-L12. Cost ships as throughput: 64 to 212 docs/sec for MiniLM-L6 on CPU, against sbert.net's 1,800 on a GPU. This is why part 5 organizes on candidate count instead of model size | 5 |
| Part 4's conclusions survive quantization | E6, int8 scalar quantization on SciFact and DBPedia. The best `k` is unchanged (2 and 20), DBSF still beats the default, tie rates move by under 0.005, and fused nDCG@10 moves by at most 0.0002. `rescore` recovers the exact unquantized dense ordering on SciFact | 3, 4 |

Two caveats ship with those rows. **The metric disagreement is partly structural**: WANDS has 358.9 relevant documents per query, so a query with that many relevant documents cannot pass 0.28 at Recall@100. The bound is per query, which is why the measured macro average reaches 0.3877. The lesson is that the metric has to match the relevance structure of the data. **The clearing counts are an upper bound**, since 31 arms are compared against the default at 95% with no multiplicity correction; the split-half check is the honest arbiter and carries the argument wherever a count currently does.

**Four E5 findings are unpublished and their artifacts are intact**, logged so a future session finds them rather than re-measuring: the reordering against new-candidates split, the union's relevant recall and ceiling at depth 200, the per-query helped-against-hurt admission counts, and leg agreement. They lived in the retired second-prefetch article, their `verify_articles.py` checks went with it, and `study/e5_second_prefetch.json` still holds them. "Which leg wins, per corpus" survives as the dense against sparse against fused table that opens the fusion article. The four become publishable again only if a later experiment finds a downstream stage that turns the extra recall into a measured gain, the same condition 4a puts on reviving the article.

**The E4 baseline gets the same treatment as the reranker, checked 2026-08-17.** `_e4_held_out` (`study.py:889`) picks the reranker configuration and the fusion arm on the same half and reports their difference on the other, and `study/e4_reranking.json` records `held_out.baseline` as `split_selected_fusion_arm` on all five corpora. The full-set argmax at `study.py:817` feeds only the `vs_best_fusion_arm` column, where the reranker is selected on the full query set too, as the best of 15 model-and-count configurations against the best of 31 fusion arms, and the article states those deltas use all 200 queries. Read `_e4_held_out` before reopening this.

**The baseline choice, not the measurement, is what makes the reranker article's headline.** Against the tuned arm at ten candidates the best reranker wins on one corpus of five. Against Qdrant's default RRF, which is what a reader runs before tuning anything, the same measurements give SciFact +0.0133, WANDS +0.0136, DBPedia +0.0459, CodeSearchNet +0.0020 and ArguAna -0.0200: three wins, one flat, one loss. Both readings are in `study/e4_reranking.json` as `vs_best_fusion_arm` and `vs_rrf_default`. **Do not quietly switch to the friendlier baseline**; the article's premise is that a reader tunes fusion first, which is the cheaper stage, and that premise is what earns the harder comparison. The two things to settle are whether the baseline gets the same held-out treatment as the challenger, which is a correctness question, and whether the article reports both columns, which is an editorial one.

**A domain reading of the same numbers, offered as a hypothesis rather than a finding.** All three rerankers are MS MARCO-trained, which is web question-answering text. Ordered by distance from that distribution the results line up: DBPedia-entity is closest and wins by the most, WANDS and SciFact sit in the middle and roughly break even against the default, CodeSearchNet is flat, and ArguAna is furthest and loses worst. Gate 12 forbids publishing this as a mechanism, because training-domain distance is not measured here, only inferred from five outcomes. It is written down because it is a better explanation than "rerankers rarely pay" and because measuring it would need a reranker trained on something other than MS MARCO.

### 3b. Do Not Claim

Each of these was tested against the five corpora and failed. They read as plausible and will reappear unless refused on sight.

**Vocabulary overlap predicts which leg wins.** It does not. Measured overlap, meaning the share of a query's content words present in a relevant document, against which leg won:

| Corpus | Overlap | Dense | Sparse | Winner |
| --- | --- | --- | --- | --- |
| ArguAna | 0.179 | 0.4905 | 0.4224 | dense |
| CodeSearchNet | 0.340 | 0.6299 | 0.5126 | dense |
| SciFact | 0.507 | 0.6239 | 0.6886 | sparse |
| DBPedia-entity | 0.743 | 0.4677 | 0.3857 | dense |
| WANDS | 0.873 | 0.6921 | 0.7098 | sparse |

DBPedia has the second-highest overlap and dense wins by 0.081. Leg agreement and query length do not predict either.

**Candidate depth is the biggest lever.** It is the biggest lever on the ceiling and nearly none on the score, per the measured row above. Any claim about what a knob buys quotes the metric a reader would see, not the best achievable on the candidate set.

**Identical results at two `hnsw_ef` values prove a full scan.** They do not. `breadth/scifact.json` returns byte-identical results at `ef128` and `ef512` at every depth on an index that is demonstrably HNSW, because recall saturates. Section 5a carries the correct check.

**A cross-encoder beats a dense bi-encoder first stage by a known margin.** No primary source gives that cleanly. The 16.7 to 36.5 MS MARCO figure is over BM25.

### 3c. The Spine Each Article Argues

Every question E1 to E6 was built to answer is closed, and the answers are the rows in 3a. What each article does with them:

- **The audit** owns the measurement method: the metric decides the winner, a 50-query set cannot see a fusion-sized gain, a swept winner keeps about three-quarters of its gain on fresh queries, and index rebuild variance lives below rank 10.
- **Candidate depth** is the gap between ceiling and score, which widens at every step on every corpus. `hnsw_ef` ships as a check rather than a curve.
- **Fusion** is arithmetic that transfers at any scale, so it carries the `k` off-by-one, `k` against relevant documents per query, weights as absolute pairs, and the tie structure. Since 2026-08-14 it also opens with whether fusion beats either prefetch alone, which is the premise it used to assume.
- **Reranking** is "when not to add a stage", since it loses to a tuned fusion on four corpora of five.

**The fusion article's five required edits are applied.** Recorded because each one was a defect worth not reintroducing. Step 1 was headed "Raise the Candidate Depth Before Touching Fusion" and cited only the ceiling; depth now lives in its own article and the fusion piece points there. Step 6 and "Where That Leaves You" told the reader to re-measure on fresh queries with no number behind it; the held-out result from E1 is now that number. The opening claim that "fifty queries are enough to run steps 1 through 4" is gone, contradicted by E2. The DBSF line said it "gives nothing to a document only one prefetch found", which misreads the mechanism: that document keeps its own normalized score and only the missing prefetch contributes nothing (`replay.py:115-120`). The tie advice said to sort by score then ID, which stabilizes only what the server returned, so it now tells the reader to over-fetch first, because a tied group straddling the `limit` is cut before the response is built.

### 3d. What Transfers To Scale, And What Does Not

Every measurement here comes from single-shard, unquantized collections of 5,183 to 100,000 documents in a laptop Docker container. The enterprise reader will find that out. They should find it out from us, in part 1, framed as a split rather than discovered in a setup appendix and used to discount the whole series.

**Arithmetic, transfers at any size.** Fusion is math over two candidate lists, so everything in part 4 holds: the `k` off-by-one, `k` against relevant-documents-per-query, weights as absolute pairs, DBSF's behavior on a document one leg missed, and the tie structure. The measurement methodology transfers too, and it is the most valuable scale-free thing in the series: 50 queries cannot resolve a 0.015 gain at any collection size, and selecting on the queries you then report is wrong at any size.

**Index behavior, measured at 100,000 documents or fewer.** These are our worked examples, not the reader's answer. Each one ships with the check that finds their own number.

| Finding | Why it may not transfer |
| --- | --- |
| `hnsw_ef` is not a lever | Measured on 5,183 documents at `m=16`, where graph recall saturates immediately. On a collection large enough that it stops saturating it is the primary recall-against-latency knob. Frame it as "here is the check", not as a null result, and describe the regime by that check rather than by a vector count we cannot source |
| Index rebuilds are not the noise | Five builds of a small single-segment unquantized collection with a fixed upsert order. Continuous upserts, optimizer merges, and quantization all add variance this does not capture. The 99.99% top-10 agreement across builds is better used to answer a different question, which is how far two replicas of the same data can diverge |
| Candidate depth buys little realized quality | At scale, depth multiplies through quantization oversampling and fans out per shard, so this is a floor on the interaction rather than an estimate of it |
| Every latency number | Single in-process shard, no network, no fan-out, no concurrent load. Multi-shard latency has a different shape, not only a different magnitude |
| Every fusion result | Measured unquantized. Quantization reorders candidate lists, which changes leg ranks, which changes fused output. E6 exists to close this |

**Three facts about sharded collections that change what the knobs mean.** They attach to the knobs they affect rather than living in one distributed-systems section.

- **Candidate depth is per shard.** `ShardQueryRequest` carries its own `limit` and every shard runs the full prefetch and returns its own top-`limit` (`lib/shard/src/query/mod.rs:36-51`). A reader on twelve shards setting `limit=200` is not fusing 200 candidates. Attach to prefetch `limit` in part 3.
- **Root-level fusion runs once at collection level; only a nested fusion inside a prefetch is per shard.** Already in section 6, currently buried as one audit row. It gates whether part 4's tuning applies as measured, so part 4 must say the word shard.
- **`indexing_threshold` is evaluated per segment, not per collection.** `is_optimization_required(&self, segment: &Segment)` compares one segment's `available_vectors_size_in_bytes` against the threshold, per named vector (`lib/shard/src/optimizers/indexing_optimizer.rs:53-90`, v1.19.0). The "roughly 6,700 vectors" figure the audit article quotes is therefore per segment, and a collection splits into `default_segment_number` of them, which defaults to one segment per two CPUs clamped to between two and eight (`lib/shard/src/optimizers/config.rs:232-239`), not to the CPU count, which is the 4c correction. A 50,000-vector collection across eight segments holds 6,250 per segment and can sit under the threshold on every one. Setting the value to 0 disables indexing outright (`config.rs:253-259`).

**Re-verified 2026-08-17 at the pinned tag**, since the local checkout now sits at v1.19.0, commit `74f3e85b9`, which is what section 6 pins to. All three hold: `ShardQueryRequest` still carries its own `limit`, `RescoreStages::collection_level` still puts root-level fusion at collection level, and `is_optimization_required` still takes one `&Segment`. The segment-count figure was wrong in this section and is corrected above.

## 4. The Series Shape

### 4a. What Shipped

Five independent articles that cross-reference each other, not a consecutive series. Neil's call on 2026-08-11; the reasoning and its cost are in section 13.

Word counts below come from `~/.claude/skills/neil-review/scripts/check_content.py`, which excludes code blocks and frontmatter. Recount with that script before quoting them, since every editing round moves them and an earlier revision of this plan counted differently.

| Slug | Title | Words | What it owns |
| --- | --- | --- | --- |
| `before-tuning-a-qdrant-collection` | What to Check Before Tuning a Qdrant Collection | 2,372 | The pipeline mental model, the tier 0 audit grouped as index state, correctness and performance, the symptom router, the cost-ordered ladder with per-query against collection scope, metric choice, labeled-set sizing, the held-out check, the rebuild floor |
| `candidate-depth` | Candidate Depth: How Much Retrieval Is Enough? | 1,431 | Prefetch `limit` as a sweep starting range, `hnsw_ef` as a check, the compressed "When RAM Is the Constraint" section: quantization (sole home of the E6 table), `memory` placement, the gated-knob closer |
| `when-your-collection-outgrows-ram` | When Your Collection Outgrows RAM | 1,989 | Memory placement per structure, the latency price of `rescore` across the RAM boundary, the recovery curve at the selected storage class, the block-read consistency check, the reader's own retention-and-latency check. Sole home of every E7 number |
| `how-to-tune-hybrid-search` | How to Tune Hybrid Search in Qdrant | 1,276 | Dense against sparse against fused, the fusion family, RRF `k`, weights, ties, the `k=60` to `k=61` port. Quantization robustness compressed to a pointer at part 3 |
| `when-a-reranker-is-worth-it` | When Is a Reranker Worth It? | 1,513 | Cross-encoder payoff, candidate count, model size, cost as capacity, the symptom-to-stage routing table, MMR, grouping, ColBERT as a reranker (sole home of its storage numbers) |

**Renamed 2026-08-13.** Title and slug changed for the hub article (`tuning-retrieval-what-to-check-first` / "Seven Qdrant Settings That Fail Silently" → `before-tuning-a-qdrant-collection` / "What to Check Before Tuning a Qdrant Collection"). Slugs only, title unchanged, for the other three: `what-a-second-retrieval-prefetch-buys` → `hybrid-search-recall-candidate-list`, `retrieval-candidate-depth-and-memory` → `candidate-depth`, `when-a-reranker-pays` → `when-a-reranker-is-worth-it`. Updated everywhere: article frontmatter and cross-links, `qdrant-landing/static/articles_data/` image directories, this table, and `experiments/fusion/verify_articles.py`'s slug map.

**Retired 2026-08-14.** `hybrid-search-recall-candidate-list` is deleted, with its preview images and its slug in `verify_articles.py`. Its finding duplicated `candidate-depth`: the best possible score rises, the current score barely moves. Its escape hatch, keep the second prefetch when a downstream stage can use the recall, is contradicted by `when-a-reranker-is-worth-it`, where extra candidates rescued none of the four losing rerankers. Two things moved rather than died: the dense against sparse against fused table now opens `how-to-tune-hybrid-search` as its premise, and the second prefetch's cost, 0.6 to 1.5 ms over dense alone, went into the audit article's cost-order table. The three inbound links, two in the audit article and the closer in `candidate-depth`, now point at the fusion article. Revisit only if a later experiment finds a reranker that wins on the extra candidates.

**What the retirement orphaned, and where it went.** The article was the only home for four tier 2 knobs in its "When the Retrieval Stack Has Hit Its Limit" section: Matryoshka `mrl`, SPLADE and miniCOIL, ColBERT as a retriever, and the pointer to `how-to-choose-an-embedding-model`. Checked across the five surviving articles on 2026-08-14: none of them appeared anywhere, and ColBERT survived only in the reranker article, which was always its home per 5b. Four E5 findings also lost their only home; 3a logs them. **Decided and applied 2026-08-14:** the audit article's rebuild tier gained one paragraph naming those four, since it already owns the cost-order ladder and the embedding model as the rebuild floor. It sits at `before-tuning-a-qdrant-collection.md:131` and gives each knob its rebuild condition rather than a bare link, because the same argument section 1 uses against the tier 3 pointer block applies here.

**Reading order by weight:** audit -214, candidate depth -213, fusion -211, reranker -210, RAM -209. Depth sits before fusion because the fusion article opens by telling the reader to set a prefetch depth. -212 is free since the retirement; leave the gap rather than renumbering four files.

**Reader-facing vocabulary.** The articles say "best possible" for the score a perfect ordering of the candidate set would reach, and "current score" for what the reader's ranking returns. This plan says "ceiling" and "the default arm" for the same two quantities, because that is what the artifacts call them. Do not carry the plan's words into an article.

The entry point is the audit article: its symptom table routes to the other four. There is no separate landing page.

**Why this exists at all**, and the line to keep if the set ever gets rewritten: `/course/essentials/` is 46 pages and 47,735 words that teach what each knob is. Its day 3 covers dense against sparse and computes an RRF table without ever mentioning `k`, weights, or DBSF. Nothing on the site teaches which knob to turn, in what order, and what it costs.

**Length calibration.** The five sit at 1,276 to 2,372 words and total 8,581, recounted 2026-08-17 with the script named above. The revision 27 figures were wrong, by 3 to 25 words on four articles and by 290 on `when-your-collection-outgrows-ram`, which has been between 1,989 and 1,994 words at every commit on this branch. Two sit under the script's 1,500-word floor for an article: `how-to-tune-hybrid-search` at 1,276 and `candidate-depth` at 1,431. `/neil-review` will flag both. The set is deliberately lean and Neil's own note was that it ran too comprehensive, so the likely answer is that the floor is the wrong bar here; decide it once, before the PR, rather than three times during it. For comparison: the ACORN article is 2,258, the longest article on the site is 4,924 (`modern-sparse-neural-retrieval`), and the median across 80 is 1,607. Length was not the problem the style pass fixed; density and flat narration were.

**Narration baseline.** The style register comes from `qdrant-landing/content/articles/filtered-vector-search-acorn.md` on the `acorn-article` branch. What it does that these now do: section headings assert the finding rather than naming the topic, mechanism is explained before the number lands, and the reader is told how to read the numbers ("read the ratios, not the absolute milliseconds").

**Dylan's narration pass, 2026-08-14, is the target to match, not just the baseline above.** He has reviewed the articles for voice and is happy with where they landed: technical, but in approachable vocabulary, not dense or jargon-heavy. A Codex review is in progress and some edits from it are already going in. Any future modification to these articles, by Claude Code or anyone else, should match that settled narration style as closely as possible rather than drifting toward a generic technical register. When a change is unavoidable, read the surrounding paragraphs first and write the new sentence the way the rest of that article already talks.

### 4b. Trade-offs Are The Spine

Retrieval quality is one axis of five. A developer arriving from a managed service has a latency budget and a memory budget they never had to think about. Every knob states its cost in these terms:

| Axis | What the reader is asking |
| --- | --- |
| Latency | What does p95 do at query time |
| Memory | How much RAM does the collection need |
| Storage | How much disk, especially with multivectors |
| Build time | How long until the index is usable after an upsert |
| Money | Extra inference calls, larger nodes, an API-billed reranker |

**Three knobs make retrieval worse on purpose and the series says so plainly.** Quantization trades recall for memory, and `oversampling` and `rescore` buy some back. Matryoshka truncation trades quality for vector size, at 6.18 MTEB points from 768 to 64 dimensions. MMR trades relevance for diversity by construction.

**Several more are pure exchanges** with no answer absent a budget: `hnsw_ef` and prefetch `limit` buy recall with latency, a second retrieval leg buys coverage with an extra embedding call and a second index, reranking buys precision with latency proportional to candidate count, and ColBERT buys near cross-encoder quality with the storage section 6 puts at 286 GiB for 9M passages.

**Latency is measured for two knobs and sourced for the rest.** E3 covers `hnsw_ef` and candidate depth, E4 covers reranking as throughput, and E7 covers memory placement and the price of rescoring. Everywhere else the cost comes from the docs or a primary source and is stated as a direction rather than a magnitude.

### 4c. Corrections That Must Not Regress

Each of these shipped wrong at some point in drafting and was caught by a gate. `verify_articles.py` locks the numeric ones. The rest are prose and need a human eye.

| The wrong version | The measured truth |
| --- | --- |
| `params=models.SearchParams(...)` in a snippet | `client.query_points` takes `search_params`. `models.Prefetch` takes `params`. The wrong one raises `AssertionError: Unknown arguments` for every reader |
| `indexing_threshold` defaults to 100,000 KB, about 66,000 vectors | 10,000 KB, about 6,700 vectors at 384 dimensions, measured per segment |
| A collection splits into as many segments as CPUs | One segment per two CPUs, clamped to 2 through 8 |
| ACORN engages below `max_selectivity` 0.4 by default | ACORN is disabled until you set its `enable` flag. The threshold only applies once enabled |
| Move payload to disk to save memory through `on_disk` and `on_disk_payload` | Both are deprecated since 1.19. Placement is `memory` on six structures, and payload already defaults to `cold` |
| `Modifier.IDF` turns raw term counts into BM25 | Without it a score still carries term frequency and document length. Measured: every distinct term in a document comes back at the same weight, so a common word counts as much as a rare one |
| An unindexed filtered field degrades quality | Results stay correct. It is slower, it drains resources other queries need, and it skips the filter-aware HNSW edges, which are only built for fields indexed before ingestion |
| Reranking with ColBERT avoids its storage | It stores a vector per token either way. Reranking drops the HNSW graph over those vectors (`m=0`), and the 170x figure is measured with the document embeddings already stored and loaded |
| A cross-encoder reads its score off the `[CLS]` token | True for the BERT-family models, and `bge-reranker-base` is RoBERTa-family. Say the pair goes through one transformer and a classification head reads out one score |
| Cross-encoders truncate long queries | Truncation is on the pair at 512 tokens with `longest_first`, so a long query takes the budget the document needed |
| MMR lowers nDCG by construction | It usually does on a corpus without near-duplicates, and it can raise the metric where the duplicates are real |
| A reranker is the only stage that collects candidate headroom | A Formula Query rescores the same candidates from payload fields |
| `hnsw_ef` is the primary knob at 100M vectors per shard | That threshold has no source. Describe the regime by the saturation check the article already gives |
| FastEmbed cross-encoders are `ms-marco-MiniLM-L-6-v2` | The ids carry the `Xenova/` prefix and are not loadable without it |
| "Recall@100 is capped near 0.28" on WANDS | That contradicted the measured 0.3877. The bound is per query, so the macro average can exceed it |
| "No fusion setting turns new candidates into a gain" | The largest was +0.004 on CodeSearchNet under DBSF. The claim needs "worth the second index" |
| "If a reranker loses at ten candidates it loses by more at two hundred" | WANDS shrank from -0.033 to -0.008. It grew on three of four losing corpora and shrank on the fourth, never passing the fusion |
| A MiniLM beats `bge-reranker-base` on four of five | Three of five. And bge is roughly 2.5x slower than MiniLM-L12, not 4x |
| `hnsw_ef` costs 9% to 49% latency, union recall moves at most 0.0007 | 4% to 49%, and union recall spans 0.0040 on CodeSearchNet |
| "With 50 queries, skip the sweep, the procedure will keep the default almost regardless of what is true" | E2 disagrees per corpus: a sweep at 50 confirmed the corpus's own best gain in 7% to 38% of draws where that gain was under 0.02, and in 93% on WANDS where it was 0.038 |
| "Take the setting closest to `k=2`, since the extremes are where the ties live" | `k=2` is the extreme with the worst measured tie rate, 12.5% against 2.8% at `k=61`. Ship what clears the split, and prefer equal weights because a weight pair is absolute |
| "A large gap means no amount of retrieval tuning will move it" | Depth raises the best achievable score by 0.10 to 0.28, so retrieval does move the gap. What barely moves is the score the reader sees |
| "Almost everyone reading this will find a large gap" | The gap ran 0.247 to 0.487 at candidate depth 200 on the five corpora here, which is what the reranker article publishes and `verify_articles.py:156-157` locks. Five corpora are not everyone. **The 0.14 to 0.51 this row carried through revision 27 matches no artifact**; do not restore it |
| "The gain will be largest where the two prefetches disagree enough to be informative and still overlap enough to vote" | Nothing measured predicts the size of the gain from leg agreement. CodeSearchNet has the lowest agreement at 0.418 and the largest reordering gain; DBPedia has 0.901 and no gain |
| "A cross-encoder earns its cost by making fine distinctions among many plausible documents" | Relevant documents per query is measured; the mechanism is inferred from five outcomes. Say which is which |
| "Somewhere above this scale the graph stops saturating" for `hnsw_ef` | Point count is one input. Vector distribution, filters and query difficulty move the same line, so no collection size tells a reader which side of it they are on. Describe the regime by the saturation check |
| "Depth is cheap in latency" | It cost 37% to 43% between `limit` 10 and 500 on one idle single-shard laptop, which is the measured range in `e3_latency` and in the depth article; **the 40% to 45% this row carried through revision 27 is wrong**. Cheap against a model call, not against a tight p95 or a shard fan-out |
| TurboQuant `bits4` "reached float32 quality" | It matched float32 on labeled nDCG@10 and kept 0.039 less of the exact top 10. Name which quality measure matched |
| The roughly thirty-fold CPU to GPU reranker ratio read as a comparison | Our CPU figures and sbert.net's GPU figure come from different machines and different documents. It is the order of magnitude serving hardware moves, not a controlled result |
| Over-fetching to 50 pins tie-boundary membership | Only if the whole tied group fits inside the larger response. Compare the rank-10 score with the last fetched score and raise the limit while they match |
| The audit's bootstrap interval with no way to produce its input | The audit now carries the step that turns two configurations' results plus labels into per-query gains, via `pytrec_eval`. Without it the series is not actionable without leaving the page |

**Three rows above are dormant since the 2026-08-14 retirement**, because the prose they guard is deleted: "No fusion setting turns new candidates into a gain", "The gain will be largest where the two prefetches disagree", and "A large gap means no amount of retrieval tuning will move it" as it was phrased in the second-prefetch article. They stay because 3a logs a revival path for the E5 findings, and each correction goes live again the moment that material is republished. Nothing else in this table lost its subject.

### 4d. Mechanical Lessons, Do Not Rediscover

- **`e3_latency` needs an idle machine.** Measured under concurrent load the same `hnsw_ef` sweep reported 4.68 ms and 6.09 ms per query an hour apart. Recall was stable across both; only the timing moved.
- **Per-corpus tasks merge, they do not replace.** `study.py e3 arguana` used to overwrite the whole artifact and silently drop SciFact. `_write(..., merge=True)` fixes it for `e1`, `e3`, `e5` and `e6`.
- **Cross-encoder scores cache per corpus and model.** `e4_score` runs about three hours; it resumes rather than restarting. Its throughput varies with document length, 64 to 212 docs/sec for MiniLM-L6, so the range in the article is real and not noise.
- **Never round a number twice.** Eight published figures were wrong because a 4-decimal value was rounded up and then rounded again. Take 3 decimals from full precision in one step.
- **A tie is not a difference.** `qio.compare_runs` reports positions moved, whether every move sits at an equal score, and the maximum score deviation. Two runs over the same data routinely disagree at tied scores, and a bare "identical: false" reads as a defect when it is a reshuffle.
- **`indexed_vectors_count` aggregates over named vectors.** A hybrid collection with 5,183 points reports 10,366. It is a floor, not an equality check.
- **Codex blocks on stdin.** Run `codex exec ... < /dev/null` or it exits having produced nothing.

## 5. The Knob Inventory, Triaged

Forty-one knobs in four tiers plus a cut list. The tiering governed what the articles cover and it still governs any companion series, so the deferred tiers stay here in full. **Tier 0 and tier 1 are shipped inside the articles**, and 4a says which article owns which; read them there rather than maintaining a second copy.

**The gates run both directions.** A tier 2 gate that says "only if you are memory-bound" routes a small collection past it, and an enterprise reader passes that gate on day one. Where a gate is near-universal above a certain size, say which gates the reader at scale should assume they pass, so the tiering does not read as a small-collection worldview.

**Tier 0, check it once.** Seven settings that fail silently and have one correct answer for a given collection. They are the hub article's own subject.

**Tier 1, full treatment.** Thirteen knobs, four beats each in the same order: what it changes, when it applies to you, how to set it, what it costs.

**Tier 2, gated.** Ten knobs that are real but conditional. Each opens with its gate in the first sentence, in the same shape every time: "Only if you filter on payload fields. If every query is unfiltered, skip to the next section." The reader self-routes. No appendix; an appendix is where content goes to be unread.

**Tier 3, named and linked.** Nine knobs that get one sentence and a docs link, so a reader knows they exist.

**Cut.** Discovery, Recommend, and context search are a different query shape rather than a tuning move and belong in their own piece. Relevance feedback needs a separate package and fitted weights, so nobody in this audience acts on it.

### 5a. One Open Harness Defect From Tier 0

**The `hnsw_ef` comparison is a corroborating signal, never the test.** Identical results at two `ef` values do not prove a full scan, per section 3b. The harness still has that weakness at `qio.py:202-211`, where `full_scan_check` raises when the two settings agree. The articles ship the correct check; the harness does not. Fix it when E7 touches that file.

### 5b. Tier 2: Gated

The home column names the article that covers the knob. **The three that lost theirs to the 2026-08-14 retirement moved to the audit article's rebuild tier on 2026-08-14**, one sentence each with a rebuild condition; 4a carries that decision.

| Knob | Home | The gate |
| --- | --- | --- |
| Matryoshka `mrl` and embedding dimension | audit | Only if you are memory-bound. Trades quality for size, 6.18 MTEB points from 768 to 64 |
| SPLADE, miniCOIL | audit | Only if core BM25 underperforms on your vocabulary. Model inference on every document and query |
| ColBERT as a retriever, with MUVERA | audit | Only if you need the ceiling and have the storage: 286 GiB per 9M passages at 128 dimensions. **ColBERT as a reranker over already-fetched candidates carries no such cost and belongs in part 5's tier 1 discussion instead**, so do not let one gate turn both readers away |
| `m`, `ef_construct` | depth | Only if you can rebuild. `m` costs memory permanently, `ef_construct` costs build time only. At scale these are one-shot design decisions, so say once that they bound everything the series tunes |
| `quantile` and quantization type selection | depth | Only after quantization is on, which for most collections above RAM it already is |
| Filterable HNSW, ACORN, and tenant-aware indexing (`is_tenant`) | depth | Only if you filter, which every multi-tenant collection does by definition. ACORN default `max_selectivity` 0.4, and 2 to 10x slower when it engages |
| Formula Query | fusion | Only if you have business signals to blend. Needs payload indexes on every referenced field |
| Reranker model size | reranker | Only after candidate count is set. Quality does not track cost: MiniLM-L6 beats electra-base at 5x the speed |
| MMR | reranker | Only if repetitive results are the complaint. Trades relevance for diversity by construction |
| Grouping (`group_by`, `group_size`) | reranker | Only if one document is many chunks. Needs a payload index on the grouped field |

### 5c. Tier 3: Named And Linked

**Narrowed 2026-08-17 to the one pointer that shipped.** `score_threshold` is in the audit article's silent-settings table as a check: don't carry a threshold into a fused query uncalibrated, because Qdrant compares it with the fused score and can silently truncate or empty the result list.

The other eight stay listed here for a companion series and appear in none of the five, which is deliberate. Two review rounds declined a pointer block, on the grounds that eight links with no decision attached is the section a reader skips: distance metric, which matches what the model was trained with; chunking strategy, which decides what a document even is, is not a Qdrant setting, and has no measurement of ours; query rewriting and expansion, usually the largest lever and also outside Qdrant; collection aliases, for rebuilding the embedding model without downtime; the float16 and uint8 vector datatypes; `exact`, a diagnostic rather than a setting; prefetch nesting; and `m=0` on rescore-only vectors, a pure memory saving.

## 6. Verified Facts, Do Not Re-Derive

Checked against Qdrant v1.19.0, commit `74f3e85b9`, on 2026-08-10. Local checkout at `~/Documents/GitHub/qdrant`. External sources in `.firecrawl/`.

### RRF, From The Rust

`lib/segment/src/common/reciprocal_rank_fusion.rs`:

```rust
pub const DEFAULT_RRF_K: usize = 2;
fn position_score(position: usize, k: usize, weight: f32) -> f32 {
    if weight <= 0.0 { return 0.0; }
    1.0 / ((position + 1) as f32 / weight + k as f32 - 1.0)
}
```

Positions are zero-based; with `weight = 1.0` this reduces to `1/(position + k)`.

| k | rank 1 vs rank 10 | rank 1 share of top-10 mass |
| --- | --- | --- |
| 2 (default) | 5.50x | 24.8% |
| 5 | 2.80x | 17.1% |
| 20 | 1.45x | 12.1% |
| 61 | 1.15x | 10.7% |

**The off-by-one.** Cormack et al. score one-based ranks, Qdrant zero-based positions. Qdrant's `k` equals the paper's plus one, at every rank, so porting `k=60` requires `k=61`. Elasticsearch documents `rank_constant` defaulting to 60 and scoring `1 / (rank + rank_constant)` on one-based ranks, confirming the mapping against a second engine. `k` is validated `min = 1` at `lib/api/src/rest/schema.rs:546`; `weights` at `:553` has no range validation.

**Weight zero does not drop a leg.** It scores every document in that leg 0.0 and still inserts them.

**Weighted RRF is not scale-invariant.** Measured on WANDS at `k=5`: `(1,2)` scores 0.739, `(2,4)` scores 0.751. Weights are absolute pairs.

**Ties are not ordered deterministically.** `reciprocal_rank_fusion.rs:93` sorts on score alone with `sort_unstable_by`; the doc comment says "Does not break ties."

### DBSF, From The Rust

`lib/segment/src/common/score_fusion.rs`: `distr_norm` normalizes against `mean +/- 3*std_dev` then sums. Variance is **sample** variance via Welford, so an offline replay needs `ddof=1` and float32. `norm()` sets every score to 0.5 when `min == max` (`:99`), which fires whenever standard deviation is zero; a query-less prefetch scores every point 1.0 (`lib/collection/src/shards/local_shard/scroll.rs:130`), so that leg contributes a flat 0.5. **DBSF imputes nothing** for a document one leg missed, but that document keeps its own normalized score from the leg that found it. Sorting uses `ScoredPoint`'s `Ord`, which compares score only (`types.rs:394`).

**Unreachable options.** `ScoreFusion` carries `weights` and a `MinMax` normalization with no public constructor. Against the best reachable setting, weighted score fusion clears the interval on one corpus of five. The `k=2` default is deliberate, so the series teaches the default rather than questioning it. Record in `experiments/fusion/engineering-question.md`.

**Where fusion runs.** Root-level fusion runs at collection level (`lib/shard/src/query/planned_query.rs`, `RescoreStages::collection_level`). Only a nested fusion inside a prefetch is per shard.

### Memory Placement, From The Rust

`lib/segment/src/types.rs:1859` defines `Memory { Cold, Cached, Pinned }`. Since 1.19 a `memory` parameter carries placement on six structures and the old flag on each is deprecated. 22 deprecation sites: `grep -rn 'deprecated(since = "1.19' lib/ src/ --include='*.rs'`.

| Structure | Deprecated flag | Default placement |
| --- | --- | --- |
| Dense vector storage | `on_disk` | `cached` |
| HNSW graph | `hnsw_config.on_disk` | `cached` |
| Quantized vectors | `always_ram` | `pinned` beside in-RAM storage, `cold` beside on-disk storage (`quantized_vectors.rs:127`) |
| Sparse index | `on_disk` | `pinned` |
| Payload storage | `on_disk_payload` | `cold` |
| Payload field index | `on_disk` | `pinned` |

`Memory::resolve` takes the explicit parameter over the legacy one, and `resolve_or_warn` logs when the two disagree. `from_on_disk` maps true to `Cold` and false to `Cached`; `from_on_disk_heap` maps false to `Pinned` for the structures with a heap-backed variant. `pinned` is rejected by validators on dense vector storage and payload storage. `on_disk_payload` still defaults to true, so payload behavior is unchanged and only the parameter moved.

`cold` and `cached` are both mmap-backed and differ only in whether the page cache is warmed on load, so `cached` carries no eviction priority. Published docs: `/documentation/ops-configuration/memory-tiers/`.

### Versions

| Feature | First release | Docs marker |
| --- | --- | --- |
| DBSF | v1.11.0 | Correct |
| RRF `k` | **v1.15.4** | **Wrong, says v1.16.0** |
| RRF `weights` | v1.17.0 | Correct |
| MMR | v1.15.0 | Correct |
| Query-less prefetch scores 1.0 | v1.16.0, PR 7347 | **Undocumented** |
| `memory` placement, deprecating `on_disk`, `on_disk_payload` and `always_ram` | v1.19.0 | Correct |

Latest release v1.19.0, 2026-08-05.

### Cross-Encoders

Query and candidate go through one transformer as a single sequence, with the score read off `[CLS]` (Nogueira and Cho, arXiv:1901.04085, section 2). There is no per-document representation to index in advance, so every candidate costs a forward pass at query time. Phrase this as the mechanism; "cross-encoders cannot do first-stage retrieval" is a consequence, not a quotable claim. `[CLS]` is BERT-family and `bge-reranker-base` is RoBERTa-family, so in prose say a classification head reads out one score for the pair.

All three models truncate at 512 tokens over the pair with `longest_first`, so a long query takes the budget the document needed. Read it off the loaded model: `TextCrossEncoder(...).model.tokenizer.truncation`.

MS MARCO passage Dev: BM25 MRR@10 16.7, BERT-Large cross-encoder 36.5 (Table 1). Cost and quality do not move together, from sbert.net's cross-encoder page on the same benchmark:

| Model | Docs/sec | MRR@10 |
| --- | --- | --- |
| TinyBERT-L2 | 9,000 | 32.6 |
| MiniLM-L6 | 1,800 | 39.0 |
| electra-base | 340 | 36.4 |

MiniLM-L6 beats electra-base on quality and is five times faster, which is why part 5 organizes on candidate count rather than model size. E4 tests whether that reproduces on our corpora.

FastEmbed cross-encoders: `Xenova/ms-marco-MiniLM-L-6-v2`, `Xenova/ms-marco-MiniLM-L-12-v2`, `jinaai/jina-reranker-v1-tiny-en`, `jinaai/jina-reranker-v1-turbo-en`, `BAAI/bge-reranker-base`, `jinaai/jina-reranker-v2-base-multilingual`. The last is CC-BY-NC-4.0 and cannot appear in a commercial example. Re-verify the list at drafting time, it changes.

### Late Interaction

MaxSim over token embeddings (Khattab and Zaharia, arXiv:2004.12832, section 3.1). As a reranker, ColBERT is over 170x faster and uses 14,000x fewer FLOPs than a BERT cross-encoder at MRR@10 34.9 against 34.7. Storage is the price: 9M MS MARCO passages at 128 dimensions need 286 GiB, or 54 GiB at 48 dimensions; ColBERTv2's residual compression cuts a further 6 to 10x (arXiv:2112.01488).

**Reranking does not avoid that storage.** Section 3.4 saves the document representations to disk and section 3.5 loads them back to rerank, and the 170x latency "subsumes the entire computation from gathering the document representations". What reranking drops is the graph over them: Qdrant's multi-stage docs say to set `m=0` on a rescoring-only multivector, "since rescoring does not use the HNSW index". The compute saving is the real one and it is the claim to make. Out of domain ColBERTv2 wins 22 of 28 tests; on Natural Questions nDCG@10, DPR-M 39.8, ANCE 44.6, ColBERT 52.4, ColBERTv2 56.2.

### Fusion Families

From Bruch, Gai, and Ingber, arXiv:2210.11934, unless noted.

| Family | Needs | Failure mode |
| --- | --- | --- |
| Reciprocal rank fusion | Ranks only | Discards score magnitude; a tuned `k` overfits its domain |
| Convex combination / linear | Comparable score scales | Unnormalized ranges distort it, unbounded BM25 against bounded cosine |
| Normalized score fusion | Scores plus a normalizer: min-max, theoretical min-max, z-score | Per-query min-max moves with the query |
| CombSUM / CombMNZ | Comparable scores plus a cutoff | Rewards appearing in more lists over scoring higher (Fox and Shaw, via Cormack et al. 2009) |
| Learned fusion | Labeled training queries | Same out-of-domain overfitting as a tuned RRF |

**The Bruch result, precisely.** Nine datasets, MS MARCO passage v1 in-domain plus eight BEIR sets zero-shot, measuring NDCG@1000 and Recall@1000. Convex combination "significantly outperforms RRF on all datasets in terms of NDCG". **Note the depth: @1000, not @10.** Our numbers are at 10, so the two are not comparable.

### Matryoshka

One embedding whose first m dimensions are each as accurate as a natively trained model of that size (Kusupati et al., arXiv:2205.13147). Text-domain cost, `nomic-ai/nomic-embed-text-v1.5` model card, MTEB average by dimension: 768 gives 62.28, 512 gives 61.96, 256 gives 61.04, 128 gives 59.34, 64 gives 56.10. A 12x cut from 768 to 64 costs 6.18 points; a 3x cut to 256 costs 1.24.

### Metrics

- **nDCG@k**: graded relevance, log discount, normalized against a perfect ranking (Manning, Raghavan, Schutze, section 8.4). Use when relevance is graded and several documents matter differently.
- **MRR@k**: mean of one over the rank of the first relevant result. From TREC-8's question answering track (Voorhees, 1999). Use when a query has essentially one right answer.
- **Recall@k**: share of relevant documents inside the top k. Use for first-stage retrieval. Meaningless when relevant documents per query far exceeds k, as on WANDS.
- **MAP**: mean of average precision, assumes binary relevance. Use when many documents are relevant and both count and position matter.

## 7. Corpora

Loaded and cached by the harness; `experiments/fusion/manifest.json` carries pinned URLs, SHA256s, sampled ids, and measured `avg_len`.

| Corpus | Docs | Queries | Relevant per query | Job |
| --- | --- | --- | --- | --- |
| SciFact | 5,183 | 300 | 1.1 | Legs close; carries the rebuild study and breadth sweep |
| ArguAna | 8,674 | 1,401 | 1.0 | Dense-favoring, 168-word queries; needs self-retrieval exclusion |
| WANDS | 42,994 | 480 | 358.9 | Sparse-favoring products; carries the exhibit query |
| CodeSearchNet-python | 50,000 | 1,000 | 1.0 | Docstring to code; lowest leg agreement |
| DBPedia-entity | 100,000 | 400 | 38.2 | Graded labels, many relevant per query |

**Do not re-propose.** MS MARCO and Quora are non-commercial, NFCorpus academic only, TREC-COVID mixed, FiQA unlicensed, Home Depot blocks redistribution.

### What These Corpora Cannot Support

Four limits. Each bounds a claim rather than invalidating one; every number in 3a stands. Any part quoting these corpora carries the relevant line.

**One dense model across five domains.** Every corpus is retrieved with `all-MiniLM-L6-v2`, a small general-purpose model, against arguments, products, source code, scientific claims, and entities. A leg comparison measures the interaction of one model with one domain, not a property of the domain. This is why part 2 asks what a second leg contributes rather than which leg wins. Fixing it means re-embedding five corpora with a second model, which is the most expensive thing anyone could propose here and is not worth it. State the model with every leg number.

**CodeSearchNet is a manufactured task with single-positive labels.** `corpora.py:205-245` makes each docstring query's only relevant document the function it came from, and strips the docstring by verbatim `code.replace`. Function names, identifiers, and comments survive, so lexical residue can point at the target, and any equivalent implementation elsewhere in the 50,000 is scored irrelevant. Its numbers describe this construction, not code search in general.

**DBPedia keeps every judged document and fills to 100,000 with reservoir-sampled distractors at seed 42.** Far denser in relevant documents than the real 4.6M-document corpus, which changes what the legs compete against. Absolute scores are easier than production and corpus-property conclusions do not transfer. Latency at a given document count is unaffected, so E3 can use it.

**WANDS caps Recall@k per query**, at an average of 358.9 relevant documents per query. The bound applies one query at a time, so the macro average can sit above it.

Five ArguAna queries were dropped because its own qrels reference five documents its corpus does not contain.

## 8. The E7 Measurement Record

**E1 to E6 are done.** Their results are the rows in 3a, the code is in `experiments/fusion/study.py`, the artifacts are in `experiments/fusion/study/`, and the claim trail is in `grounding.md`. Do not re-run them. If one ever has to be re-run, 4d holds the two constraints that cost the most to rediscover: `e4_score` caches per corpus and model so it resumes rather than restarting, and `e3_latency` needs an idle machine.

Nothing is queued for measurement. E7 was the last one and it ran on 2026-08-12; this section is its record, kept because the measurement discipline in it is expensive to reacquire and because it is what defends the RAM article's numbers under review. A Matryoshka sweep stays unrun: it needs a rebuild per dimension, and section 6 already has per-dimension numbers from a primary source.

**E7. The RAM boundary and the price of recovery, two experiments behind one article. Run on 2026-08-12; the results are below.** Adversarially reviewed and overlap-reviewed on 2026-08-11, then reviewed three more times during execution; the constraints below are those reviews' output and are not optional. Where a constraint was changed, the change and its date are recorded with it.

**The article's spine, settled by the overlap review.** Quantization type selection is published territory: [the TurboQuant article](/articles/turboquant-quantization/) (2026-05, v1.18) benchmarks recall for float32, SQ, BQ and TurboQuant across ten datasets and carries the pick-a-storage-class guidance. The RAM article does not re-litigate it; it cites it and owns what that article measures nowhere: what happens at the placement a reader actually runs once the collection outgrows RAM. `rescore=True` is the knob every quantization guide says to flip, and with `cold` originals it reads disk on every query, so quality recovery and its latency price are the same setting seen from two sides, and the price depends on the placement and on which side of the RAM limit the collection sits. No existing content measures that interaction; the 2022 memory-consumption article predates memory tiers by four years and this piece supersedes its territory.

**One collection, two container memory limits. Dylan's simplification, 2026-08-11, replacing the two-ingestion design.** The regime boundary is relative, so the fits-in-RAM and exceeds-RAM regimes come from running the same collection under two Docker memory limits, not from ingesting a corpus at two sizes. That removes the corpus-size confound between regimes: same data, same graph, same labels, and RAM is the only variable.

**The corpus is DBPedia-entity's full 4.6M-document BEIR corpus**, of which the harness's other collection is the 100k sample: same queries, graded labels, license handling, and embedding model already in `experiments/fusion/`. At 384 dimensions the originals are about 7 GB of float32, so the boundary is real on a laptop.

**Dense only. No sparse prefetch, 2026-08-11.** The knob under test acts on dense vector storage and on the quantized copy of it, which section 8 already scoped the claims to. A BM25 prefetch in the same request adds about 1.5 GB to the working set, and that memory competes for the same page cache the experiment is trying to starve, so under the tight limit the evicted structure could be the sparse index rather than the originals. Fusion would also hide the effect on the metric, because a sparse prefetch rescues documents the dense side lost. E7 therefore measures the dense stage on its own, and the article hands the reader the fused check rather than claiming their fused latency is unaffected: the sparse stage does the same work either way, and it shares the page cache, so the reader picks a dense placement and recovery setting here and then reruns their own fused request to see the end-to-end number.

**What gets recorded and what gets published are different lists.** Everything in this section is recorded, because the runs that produce it are runs the matrix needs anyway. The article publishes one recovery curve, one placement and latency comparison, and the reader's checks. Build time, optimization time, restart-to-first-query, warm-up behavior, the cgroup counters and the per-stage candidate breakdowns are validity evidence and diagnosis, and they ship in the artifact rather than in a table. Section 12 already forbids a table that does not change what the reader does.

**E7a, quality on labeled queries.** The published TurboQuant numbers are recall against float32 on unlabeled datasets; the article's claims need nDCG on labels, and recovery measured for the configurations the article recommends.

- Cells, fixed up front: float32; int8 scalar; TurboQuant `bits4`; TurboQuant `bits1`. Each quantized cell runs `rescore` off, and `rescore` on at `oversampling` 1, 2, and 4. Pre-registered, no post-hoc additions. `bits4` is in because it is the v1.18 memory-win recommendation over int8 at half the storage, and a memory article that skips the newest release undersells it. Vanilla BQ is cut: since 1.18 the recommendation at its storage class is TurboQuant, the published comparison already exists, and the benchmark has to measure the configuration the article recommends.
- Quality does not depend on placement, so these cells run once, at the default placement, and only latency runs per placement in E7b.
- Everything else held fixed across cells: `hnsw_ef`, `limit`, and the candidate count each stage sees. Record the number of originals a rescore actually rereads per query, which is `oversampling` times the dense stage's limit rather than the series default of 200.
- The reference is an exact search (`exact=True`) top-k on a sampled query set, so float32's own ANN recall is known and a quantized result near float32 cannot hide that both sit far from exact. Quality separates into three numbers, not one: how much of the exact top-k the ANN candidate set reaches, how much of that the quantized ranking keeps, and what rescoring puts back. nDCG@10 rides alongside all three.
- Selection and reporting on different queries, per section 12: pick the deployment point, meaning storage class plus recovery setting, on one half; report every delta with a paired interval on the other half.
- **The decision rule is pre-registered with the cells**, because a cell list alone lets "recommended" mean the winner of a 200-query tournament. The rule runs on a declared tolerance rather than on an interval that contains zero, since a wide interval would otherwise turn "no difference detected" into "equivalent": take the smallest storage class whose held-out nDCG@10 sits within 0.01 of float32's and whose exact top-10 retention sits within 0.02, and at that class the lowest `oversampling` clearing the same two bars. Report the paired 95% interval beside every pick.
- **If no cell clears the tolerance, say so and route the reader.** The rule has to be able to return nothing, or it silently promotes whatever came closest. The three routes are a larger storage class, more candidate depth by the sibling article's procedure, or accepting the measured loss with the number in hand.
- Four storage classes run, and one recovery curve publishes. The four exist to pick the deployment point and to check the published ladder holds on labeled queries; publishing a second ladder redoes the TurboQuant article's job. The article cites that ladder, states in one sentence whether it reproduced here, and spends its figure on recovery at the selected class.

**E7b, placement and the latency price of recovery.** Placement is per structure, six of them, and is not one knob. The claims scope to dense vector storage and quantized vectors; graph, payload and payload-index placement stay at their defaults, are recorded with every run, and the article states them.

- **Six cells rather than twelve, and five rounds rather than the three registered. The cell cut was made on 2026-08-12 before any E7b cell ran, on measurement-validity grounds rather than on any E7b result.** Twelve single-pass cells on a laptop VM manufacture more precision than the machine supports, and the rows cut are the symmetric ones that change nothing for a reader: `rescore` off at a placement whose entire subject is what `rescore` reads. The spread across independent starts is the honest error bar on this stack, so repeats buy more than rows do. `cells.json` still registers `repeats: 3`; the run went to five rounds because the consistency check below rejects runs, and the artifacts carry rounds 0 to 4 for all six cells. Say five rounds, never three.

| Limit | Originals | Quantized | `rescore` | What it decides |
| --- | --- | --- | --- | --- |
| 12 GiB | `cached` | `pinned` | off, on | The no-pressure reference, and what rescore costs when everything fits |
| 4 GiB | `cached` | `pinned` | off, on | Whether rescore is still worth it at the limit the reader runs at |
| 4 GiB | `cold` | `pinned` | on | Whether caching the originals is necessary once rescore is on |
| 4 GiB | `cold` | `cached` | on | What not pinning the structure the search itself reads costs |

- Quantized placement is written out in every cell. Leaving it at its default would not hold it fixed, because the default is `pinned` beside in-RAM storage and `cold` beside on-disk storage (section 6), so it moves whenever the originals do. The quantized cells use the deployment point E7a selected. The two regimes' latency figures are never pooled.
- The four rules those six cells support, which are what the article teaches: pin whatever the initial search reads, test `rescore` at your own memory cap rather than a generous one, spend RAM caching originals only if it moves your tail, and treat `rescore` off as a control rather than a configuration to benchmark everywhere.
- **These are placement policies, not observed states, and the rule keys off what was observed.** Under the tight limit `cached` originals are evicted anyway, so a rule written on the configuration label would be wrong for the reader who sets that label and gets eviction. Every row carries its measured refault and block-read counts, and the article's rule reads off those rather than off the setting.
- **The `rescore` off rows are the negative control.** With no rescore there is no reread of an original, so moving originals between `cached` and `cold` should not move latency. If it does, the treatment is confounded and the cold rows do not carry a claim. The control ships as a sentence, not a table.
- **Configure and measure in different containers.** Changing a placement starts an optimizer pass whose transient spike exceeded the 12 GiB limit and had the kernel kill the server twice. Configuration now happens on a roomier container, and the measured container is started fresh at the cell's own limit with its configuration already correct. That also keeps optimizer work out of the measured window, which would have contaminated the latency even when it did not kill anything.
- **Readiness is a successful query, not a status field.** This collection reports `grey` while its shard is `Active` and serving. `Grey` means "optimizations are possible but not triggered" (`lib/collection/src/operations/types.rs:66`), so it is a settled state after a configuration change, and waiting for the literal `green` waits for something only an update operation triggers. Two separate hangs came from asserting on how a value prints rather than what it is: `str(shard.state)` is `Active`, not `ReplicaState.ACTIVE`. Compare enum values.
- **Every cell starts from a controlled cache state, and this is not optional.** Page cache is charged to the cgroup that first faults a page in, and the charge outlives the container that made it, so recreating a container over a warm volume hands it gigabytes of resident pages it is never billed for. Measured on 2026-08-12: reopening the 4 GiB limit that way, the cgroup reported 119 MB of file cache while the process held 9.49 GB, `memory.events` recorded no pressure at all, and 400 queries ran in 2.9 s. From a controlled cache state the same limit reported 4.29 GB of 4.29 GB used, 37,888 limit events, 6,065,509 refaults, and 158.1 s. Dropping the cache while the server still has the files mapped does not work either, because `drop_caches` frees only clean unmapped pages. The sequence is stop the container, `sync`, drop the VM page cache, check it fell to its floor, then start a fresh container. `e7.py cold <limit>` does exactly that and refuses to continue if the cache did not drop.
- Latency protocol. Every cell begins from the controlled cache state above and receives the same fixed warm-up pass before its measured pass, so "warmed" means a stated number of passes rather than whatever the previous cell left behind. Order is randomized within a round, seeded by the round, so a round is a complete replicate and no cell always follows the same neighbour. Settings are never randomized inside one long-lived container, because under a tight limit the previous cell's pages decide which of this cell's pages survive. One dense request per query, on an idle machine per 4d. A cold-start arm is no longer separate, because every cell now starts cold by protocol. **Superseded, kept only to explain the shape of the artifacts:** cold originals with `rescore` off and on under the tight limit, one setting per container boot, no randomization, and the host file cache dropped with `purge` before each boot, because randomizing settings inside a live server warms the pages the next setting reads and a container restart on its own leaves both cache layers intact. Running cold start across the whole matrix would double the results surface to answer a question the article does not ask. With 400 queries the cold arm is 400 observations and no more, so it reports the first-pass distribution, p50 and p95 with bootstrap intervals, and paired per-query differences. No p99.
- **Every run is instrumented and any run that fails the gate is excluded rather than read as a slow tier.** Recorded per run: cgroup `memory.current`, `memory.peak`, `memory.events`, `memory.stat` including file cache and refault counters, cgroup `io.stat` for bytes actually read from the block device, the Qdrant process RSS, host swap before and after, and the Docker memory limit. A run showing an OOM kill, sustained `memory.high` pressure, or host swap growth is dropped.
- Memory ships as named measurements, never as one "footprint": container RSS, cgroup `memory.current`, disk footprint, peak during build and optimization, and steady state after the optimizer converges, with the method stated and the lifecycle point labeled.
- **Residency is measured per structure from the filesystem, not read off a placement label or a telemetry field.** Qdrant writes each structure to its own file inside a segment: `vector_storage-dense/matrix.dat` is the float32 originals, `vector_storage-dense/quantized.data` the quantized copy, `vector_index-dense` the HNSW graph, alongside `payload_storage` and `id_tracker.mappings`. Sizing those against the cgroup's file page cache says how much of each structure is resident, which is what a cell needs and what `/telemetry` does not provide. **Report allocated blocks, not apparent size:** payload storage is preallocated sparse, and at 100,000 points it measures 242 MB apparent against 14.5 MB on disk, so `du -sb` would have published a footprint 2.4x too large.
- Operational costs ship with the matrix: build and optimization time per cell, restart-to-first-query time, and warm-up behavior after a restart, because section 4b makes build time and storage first-class axes. All three are recorded during runs the matrix needs anyway.

**What the result can claim, and the stack it is true of.** Qdrant runs in Docker Desktop on macOS, so the storage sits in a named volume inside a Linux VM whose disk image is a file on APFS behind the host page cache. A cgroup limit does force the guest to evict the mmapped originals, which is the mechanism the experiment turns on, and cgroup `io.stat` shows whether that eviction produced real block reads. What the stack cannot show is a bare-metal NVMe read, so the latency figures are named as what they are, a guest cache miss on a stated stack, and the `io.stat` bytes ship beside them so a reader can see the miss was real. Dropping the host cache before every cold boot keeps macOS from serving the read. The reader acts on the shape, which is what `rescore` costs when the originals are not resident and how that shape changes across the RAM boundary, not on the absolute milliseconds. Capacity planning and enterprise tail-latency claims are out of scope; section 3d's transfer table applies and the article carries the same split. The decision procedure, measure against exact, pick the storage class from the published ladder, verify recovery at your own placement, is the scale-free part and the part the enterprise reader keeps.

**Machine budget and the two limits, measured 2026-08-12.** Apple M5 Pro, 24 GB, Docker Desktop VM at 16 GiB with 1 GiB of VM swap, storage on the internal SSD through a named volume, which is ext4 on `/dev/vda1` inside the VM. The collection is 4,635,922 documents, dense only, uploaded in 784 s and indexed in 541 s across 7 segments.

Measured on-disk footprint, allocated blocks per structure: originals 7.121 GB, HNSW graph 0.373 GB, payload 0.668 GB, id tracker 0.060 GB, so 8.222 GB across the five structures the claims scope to. Whole storage is 8.783 GB, the extra 0.56 GB being the write-ahead log and segment metadata, and the whole-storage figure is the denominator for any residency share. The server's own heap sits at about 1.9 GB of anonymous memory.

**The limits are 12 GiB for fits and 4 GiB for does not fit**, each measured from a controlled cache state with float32 originals `cached` and no quantization, which is the state a reader arrives in.

Every row starts from a controlled cache state unless it says otherwise, and the two rows carrying float32 and int8 together are the state every cell runs in.

| Limit | Contents | `memory.current` | Limit events | Page cache | Warmed pass, mean |
| --- | --- | --- | --- | --- | --- |
| 12 GiB | float32 and int8 | 11.81 GB, steady | 0 | 7.91 GB | 4.4 ms, p95 5.6 |
| 4 GiB | float32 and int8 | 4.29 GB, pegged | 15,807 | 0.53 GB | 18.4 ms, p95 22.8 |
| 12 GiB | float32 | 9.65 GB, steady | 0 | 7.64 GB | 3.5 ms |
| 10 GiB | float32 | 9.66 GB, steady | 0 | 7.64 GB | 9.0 ms |
| 4 GiB | float32 | 4.29 GB, pegged | 37,888 | 2.44 GB | 395 ms |
| 10 GiB | float32, read straight after the build | 10.53 GB, pegged | 17,227 | 7.55 GB | 89 ms |

**The top two rows are the experiment's regimes and the gap between them is the article's subject.** With int8 pinned, the same collection under a limit that cannot hold it answers in 18.4 ms against 4.4 ms, a factor of 4.2, and the page cache holding the originals collapses from 7.91 GB to 0.53 GB against 7.121 GB of originals on disk. That gap exists before `rescore` is varied at all, which is what makes the rescore cells worth running: they ask what recovering the quality costs on top of a boundary the reader has already crossed.

**The two 10 GiB rows disagree because a reading taken straight after a build is a reading of the build, not of the collection.** The cgroup counters run from container boot, so the limit events and most of the refaults in that row belong to the ingest: 17,227 events and 3,602,055 refaults were already on the clock before the 400 queries started, and the pass itself added 479,445 refaults and no further limit events. Restarting the same collection under the same 10 GiB limit from a controlled cache state settles at 9.66 GB with no limit events at all.

**A build fills whatever ceiling it is given, so `memory.peak` during one is not a capacity signal.** Rebuilding the collection at 12 GiB peaked at 12.885 GB, which is the limit exactly, with 6,441 limit events, the same shape as the 10 GiB build's 10.740 GB and 17,227 events. Both builds completed with every vector indexed, and the roomier one was slightly faster: 730 s upload and 511 s indexing against 784 s and 541 s. The optimizer's page cache expands into free memory and is reclaimed harmlessly, so hitting the ceiling says the ceiling was reached and nothing about what the build required. **The number to read is steady state after a controlled restart, and it is 9.65 GB at both limits.** Every memory figure the article publishes therefore names its lifecycle point, and no build peak is quoted as a capacity requirement.

**12 GiB is the fits limit because of what the cells add, not because of the build.** Steady state is 9.65 GB with float32 alone, and every E7b cell also holds a quantized copy. Measured with int8 present, which is the largest of the three quantized classes at 1.799 GB on disk: steady state is 11.81 GB against the 12.885 GB limit, with no limit events and no refaults, and the quantized copy shows up in anonymous memory rather than page cache because `pinned` holds it in RAM, taking anon from 1.90 to 3.69 GB. 10 GiB would not hold that. The same collection under the 4 GiB limit sits pegged with anon at 3.67 GB, so the pinned quantized copy is held and the originals are what gets evicted, which is precisely the placement the cells are built to compare. The headroom at 12 GiB is 1.07 GB in the worst case and larger for TurboQuant `bits4`, whose quantized copy is roughly half the size.

Query timings from that state, at the cells' depth of 200: the first pass after a controlled cold start averages 21.3 ms with a p95 of 39.2 ms, and the second pass averages 4.4 ms with a p95 of 5.6 ms. Both passes ship as artifacts (`e7/pass-*.json`) rather than as terminal output, so every published timing has a file behind it.

**The E7 container needs about 13 GiB of the VM's 16 GiB, which leaves `fusion-qdrant`'s 2 GiB as the only other resident tenant.** Everything else stays stopped for the duration.


**The article teaches; the numbers earn the guidance. Dylan's call, 2026-08-11.** The RAM article is not a benchmark report on our corpus. It is built around the decisions the reader faces, in order: is the collection near its RAM limit, which structure placement to run, whether to turn `rescore` on and at what `oversampling`, and how to verify each answer on their own collection. Every E7 number appears only to back a rule, calibrate an expectation, or demonstrate a check the reader then runs themselves, the way the `hnsw_ef` section of part 3 does. A table that does not change what the reader does gets cut. The TurboQuant article is a benchmark report because that is its job; this article's job is the decision procedure.

**Overlap register for the RAM article.** Cite, never re-teach: the TurboQuant article for the storage-class ladder and recall numbers, [scalar quantization](/articles/scalar-quantization/) and [binary quantization](/articles/binary-quantization/) as background, the [capacity planning](/documentation/capacity-planning/) and [memory tiers](/documentation/ops-configuration/memory-tiers/) docs for formulas and the placement reference. The one piece it overlaps on purpose is the 2022 memory-consumption article, which it supersedes.

**E7a, quality. Reported on the held-out half of the 400 queries.** The reference is a brute-force exact float32 search, so a loss splits into what the HNSW graph missed and what the quantized ranking then reordered. Retention is the share of the exact top 10 the cell's own top 10 kept. Every figure below is the reporting half, recomputed from `results/e7a.json` and locked by `verify_articles.py`.

| Cell | nDCG@10 | Retention |
| --- | --- | --- |
| float32, re-measured 2026-08-13 | 0.3103 | 0.957 |
| TurboQuant `bits4`, `rescore` off | 0.3218 | 0.918 |
| TurboQuant `bits4`, `rescore` on x4 | 0.3238 | 0.993 |
| TurboQuant `bits1`, `rescore` off | 0.2786 | 0.605 |
| TurboQuant `bits1`, `rescore` on x1 | 0.3114 | 0.951 |
| TurboQuant `bits1`, `rescore` on x2 | 0.3128 | 0.977 |
| TurboQuant `bits1`, `rescore` on x4 | 0.3178 | 0.988 |

**The E7a float32 row is int8 without rescoring, and the int8 rows are cut. Found 2026-08-12 by a review pass, mechanism confirmed.** `update_collection(quantization_config=None)` in the python client omits the field rather than clearing it, so the float32 cell inherited the int8 configuration that the Phase 1 memory work left on the collection at 03:16, and scored against it with `rescore` unset, which resolves to false for scalar quantization. The evidence is three-way: `results/e7a.json` has byte-identical `per_query` values for the float32 and int8 `rescore` off cells across all 400 queries, `memory-e7a-float32.json` records a 1.799 GB quantized copy on disk at 09:48:12, and int8's `apply_seconds` is 30.0, the settle loop's floor, against 210.1 and 270.5 for the TurboQuant classes, so nothing was building between them. `_settle` cannot see a quantization build: it polls `optimizer_status` and `indexed_vectors_count`, and this collection reports a settled state before the build starts.

What that does and does not touch. The int8 `rescore` on rows are valid int8 measurements, since int8 was fully built the whole time; they are cut from the article because a ladder is the TurboQuant article's job, not because they are wrong. The `bits4` and `bits1` rows are clean. `exact.json` is clean, because `is_quantized_search` returns false when `exact` is set (`lib/segment/src/index/vector_index_search_common.rs:15-25`), so every retention denominator is a genuine float32 full scan. E7b is clean, because it writes both placements explicitly and asserts the read-back.

**The re-run closed it on 2026-08-13, and the way it had to be done is the reusable part.** `quantization_config=models.Disabled.DISABLED` clears the collection config and leaves `quantized.data` in every segment, and the search reads the quantized storage off the segment rather than off the config, so clearing the config is not enough. What works is `QuantizationSearchParams(ignore=True)` on the query, which is what `is_quantized_search` keys off (`lib/segment/src/index/vector_index_search_common.rs:15-25`). `e7_run.py float32` does that, asserts the ranking differs from the int8 row so the flag cannot silently do nothing, and writes `results/e7a_float32.json`. Anything comparing against float32 on this collection uses that file.

**What the corrected reference changed.** True float32 lands at 0.3103 nDCG@10 and 0.957 retention on the reporting half, against the 0.3216 and 0.953 the mislabeled row reported. Two consequences. The nDCG column cannot separate the cells at all: every cell except `bits1` without rescoring sits within 0.014 of float32 and several are nominally above it, so retention is the column that carries the argument and the article says so. And the registered rule's pick now verifies on the reporting half: `bits1` with rescoring at `oversampling` 1 is 0.0011 better than float32 on nDCG@10 there, with a paired 95% interval from -0.003 to +0.005 and retention 0.006 below. The earlier "selected but not confirmed" reading was an artifact of comparing against int8. **Still never write "equivalent to float32"**: the interval bounds the difference at under 0.005 either way, which is what to write instead.

**`rescore` only earns its keep at the aggressive storage class.** At `bits4` the ranking is already within noise of float32 with `rescore` off, so the knob buys retention nobody sees. At `bits1` the collection keeps 60% of the exact top 10 without it and 95% with one pass at oversampling 1. That is a more useful finding for a reader than "always turn it on", and it is the article's spine on the quality side. Note that `bits4` with `rescore` off retains 0.918 against float32's 0.957, so it would not clear the registered 0.02 retention tolerance; scope any `bits4` equivalence claim to nDCG.

**The registered rule selected `bits1` with `rescore` at oversampling 1 and the held-out half confirms it**, against the corrected float32 reference above. `decision.json` carries the applied rule and was re-run on 2026-08-13; it now reads `clears_on_report: true`.

**The rule's own text is ambiguous and that is recorded rather than silently resolved.** It says "held-out nDCG@10 within 0.01" and, next sentence, "selection on one query half, reporting on the other". Against the mislabeled reference those two readings picked different configurations, which is how the ambiguity surfaced; against the corrected reference they agree. The reading used is the one section 12 requires, selection on the selection half. A future rule should choose on a tuning set, validate on a separate one, and report the uncertainty, rather than treat a point-estimate cutoff as proof of equivalence.

**E7a's latency column is not published.** Those passes shared one long-lived container, so the cache carried between them, and the non-monotonic oversampling timings are the symptom. E7a's relevance and retention results are unaffected. All latency comes from E7b.

**E7b, placement and latency. 2026-08-12.** Thirty E7b runs, of which 20 pass the block-read consistency check, across six cells and five rounds. Latency is p50 of the measured pass, median across comparable runs, with the range beside it.

**The read column covers two passes, not one.** `e7_run.py:306-309` takes the `before` snapshot ahead of the warm-up pass and the `after` snapshot after the measured pass, so each cell's read figure spans 800 query executions. Dividing it by 400 overstates the per-query read, and the warm-up pass reads more than the measured one, so dividing by 800 is not a per-query figure either. What the column supports is the ratio between cells, and the amplification against the bytes a rescore needs: 2.98 GB read against 246 MB of rescored vectors under the tight limit, about 12x. The same correction applies to any cgroup counter quoted from these runs, which is why the refault figure is a `before` to `after` delta of 613,388 rather than the post-pass reading of 619,538.

| Limit | Originals | `rescore` | Runs | p50, median [range] | GB read |
| --- | --- | --- | --- | --- | --- |
| 12 GiB | `cached` | off | 5 | 3.8 ms [3.1, 4.3] | 0.30 |
| 12 GiB | `cached` | on | 2 | 4.1 ms [3.8, 4.3] | 0.52 |
| 4 GiB | `cached` | off | 3 | 4.3 ms [4.0, 4.3] | 0.30 |
| 4 GiB | `cached` | on | 4 | 43.4 ms [42.7, 47.3] | 2.98 |
| 4 GiB | `cold` (quantized `cached`) | on | 3 | 45.7 ms [42.8, 52.8] | 3.02 |
| 4 GiB | `cold` (quantized `pinned`) | on | 3 | 52.0 ms [43.8, 56.1] | 3.50 |

**The negative control holds, which is what licenses the rest.** With `rescore` off there is nothing to reread, and latency is 3.8 to 4.3 ms and reads are 0.30 GB in both regimes. The memory limit does not move latency by itself.

**`rescore` is free when the collection fits and costs ten times the query when it does not.** 4.1 ms against 43.4 ms, and the read column says why: 0.52 GB against 2.98 GB pulled off the block device for the same 400 queries.

**The memory limit decides, and the placement setting barely does.** Moving the originals from `cached` to `cold` under the tight limit takes 43.4 ms to between 45.7 and 52.0 ms, with ranges that overlap. That is the point the article turns into advice: under a limit that cannot hold them, originals set to `cached` are evicted anyway, so a reader who leaves them `cached` hoping to keep `rescore` cheap gains almost nothing. Placement is a request, and the limit is the answer.

**Ten runs are excluded by a stated rule, not by judgement.** `e7_run.py check` compares each run's block reads against its cell's median and drops any that differ by more than 40%. The split is eight whose reads disagreed with their siblings, in both directions, and two whose counter reset when the container was recreated mid-reading; `e7b_check.json` carries the verdict per run and is the only place to read this from. Three of the eight read roughly half what their siblings read and answered in about a fifth of the time, so without the check they would have been averaged in and dragged the headline down. The rule has one known weakness: on cells whose reads are near zero, a 40% relative band is too tight, which is why the fits and `rescore` on cell keeps only two runs. Its five raw runs all sat between 3.4 and 4.9 ms, so the conclusion does not rest on the exclusion.

**The code.** `e7.py` owns the corpus, the embedding pass, the container, the ingest and the memory measurements; `e7_cells.py` is the registration; `e7_run.py` runs it as `exact`, `e7a`, `decide`, `e7b`, `check`. Artifacts land in `experiments/fusion/e7/` and `e7/results/`. Measured costs: the exact float32 reference is 80 ms per query fully cached and 2.0 s per query when the originals are not resident; applying a quantization class to the built collection takes minutes against the 21 the full ingest takes; one E7b cell takes 50 to 95 s end to end, so a round of six is under ten minutes.

**Budget: two to four days.** One overnight embedding pass for the full corpus, new harness code in `experiments/fusion/`, the E7a sweep, and the E7b placement-by-rescore-by-regime latency runs. The two-limit design cut the second ingestion the earlier estimate priced in. Dropping the sparse prefetch cuts the BM25 pass over 4.6M documents from the ingest.

**Milliseconds are evidence for one machine; the finding is the paired change.** Absolute latency from a laptop VM is not a target a reader compares against, so each cell reports the paired relative change against its pair, with p50, p95 and the spread across the three independent starts. The spread is the error bar, and on a machine we cannot fully quiet it is the only honest one. Every figure carries the machine it came from, and none of the ratios is offered as portable to other hardware.

**Measured cost of the run, 2026-08-12: one cell takes 59 s** at the 4 GiB limit, made of 7 s to stop, drop the page cache and come back green, 30 s to apply the configuration and settle, and two query passes. The 12 GiB cells are slower to start because they read about 8 GB back on load. A full round of six cells is roughly 10 minutes, and the three rounds need about half an hour in total. Rounds do not have to be contiguous: `e7_run.py e7b` writes after every cell and resumes at the one it stopped on, so the run fits into whatever quiet stretches the machine has.

**The headline is a shape, not a millisecond.** On this stack an absolute "rescore costs X ms" does not transfer, so the finding the article carries is the shape and the mechanism behind it: moving originals changes nothing while `rescore` is off, turning `rescore` on against cold originals puts real block reads on the query path, and the quality those reads buy flattens as `oversampling` rises. The measured bytes earn the causal claim and the milliseconds calibrate one worked example. The reader's action is to find their own first point that clears their relevance and latency budgets.

**What the two Codex adversarial reviews changed, 2026-08-11.** Six corrections from the first, all applied above. The sparse prefetch is gone, because it competes for the page cache the experiment starves and fusion hides a dense quality loss. E7b gains a third placement cell, because `cached` against `cold` plus `pinned` moves two things at once. Cold and warmed arms run under different protocols, because randomizing settings inside a live server warms the next setting's pages. Every run carries cgroup `io.stat`, `memory.events` and refault counters, and a run that fails that gate is dropped instead of read as a slow tier. E7a's cell list gains a decision rule. The latency claim is named for the stack it is measured on. Two of the review's points were checked and not taken: it asked to cut float32 `rescore` cells that were never in the list, and it proposed gating on a Qdrant memory endpoint that reports expected cache and resident page cache per component, which v1.19.0 does not have. `/telemetry` carries jemalloc totals, and the per-segment `ram_usage_bytes` and `disk_usage_bytes` fields read 0 on the running build.

The second review ran on the revision and found one defect in it: leaving quantized placement at its default does not hold that structure fixed, because the default follows the originals, so all three E7b cells now name both placements. It also drew the line between recording and publishing, replaced an interval-based selection rule that would have read "no difference detected" as "equivalent", gave the rule a way to return nothing, cut cold start back to a validation arm, and corrected the claim that a reader's fused latency is unaffected by dense placement, since the two stages share a page cache. Not taken: cutting the four storage classes down to one. They are what picks the deployment point and what checks the published ladder against labeled queries, and the publication discipline above already stops them from becoming a second ladder in the article.

The RAM article owns the memory territory, and part 3's "When RAM Is the Constraint" section was shrunk to a pointer on 2026-08-13, per section 13.

## 9. Setup Values

In `experiments/fusion/manifest.json`. Local Qdrant in Docker `qdrant/qdrant:v1.19.0`, single shard, no quantization, HNSW `m=16` and `ef_construct=100`, `indexing_threshold=1` KB and `full_scan_threshold=10` KB so every corpus searches the graph, dense `sentence-transformers/all-MiniLM-L6-v2` at 384 dimensions cosine, sparse core BM25 with `Modifier.IDF` and per-corpus measured `avg_len`, candidate depth 200, metrics from `pytrec_eval`, tie-break by score descending then point id ascending.

## 10. Artifact Contract

Everything under `experiments/fusion/`. `data/`, `cache/`, and `fused/` are gitignored and regenerate from `download.sh` plus `run.py t1 t3 t5`. `README.md` there has the file map.

Two artifacts need reconciling. `floor/scifact.json` reports `sparse_caches_identical_across_builds: false` while `floor()`'s comment justifies the floor by that flag being true; the reconciliation, that 675 of 59,623 positions differ and every one at a tied score, is in `grounding.md` and belongs in the artifact. And the documentation-fix count disagrees: the file has nine, `grounding.md` says six.

## 11. Writing Rules

- **Every tier 1 knob gets the same four beats in the same order: what it changes, when it applies to you, how to set it, what it costs.** The fourth beat is never "some latency"; it names the axis from 4b and quantifies it wherever a number exists.
- **Every tier 2 knob opens with its gate in the first sentence**, same shape every time, so a reader can skip on one line.
- **Never frame a trade-off knob as a quality knob.** Quantization, Matryoshka truncation, and MMR all reduce retrieval quality by design. Say what they buy.
- **Link for mechanism, not for the action.** The reader acts on the page; the docs carry the parameter surface.
- **Establish that a knob exists before saying which way to turn it.**
- **Coin nothing. Use the name Qdrant uses.** Every parameter, feature, and concept goes by its name in the Qdrant documentation and API: prefetch, fusion, `Modifier.IDF`, filterable HNSW, payload index, candidate. Where a concept has both an academic name and a Qdrant name, the Qdrant name wins in the prose and the academic one appears once, in the sentence that introduces it, so a reader can follow the literature. Do not invent shorthand for a mechanism because the real name is long, and do not carry over vocabulary from another engine: a shard is a shard, not a partition. Coined terms make a reader re-derive the mapping on every reappearance and they do not match anything they will search for later.
- **One name per thing, for the whole series.** A concept that appears in three parts uses one name in all three. This matters most where a table compares several things by name.
- **"Leg" is ours, not Qdrant's.** It appears nowhere in the Qdrant search documentation, which says `prefetch`. All five articles are clean of it; this plan and the notebook are not. Say "the dense prefetch" and "the sparse prefetch" in anything new, and clean the notebook's prose and its dict name when something else takes you into that file.
- **Write for a collection that already exists.** Never open with creating one, and never open with whether to build one. A numbered "decide whether to add X" ladder is the specific shape that cost the retired prefetch article its audience, since that reader made the hybrid decision quarters ago. The fusion article's new opening section is the one place the series now asks a should-you question, and it earns it by answering with a measurement rather than a ladder. Say what their current setup is losing, then teach the knob. The one-sentence functional definitions stay. **"Running hybrid search" is only true of the reader for the fusion article**; the other four assume an existing collection but not a second leg, per the North Star at the top of this plan.
- Draft each opening last. Lead with the reader's problem. No recap sections.
- Title convention: no ordinals, and the title names the reader's problem rather than the API surface. The five titles are recorded in section 13.
- House style: Title Case headings, no em dashes, straight quotes, vector search engine rather than vector database.

## 12. Claim Gates

- **A knob with no number and no citable source** still gets its beats, stated qualitatively. Never invent a number, and never invent a cost.
- **A cost asserted without a source or measurement** is stated as a direction rather than a magnitude. "Adds latency proportional to candidate count" is defensible; "adds about 40ms" is not, unless we measured it.
- **A causal claim needs the property measured, not inferred from the outcome.** If the mechanism is not measured, report the outcome per corpus and stop.
- **A ceiling is not a score.** Any claim about what a knob buys quotes the metric a reader would see. Quote both when the gap is the point.
- **Selection and reporting happen on different queries.** Anything presented as a winner was chosen on one half and measured on the other.
- **The reranking measurement shows no gain:** report it.
- **Corpora disagree:** state the disagreement per corpus. Never say "ordering" when they disagree on it.
- **A comparison count across many arms is an upper bound.** Prefer the split-half result wherever a count currently carries the argument.
- **Any prescription without a disclosed baseline:** cut it.

## 13. Settled Decisions

| Question | Answer |
| --- | --- |
| Independent articles or a consecutive series? | **Independent articles that cross-reference each other**, five at the time of the call and five now, after one was added and later retired. Neil's call, 2026-08-11. The measured coupling was small: only the measurement setup and the ceiling-against-score idea are shared, and both compress to about four sentences per article, roughly 5% overhead at this length. Independence also answers the "too comprehensive" note, because 8,000 words reads as bloat in a fixed reading order and as five reference pages when each stands alone |
| Does any one article ship on its own? | Yes, each is standalone. They still publish together so the cross-links resolve |
| Publication | All five together |
| Announcement | **Open, raise when opening the PR.** Dylan wants a daily announcement across the days after launch, but the articles are cross-linked heavily enough that all five have to publish at once, so a staggered announcement would point at links that don't resolve yet on day one. This series took real effort and answers a customer request big enough to be worth a proper release moment, so check with product marketing on whether it gets a release announcement or similar treatment before landing on a plan |
| Entry point | The audit article carries a symptom table routing to the other four. No separate landing page |
| Title convention | No ordinals. Titles name the reader's problem or the action, never the API. `What to Check Before Tuning a Qdrant Collection`, `Candidate Depth: How Much Retrieval Is Enough?`, `When Your Collection Outgrows RAM`, `How to Tune Hybrid Search in Qdrant`, `When Is a Reranker Worth It?`. Dylan's call, 2026-08-11: the hub title is his rewrite from that day and closes the question the structural review reopened. The hub retitled and four slugs changed again on 2026-08-13, and one article was retired on 2026-08-14, both per the notes in 4a |
| Titles inside prose | A question title breaks a sentence it sits inside, so body cross-links use a topic descriptor instead: "reranking", "candidate depth", "tuning fusion", "the pre-tuning checks". Slugs are unchanged, so the descriptors and the titles both resolve |
| Slugs | Descriptive, one keyword each, no `part-N`. Part 4 keeps `how-to-tune-hybrid-search` because it is the strongest keyword in the set and its figure and preview directory already exist |
| Is part 4 frozen? | No. A draft like the rest, with five edits in 3c, and it re-runs the gates before shipping |
| Does the reranking measurement happen? | Yes, and it is done. E4 ran across five corpora with selection and reporting on different queries; the result is in 3a and the article reports the loss |
| Hero images | Built for all five, 2026-08-13. The retired article's set was deleted on 2026-08-14. Each `articles_data/<slug>/preview/` holds the five-file set. **Only `social_preview.jpg` carries the title**, composited by `automation/template/apply-template.sh`; `title.jpg` and `preview.jpg` are text-free crops, so a retitle rebuilds one file per article. The audit social preview was rebuilt on 2026-08-13 after its retitle. **The 1904x640 Midjourney sources live in `~/Downloads`, named by the articles' old titles** (`Seven Qdrant Checks Before You Tune Search.png`, `Candidate Depth.png`, `How to Tune Hybrid Search in Qdrant.png`, `When Is a Reranker Worth It.png`). Nothing in the repo can regenerate a social preview without them. On macOS the scripts need `stat`, `realpath` and `pngquant` shims on `PATH`, and `ALLOW_OVERWRITE=true` |
| Does `experiments/` ship in the landing_page PR? | No. It moves to its own repo once the series is done |
| The documentation fixes | Dropped, 2026-08-11. The report is stale and the series does not depend on it. Do not resurrect it from the section 6 findings |
| The notebook into `qdrant/examples` | Moves once the series is done |
| Is `DEFAULT_RRF_K = 2` deliberate? | Yes, by design. The docs should explain the default rather than query it |
| Split the depth article into depth and memory? | **Not now.** Both Codex passes were weighed on 2026-08-11: the split happens when E7 gives the memory article its own measured finding, and until then the depth article keeps a compressed "When RAM Is the Constraint" section. Do not split ahead of the data |
| Series order | Depth before fusion, by weight. Settled 2026-08-11 after the structural review. The fusion article carries its own one-sentence RRF and DBSF definitions, so it works standalone regardless of what a reader read first |
| Duplicated findings | One home each, settled 2026-08-11: the E6 quantization table lives in part 3, ColBERT storage in part 5, the best-possible-against-current gap measurement in part 3 with the hub naming the concept. Other articles point, never re-teach |
| The structural review's six-article restructure and evolving running example | Rejected. The split waits on E7 above; the running example's cheap version is WANDS threading, in the section 1 polish backlog |
| Who is the reader on the day they open this? | Someone already running two prefetches and a fusion. Dylan's call, 2026-08-11, after the drafts read as basics to that reader. It cost two retitles and one reframe, both on articles whose titles the earlier rounds argued over because they asked a question this reader had answered. The surviving half of that call is the hub going to `Seven Qdrant Settings That Fail Silently`, since "Before You Tune Search" reads pre-adoption; the other half was applied to the article retired on 2026-08-14. The rule that came out of it is in the brief and in section 11. **Narrowed 2026-08-14: this reader profile holds for the fusion article only, after the second-prefetch article was retired.** The other four don't assume a second leg; see the North Star after the brief's hybrid paragraph |
| Does the E7 deployment point stay at `bits1` oversampling 1? | **Yes, and since 2026-08-13 the held-out half confirms it.** The article recommends `bits1` with `rescore` on at oversampling 1, described as chosen by the pre-registered rule and confirmed on the queries that had no say in choosing it: 0.0011 better than float32 on nDCG@10 there, paired 95% interval -0.003 to +0.005, retention 0.006 below float32, for 7.121 GB of vectors compressed to 0.260 GB. Oversampling 2 is now just another point on the published curve and carries no special status, so the robustness framing it used to need is gone. **Every published E7b latency number was measured at oversampling 1**, so a recommendation of 2 would put a latency table under a configuration it never measured, which the benchmark-measures-the-recommendation gate forbids. Never write "equivalent to float32"; quote the interval instead |
| Does the depth article's RAM section shrink in this PR? | **Yes. Settled 2026-08-12**, reversing the earlier "not now", whose only reason was that the RAM article's URL did not exist. It does now, and both articles ship in one PR. What stays in depth: the rule to test quantization before reducing candidate depth, and the E6 table, whose sole home it is. What becomes a pointer: the "Once the collection outgrows RAM" paragraph, meaning placement, the `memory` parameter and the latency price of `rescore`. Shrinking re-runs the gate order and `verify_articles.py` over the locked figures, which is the cost and is accepted |
| What happened to the E7a int8 cells? | **Cut from the article, and the float32 row was re-run on 2026-08-13.** Section 8 carries the mechanism and the fix, and `e7/results/e7a_float32.json` is the file anything comparing against float32 reads. Do not resurrect the int8 rows as a storage ladder: that is the TurboQuant article's job, and the publication discipline in section 8 forbids a second one |
| The three review passes of 2026-08-12 (one Fable agent, two Codex) | **Taken:** every factual defect they found in the RAM article, listed in section 8, and seven corrections to the others, listed in 4c. **Rejected, do not resurrect:** trimming the reranker article's held-out paragraph to one sentence, because gate 12 requires each article to disclose that its own winner was selected and reported on different halves; and cutting the `bits4` rescoring row, which is what shows that rescoring buys retention the nDCG column does not reveal. **Closed 2026-08-17:** the tier 3 pointer question, by narrowing 5c to `score_threshold` |
| The reader-quality review (Codex, 2026-08-13) | **Taken:** fourteen items, the prose ones now in 4c. The Recall@100 passage, `hnsw_ef` without a size threshold, per-shard `limit` in the fusion article, the conditional tie workaround, five companions not four, reranking listed once in the cost ladder, two over-length `short_description` fields, the `bits4` quality measure named, the CPU-to-GPU ratio decontrolled, "depth is cheap" made relative, and the rebuild-variance section given the production sources it did not test. **Rejected, do not resurrect:** the tier 3 pointer block, per section 1; an "Advanced Edge Cases" heading over the fusion article's weight-zero and query-less-prefetch sentences, since a heading over two sentences inside the weights section is scaffolding; and retitling the audit's rebuild-variance section to "A Clean Rebuild Did Not Move the Top 10 Here", because the claim needed the fix and the title already hedges. **Its plan-hygiene finding was correct** and this revision is the fix |
| The five-article engineering reproducibility review (Codex, 2026-08-11) | **Taken:** the reranker stop rule diagnoses model and input mismatch before it tells anyone to stop buying candidates, and the reranker article surfaces its held-out footing, which was the thinnest of the five. **Rejected, do not resurrect:** p95 and p99 under concurrency, multi-shard latency, GPU throughput, and cost per fixed query volume, all of which need hardware we do not have and would ship numbers section 12 forbids; the solo, team and enterprise labeling paths and annotation guidelines, which turn the hub into three articles against Neil's length note; a second embedding model or learned sparse retrieval in part 2, which is the re-embedding section 7 rules out; and splitting depth from memory as separate articles, which the RAM article now answers instead. **Deferred, worth revisiting after publication:** the reviewer's one strong idea, a downloadable harness taking a collection, queries, labels and a variant config and returning pass, reject or inconclusive. `experiments/fusion/` plus the notebook is most of it already, and section 14 moves that code to its own repo, so decide there whether it gets packaged for readers. Half the review's findings came from reading the drafts without the artifacts, so brief any future reviewer with this plan |

## 14. Deliverables

Done and on disk, uncommitted:

- **Five articles** in `qdrant-landing/content/articles/`, listed in 4a. All code executed against the live server; all 207 figures verified by `verify_articles.py`. Cross-linked in both directions as of 2026-08-14.
- **`experiments/fusion/study.py`** with tasks E1 to E6, artifacts in `experiments/fusion/study/`, claims traced in `grounding.md`.
- **`experiments/fusion/verify_articles.py`**, the regression check that ties the prose to the measurements.

- **E7**, measured 2026-08-12. Code in `experiments/fusion/e7*.py`, artifacts in `experiments/fusion/e7/`, results and the applied decision rule in `e7/results/`. Section 8 carries every number.

Still to do:

- **`experiments/fusion/notebook/Tuning_Hybrid_Fusion.ipynb` into `qdrant/examples`**, merging before any article links to it. Its content is current, and it still uses "leg" in prose and in a dict name; fix the prose if you touch it.
- **`experiments/` moves to its own repo** once the articles publish. It does not ship in the landing_page PR.
