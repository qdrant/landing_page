---
title: The Four Layers of Retrieval Evaluation
weight: 4
aliases:
  - /documentation/tutorials/retrieval-quality-fundamentals/
---

# The Four Layers of Retrieval Evaluation

<aside role="status">This page covers the concepts and framework behind retrieval evaluation; the hands-on execution lives in the individual tutorials. This page is slated to move out of the tutorials section and into a blog post.</aside>

A team swaps embedding models. Offline recall@10 climbs from 0.71 to 0.79. They ship. A week later, the hallucination dashboard hasn't moved, session length hasn't moved, and their PM wants to know whether the migration was worth it. Nobody in the room can give a straight answer.

This scenario plays out every time a retrieval system touches production. Model swaps, index reconfigurations, chunking changes, reranker upgrades, and dataset refreshes each claim to improve quality. Most of them ship without anyone knowing, before or after, whether they did. The missing piece is a systematic way to measure retrieval quality across the full stack, from algorithmic correctness all the way to business outcomes.

Retrieval quality operates at four distinct layers. Each one measures something different, costs something different, and fails in a different way. Teams that ship retrieval improvements with confidence tend to measure all four. Teams that can't answer the PM's question are usually optimizing one layer while flying blind on the others.

## The Four Layers

Retrieval quality sits on top of embedding quality. Embedding quality is measured separately by benchmarks like [MTEB](https://huggingface.co/spaces/mteb/leaderboard), a public leaderboard for embedding models, and it sets the ceiling on every downstream metric. The four layers that follow evaluate how well the pipeline preserves that ceiling.

### Layer 1: Approximate Nearest-Neighbor (ANN) Precision

Does the approximate index return the same results an exact nearest-neighbor search would? This is a purely algorithmic question about how faithfully the index (HNSW, or whichever ANN algorithm is in use) approximates exhaustive search. Sparse vectors use exact matching, so this layer doesn't apply to them. Layer 1 has nothing to do with whether the results are useful to a human.

### Layer 2: Retrieval Relevance

Of the results returned, how many are relevant to the query intent? This requires a labeled ground-truth dataset, human judgment, or LLM-as-judge scoring. A pipeline can hit near-perfect ANN precision and still surface irrelevant documents when the embeddings are a poor fit for the task.

### Layer 3: Pipeline Output Quality

Does the full pipeline (retrieval plus whatever consumes it: an LLM, a ranker, a recommendation surface) produce the right output? This is typically measured offline with LLM-as-judge or human rating on a labeled test set, and increasingly on sampled production traffic. It's downstream of retrieval and upstream of any business KPI.

### Layer 4: Business Impact

Does better retrieval lead to better business outcomes: lower hallucination rates, higher task-completion rates, improved user satisfaction, lower support cost, more revenue? This is what stakeholders care about, and it's the layer most teams fail to connect back to the work they're doing. The second half of this post is dedicated to it.

## The Evaluation Ladder

The four layers aren't measured in isolation. Teams that connect retrieval work to business outcomes build an *evaluation ladder* that runs each layer at a different cadence and cost, and uses the result of each layer to decide whether to invest effort at the next.

| # | Layer | What It Measures | Cadence | Cost |
|---|---|---|---|---|
| 1 | ANN precision | `Precision@k` vs exact kNN on a sampled query set | On index or embedding changes | Low |
| 2 | Retrieval relevance | `Recall@k` or `NDCG@k` vs a labeled golden set | Weekly, or on retrieval-stack changes | Low per run; the golden set is the real cost |
| 3 | Pipeline output quality | LLM-as-judge or human rating on the golden set and on sampled production traffic | Weekly, or on retrieval or generator changes | Moderate (LLM-judge cost × eval size) |
| 4 | Business impact | Online A/B behind a flag, or proxy signals | Per release, once offline layers pass | High (traffic, experimentation infra) |

Each layer is necessary but not sufficient. A win at layer 2 that doesn't carry through to layer 3 usually means the downstream consumer (the LLM generator in RAG, the ranker in a search UI, the prompt itself) is the bottleneck, not retrieval. This is the most useful diagnostic the ladder provides, and it's the reason teams shouldn't collapse layers 2 and 3 into a single score.

### Isolate the Component Under Test

When end-to-end quality moves, hold one side fixed. Evaluate retrieval with the downstream piece frozen (a specific LLM generator, a specific ranker, the current UI), and evaluate that piece with retrieval frozen. Without this discipline, attribution collapses into guesswork and the ladder stops being diagnostic.

### Pre-Register the Decision Rule

Before running the A/B, write down what counts as a win and what counts as a no-ship, in terms of both the retrieval metric and the KPI. This is the highest-leverage habit for avoiding "recall improved but the KPI didn't, the KPI is noisy, let's ship anyway" rationalization. We'll unpack the mechanics of a good decision rule in the layer 4 section.

### Tooling

For layer 1, the Qdrant Web UI ships with a Search Quality tab that measures ANN vs exact kNN without code (see [Measuring ANN Precision](/documentation/tutorials-search-engineering/retrieval-quality/)). For layer 2, [ranx](https://amenra.github.io/ranx/) is the standard Python library for ranking metrics (recall@k, MRR, NDCG@k, and others). For layer 3, tools like [Ragas](https://docs.ragas.io/), [Arize Phoenix](https://phoenix.arize.com/), and [DeepEval](https://docs.confident-ai.com/) cover LLM-as-judge scoring and offline answer-quality evaluation. Layer 4 tooling is a different category (experimentation platforms like Statsig, Eppo, or GrowthBook; product analytics like Amplitude, Mixpanel, or PostHog; LLM observability for production quality monitoring), covered in the layer 4 section.

## Quality Metrics

Different layers call for different metrics. The right choice depends on what the pipeline does with its results and what ground truth is available.

**Layer 1 (ANN precision).** The question is simple: of the `k` true nearest neighbors an exact search would return, how many did the approximation find? That fraction is **`precision@k`**:

`precision@k = |ANN results ∩ exact results| / k`

Because both result sets are size `k`, precision and recall collapse to the same formula, and some literature (notably [ANN-benchmarks](https://ann-benchmarks.com/)) calls this `recall@k` to emphasize that exact kNN is the ground truth.

**Layer 2 (retrieval relevance).** Several metrics quantify relevance against a labeled ground truth. [Precision@k](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Precision_at_k) counts relevant documents in the top-k. [Mean Reciprocal Rank (MRR)](https://en.wikipedia.org/wiki/Mean_reciprocal_rank) accounts for the position of the first relevant document. [DCG and NDCG](https://en.wikipedia.org/wiki/Discounted_cumulative_gain) weight by graded relevance score.

### Choosing the Right Metric

The table is a starting point, not a prescription. Pick the metric that matches your ground truth and your user-visible behavior.

| Scenario | Recommended Metric | Ground Truth | Why |
|---|---|---|---|
| Tuning HNSW parameters | `Precision@k` | Exact kNN search | Approximation manifests as missed items from the true top-k set, so set-overlap against exact search is the quantity that changes with index parameters |
| RAG pipeline (LLM reads top-k chunks) | `Recall@k` | Labeled relevant chunks | The LLM can recover if a relevant doc is at position 3 vs 1; missing it entirely hurts more |
| Single-answer retrieval (FAQ, Q&A) | `MRR` or `Hits@1` | Labeled correct answer | The first result is what the user acts on; lower ranks matter little |
| Re-ranking or recommendation feeds | `NDCG@k` | Graded relevance labels (for example, 0/1/2) | Order within the result list matters; a highly relevant doc at rank 5 is worse than at rank 1 |

On choosing `k`: set it to match actual usage. If the application shows 5 results to the user, measure `@5`. If a RAG pipeline passes 10 chunks to the LLM, measure `@10`. Reporting `@100` for a UI that surfaces 5 results makes the metric look artificially good.

`NDCG` is worth the added complexity only when you have **graded relevance labels** (for example, 0/1/2 scores per query-document pair rather than binary relevant/not-relevant) and when the downstream system benefits from fine-grained ranking. Without multi-grade annotations, the simpler metrics give a cleaner signal with less labeling overhead.

## Layer 4 in Depth: Connecting Retrieval to Business Outcomes

### Why Layer 4 Is Different

The first three layers are engineering questions with technical ground truth. ANN precision has exact kNN as its oracle. Retrieval relevance has a labeled golden set. Pipeline output quality has a judge (LLM or human) scoring outputs against expected answers. You can iterate on these layers in a notebook.

Layer 4 is different. The "right" answer is a business outcome, the "ground truth" is user behavior in aggregate, and the measurement happens in production under noise that has nothing to do with retrieval: seasonality, UX changes, generator drift, competitor moves, traffic-mix shifts. An offline win can fail to move a KPI for reasons that aren't the retrieval team's fault:

- **Generator dominance.** If the downstream LLM is already strong enough to compensate for mediocre retrieval, better retrieval doesn't move answer quality. This is common in RAG pipelines built on frontier models.
- **Ceiling effects.** If 90% of queries already have the right answer in the top 3, pushing recall@10 from 0.88 to 0.92 barely touches the KPI. The wins live in the long tail, which moves slowly.
- **Traffic dilution.** If a change only affects 5% of queries (say, long-tail non-English ones), it won't show up in a top-line metric averaged over all traffic. Slice the evaluation or the signal vanishes.
- **User adaptation.** Users who've learned to work around poor search reformulate multiple times. Better retrieval means fewer reformulations, which can look like lower engagement in some metrics.

And a KPI can move without an offline win: novelty effects in the first week of an A/B, confounds with a simultaneous UI change, seasonality, or statistical noise on a low-traffic surface. Layer 4 measurement is the practice of telling these apart.

### Pick the Right KPI for the Product Shape

No single KPI captures "retrieval is working." The right KPI depends on what retrieval is *for*. The following table maps common application shapes to the metrics that correlate with user value, with a note on which are leading (respond quickly to retrieval changes) vs lagging (take weeks or months to move).

| Application | Candidate KPIs | Leading / Lagging |
|---|---|---|
| RAG / Q&A | Answer-accepted rate, hallucination rate on sampled traffic, follow-up-question rate, source-click rate, regeneration rate | Leading: regeneration, follow-ups. Lagging: retention, NPS |
| Search UI | CTR@1, abandonment rate, reformulation rate, satisfied-session rate, time-to-first-click | Leading: all of these. Lagging: retention, repeat usage |
| Agentic | Task-completion rate, tool-selection accuracy, steps-to-completion, human-in-the-loop intervention rate | Leading: step count, tool accuracy. Lagging: cost per completed task, retention |
| Recommendations | Engagement rate, diversity-adjusted engagement, downstream conversion, long-term retention | Leading: engagement. Lagging: retention, LTV |

Pick one or two leading KPIs and one lagging KPI. Leading KPIs tell you whether the change is working. Lagging KPIs tell you whether the work matters.

### Guardrail Metrics

A KPI win is only real if it doesn't break something else. Retrieval changes commonly trade against:

- **Latency.** A larger `k`, a heavier reranker, or a multi-vector query can add tens of milliseconds to p95. On a chat surface, 80 ms of added latency can erase a 2-point gain on any quality metric.
- **Cost per query.** Reranker calls, LLM judges in production, and denser index configurations all raise the per-query bill. A recall improvement that doubles inference cost is rarely worth shipping at scale.
- **Index size and memory footprint.** A second vector space or higher-dimensional embeddings can multiply RAM. Qdrant's quantization and tiered storage exist because this trade-off is real.
- **Slice performance.** Top-line recall can rise while long-tail queries, non-English queries, or specific customer segments regress. Evaluate the relevant slices, not the average alone.
- **Safety and refusal rates.** In RAG, better retrieval sometimes surfaces content the system shouldn't answer from. Track refusal and unsafe-output rates alongside quality.

Write the guardrails into the decision rule before the A/B runs. A change that lifts the KPI by 1% but bumps p95 latency by 60 ms and doubles index cost is a no-ship in most organizations, and arguing about that after the test is how regressions slip in.

### Proxy Signals When You Can't A/B

Most teams building retrieval systems don't have a proper experimentation platform. A/B design for RAG and agentic systems is still evolving, and even at companies with Statsig, Eppo, or GrowthBook wired up, getting statistical power on a low-traffic surface can take weeks. Proxy signals bridge the gap. They're cheap to instrument and correlate reliably enough with value to catch big regressions and big wins.

The minimum viable instrumentation:

- **Explicit feedback.** Thumbs up / thumbs down on each answer or result. Noisy per query, meaningful in aggregate.
- **Implicit quality signals.** Copy-to-clipboard, share, save, export actions. Much stronger than thumbs because they carry intent.
- **Regeneration rate.** The fraction of users who re-ask, click regenerate, or rephrase within a short window. A drop in regeneration rate after a retrieval change is one of the cleanest leading indicators for RAG.
- **Source-click rate.** In RAG, what fraction of users click through to the retrieved source? If retrieval is surfacing the right source, users verify more often.
- **Dwell and session structure.** Time on answer, number of follow-ups, session length. Blunt but cheap.
- **Abandonment.** Fraction of sessions that end without any positive signal. The strongest negative indicator.

Build these into production telemetry before you need them. They're far cheaper to add early than to retrofit during an incident.

### Close the Offline-Online Loop

The single most useful exercise for a team serious about retrieval evaluation is calibrating the transfer function from offline wins to online movement. Run a handful of paired measurements: when offline recall@10 went up by 5 points, did the KPI move? By how much? Over how long?

After three or four paired measurements, patterns emerge:

- **The slope.** How much offline win translates to how much online movement. This is team- and product-specific; there's no industry constant.
- **The threshold.** Below some offline delta (typically 2 to 3 points on recall@10 in RAG), online noise swamps the signal. Stop running A/Bs below this threshold and batch changes instead.
- **The lag.** How long after launch the KPI moves. Two weeks is typical; a month isn't unusual for lagging metrics.

Once calibrated, offline becomes a credible predictor of online impact, and the PM question ("is this worth shipping?") gets a defensible answer instead of a shrug. Until calibrated, offline wins are unfalsifiable and no amount of layer 2 and 3 polish buys trust with the business.

### Experiment Design for Retrieval A/Bs

Retrieval experiments have their own failure modes worth naming:

- **Unit of randomization.** User is usually right. Session works for anonymous surfaces. Per-query randomization is almost always wrong for RAG: the same user getting different retrieval within a conversation produces incoherent experiences and breaks attribution.
- **Minimum detectable effect.** Retrieval A/Bs are chronically underpowered. If the KPI sits on a 3% baseline with high variance, detecting a 0.5 pp absolute change at 80% power may need millions of sessions. Check this *before* running the test. An underpowered test that shows "no effect" hasn't ruled anything out.
- **Novelty effects.** The first few days of any change show an effect that isn't the steady-state effect, in either direction. Run for at least two weeks, longer for low-traffic surfaces. Bake a minimum runtime into the decision rule.
- **Freeze the other side.** If the A/B is a retrieval change, don't ship a prompt change, a model swap, or a UI tweak during the same window. If you must, the attribution is compromised. Say so.
- **Simpson's paradox by query segment.** A retrieval change can lift the average while regressing on specific query types (short queries, non-English, ambiguous intents). Pre-register the slices that matter and check each one.
- **Interaction with the generator.** In RAG, a retrieval win is only real if the generator can use it. Evaluate on the generator you ship, not the strongest frontier model in a notebook.

### When You Can't A/B at All

Many retrieval systems run on traffic that's too low, too heterogeneous, or too sensitive for a conventional A/B. Alternatives that preserve some of the rigor:

- **Interleaving.** Mix results from two retrieval systems in the same ranked list and track which side users click. Far more statistically efficient than A/B for ranking changes.
- **Side-by-side blind evaluation.** Show two variants of the same answer or result list to raters (internal, external, or the users themselves) and collect preferences. Works well for RAG where subjective answer quality dominates.
- **Shadow traffic.** Run the new retrieval path in parallel with production, don't serve it to users, and compare offline. Doesn't give a KPI answer but surfaces regressions safely.
- **Pre/post with guardrails.** If traffic is stable enough, launch the change for everyone and watch the metrics move. This is weak inference, so only do it with a strong rollback plan and heavy pre-registered guardrails.
- **Moderated user studies.** Small-n, high-signal. Best for catching user-experience regressions that metrics miss.
- **Expert review panels.** Domain experts score results on a rubric. Expensive per sample, valuable when user behavior is a poor proxy for quality (medical, legal, financial retrieval).

Match the method to the risk. Shadow traffic for "is this safe?" Interleaving for ranking. Expert panels for compliance-sensitive domains. A/B only when you have traffic to spend.

### Anatomy of a Decision Rule

A good decision rule is a document, written before the experiment starts, that specifies:

1. **Primary KPI and expected direction.** Which metric decides the ship.
2. **Minimum effect size.** Below what delta the result is "flat" and not a win, regardless of statistical significance.
3. **Guardrails.** Which metrics must not regress, and by how much.
4. **Slices.** Which query or user segments get checked independently.
5. **Minimum runtime and sample size.** When the test is allowed to stop.
6. **Ship / no-ship / iterate criteria.** What combination of results leads to which decision.
7. **What happens if the KPI moves but the offline metric didn't, or vice versa.** The hardest case to handle under pressure and the most common.

The reason to write it down is that once results are in, everyone develops opinions about which metric is "really" important. Pre-registration is a commitment device against motivated reasoning. Review it. Agree on it. Sign it. Then run the test.

### The Organizational Pattern

The evaluation ladder is also an interface contract between teams. The common pattern in mature organizations:

- **Retrieval engineers own layers 1 and 2.** Index configuration, embedding choice, chunking, hybrid strategies. Their deliverable is a retrieval system that hits a target on the golden set.
- **Applied ML or evaluation engineers own layer 3.** LLM-as-judge infrastructure, golden-set curation, pipeline-output measurement across the full stack.
- **Product and analytics own layer 4.** KPI definition, experimentation platform, A/B analysis, business attribution.

The common failure mode is gaps at the handoffs. Retrieval engineers report recall wins that never get scored end-to-end. Evaluation engineers report answer-quality wins that never make it into an A/B. PMs run A/Bs that can't be attributed back to a specific retrieval change. The evaluation ladder is how those handoffs get made explicit, with a shared set of metrics and a shared cadence.

Teams that skip layers fail in predictable ways. Skipping layer 2 means every layer 3 regression is a mystery. Skipping layer 3 means shipping retrieval wins that don't help the user. Skipping layer 4 means shipping changes that feel good to the engineering team but don't move the business. Skipping layer 1 means chasing relevance problems that are really index-tuning problems in disguise.

### The Hard Case: Offline Wins, Flat KPI

This is the scenario at the top of the post, and it's the one worth thinking through most carefully. Offline recall is up. The KPI is flat. What do you do?

The answer depends on why. Work through the possibilities in order:

1. **Is the test powered?** Check the minimum detectable effect first. If the KPI can't detect a change of this size at this traffic level, "flat" means "we didn't measure it," not "there was no effect." Rerun with more traffic or batch the change with others.
2. **Is the KPI leading or lagging?** If you're measuring retention on a two-week A/B, the signal may not have arrived yet. Check leading indicators (regeneration rate, follow-up rate, reformulation rate) for movement.
3. **Is the downstream component dominating?** If the generator is strong enough to compensate for mediocre retrieval, retrieval wins disappear. Re-run the layer 3 evaluation with a weaker generator to confirm. This is useful information: it means retrieval isn't the bottleneck, and further investment should shift to the generator or the surface.
4. **Is the win concentrated in a slice that's invisible in the aggregate?** Check long-tail queries, specific languages, specific user cohorts. A 20% lift on 3% of queries is a real win even if the overall KPI doesn't move.
5. **Is the offline metric measuring the wrong thing?** If recall went up but the retrieved items are still the wrong ones for the task, the golden set is miscalibrated. Re-examine the labels.
6. **Is it genuinely a non-improvement?** Sometimes the answer is yes. This is why pre-registration exists. A shrug and a ship is how drift accumulates.

A team that can walk this list with a straight face, on the record, after every test, is a team that knows what its retrieval system does.

## Closing Argument

Retrieval systems are infrastructure that touch every AI feature a team ships. They get swapped, tuned, and replaced constantly. Without a measurement discipline across the four layers, those changes land blind, regressions accumulate, and the gap between "the retrieval team is busy" and "the product is getting better" widens until someone has to justify the work to a skeptical exec and can't.

The four-layer ladder is the cheapest version of that discipline. Layer 1 catches index regressions. Layer 2 catches relevance regressions. Layer 3 catches output-quality regressions. Layer 4 catches the wins and losses that matter. Run each at its right cadence, connect the results, and the PM's question ("was the migration worth it?") becomes a defensible answer instead of a shrug.

Qdrant is built around the same principle at the engine level. Retrieval primitives (dense vectors, sparse vectors, metadata filters, multi-vector representations, custom scoring) are exposed as composable decisions so engineers can tune for the quality metric that matters on their surface. Qdrant powers retrieval at Canva, Tripadvisor, HubSpot, Bosch, and others, from billion-scale user-generated content to domain-specific enterprise RAG. The ladder doesn't depend on any particular engine, and it's easier to run when the one you're on gives you enough control to move each layer on purpose.

To measure and tune the ANN precision of a Qdrant collection in practice, see [Measuring ANN Precision](/documentation/tutorials-search-engineering/retrieval-quality/). To build a labeled dataset for relevance evaluation, see [Building a Golden Query Set](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/). To score pipeline output quality on that golden set, see [Evaluating Pipeline Output Quality](/documentation/tutorials-search-engineering/retrieval-quality-pipeline-output/).
