---
title: "Route Retrieval by Evidence: Cheap Signals for Self-Correcting RAG"
short_description: "Cheap signals that flag weak retrieval, so you escalate only when needed."
description: "Route agentic retrieval by evidence, not question shape: cheap signals predict weak retrieval and a gate escalates to ColBERT or decomposition only when needed."
preview_dir: /articles_data/route-retrieval-by-evidence/preview
social_preview_image: /articles_data/route-retrieval-by-evidence/preview/social_preview.jpg
weight: -200
author: Dylan Couzon
date: 2026-06-17T00:00:00+03:00
draft: false
keywords:
  - signal-driven retrieval
  - agentic RAG
  - self-correcting retrieval
  - query routing
  - hybrid search
category: rag-and-genai
---

Most retrieval systems do the same thing on every query, whether they feed a RAG prompt, an agent loop, or a search results page. They run one [hybrid search](/documentation/search/hybrid-queries/) and use the top results, or they rerank everything, or they rewrite and re-retrieve on every query. Each is the wrong default for some fraction of traffic: the single pass under-serves the hard queries, and the expensive path wastes compute and latency on the easy ones. Worse, a single pass fails *silently*. When the relevant document never reaches the top results, the system still returns something, ranked from whatever it retrieved.

A self-correcting loop fixes the default by making it conditional. Retrieve once, judge the result with a **cheap signal**, and escalate to a more expensive action only when the signal says the evidence is weak. The interesting question is not which expensive action to run. [Cross-encoders](/documentation/fastembed/fastembed-rerankers/), [ColBERT late interaction](/articles/late-interaction-models/), query rewriting, and [decomposition](/documentation/search/hybrid-queries/#query-decomposition-for-multi-hop-questions) are all well understood. The interesting question is *when* to spend them, and how to decide cheaply, on every query, without an extra model call.

This article is about that decision, which is the same whatever the corpus: the signals that predict weak retrieval, how to find the ones that work on your data, and how to turn a signal into a routing gate. To put real numbers on it we lean on one concrete benchmark, a [workshop we built](https://github.com/qdrant-labs/self-correcting-loops-workshop) on a mixed question-answering workload, where routing by signal kept most of the quality of always-escalating at a fraction of the cost. The benchmark is question answering; the method is not.

{{< figure src="/articles_data/route-retrieval-by-evidence/self-correcting-loop.png" alt="The self-correcting retrieval loop: a query goes through hybrid retrieval to a cheap signal and gate, which either answers from the top-3 or escalates to ColBERT or decomposition before answering." caption="The loop. One retrieval, a cheap signal that decides whether the evidence is weak, and a more expensive action only when it is." width="100%" >}}

This sits in a line of work on corrective and adaptive retrieval, and the difference is specific. [CRAG](https://arxiv.org/abs/2401.15884) also grades the retrieval and corrects when it looks weak, but it trains a dedicated evaluator model to do the grading. [Adaptive-RAG](https://arxiv.org/abs/2403.14403) routes on a query-complexity classifier, deciding from the shape of the question before retrieving anything, which is the approach this article argues against. [Self-RAG](https://arxiv.org/abs/2310.11511) bakes the decision into a fine-tuned model, and [FLARE](https://arxiv.org/abs/2305.06983) gates on the generator's token confidence. The gate here reads a cheap statistic of the result already retrieved: no extra model call, no model to train, no query classifier, just a labeled calibration split to choose the signals and set the floors. Whether the retrieved evidence is enough is the same question [sufficient-context work](https://arxiv.org/abs/2411.06037) asks with an LLM judge, answered here from a free signal instead.

## What "good retrieval" means

Before you can detect weak retrieval, you have to define it, and the definition has to be operational. Every retrieval system has a window that gets used: the few passages an LLM reads, the first page a user scans, the candidate pool a reranker reorders. Good retrieval means the items you need land inside that window. Everything below it is invisible, no matter how good the recall looks deeper down the list.

In the benchmark the window is the **top-3** passages an LLM reads to answer, so a retrieval is *good* when every supporting passage the question needs lands in the top-3, and *weak* when at least one is missing. Pick the window that matches your system and the rest of the method is unchanged. This is the hook that makes a signal meaningful: a signal is useful precisely when it predicts that the needed items did not make the window.

The benchmark workload is [MuSiQue](https://github.com/StonyBrookNLP/musique), built from three failure modes that show up well beyond question answering:

| Failure mode | In the benchmark | Where else it appears |
|---|---|---|
| easy | single-hop: one passage answers | the bulk of queries in a typical workload |
| needs a follow-up | multi-hop: the next passage isn't reachable from the query as written | faceted product search, queries whose filter depends on a first lookup |
| not in the corpus | unanswerable: the evidence isn't there | anything that should return "no good match" instead of the least-bad result |

The baseline is a single **hybrid** retrieval: a [dense retriever](/documentation/search/search/) (`bge-base`) and a sparse one ([miniCOIL](/documentation/fastembed/fastembed-minicoil/)) fused server-side with [Reciprocal Rank Fusion (RRF)](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf). It handles the easy cases. It breaks when the needed evidence is not reachable from the query as written, and it has no way to know it failed.

## Signals: predicting weak retrieval for free

A **signal** is a number you compute from the retrieval result that predicts whether the evidence is weak. A good signal meets two criteria, and the second is what makes this practical:

1. It separates good retrievals from weak ones on calibration data.
2. It is cheap enough to run on every query.

"Cheap" is the constraint that rules out the obvious approaches. You could ask an LLM "is this enough to answer?" on every query, but that adds a model call and latency to the cheap path you were trying to protect. The signals here read only what the retriever already returned, or at most ask Qdrant for one extra ranking. No extra model call, no LLM in the hot path.

### The candidate families

There is no single signal that works everywhere, so the right move is to test several and keep what separates on your data. We test five candidates across five families. They are a starter set, not the universe: predicting whether a retrieval succeeded is a studied problem, [query performance prediction](https://arxiv.org/abs/2504.01101), with a couple of dozen predictors in the literature. The two spread signals here are score-variance predictors of the kind that work calls Unnormalized Query Commitment (UQC), the unnormalized counterpart of the better-known Normalized Query Commitment (NQC), which divides the same spread by a collection-wide score. The split that matters is whether a signal reads the already-fused hybrid result or asks for one extra raw retriever view.

| Family | Signal | What it reads | Flags weak when |
|---|---|---|---|
| height | `max_score` | top-1 fused score | low |
| spread (fused) | `score_variance` | spread of the fused top-k scores | low (flat ranking) |
| spread (raw) | `dense_variance` | spread of the raw dense cosines | low (dense can't separate its hits) |
| coverage | `evidence_coverage` | question entities present in the top-k text | low (text misses them) |
| agreement | `retriever_divergence` | dense vs miniCOIL top-k overlap | high (the retrievers disagree) |

The intuition behind each is worth stating, because it is what transfers to a new corpus:

- **Height** asks whether the top hit scored high in absolute terms. It is most useful when scores are calibrated; RRF ranks rather than calibrates, so on a fused result the top score tends to echo the spread signals.
- **Spread** asks whether the retriever could pull its top results apart. When a retriever is confident, the scores fan out; when it is lost, they bunch together. We measure spread on two substrates: the fused RRF scores (free) and the raw dense cosines (one extra query, no model call). RRF combines ranks well but flattens score shape, which is why the raw dense spread can carry information the fused spread loses.
- **Coverage** asks whether the entities named in the question appear in the retrieved text. Cheap to compute, strong on entity-lookup data.
- **Agreement** asks whether the dense and sparse retrievers returned the same documents. When they diverge sharply, one of them is usually lost, which happens on jargon or out-of-vocabulary terms.

### How the signals are computed

Each signal is a few lines. The two spread signals take the population standard deviation of a score list (the `_variance` names are loose; the code returns the standard deviation):

```python
import statistics

def score_variance(fused_points):     # spread of the fused RRF scores
    return statistics.pstdev([p.score for p in fused_points])

def dense_variance(dense_ranking):    # spread of the raw dense cosines
    return statistics.pstdev([score for _, score in dense_ranking])
```

`score_variance` reads the hybrid result you already have. `dense_variance` needs the raw dense ranking, which is one extra Qdrant query that reuses the embedding the hybrid query already computed, so there is no extra model call:

```python
def dense_ranking(query_vector):
    points = client.query_points(
        collection_name="{collection_name}",
        query=query_vector,
        using="dense",
        limit=10,
        with_payload=False,
    ).points
    return [(p.id, p.score) for p in points]
```

Coverage and agreement are equally cheap: coverage counts how many of the question's capitalized spans and years appear in the top-k text, and agreement is one minus the overlap between the dense and sparse top-k id sets.

## Finding the winners on your data

This is the part that matters, and the part that does not transfer as a fixed answer. The signals that win are corpus-specific. The *method* for finding them is not.

On a calibration split you know the ground truth: whether all the gold passages landed in the top-3. So you can score each candidate by how well its value separates good retrievals from weak ones, using the area under the ROC curve (AUC). Read it as a separation score, where 0.5 is a coin flip and 1.0 is perfect. Because some signals fire high for weak retrieval and others fire low, we take the stronger of the signal and its inverse:

```python
from sklearn.metrics import roc_auc_score

def separation(values, weak_labels):
    auc = roc_auc_score(weak_labels, values)
    return max(auc, 1 - auc)   # separation, regardless of direction
```

Then two rules: keep any signal that separates above a bar (0.65 here), and drop any survivor that is a near-duplicate of a stronger one (absolute correlation above 0.85). The correlation rule matters because redundant signals add cost without adding information.

{{< figure src="/articles_data/route-retrieval-by-evidence/signal-separation.png" alt="Box plots of each candidate signal on good versus weak retrievals. dense_variance and score_variance separate the two; the others overlap." caption="Each candidate on good versus weak retrievals over the calibration split. When the boxes pull apart, the signal separates; when they overlap, it does not." width="100%" >}}

On this corpus, two signals clear the bar and survive the correlation check:

| Signal | AUC | Verdict |
|---|---|---|
| `dense_variance` | 0.74 | kept |
| `score_variance` | 0.70 | kept |
| `max_score` | 0.66 | dropped (redundant) |
| `evidence_coverage` | 0.59 | dropped (below the bar) |
| `retriever_divergence` | 0.53 | dropped (below the bar) |

Both winners are spread signals: when the retriever cannot separate its top results, the evidence is usually weak. `max_score` clears the separation bar too, but it correlated 0.92 with `score_variance` on this split, so the correlation rule drops it as a near-duplicate. `evidence_coverage` fails for a concrete reason worth seeing: the question's entities turn up somewhere in the top-k for most retrievals, weak or not (87% of good and 69% of weak score a perfect 1.0), so the signal saturates and a threshold has nothing to cut on. The AUC, not any single threshold, is what tells you that. Agreement is weak here too, though on a jargon-heavy corpus it can be the strongest signal you have, and on entity-lookup data coverage often wins. Run the benchmark on your data and keep what separates: pick signals on one split, tune thresholds on a second, and keep a test split held out.

## The gate: a floor on each signal

A signal becomes a decision through a threshold. Each kept signal gets a floor; if either falls below it, the retrieval is treated as weak and the query escalates:

```python
def retrieval_is_weak(fused_points, dense_ranking):
    return (score_variance(fused_points) < SV_FLOOR
            or dense_variance(dense_ranking) < DV_FLOOR)
```

The floor is a tradeoff, not a constant. Raise it and you catch more weak retrievals but escalate more queries; lower it and you escalate less but miss more. We set it at the threshold that maximizes catches minus false alarms on the calibration set (the Youden point on the ROC curve), though you can instead target a recall (say, catch 90% of weak retrievals) when a missed weak retrieval costs more than an extra escalation.

{{< figure src="/articles_data/route-retrieval-by-evidence/gate-histogram.png" alt="Histogram of dense_variance for good and weak retrievals, with the gate floor marked. Most weak retrievals fall below the floor." caption="The chosen signal's distribution for good and weak retrievals, with the calibrated floor. The shaded region escalates." width="85%" >}}

The two kept signals differ in cost as well as strength. `score_variance` reads the fused result you already have, so it is free: at its balanced floor it catches 63% of the weak retrievals while escalating 37% of queries. `dense_variance` is stronger, catching 78% while escalating 49%, but it spends one extra dense query on every request, a retrieval round-trip added to the cheap path you are protecting. The free signal alone already catches most weak retrievals; the extra query buys about 15 more points of catch. That is the shape of the win either way: most weak cases caught, and the cheap path still serves the rest.

The gate ORs the two floors because the signals are complementary, not redundant. On the calibration split `dense_variance` and `score_variance` correlate only 0.54 and flag overlapping but different weak retrievals, with about half the escalations unique to one signal. Together they catch 80% against 78% for `dense_variance` alone, at a slightly higher escalation rate. Whether two signals are redundant is a property of the corpus, not a fixed fact, which is why the correlation check belongs in the benchmark rather than a rule of thumb. With more signals that each carry independent information, hand-tuning a floor per signal stops scaling, and a small classifier over the signal vector is the better gate.

## What routing by evidence buys

The gate decides whether to escalate; what you escalate *to* is open. A reranker, a query rewrite, a larger embedding model, decomposition, relaxing a filter, or handing off to a person are all valid escalations, and the gate does not care which you pick. That division is the point of routing by evidence: the signal makes the decision that costs you, whether to escalate at all; choosing which escalation to run is a cheaper, lower-stakes call, and a query-shape heuristic is fine there. The benchmark picks between two with a light, label-free check on the query (its entity count and length): a likely multi-hop query goes to **decomposition**, which [asks the next still-missing sub-question](/documentation/search/hybrid-queries/#query-decomposition-for-multi-hop-questions), retrieves again, and repeats, interleaving retrieval with reasoning ([Self-Ask](https://arxiv.org/abs/2210.03350), [IRCoT](https://arxiv.org/abs/2212.10509)); anything else goes to **ColBERT** late interaction, which re-scores with token-level precision to promote a buried result and adds no LLM call. That split is why the gate escalates about 70% of the test queries but the loop still averages only 0.78 LLM calls: only the roughly 48% routed to decomposition spend a call, and the ColBERT reranks add none. Both actions are linked rather than re-explained, because the point of the loop is the routing, not the actions.

Because the gate routes by evidence, each question type lands where it needs to without anyone hard-coding a rule per type:

{{< figure src="/articles_data/route-retrieval-by-evidence/routing-distribution.png" alt="Stacked bars showing how single-hop, multi-hop, and unanswerable questions are routed across the three tiers." caption="How the gate routes each question type. Single-hop questions mostly stay cheap; multi-hop questions mostly decompose; unanswerable questions spread across tiers as the signal finds them weak." width="85%" >}}

Unanswerable queries show both the reach of routing by evidence and its limit: the gate flags most of them as weak, but escalation cannot conjure evidence that is not in the corpus, so the win there is detecting the weak retrieval, not repairing it. Deciding when to abstain on those instead of answering from thin evidence is a separate step, the STOP autorater described in the [workshop](https://github.com/qdrant-labs/self-correcting-loops-workshop); this article measures retrieval quality on the answerable set and makes no abstention claim.

The loop sits on the cost/quality frontier. Quality is measured over the 180 answerable questions, since the 141 unanswerable ones have no gold passage to recover, while cost and routing cover all 321. The lead metrics are top-3 metrics, because the top-3 is the window the model reads: `recall@3` asks whether at least one supporting passage reached it, and `full_gold@3` asks whether every required passage did, a strict set recall at the window.

| Policy | recall@3 | full_gold@3 | MRR | LLM calls/query | Routing latency |
|---|---|---|---|---|---|
| always answer | 0.82 | 0.70 | 0.88 | 0.0 | 0.15s |
| always rerank | 0.81 | 0.69 | 0.91 | 0.0 | 0.15s |
| always ColBERT | 0.80 | 0.68 | 0.89 | 0.0 | 0.30s |
| always decompose | 0.88 | 0.79 | 0.90 | 1.88 | 3.30s |
| **signal-gated ladder** | **0.85** | **0.76** | **0.91** | **0.78** | **1.50s** |

{{< figure src="/articles_data/route-retrieval-by-evidence/cost-quality-frontier.png" alt="Cost versus quality across the five retrieval policies. The signal-gated ladder sits on the efficient frontier, near always-decompose but at far lower cost." caption="The same five policies as a frontier: quality (all gold passages in the top-3) against cost (LLM calls per query). The signal-gated ladder comes within a few points of always-decompose at roughly 40% of its LLM calls." width="90%" >}}

Two honest readings of this table. First, the win is efficiency, not a new quality ceiling. Always-decompose is the most accurate policy, and the ladder does not beat it: it reaches `recall@3` of 0.85 against 0.88, and `full_gold@3` of 0.76 against 0.79. What it changes is the bill. It spends 0.78 LLM calls per query against 1.88, and 1.5 seconds of routing latency against 3.3, because it only decomposes the queries the gate flags. Against the cheap always-answer baseline, the lift is real and significant: `recall@3` improves by 3.6 points (95% CI 0.3 to 6.8) and `full_gold@3` by 6.1 points (95% CI 1.1 to 11.1).

Second, the ladder posts the best MRR (mean reciprocal rank) at 0.91, just ahead of always-rerank at 0.905 and always-decompose at 0.901. The gap is small and carries no confidence interval, and MRR is the lenient metric here, rewarding any single supporting passage, so read it as a sign that routing the right queries to ColBERT holds rank quality steady, not as a standalone win.

## This is not only for question answering

The benchmark is a QA workload, but nothing in the method is: the signals are statistics of a ranking and the gate is a threshold on them, so the pattern fits any retrieval system with a cheap default and a more expensive fallback. The cases below are not measured here. They are extrapolations from the mechanism, and they are worth stating only as hypotheses to run on your own data, not as results:

- **Product and site search.** A query that matches nothing relevant produces a flat, low-spread result. The same spread signal that flags weak QA retrieval can trigger query relaxation or a broader recall pass instead of returning the least-bad items.
- **Support and knowledge-base RAG.** When the first retrieval over a help center is weak, escalate to a query rewrite or ask the user to disambiguate, rather than answering from thin context.
- **Code and technical search.** Identifier- and jargon-heavy queries are exactly where dense and lexical retrievers disagree, so the agreement signal earns its keep and routes those queries to a lexical-heavy pass.
- **Heterogeneous or multi-tenant corpora.** Some queries land in a region of the corpus the default index serves poorly; a weak-retrieval signal can route them to a different index or filter.

In each case the three ingredients are the same: a window you can define, cheap signals that predict when the needed items missed it, and a more expensive action worth spending only when they did.

## Adapt this to your corpus

The specific winners here are not portable, but the recipe is:

1. **Set the window.** Decide what your system consumes (the passages an LLM reads, the results a user sees) and how many. That window defines good retrieval.
2. **Label retrieval outcomes** on a calibration split: did the needed evidence reach the window?
3. **Engineer and benchmark cheap signals.** Keep the ones that separate weak from healthy retrievals on your data; drop the redundant ones.
4. **Turn the winner into a gate.** One floor if your signals are redundant, a small classifier if they carry independent information.
5. **Match a fix to each failure mode** and measure quality and cost together. Keep the loop only where the quality justifies the spend.

A caveat worth stating plainly: every number here is from one workload. The mixed single-hop, multi-hop, and unanswerable set is representative of the failure modes that make routing worthwhile, but it is a single corpus, and the AUCs, the floors, and the winning signals would differ on yours. The benchmark code is open-source, so the honest way to use this is to run it on your data rather than to adopt these thresholds.

The reusable idea is small and sturdy. Retrieval quality is observable from cheap statistics of the result, before you spend anything to act on it. Measure it, set a floor, and let the evidence, not the question, decide which queries are worth the expensive path.

*The full method, including the corrective actions and the evaluation harness, is in the [self-correcting retrieval loops workshop](https://github.com/qdrant-labs/self-correcting-loops-workshop). For the building blocks the loop escalates to, see [late interaction models](/articles/late-interaction-models/), [hybrid search](/articles/hybrid-search/), and [query decomposition](/documentation/search/hybrid-queries/#query-decomposition-for-multi-hop-questions).*
