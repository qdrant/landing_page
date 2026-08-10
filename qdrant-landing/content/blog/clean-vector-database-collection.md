---
title: "Clean Up Your Vector Database Collection Before You Blame the Prompt"
draft: false
slug: clean-vector-database-collection
short_description: "Learn how duplicates, stale data, and mixed retrieval pipelines distort top-k results as vector collections grow."
description: "Clean up a vector database collection: control duplicate points, embedding provenance, stale records, and top-k search quality."
preview_image: /blog/clean-vector-database-collection/preview/preview.jpg
social_preview_image: /blog/clean-vector-database-collection/preview/social_preview.jpg
title_preview_image: /blog/clean-vector-database-collection/preview/title.jpg
date: 2026-08-10
author: Dylan Couzon
featured: false
tags:
  - vector-database
  - vector-search
  - collection-maintenance
  - embeddings
  - data-quality
---

Every crawl, retried job, and embedding pipeline change writes points into a vector collection. The stored data keeps moving even when the query code never changes, and the top results move with it.

At first, little looks wrong. Search returns results, and latency stays normal. In our baseline run, the context-relevance score sat at 0.92 out of 1.00 while four answers in ten came back wrong, because duplicate chunks and one outdated record were filling the five results the agent could read.

We reproduced this pattern in a Qdrant and [Future AGI](https://futureagi.com/) webinar using a controlled Pokédex collection. The example was small enough to inspect by hand, but the same failure modes appear in product catalogs, support knowledge bases, recommendations, and agent memory.

## Growth Exposes Flaws That Shipped With the First Ingest

A larger collection creates more competition for each result slot. Weak identity rules, stale records, and poor retrieval choices are usually there from the first ingest. Growth only raises how often a query meets them.

We ran 33 of our 37 test questions against the collection at three sizes, from 1,314 points up to 22,946, and changed nothing else.

{{< figure src="/blog/clean-vector-database-collection/recall-decay.png" alt="Two lines plotted against collection size for the same 33 questions. The share of questions that find the right chunk in the top five falls from 67% at 1.3k points to 39% at 22.9k points, while the share of top-five slots holding repeats rises from 44% to 52%. The two lines cross at around 8.4k points." caption="Recall falls as duplicates take a larger share of the top five." width="100%" >}}

The smallest collection is the one to look at: with 1,314 points, repeats already held 44% of the five slots.

When quality falls after an ingest, inspect the collection before changing prompts or agent logic. Compare the point count with the source count, sample the top-k results your application receives, and check whether the same content or an older version of it appears more than once.

## Deduplication Works by Freeing Result Slots

Repeated ingestion had turned 8,416 distinct points into 22,946 total points. Removing the 14,530 unintended copies dropped queries with a duplicate in the top five from 36 of 37 to 2 of 37, and answer correctness, scored against known-good answers, rose from 0.57 to 0.76.

The agent reads the first five results of each search and nothing below them, so those five slots are all the evidence one search can offer. With the copies gone, they held five different chunks, and answer quality followed. The point count fell as a side effect.

Stable point IDs prevent most duplication at the source. Qdrant point loading is [idempotent](/documentation/manage-data/points/#idempotence), so a retry under the same ID updates the point already there instead of adding another one. Duplicates accumulate when each ingest assigns fresh IDs to content the collection already holds.

An exact copy is easy to find: hash the text of each point and compare the hashes. Deleting one takes more care, because the same text can legitimately sit in two places, once per tenant or once per language. Records that are merely similar have no automatic rule, because whether they count as the same thing depends on what your application does with them.

## Better Retrieval Can Still Produce a Worse Answer

Retrieval quality and answer quality move independently, so we grouped the 37 test questions to exercise one failure at a time. A stronger embedding model took the 14 questions built on near-identical entries from 0.64 to 1.00 on Recall@5, and answer correctness across the full set reached 0.92.

Hybrid search adds two steps to the query path, fusion and reranking. On the 18 ranking questions, fusing sparse and dense results scored 0.72, below the 0.78 plain dense search already reached, and the ColBERT reranking step is what carried the group to 0.89. Fusion on its own would have been a regression.

Then answer correctness fell, 0.92 to 0.86, on the change that improved every ranking metric.<br>The agent had been rewording failed queries and searching again, so the answer column never registered the ranking problem and had nothing to gain from the fix. Searches per question dropped from 2.0 at baseline to 1.14, which is where the improvement showed up instead.

Two checks disagreed about those same answers. Groundedness passed them, because the claims did come from the retrieved text. The hallucination check posted its worst reading of the run, because the answers also carried detail the sources never mentioned.

An agent that retries covers for bad retrieval, which is why the answer column missed both the problem and the fix.

## Freshness Belongs in the Data Model

Similarity can't decide which of two conflicting records is current. An older policy, price, or product state may be a close semantic match and still be wrong for the request.

Our collection contained one outdated type-chart record that was correct for its historical version. Every retrieval and grounding check passed the answer built on it, because the answer reflected that record accurately. Only the correctness judge stayed red, and it stayed red through all four retrieval upgrades.

{{< figure src="/blog/clean-vector-database-collection/steel-stale-baseline.png" alt="The Pokedex app answers the question Does the Steel type resist Ghost and Dark attacks with Yes. The retrieval panel beside it holds the record typechart-steel-gen5 at rank one with a score of 0.639, and the same record again at rank two, tagged as a duplicate." caption="The first question of the session. The top results are copies of an outdated type chart, and the answer built on them is wrong." width="100%" >}}

An `is_current` payload filter removed the stale record from current queries, which recovered answer correctness to 0.92.

{{< figure src="/blog/clean-vector-database-collection/steel-current-filtered.png" alt="The same question answered with No. The retrieval panel is tagged hybrid and current-only, and its top result is the record typechart-steel-gen6, the current type chart." caption="The same question with all four fixes in place. The panel retrieves current records only, and the answer flips." width="100%" >}}

Old records can stay in the collection, as long as something marks which of them is current. `status`, `version`, `is_current`, and `updated_at` are the usual fields, and they let each query state what it should retrieve. A [payload index](/documentation/manage-data/indexing/#payload-index) on every one of them keeps lifecycle rules part of retrieval, and it is what lets [filtering](/documentation/search/filtering/) run at all on a cluster that rejects unindexed fields.

## Pick Metrics That Can See the Failure

Chunk utilization, which measures how much of the retrieved context the generator uses, read 0.85 before deduplication and 0.85 after, while answer correctness rose 0.19 over the same change. Five copies of one chunk score the same as five distinct chunks, so the metric never had a way to register duplication.

One score rarely locates the failing layer, and two read together usually do. Low context relevance with low chunk utilization points at retrieval. High relevance with a failing correctness or groundedness score points at the generator or at the data behind it, and that is the reading that would have pointed at the outdated type chart four stages earlier.

One failure stays invisible to every check in this post: a record that never got ingested. Retrieval metrics score what came back, and answer metrics score what the agent said. Comparing the collection against the source list is the check that catches it.

## Watch the Full Walkthrough

The recording follows these problems through a working RAG system. [Dylan Couzon](https://www.linkedin.com/in/dcouzon) changes the retrieval path in Qdrant, while [Rishav Hada](https://in.linkedin.com/in/rishavhada) traces and evaluates the agent in Future AGI.

<div style="max-width: 640px; margin: 0 auto; padding-bottom: 1em">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/o73V446Po_o" title="Why Did My RAG Agent Get Worse? A Live Autopsy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
  </div>
</div>

[Watch the recording on YouTube](https://www.youtube.com/watch?v=o73V446Po_o), or see [Future AGI's partner recap](https://futureagi.com/blog/why-did-my-rag-agent-get-worse-webinar-2026/?utm_source=10augln&utm_medium=organic&utm_campaign=product_marketing) for more on its evaluation workflow.
