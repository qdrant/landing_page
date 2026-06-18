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

Most retrieval systems run the same pipeline on every query, whether it feeds a RAG prompt, an agent loop, or a search results page. Some run a single [hybrid search](/documentation/search/hybrid-queries/) and take the top results; others rerank everything, or rewrite and re-retrieve every time. Each is the wrong default for part of the traffic: the single pass under-serves the hard queries, and the expensive path wastes compute and latency on the easy ones. Worse, the single pass fails *silently*: when the relevant document never reaches the top, the system returns something anyway.

A self-correcting loop fixes the default by making it conditional: retrieve once, judge the result with a **cheap signal**, and escalate to a more expensive action only when the evidence looks weak. Which action to run is the settled part. [Cross-encoders](/documentation/fastembed/fastembed-rerankers/), [ColBERT late interaction](/articles/late-interaction-models/), query rewriting, and [decomposition](/documentation/improve-search/query-decomposition/) are all well understood. The open question is *when* to spend them, decided cheaply on every query, without an extra model call.

This article is about that decision: the signals that predict weak retrieval, how to find the ones that work on your data, and how to turn a signal into a routing gate. For real numbers we lean on one benchmark, a [workshop we built](https://github.com/qdrant-labs/self-correcting-loops-workshop) on a mixed question-answering workload, where routing by signal kept most of the quality of always-escalating at a fraction of the cost.

{{< figure src="/articles_data/route-retrieval-by-evidence/self-correcting-loop.png" alt="The self-correcting retrieval loop: a query goes through hybrid retrieval to a cheap signal and gate, which either answers from the top-3 or escalates to ColBERT or decomposition before answering." caption="The loop. One retrieval, a cheap signal that decides whether the evidence is weak, and a more expensive action only when it is." width="100%" >}}

## What "Good Retrieval" Means

Before you can detect weak retrieval, you have to define it, and the definition has to be one you can measure.

Retrieval returns a long ranked list, but only the top few results are ever used. In the benchmark, that is the **top-3** chunks fed to the LLM to answer: call it the **window**. Anything ranked below the window is invisible in practice, no matter how good the recall looks deeper down the list. So good retrieval has a precise meaning: every chunk the question needs lands in the window, and a retrieval is *weak* when even one is missing.

You set the window to match your own system, whatever number of results it actually consumes; the rest of the method is unchanged.

The benchmark workload is recast from [MuSiQue](https://github.com/StonyBrookNLP/musique) into a mix of three failure modes that show up well beyond question answering:

| Failure mode | In the benchmark | Where else it appears |
|---|---|---|
| easy | single-hop: one chunk answers | the bulk of queries in a typical workload |
| needs a follow-up | multi-hop: the next chunk isn't reachable from the query as written | faceted product search, queries whose filter depends on a first lookup |
| not in the corpus | unanswerable: the evidence isn't there | anything that should return "no good match" instead of the least-bad result |

The baseline is a single **hybrid** retrieval: a [dense retriever](/documentation/search/search/) (`bge-base`) and a sparse one ([miniCOIL](/documentation/fastembed/fastembed-minicoil/)) fused server-side with [Reciprocal Rank Fusion (RRF)](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf). It handles the easy cases. It breaks when the needed evidence is not reachable from the query as written, and it has no way to know it failed.

## Signals: Predicting Weak Retrieval for Free

A **signal** is a number you compute from the retrieval result that predicts whether the evidence is weak. A good signal meets two criteria, and the second is what makes this practical:

1. It separates good retrievals from weak ones on calibration data.
2. It is cheap enough to run on every query.

"Cheap" is the constraint that rules out the obvious approaches. You could ask an LLM "is this enough to answer?" on every query, but that adds a model call and latency to the cheap path you were trying to protect. The signals here read only what the retriever already returned, or at most ask Qdrant for one extra ranking. No extra model call, no LLM in the hot path.

### The Candidate Families

No single signal works everywhere, so we test five candidates across four families. The split that matters is whether a signal reads the already-fused hybrid result or asks for one extra raw retriever view.

They are a starter set, not the universe: predicting whether a retrieval succeeded is a studied problem, [query performance prediction](https://arxiv.org/abs/2504.01101), with many predictors proposed and recent work testing them for exactly this kind of selective routing. The two spread signals here are score-variance predictors; that literature calls them Unnormalized Query Commitment (UQC).

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

### How the Signals Are Computed

Each signal is a few lines. The two spread signals take the population standard deviation of a score list (the `_variance` names are loose; the code returns the standard deviation):

```python
import statistics

def score_variance(fused_points):     # spread of the fused RRF scores
    return statistics.pstdev([p.score for p in fused_points])

def dense_variance(dense_ranking):    # spread of the raw dense cosines
    return statistics.pstdev([score for _, score in dense_ranking])
```

`score_variance` reads the hybrid result you already have. `dense_variance` needs the raw dense ranking, which is one extra Qdrant query that reuses the query vector you already embedded for the hybrid search, so there is no extra model call:

```python
def dense_ranking(query_vector):
    points = client.query_points(
        collection_name="your_collection",
        query=query_vector,
        using="dense",
        limit=10,
        with_payload=False,
    ).points
    return [(p.id, p.score) for p in points]
```

The signals read the top-10 pool shown above, deeper than the top-3 answer window, because spread and overlap need enough results to be stable. Coverage and agreement are equally cheap: coverage counts how many of the question's capitalized spans and years appear in the top-k text, and agreement is one minus the overlap between the dense and sparse top-k id sets.

## Finding the Winners on Your Data

This is the part that matters, and the part that does not transfer as a fixed answer. The signals that win are corpus-specific. The *method* for finding them is not.

On a calibration split you know the ground truth: whether all the gold chunks landed in the top-3. So you can score each candidate by how well its value separates good retrievals from weak ones, using the area under the ROC curve (AUC). Read it as a separation score, where 0.5 is a coin flip and 1.0 is perfect. Because some signals fire high for weak retrieval and others fire low, we take the stronger of the signal and its inverse:

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

Both winners are spread signals: when the retriever can't pull its top results apart, the evidence is usually weak.

`max_score` clears the bar too, but it tracks `score_variance` almost exactly (0.92 correlation), so it only repeats a signal we already keep. `evidence_coverage` fails differently: the question's entities show up in the top results for almost every retrieval, good or weak, so it can't tell the two apart.

These results are specific to this corpus. Agreement is weak here, but it can be the strongest signal on jargon-heavy text, and coverage often wins on entity-lookup data. So run the benchmark on your own data and keep what separates: pick signals and set thresholds on a calibration split, and hold out a separate test split for the final numbers.

## The Gate: A Floor on Each Signal

A signal becomes a decision through a threshold. Each kept signal gets a floor; if either falls below it, the retrieval is treated as weak and the query escalates:

```python
def retrieval_is_weak(fused_points, dense_ranking):
    return (score_variance(fused_points) < SV_FLOOR
            or dense_variance(dense_ranking) < DV_FLOOR)
```

The floor is a tradeoff, not a constant. Raise it and you catch more weak retrievals but escalate more queries; lower it and you escalate less but miss more. We set it at the threshold that maximizes the catch rate minus the false-alarm rate on the calibration set (the [Youden point](https://en.wikipedia.org/wiki/Youden%27s_J_statistic) on the ROC curve), though you can instead target a recall (say, catch 90% of weak retrievals) when a missed weak retrieval costs more than an extra escalation.

{{< figure src="/articles_data/route-retrieval-by-evidence/gate-histogram.png" alt="Histogram of dense_variance for good and weak retrievals, with the gate floor marked. Most weak retrievals fall below the floor." caption="The chosen signal's distribution for good and weak retrievals, with the calibrated floor. The shaded region escalates." width="85%" >}}

On that same calibration split, the two kept signals differ in cost as well as strength:

| Signal | Extra cost | Weak retrievals caught | Queries escalated |
|---|---|---|---|
| `score_variance` | none (reuses the fused result) | 63% | 37% |
| `dense_variance` | one dense query per request | 78% | 49% |

The free signal alone already catches most weak retrievals; the extra query buys about 15 more points. The gate ORs the two because they are complementary, not redundant: they correlate only 0.54 and flag different weak retrievals, so together they catch 80%, just above `dense_variance` alone. Redundancy is a property of the corpus, not a fixed fact, so the correlation check belongs in the benchmark. And once you have several signals that each add independent information, a small classifier over them beats hand-tuning a floor for each.

## What Routing by Evidence Buys

The gate decides whether to escalate; what you escalate *to* is open. A reranker, a query rewrite, a larger embedding model, decomposition, relaxing a filter, or handing off to a person are all valid escalations, and the gate does not care which you pick. That division is the point of routing by evidence: deciding *whether* to escalate is the call that costs you; *which* escalation to run is a cheaper, lower-stakes choice where a query-shape heuristic is fine.

In the benchmark, a cheap query-shape check picks the escalation: a likely multi-hop query goes to **[decomposition](/documentation/improve-search/query-decomposition/)** ([Self-Ask](https://arxiv.org/abs/2210.03350), [IRCoT](https://arxiv.org/abs/2212.10509)), which spends one or more LLM calls as it iterates sub-questions; anything else goes to **ColBERT** late interaction, which adds none. So even while escalating about 70% of queries, the loop averages just 0.78 LLM calls.

Because the gate routes by evidence, each question type lands where it needs to without anyone hard-coding a rule per type:

{{< figure src="/articles_data/route-retrieval-by-evidence/routing-distribution.png" alt="Stacked bars showing how single-hop, multi-hop, and unanswerable questions are routed across the three tiers." caption="How the gate routes each question type. Single-hop questions mostly stay cheap; multi-hop questions mostly decompose; unanswerable questions spread across tiers as the signal finds them weak." width="85%" >}}

Unanswerable queries show both the reach of routing by evidence and its limit: the gate flags most of them as weak, but escalation cannot conjure evidence that is not in the corpus, so the win there is detecting the weak retrieval, not repairing it. Deciding when to abstain on those instead of answering from thin evidence is a separate step, the STOP autorater described in the [workshop](https://github.com/qdrant-labs/self-correcting-loops-workshop); this article makes no abstention claim.

The loop sits on the cost/quality frontier. These frontier numbers are on a held-out test split, separate from the calibration data used to pick the signals and floors. Quality is measured over the 180 answerable questions, since the 141 unanswerable ones have no gold chunk to recover, while cost and routing cover all 321. The lead metrics are top-3 metrics, because the top-3 is the window the model reads: `recall@3` asks whether at least one supporting chunk reached it, and `full_gold@3` asks whether every required chunk did, a strict set recall at the window. `MRR` is a secondary reference, not a window metric: the reciprocal rank of the first supporting chunk over the full ranking, so it can read higher than `recall@3`.

| Policy | recall@3 | full_gold@3 | MRR | LLM calls/query | Routing latency |
|---|---|---|---|---|---|
| always answer | 0.82 | 0.70 | 0.88 | 0.0 | 0.15s |
| always rerank | 0.81 | 0.69 | 0.91 | 0.0 | 0.15s |
| always ColBERT | 0.80 | 0.68 | 0.89 | 0.0 | 0.30s |
| always decompose | 0.88 | 0.79 | 0.90 | 1.88 | 3.30s |
| **signal-gated ladder** | **0.85** | **0.76** | **0.91** | **0.78** | **1.50s** |

{{< figure src="/articles_data/route-retrieval-by-evidence/cost-quality-frontier.png" alt="Cost versus quality across the five retrieval policies. The signal-gated ladder sits on the efficient frontier, near always-decompose but at far lower cost." caption="The same five policies as a frontier: quality (all gold chunks in the top-3) against cost (LLM calls per query). The signal-gated ladder comes within a few points of always-decompose at roughly 40% of its LLM calls." width="90%" >}}

Routing latency is modeled, not wall-clock: roughly 0.15s per Qdrant query and 1.5s per decomposition LLM call, with the shared answer-generation step every policy pays excluded. Read the table as efficiency, not a new quality ceiling: always-decompose stays the most accurate policy. The ladder's lift over the cheap always-answer baseline is small but statistically real (`full_gold@3` +6.1 points, 95% CI 1.1 to 11.1).

## This Is Not Only for Question Answering

Nothing in the method is QA-specific: the signals are statistics of a ranking and the gate is a threshold on them. The cases below aren't measured here, just hypotheses to run on your own data:

- **Product and site search.** A query matching nothing relevant gives a flat, low-spread result, the cue to relax the query or widen recall.
- **Support and knowledge-base RAG.** A weak first retrieval over a help center triggers a rewrite or a disambiguation prompt instead of a thin-context answer.
- **Code and technical search.** Identifier- and jargon-heavy queries are where dense and lexical retrievers disagree, so the agreement signal routes them to a lexical-heavy pass.
- **Heterogeneous or multi-tenant corpora.** A weak-retrieval signal routes queries the default index serves poorly to a different index or filter.

## Adapt This to Your Corpus

The specific winners here are not portable, but the recipe is:

1. **Set the window** your system consumes, and what counts as the evidence a query needs.
2. **Label retrieval outcomes** on a calibration split: did that evidence reach the window?
3. **Benchmark cheap signals** and keep the ones that separate weak from healthy retrievals; drop the redundant.
4. **Turn the winners into a gate**: one floor, or a small classifier if the signals are independent.
5. **Match a fix to each failure mode**, and keep the loop only where quality justifies the spend.

The reusable idea is small and sturdy: retrieval quality is observable from cheap statistics of the result, so measure it, set a floor, and let the evidence, not the question, decide which queries are worth the expensive path.

## Adjacent Work

This sits in a line of work on corrective and adaptive retrieval. The difference is where the decision comes from: the gate here reads a cheap statistic of what was already retrieved, with no extra model call and nothing to train.

- [CRAG](https://arxiv.org/abs/2401.15884) also grades the retrieval, but trains a dedicated evaluator model to do it.
- [Adaptive-RAG](https://arxiv.org/abs/2403.14403) routes on query complexity *before* retrieving, the question-shape approach this article argues against.
- [Self-RAG](https://arxiv.org/abs/2310.11511) bakes the decision into a fine-tuned model; [FLARE](https://arxiv.org/abs/2305.06983) gates on the generator's token confidence.
- [Sufficient-context work](https://arxiv.org/abs/2411.06037) asks the same "is this enough?" question, but with an LLM judge rather than a free signal.

*The full method, including the corrective actions and the evaluation harness, is in the [self-correcting retrieval loops workshop](https://github.com/qdrant-labs/self-correcting-loops-workshop). For the building blocks the loop escalates to, see [late interaction models](/articles/late-interaction-models/), [hybrid search](/articles/hybrid-search/), and [query decomposition](/documentation/improve-search/query-decomposition/).*
