---
title: "Predicting Weak Retrieval: Match the Signal to the Failure Mode"
short_description: "Cheap signals flag weak retrieval before you pay for a rerank or LLM judge. The one that works depends on how your search fails."
description: "Detect weak retrieval with cheap signals from the result. Which one works, spread, retriever divergence, or multi-dense agreement, depends on your corpus."
preview_dir: /articles_data/predicting-weak-retrieval/preview
social_preview_image: /articles_data/predicting-weak-retrieval/preview/social_preview.jpg
aliases:
  - /articles/route-retrieval-by-evidence/
weight: -200
author: Dylan Couzon
date: 2026-06-24T00:00:00+03:00
draft: false
keywords:
  - weak retrieval detection
  - query performance prediction
  - retrieval confidence
  - hybrid search
  - retriever divergence
category: search-quality
---

Most retrieval systems run the same pipeline on every query, and they fail silently when it goes wrong. When the relevant document never reaches the top of the results, the system answers anyway, from whatever it retrieved. The fix is a cheap check that flags weak retrieval before you spend on a reranker, a query rewrite, or an LLM judge: retrieve once, score the result with a number you compute for free, and escalate only when that number says the evidence is weak.

The hard part is not the escalation. [Cross-encoders](/documentation/fastembed/fastembed-rerankers/), [ColBERT late interaction](/articles/late-interaction-models/), query rewriting, and [decomposition](/documentation/improve-search/query-decomposition/) are well understood. The hard part is the cheap signal: which number actually predicts weak retrieval. This article shows there is no single answer. The signal that works depends on how your retrieval fails, and we measure that across three corpora that fail in three different ways.

## What "Weak Retrieval" Means

Before you can detect weak retrieval, you have to define it, and the definition has to be measurable.

Retrieval returns a long ranked list, but only the top few results are ever used. Call that the **window**: the top-k chunks fed to the model, or the results shown on the page. Anything ranked below the window is invisible in practice, no matter how good the recall looks deeper down. So good retrieval has a precise meaning: every piece of evidence the query needs lands in the window, and a retrieval is *weak* when even one is missing.

Set the window to match your own system, whatever number of results it consumes. On a labeled split, where you know which documents each query needed, "weak" becomes a binary label you can try to predict.

## Cheap Signals

A **signal** is a number you compute from the retrieval result that predicts whether the evidence is weak. A good signal meets two criteria, and the second is what makes this practical:

1. It separates good retrievals from weak ones on labeled data.
2. It is cheap enough to run on every query.

"Cheap" rules out the obvious approach. You could ask an LLM "is this enough to answer?" on every query, but that adds a model call and latency to the path you were trying to protect. The signals here read only what the retriever already returned, or at most ask Qdrant for one extra ranking. No LLM in the hot path.

