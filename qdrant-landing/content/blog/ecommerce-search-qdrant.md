---
title: "Lessons From Building E-Commerce Search on Qdrant"
draft: false
slug: ecommerce-search-qdrant
short_description: "We built e-commerce search over 5.8M real products on Qdrant. These are the ranking, personalization, and scaling decisions that generalize."
description: "Build e-commerce search on Qdrant: lessons on hybrid ranking, in-query filtering, embedding recipes, personalization as re-rank, and merchandising formulas."
preview_image: /blog/ecommerce-search-qdrant/hero.jpg
social_preview_image: /blog/ecommerce-search-qdrant/hero.jpg
date: 2026-07-17
author: Dylan Couzon
featured: true
tags:
  - ecommerce-search
  - vector-search
  - hybrid-search
  - personalization
  - recommendations
---

E-commerce search is rarely one system. Relevance, filtering, personalization, merchandising, and recommendations each tend to arrive as a separate service, and the final ranking gets stitched across all of them. What a shopper sees is the sum of systems that were never built to agree.

We built [Qdrant Shopping](https://demo-ecommerce-search.vercel.app/), a storefront over 5.8 million real Amazon fashion products, to find out how many of those pieces collapse into one. Every text search is a single request to Qdrant's [Query API](/documentation/search/hybrid-queries/) that returns a ranked shelf in about 40 milliseconds, and the [code is on GitHub](https://github.com/qdrant-labs/demo-ecommerce-search). The decisions below apply to almost any product catalog, and we got several of them wrong before we got them right.

![Qdrant Shopping storefront: a search for running shoes, faceted category counts, and a per-product score breakdown, all from one Query API request](/blog/ecommerce-search-qdrant/storefront.png)

## Make Hybrid the Default, Not an Upgrade

A product query is two queries at once. Part of what a shopper types is an exact token: a brand, a size, a model number, a SKU, where the right result literally contains the string. The rest is intent, "something warm for hiking," where the right result may never use those words. Dense vectors handle the intent and fumble the exact tokens; keyword search nails the tokens and misses the intent.

So the storefront retrieves with both: a dense vector built from the product title and category, a BM25 sparse vector built from title, brand, and category, fused with reciprocal rank fusion in one Query API request. For a product catalog, hybrid is the floor, not the upgrade you reach for once relevance complaints pile up.

## Filter Inside the Query, Not After It

Every category page, price bracket, size, and in-stock toggle is a filter, and where you apply it decides whether the page survives. Retrieve the top vector matches first and filter after, and a strict filter empties the page: you fetched 100 candidates, 90 were out of stock, and the shopper sees 10 results while better matches sit barely outside the window you pulled. Qdrant applies the filter during the search instead, walking its filterable HNSW graph so only matching products are ever scored, and the [facet counts](/documentation/search/filtering/) down the side of the page come from the same payload.

One rule bites everyone exactly once: index every payload field you filter, sort, group, or reference in a formula. On Qdrant Cloud an unindexed field in any of those positions returns an error instead of a silent slow scan, which is the engine telling you to declare the field up front rather than discover the cost in production.

## What You Embed Matters More Than Which Model

A quality bug looked like a job for a bigger model: a search for a shirt was ranking on the brand rather than the garment. It was not the model. The title alone gave the embedding too little to anchor on, so brand tokens dominated the vector. Adding the product category to the embedded text fixed the drift, and it fixed it on every model we tried.

We benchmarked the bigger model anyway. The table compares precision@10 on a 200,000-product subset with the recipe applied to both (scored by the LLM judge described below), then the latency and memory each model costs after re-ingesting the full 5.8 million products:

| Model | Dimensions | precision@10 (subset) | Query latency | RAM (int8, full catalog) |
|---|--:|--:|--:|--:|
| MiniLM (shipped) | 384 | 90.3% | ~40 ms | 1.9 GB |
| Larger model | 1024 | 92.3% | ~180 ms | 6 GB |

Two points of precision@10 cost 4.5 times the query latency, 3 times the RAM, and an out-of-disk incident: the larger model's float32 originals filled a 96 GB node mid-ingest. We reverted. Embed the fields that define the product, its title, category, and key attributes, and check that text before you reach for a bigger model. The recipe is cheaper to change and usually fixes more.

## Quantize in RAM, and Skip the Rescore

The dense vectors live in RAM as int8, with the float32 originals on disk. Qdrant can [rescore](/documentation/manage-data/quantization/) the top candidates against those originals to undo quantization error, and we assumed a catalog this size would need it. Measured, the rescore bought 2 points of recall@10 at best while multiplying query time by 4.5 to 8, from 41 ms to as much as 334 ms, so we shipped without it.

The rescore reads originals from disk, and reciprocal rank fusion damps the small ordering errors quantization introduces. Quantization noise matters when one score decides the final order directly; when that score only feeds a rank fusion, it mostly washes out, and paying disk reads to correct it buys nothing a shopper can see.

## Personalize in Ranking, Not Retrieval

Our first pass added the shopper's taste vector, built from their purchase history, as a third retrieval branch fused with the dense and keyword branches. A search for "jeans" could then return a flannel shirt, because the taste branch contributed candidates the query never asked for.

So we moved taste out of retrieval and into ranking. The text query decides what qualifies; taste only reorders the page it returns, blended into the final rank at a weight of 0.45. Against the heavier 0.6 we started with, 0.45 held recall (0.82 versus 0.79) while cutting off-query items in the top 10 from 1.7 per query to 0.03. Below 0.45 the personas start converging on the same results with no further gain, so the shipped weight is a chosen point, not just the lowest one we tried.

Two edge cases need a decision up front. A query with no text, a landing page, has no intent to protect, so taste drives the whole ranking there. A shopper with no history gets the plain query ranking, which is the right cold-start default.

![Qdrant Shopping persona picker: six shoppers, each with their own tastes and past purchases that reorder results](/blog/ecommerce-search-qdrant/personas.png)

## Make Merchandising a Formula, Not a Service

Margin, popularity, freshness, price, rating, and stock are business signals, and the instinct is to build a service that reorders search results according to them. We put them in the ranking instead. One [Formula Query](/documentation/search/hybrid-queries/) rescore runs after fusion and composes the final score from those payload fields, and a campaign like "clearance" or "new arrivals" is a set of weights on that formula rather than a separate code path.

Presets and sliders change the weights, and the server clamps each to a fixed range. A merchandiser can retune a campaign without a deploy, and a bad slider value can't reshape the pipeline, only change how much a signal counts. That hands a merchandising desk to non-engineers without a second ranking service to keep in sync with search. Model the rules that change often as weighted terms in one formula, and keep the pipeline shape in code.

![Qdrant Shopping merchandiser desk: campaign presets and weight sliders for relevance, margin, popularity, freshness, price, and rating](/blog/ecommerce-search-qdrant/merchandiser.png)

## Every Eval Has a Blind Spot

Our first relevance eval was a golden set: fixed expected product IDs per query. One recipe change took a 60-query fixture to 27% strict match overnight, not because relevance dropped but because the expected IDs were the old model's own output. The eval wasn't measuring relevance; it was measuring distance from the model that built it, so every change scored as a regression.

We replaced it with an LLM judge that asks, for each returned result, whether it is relevant to the query. It reads the results rather than an answer key, so it never anchors to any model, which is what made the model comparison above possible; the shipped pipeline scores 96% by this judge on the full catalog. But the judge is blind too: it only sees what came back, so it measures precision and says nothing about what retrieval missed.

That is why the numbers in this post come from a small battery rather than one score. The judge scores precision, recall@10 catches what a cheaper setting drops, intrusion counts off-query items personalization sneaks into the top 10, and persona overlap checks that personalization still tells shoppers apart. Each metric exists because the one before it was blind exactly there. Even the golden set keeps a job: it is cheap, deterministic, and reliable as long as the model is frozen; ours only broke when we started iterating. Whatever mix you can run, the useful exercise is naming what each eval cannot see, then covering that spot with the next one.

## One Gotcha: Fusion and Shards

If you shard the collection, watch for one Qdrant-specific trap. Fusion is global only when it is the main query. Nest it one level down inside a prefetch and each shard fuses its own local results, then the per-shard rankings merge. Wrapping a fused query in a rescore stage, exactly what the merchandising formula above does, is what pushes it down that level.

Across four shards, a plain fused query reproduced the global top 10 on 87% of queries; the same query nested under a rescore fell to 55%. About half the top 10 comes back in a different position:

![The same 10 results ranked two ways: on a single shard they hold one order, and across four shards about half come back in a different position, with lines tracing each move](/blog/ecommerce-search-qdrant/fusion-shards.svg)

If the catalog fits on one node, a single shard keeps fusion global and still lets you rescore in the same request. If it doesn't, keep the fusion as the main query so it stays global, retrieve a generous candidate set, and apply the merchandising formula as a separate pass over those results. Qdrant's [hybrid queries documentation](/documentation/search/hybrid-queries/) states the rule.

## Try It

The whole storefront (search, filters, personalization, merchandising, and product-page recommendations) runs on one Qdrant collection with product payloads and three vector types: a MiniLM dense vector, a BM25 sparse vector, and a CLIP image vector for visual similarity. Query embeddings run in-cluster through [Cloud Inference](/documentation/inference/cloud-inference/), so the app serves no embedding model of its own.

[Qdrant Shopping is live](https://demo-ecommerce-search.vercel.app/), and the [full source](https://github.com/qdrant-labs/demo-ecommerce-search) shows the ingest, the schema, and the search path end to end. You can run the same pattern on a free [Qdrant Cloud](https://cloud.qdrant.io/signup) cluster and point it at your own catalog.
