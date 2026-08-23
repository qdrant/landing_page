---
title: "How to Tune Vector Search Without Guessing"
draft: false
slug: tuning-retrieval-which-knob-first
short_description: "The reference tells you what each retrieval setting does. Five measurements tell you what your own data needs, and we ran all five."
description: "Tune retrieval in Qdrant: the measurement behind fusion k, candidate depth, rerankers, rescoring, and labeled set size."
preview_image: /blog/tuning-retrieval-which-knob-first/hero.jpg
social_preview_image: /blog/tuning-retrieval-which-knob-first/hero.jpg
date: 2026-08-24
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

Your collection works. Queries return in a few milliseconds, results are mostly right, and product keeps forwarding you the ones that aren't. You open the search API reference and get exact definitions for `hnsw_ef`, reciprocal rank fusion `k`, and quantization `oversampling`. The definitions are correct. They still don't tell you which setting is failing on your data.

So you change one setting, rerun the queries, and the score moves by 0.01. Did relevance improve, or did the same queries land differently?

Each setting has a right value, and it depends on something about your collection that no default can see. That something is measurable. We ran those measurements on five public datasets, from 5,183 to 4.6 million documents, and published the results today in five articles. Here's the problem each one solves, and the result we didn't expect.

The five articles work on one query path. A dense and a sparse prefetch retrieve candidates, fusion merges the two lists into one ranking, and an optional reranker reorders the top of it.

![Pipeline diagram: a dense prefetch with limit and hnsw_ef settings and a sparse prefetch with limit and Modifier.IDF settings both feed a fusion stage with RRF k, weights, and DBSF settings, followed by an optional reranker with candidate count and model settings.](/articles_data/before-tuning-a-qdrant-collection/retrieval-pipeline.svg)

## Seven Settings Can Quietly Break Your Search

Start where the 0.01 question gets its answer. Seven collection settings can cap search quality no matter what you tune next. Two examples: a sparse vector missing its IDF modifier stops rare words from counting more than common ones, and a BM25 average length left at the default misjudges every document's length. Neither raises an error. The results are quietly worse.

Your labels decide what you can measure, too. In our runs, 25 labeled queries weren't enough: the noise was wider than any gain our fusion tuning produced. [What to Check Before Tuning a Qdrant Collection](/articles/before-tuning-a-qdrant-collection/) catches all seven settings and shows how many labeled queries you need before the next four checks are worth trusting.

## One Constant Flipped the Top Result on 202 of 480 Queries

Hybrid search runs a dense and a sparse query, then merges the two result lists with reciprocal rank fusion. One constant, `k`, decides how much that merge favors each list's top-ranked documents. Qdrant defaults to `k=2`, which puts heavy trust in each list's first pick. Switching to the `k=61` from [the original paper](https://dl.acm.org/doi/10.1145/1571941.1572114) changed which document ranked first for 202 of 480 queries on one of our datasets.

That makes `k` worth testing, but you may not need it at all. DBSF, Qdrant's other fusion method, takes no parameters and beat default RRF on three of five datasets. [How to Tune Hybrid Search in Qdrant](/articles/how-to-tune-hybrid-search/) shows which method to reach for, and the one count that picks your `k` when you do sweep it.

## Retrieval Delivered, Ranking Buried It

Every search system eventually gets this complaint: a document the user knows exists doesn't come up. They searched the obvious terms, and it landed at rank 40 or nowhere. Either retrieval missed it, or ranking buried it. Those failures need different fixes.

The obvious move is to retrieve more. Retrieving more did help: pushing the candidate limit from 10 to 500 lifted the best achievable score by up to 0.28. The score users saw moved by 0.01 at most, because ranking was burying what retrieval had already found. Even `hnsw_ef`, the knob many teams reach for first, moved the final score by at most 0.0022. [Candidate Depth: How Much Retrieval Is Enough?](/articles/candidate-depth/) shows the check that separates missed retrieval from buried relevance before you pay to fix the wrong one.

## The Reranker Got Credit for Tuning We Skipped

You add a cross-encoder, relevance improves, and you ship it. That improvement costs a model forward pass per candidate on every query, for as long as the reranker runs.

Before you pay that cost on every query, tune fusion first. Part of what a reranker appears to buy is fusion tuning you skipped. The best of four rerankers beat Qdrant's out-of-the-box fusion on all five datasets, but against tuned fusion, most of that lift disappeared, and one win became a loss. [When Is a Reranker Worth It?](/articles/when-a-reranker-is-worth-it/) shows the cheap test that tells you when the model earns its latency.

## The Query That Got 10 Times Slower Over the Weekend

Your p95 looked fine on Friday. The collection grew over the weekend. On Monday, the same query takes ten times longer, with no error and no config change to blame.

The culprit is rescoring. Quantization keeps a compressed copy of your vectors in RAM and rereads the originals to fix compression error. While the originals fit in memory, that reread is nearly free. Once they stop fitting, it hits disk: the same query went from 4.3 ms to 43.4 ms.

So measure quantization at the memory limit you deploy with, because a machine with spare RAM can hide the disk-read cost. And think twice before switching it off: without rescoring, the dense stage found only six in ten of the true nearest neighbors. [When Your Collection Outgrows RAM](/articles/when-your-collection-outgrows-ram/) has the protocol for choosing between speed and recall, and the signal that warns you before your p95 does.

## Start with the Problem You Have

Each article answers one of these:

- You changed a setting and can't tell whether it helped: [What to Check Before Tuning a Qdrant Collection](/articles/before-tuning-a-qdrant-collection/)
- You use hybrid search with the default fusion settings: [How to Tune Hybrid Search in Qdrant](/articles/how-to-tune-hybrid-search/)
- A document you know exists comes back buried or missing: [Candidate Depth: How Much Retrieval Is Enough?](/articles/candidate-depth/)
- You're deciding whether a reranker would pay for its latency: [When Is a Reranker Worth It?](/articles/when-a-reranker-is-worth-it/)
- Latency jumped after the collection grew: [When Your Collection Outgrows RAM](/articles/when-your-collection-outgrows-ram/)

If more than one fits, start with the first. It builds the labeled query set the other four checks run on, using the queries product keeps forwarding you as raw material. Run the checks, and tuning stops being guesswork.
