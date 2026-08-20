---
title: "How to Tune Vector Search Without Guessing"
draft: false
slug: tuning-retrieval-which-knob-first
short_description: "The reference tells you what each retrieval setting does. Five measurements tell you what your own data needs, and we ran all five."
description: "Tune retrieval in Qdrant: the measurement behind fusion k, candidate depth, rerankers, rescoring, and labeled set size."
preview_image: /blog/tuning-retrieval-which-knob-first/hero.jpg
social_preview_image: /blog/tuning-retrieval-which-knob-first/hero.jpg
date: 2026-08-19
author: Dylan Couzon
featured: true
weight: 0 # Change this weight to change order of posts
tags:
  - retrieval tuning
  - hybrid search
  - search relevance
  - reranking
  - quantization
---

Your collection works. Queries return in a few milliseconds, results are mostly right, and someone on the product side has started forwarding you the ones that aren't. You open the search API reference and get accurate definitions for `hnsw_ef`, reciprocal rank fusion `k`, and quantization `oversampling`. None of them tells you which setting is failing on your data.

So you pick one, change it, rerun your queries, and the score moves by 0.01. Is that a win, or is it the same queries landing differently?

Each of these settings has a right value, and it depends on something about your collection that nobody who wrote a default could see. That something is measurable. We ran all five measurements on five public datasets and turned the results into [five articles](/articles/before-tuning-a-qdrant-collection/), published today. Our collections held 5,183 to 4.6 million documents, so read the numbers as directions and the checks as the part that transfers.

![Pipeline diagram: a dense prefetch with limit and hnsw_ef settings and a sparse prefetch with limit and Modifier.IDF settings both feed a fusion stage with RRF k, weights, and DBSF settings, followed by an optional reranker with candidate count and model settings.](/articles_data/before-tuning-a-qdrant-collection/retrieval-pipeline.svg)

Every query retrieves candidates, then ranks them, and each stage owns its own settings.

## How Many Documents Can Answer One of Your Queries?

That count sets the fusion constant. It decides how steeply the head of a candidate list outranks its tail. At Qdrant's default of `k=2`, rank 1 carries 5.50 times the weight of rank 10, so fusion trusts each retriever's top pick almost blindly. At `k=61`, which reproduces [the original paper's convention](https://dl.acm.org/doi/10.1145/1571941.1572114), that ratio falls to 1.15, and being found by both retrievers matters more than being ranked first by one.

Our five datasets give a direction to start from. With about one relevant document per query, the best `k` was 2 or 5. With tens or hundreds of them, it was 20 or 61. A support search where a single document answers the question sits at one end, a product catalog where fifty are all reasonable at the other.

So count relevant documents per query, then sweep the matching end of 1, 2, 5, 20, and 61. That count comes from a labeled query set: real queries paired with the documents that should come back, and the ones product keeps forwarding you are the place to start. Try DBSF first, though. Qdrant's other fusion method takes no parameters at all and beat default RRF on three of our five datasets, which retires the `k` question entirely. [How to Tune Hybrid Search in Qdrant](/articles/how-to-tune-hybrid-search/) shows when the parameter-free option is the safer default, and when the `k` sweep earns the queries it costs.

## Retrieval and Ranking Fail Differently

The complaint arrives as one specific document. Somebody knows the right document exists, they searched the obvious words, and it came back at rank 40 or not at all. Two things could have happened: the document never made it out of the index, or it landed in your candidate list and your ranking buried it.

Those failures need opposite fixes. Retrieving more adds latency to every query, ranking better adds a stage you have to run and maintain, and guessing wrong means paying for one while the other keeps failing.

One measurement tells you which you have. Score your candidate list as if it were ordered perfectly, then compare that with what your pipeline returns. Use `nDCG@10`, which grades the top 10 results and gives more credit to relevant documents near the top. A wide gap means better ranking pays. A narrow one means you need better candidates.

We ran that check while pushing the candidate limit from 10 to 500. Retrieval delivered the whole way, lifting the best achievable score by as much as 0.28, while what users saw moved by 0.01 at most. The documents were arriving; the ranking stage left them out of view.

Why `hnsw_ef` moved less than anything else we tested, and how to run the check on your own collection, are both in [Candidate Depth: How Much Retrieval Is Enough?](/articles/candidate-depth/).

## The Baseline You Pick Decides the Answer

You bolt on a cross-encoder, the results get better, and you ship it. What you cannot tell from that is what you just bought, because a reranker costs a forward pass per candidate on every query, for as long as you run it.

Against Qdrant's out-of-the-box fusion, the best of four rerankers improved every dataset we tried. Against fusion tuned first, which only reorders lists you already retrieved and adds no query-time model call, most of that improvement disappeared: only two held up on fresh queries, and one turned into a loss.

Some of what the reranker had been paid for was tuning we had not done.

Make the comparison honest first. Tune fusion, then rerank 10 candidates and score it on fresh queries. In our tests a reranker that lost at 10 also lost at 200, so the cheap version of this test is the informative one. [When Is a Reranker Worth It?](/articles/when-a-reranker-is-worth-it/) covers what to check when it loses, which turned out to be the model's context window and training domain far more often than the candidate count.

## A Free Setting Becomes a Disk Read at the Memory Boundary

This one reaches you through your dashboards. Your p95 was fine on Friday, the collection grew over the weekend, and the same query now takes ten times longer. No error, no config change, nothing in the logs to blame.

Quantization keeps a compressed copy of your vectors in RAM and leaves the originals on disk. Rescoring reads those originals back to repair compression error, and while they sit in the page cache that read is close to free. Cross the point where they no longer fit and every query pays a disk seek instead. In our test the same query went from 4.3 ms to 43.4 ms, and the only thing that changed was the memory ceiling.

Switching rescoring off is the tempting fix and an expensive one at aggressive compression, where the dense stage missed roughly a third of the true nearest neighbors without it. Qdrant enables it by default at those settings for that reason.

The setting costs whatever your memory ceiling costs, and a laptop with room to spare will report that it is free. [When Your Collection Outgrows RAM](/articles/when-your-collection-outgrows-ram/) has the protocol, and the signal that tells the two regimes apart before your p95 does.

## How Small a Gain Can Your Labels See?

Back to that 0.01. You changed a setting and the score moved, and you still cannot say which. Whether that question has an answer at all depends on how many labeled queries you have.

Tuning fusion moved `nDCG@10` by roughly 0.01 to 0.04 on a scale that runs to 1. At 25 labeled queries, the uncertainty around a measurement that size is wider than the measurement itself, so noise can pick your winner. Around 200, the interval narrows enough to resolve.

The second trap costs weeks. Pick a winner on a set of queries, then report its score on those same queries, and the number flatters the setting you chose. Scored on fresh queries, our picks kept between two thirds and nearly all of the gain they had claimed. Split the set and report the half you did not choose on.

Two settings can make every measurement here meaningless: a sparse vector missing its IDF modifier, and a BM25 average length left on the default. [What to Check Before Tuning a Qdrant Collection](/articles/before-tuning-a-qdrant-collection/) catches both, then sizes the labeled set the other four checks run on. If all five checks come back flat, your problem sits upstream of these knobs, in the embedding model, the chunking, or the queries themselves.

Four of the five measurements run against a collection you already have and a labeled set you build once. A free [Qdrant Cloud](https://cloud.qdrant.io/signup) cluster covers those four; the memory one needs a container limit you control, so it stays self-hosted.