These are not new. Predicting whether a retrieval succeeded is a studied problem, [query performance prediction](https://arxiv.org/abs/2504.01101) (QPP), with many post-retrieval predictors proposed. The two spread signals below are score-variance predictors, what that literature calls Unnormalized Query Commitment. The contribution here is not a new predictor. It is *which* known signal to reach for, and the answer depends on your data.

| Family | Signal | What it reads | Flags weak when |
|---|---|---|---|
| height | `max_score` | top-1 fused score | low |
| spread | `score_variance` | spread of the fused top-k scores | low (flat ranking) |
| spread | `dense_variance` | spread of the raw dense cosines | low |
| coverage | `evidence_coverage` | question entities present in the top-k text | low |
| agreement (dense vs sparse) | `retriever_divergence` | dense vs sparse top-k overlap | high (they disagree) |
| agreement (across dense models) | `dense_agreement` | top-k overlap across independent dense models | low (they disagree) |

The intuition behind each is what transfers to a new corpus:

- **Height and spread** ask whether the retriever could separate its top results. A confident retriever fans its scores out; a lost one bunches them together. [Reciprocal Rank Fusion (RRF)](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf) ranks rather than calibrates, so it flattens score shape, which is why the raw dense spread can carry information the fused spread loses.
- **Coverage** asks whether the entities named in the query appear in the retrieved text.
- **Agreement** asks whether two retrievers, or two independent embedding models, returned the same documents. When they diverge sharply, one of them is usually lost, which happens most on jargon and out-of-vocabulary terms.

### How the Signals Are Computed

Each signal is a few lines. The spread signals take the population standard deviation of a score list:

```python
import statistics

def score_variance(fused_points):     # spread of the fused RRF scores
    return statistics.pstdev([p.score for p in fused_points])

def dense_variance(dense_ranking):    # spread of the raw dense cosines
    return statistics.pstdev([score for _, score in dense_ranking])
```

`score_variance` reads the hybrid result you already have. `dense_variance` needs the raw dense ranking, which is one extra Qdrant query that reuses the query vector you already embedded, so there is no extra model call:

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

The two agreement signals compare ranked id lists. `retriever_divergence` is one minus the overlap between the dense and sparse top-k sets. `dense_agreement` runs the query through two or more independent dense models and measures how much their top-k lists overlap:

```python
def jaccard(a, b):
    a, b = set(a), set(b)
    return len(a & b) / len(a | b) if a or b else 1.0

def dense_agreement(rankings):        # rankings: one top-k id list per dense model
    pairs = [(a, b) for i, a in enumerate(rankings) for b in rankings[i + 1:]]
    return sum(jaccard(a, b) for a, b in pairs) / len(pairs)
```

Running two or three small dense models costs a few extra embeddings per query, still far below the cost of an LLM judge in the hot path.

## The Winning Signal Depends on the Failure Mode

On a labeled split you can score each candidate by how well its value separates good retrievals from weak ones, using the area under the ROC curve (AUC). Read it as a separation score: 0.5 is a coin flip, 1.0 is perfect. Because some signals fire high for weak retrieval and others fire low, take the stronger of the signal and its inverse.

We ran the same signals on three corpora that fail in three different ways: [MuSiQue](https://github.com/StonyBrookNLP/musique) (multi-hop question answering), and two [BEIR](https://github.com/beir-cellar/beir) datasets, NFCorpus (medical and nutrition text, heavy jargon) and SciFact (scientific claim verification). The strongest signal is different on each one.

{{< figure src="/articles_data/predicting-weak-retrieval/signal-by-corpus.png" alt="Grouped bar chart of separation AUC for five signals across MuSiQue, NFCorpus, and SciFact. retriever_divergence and dense_agreement are near chance on MuSiQue and SciFact but the strongest signals on NFCorpus; the spread and height signals carry MuSiQue and SciFact." caption="Separation AUC per signal, per corpus. The strongest signal is different on each corpus, and it tracks how that corpus fails." width="100%" >}}

| Signal | MuSiQue (multi-hop QA) | NFCorpus (medical jargon) | SciFact (scientific claims) |
|---|---|---|---|
| `dense_variance` (spread) | 0.73 | 0.77 | 0.75 |
| `max_score` (height) | 0.66 | 0.75 | **0.76** |
| `retriever_divergence` | 0.52 | **0.76** | 0.54 |
| `dense_agreement` (multi-dense) | 0.56 | **0.78** | 0.56 |
| `evidence_coverage` | 0.59 | 0.52 | 0.51 |
| small classifier (all signals) | 0.73 | 0.80 | 0.80 |

The AUCs are direction-agnostic separation scores. The window is the top-3 for MuSiQue and NFCorpus and the top-1 for SciFact, set per corpus to keep the weak class large enough to score. Every corpus used the same stack: a dense retriever and a [miniCOIL](/documentation/fastembed/fastembed-minicoil/) sparse retriever fused server-side with RRF, plus two additional independent dense models for the agreement signal.

Three corpora, three different winners, each explained by how the corpus fails:

- **MuSiQue fails when the answer needs a second hop the query cannot reach.** The first-hop retrieval looks confident and correct, so no confidence signal sees the problem: there is no embedding confusion to see. Nothing clears 0.73, and a classifier over all signals adds nothing: roughly 90% of the weak cases are multi-hop, and the failure is in the question, not the retriever.
- **NFCorpus fails by vocabulary mismatch.** Medical and nutrition queries hit out-of-vocabulary terms where dense and sparse retrievers disagree, and where independent dense models disagree, exactly when retrieval is weak. `retriever_divergence` (0.76) and `dense_agreement` (0.78) become the strongest signals, beating the spread family.
- **SciFact fails on ranking precision.** Queries are well-formed scientific claims, so dense models agree and the agreement signals carry no information. The failures are subtle ranking errors, which the spread and height signals catch (0.75 and 0.76).

Two things follow. Cheap signals have real headroom on single-hop precision corpora, where a small classifier reaches 0.80, and a hard ceiling on multi-hop QA, around 0.73, because the failure there is a hop the query cannot reach, not low confidence. And the signal you pick has to match the failure: agreement for vocabulary mismatch, spread for precision, and on a multi-hop workload, no cheap signal substitutes for fixing the query.

One signal lost everywhere. `evidence_coverage` stayed near chance on all three corpora (0.51 to 0.59): the query's entities show up in the top results for almost every retrieval, good or weak, so it cannot tell them apart. We drop it.

## Find Your Signal

This is the part that matters, and the part that does not transfer as a fixed answer. The method does. On a calibration split where you know the ground truth, score each candidate by its separation:

```python
from sklearn.metrics import roc_auc_score

def separation(values, weak_labels):
    auc = roc_auc_score(weak_labels, values)
    return max(auc, 1 - auc)   # separation, regardless of direction
```

Then two rules: keep any signal that separates above a bar (0.65 is a reasonable start), and drop any survivor that is a near-duplicate of a stronger one (absolute correlation above 0.85). The correlation rule matters because a redundant signal adds cost without adding information.

Pick signals and set thresholds on the calibration split, and hold out a separate test split for the final numbers. The winners are corpus-specific, so read the failure mode first: if your queries are jargon-heavy or full of identifiers, start with the agreement signals; if they are clean and the misses are precision errors, start with spread and height.

## Turn the Signal into a Gate

A signal becomes a decision through a threshold. Give the chosen signal a floor; if the retrieval falls below it, treat it as weak and escalate:

```python
def retrieval_is_weak(result):
    return chosen_signal(result) < FLOOR
```

The floor is a tradeoff, not a constant. Raise it to catch more weak retrievals at the cost of escalating more queries; lower it to escalate less and miss more. A good default is the threshold that maximizes the catch rate minus the false-alarm rate on the calibration set (the [Youden point](https://en.wikipedia.org/wiki/Youden%27s_J_statistic) on the ROC curve). When a missed weak retrieval costs more than an extra escalation, target a recall instead, for example catch 90% of weak retrievals. If two signals separate well and correlate weakly, gate on either firing: they catch different failures.

{{< figure src="/articles_data/predicting-weak-retrieval/gate-histogram.png" alt="Histogram of a signal's value for good and weak retrievals, with the calibrated floor marked. Most weak retrievals fall below the floor." caption="The chosen signal's distribution for good and weak retrievals, with the calibrated floor. The shaded region escalates." width="85%" >}}

## Acting on a Weak Retrieval

Once the gate fires, what you escalate *to* is the settled, lower-stakes part. A reranker, a query rewrite, a larger embedding model, decomposition, relaxing a filter, or handing off to a person are all valid, and the gate does not care which you pick. The expensive decision is *whether* to escalate, and the gate makes it for free on every query. A worked self-correcting loop, where a query-shape check picks the escalation and the gate decides when to spend it, is in the [accompanying workshop](https://github.com/qdrant-labs/self-correcting-loops-workshop).

The one case the gate cannot repair is the missing hop. On a multi-hop or unanswerable query, detecting the weak retrieval is the win; escalation still cannot conjure evidence that the query never reaches or that is not in the corpus. Knowing the difference is the point: spend the gate where a signal exists, and recognize the workload where none does.

## Adapt This to Your Corpus

The specific winners here are not portable, but the recipe is:

1. **Set the window** your system consumes, and what counts as the evidence a query needs.
2. **Label retrieval outcomes** on a calibration split: did that evidence reach the window?
3. **Benchmark cheap signals** and keep the ones that separate, then drop the redundant.
4. **Match the signal to your failure mode**: agreement for vocabulary mismatch, spread and height for precision.
5. **Threshold the winner into a gate**, and escalate only when it fires.

The reusable idea is small and sturdy: retrieval quality is observable from cheap statistics of the result, *when* the failure is one those statistics can see. Measure which signal that is on your own data, set a floor, and let the evidence decide which queries are worth the expensive path.

## Adjacent Work

This sits in a line of work on corrective and adaptive retrieval. The difference is where the decision comes from: the gate here reads a cheap statistic of what was already retrieved, with no extra model call and nothing to train.

- The signals are post-retrieval [query performance predictors](https://arxiv.org/abs/2504.01101); the field has many, and which one predicts failure on a given corpus is exactly the question this article measures.
- [CRAG](https://arxiv.org/abs/2401.15884) also grades the retrieval, but trains a dedicated evaluator model to do it.
- [Adaptive-RAG](https://arxiv.org/abs/2403.14403) routes on query complexity *before* retrieving, the question-shape approach this article argues against: route on the evidence you got back, not the shape of the question.
- [Self-RAG](https://arxiv.org/abs/2310.11511) bakes the decision into a fine-tuned model; [FLARE](https://arxiv.org/abs/2305.06983) gates on the generator's token confidence.
- [Sufficient-context work](https://arxiv.org/abs/2411.06037) asks the same "is this enough?" question, but with an LLM judge rather than a free signal.

*The full self-correcting loop, including the corrective actions and the evaluation harness, is in the [self-correcting retrieval loops workshop](https://github.com/qdrant-labs/self-correcting-loops-workshop). For the building blocks the loop escalates to, see [late interaction models](/articles/late-interaction-models/), [hybrid search](/articles/hybrid-search/), and [query decomposition](/documentation/improve-search/query-decomposition/).*
