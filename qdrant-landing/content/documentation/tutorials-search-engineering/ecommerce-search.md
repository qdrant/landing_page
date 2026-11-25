---
title: E-Commerce Search With Geo Filters and Score Boosting
short_description: Search Wayfair products, filter nearby pickup offers, and balance relevance, free returns, and distance with Qdrant formula queries.
description: Build e-commerce search with the WANDS dataset, geographic filters, and explainable score boosting in Qdrant. Explore Amazon ESCI embeddings as a larger-catalog extension.
weight: 17
author: Ewa Szyszka
author_link: https://github.com/ESzyszka
aliases:
  - /documentation/tutorials-search-engineering/film-location-search/
goal: Search Quality
stack:
  - Python
  - FastEmbed
example_resources:
  - label: Open Notebook
    url: https://colab.research.google.com/github/qdrant/examples/blob/936426d5327cfe9d2e5497f5f9d4f04acfaf0a46/ecommerce-search/ecommerce-search.ipynb
keywords:
  - e-commerce search
  - score boosting
  - formula queries
  - geographic filtering
  - WANDS
---

# Find Products Nearby With Score Boosting

| Time | Level | Stack |
| --- | --- | --- |
| About 50 minutes | Intermediate | Python, FastEmbed, Qdrant |

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/qdrant/examples/blob/936426d5327cfe9d2e5497f5f9d4f04acfaf0a46/ecommerce-search/ecommerce-search.ipynb)

A shopper wants a piece of furniture they can pick up nearby. The closest offer may be a poor match for their search. A more relevant product may be farther away, while another comes with free returns. Your search needs to enforce pickup requirements and make those preferences explicit.

You will build this search using real product descriptions and relevance judgments from Wayfair's WANDS dataset. First, retrieve products by text similarity. Then filter for stock and pickup distance, add score bonuses for free returns and proximity, and inspect what each bonus does to the ranking. Finally, use the human labels to check whether promoting convenient offers also sacrifices product relevance.

You should be comfortable running Python notebook cells and understand that an embedding represents text as a vector. For a first introduction, work through [Semantic Search 101](/documentation/tutorials-basics/search-beginners/).

## Start the Notebook

Open the [companion notebook](https://colab.research.google.com/github/qdrant/examples/blob/936426d5327cfe9d2e5497f5f9d4f04acfaf0a46/ecommerce-search/ecommerce-search.ipynb) in a CPU runtime and run its setup cells in order. It downloads the data, starts a real Qdrant server, generates embeddings, and displays the query results. The code sections on this page follow the same sequence.

The notebook uses Qdrant 1.20.2, `qdrant-client` 1.20.0, FastEmbed 0.8.0, and a pinned revision of BGE small English v1.5. It verifies the server download's checksum and uses a dedicated temporary collection. You do not need a Qdrant account, API key, GPU, or Docker. Colab itself requires Google sign-in.

Allow time for the first data, model, and server downloads. The lesson duration is an estimate. When you finish, set `CLEAN_UP=True` in the cleanup cell to stop the server and remove its temporary files.

## Use Real Products and Simulated Pickup Offers

[WANDS](https://github.com/wayfair/WANDS) contains 42,994 products, 480 search queries, and 233,448 human relevance judgments. Its product records include names, descriptions, features, and categories. The labels distinguish Exact, Partial, and Irrelevant query-product matches. The repository provides the data under the MIT license.

The notebook downloads the tab-separated files from a pinned WANDS commit and selects the 1,123 unique products judged for query 418, "writing desk." This keeps CPU embedding time manageable and gives every returned product a known relevance label for that query. It is a deliberately restricted, judged candidate pool, not an evaluation of retrieval across the full catalog.

WANDS does not provide the pickup locations, stock, or return policies needed for this scenario. We add those fields deterministically as **simulated offer metadata**. They do not describe Wayfair's real stores, inventory, or policies. Each product has one simulated offer; a production catalog with several offers per product needs its own offer model and product deduplication.

| Field | Source and Role |
| --- | --- |
| Product ID, name, and description | Real WANDS data. Product text supplies the embedding. |
| Relevance label | Human WANDS judgment for the selected query. Used only to inspect results, never as a scoring input. |
| `pickup_location` | Simulated coordinates used for geographic filtering and scoring. |
| `in_stock` | Simulated stock flag used as a hard eligibility requirement. |
| `free_returns` | Simulated policy flag used as an optional score bonus. |

Semantic similarity does not establish stock or pickup availability. Keep those requirements in structured [payload](/documentation/manage-data/payload/) fields. The setup creates payload indexes for the geographic and Boolean fields before ingestion. Exact vector search over this small slice removes approximate retrieval as a source of variation; it does not demonstrate production indexing performance.

Some WANDS descriptions are empty. The embedding still includes the product name; inspect that name and its label when no description is available.

## Retrieve Products by the Shopper's Query

Use the same embedding model for the product text and search query. The initial search orders products only by vector similarity.

{{< code-snippet path="/documentation/headless/snippets/tutorial-ecommerce-search/" block="baseline" >}}

Read the product names and descriptions alongside their WANDS labels. Does the baseline retrieve the type of product the shopper requested? Boosting cannot recover a suitable product that candidate retrieval misses.

A cosine score is a similarity measure, not a confidence percentage. The differences between scores help determine how much an added bonus can change the ranking.

## Require Stock and Nearby Pickup

For this exercise, an offer must be in stock and within 15 kilometers of the shopper. Put both requirements in a filter.

{{< code-snippet path="/documentation/headless/snippets/tutorial-ecommerce-search/" block="filter" >}}

Compare this list with the unfiltered baseline. An out-of-stock or distant offer disappears regardless of how well its product matches. A score bonus cannot bring an excluded offer back.

Apply the same filter during every formula query's prefetch. This ensures that candidate retrieval spends its budget on eligible offers. The geographic condition also excludes offers without coordinates before distance scoring runs; missing coordinates should not silently become the shopper's location and earn the maximum bonus.

## Prefer Free Returns

The shopper can buy a product without free returns, but would prefer that policy. Add a fixed bonus when `free_returns` is true.

A formula query has two stages. The `prefetch` retrieves candidates using the search vector and eligibility filter. The formula calculates a new score for each candidate, and Qdrant returns the highest-scoring results.

{{< code-snippet path="/documentation/headless/snippets/tutorial-ecommerce-search/" block="returns" >}}

A payload condition inside a formula evaluates to one when it matches and zero otherwise. Multiplying it by a weight makes the maximum policy bonus explicit. An offer without free returns stays eligible and receives no policy bonus.

The formula's `$score` is the prefetch score. Keeping it in the sum preserves the product relevance signal. The free-returns flag is simulated business metadata, independent of the human relevance labels.

## Prefer Shorter Pickup Distances

The radius filter defines a hard boundary. Within it, a geographic decay function expresses a gradual preference for a closer pickup location.

{{< code-snippet path="/documentation/headless/snippets/tutorial-ecommerce-search/" block="proximity" >}}

`GeoDistance` measures geographic distance in meters. Gaussian decay converts that distance to a value between zero and one. With a target of zero, the decay is highest at the shopper's location. The `scale` is the distance where it reaches `midpoint`; it is not another cutoff.

`GEO_WEIGHT` limits the proximity contribution. An offer at the origin receives the full bonus. At a scale of 5,000 meters and a midpoint of 0.5, an offer five kilometers away receives half that bonus. Farther offers receive progressively less. This is geographic distance, not driving distance, travel time, or a delivery promise.

## Combine and Explain the Scores

Combine product similarity, the free-returns bonus, and proximity in one formula query.

{{< code-snippet path="/documentation/headless/snippets/tutorial-ecommerce-search/" block="combined" >}}

The notebook displays similarity, distance, the returns contribution, the proximity contribution, and the final score for each result. It independently reconstructs those contributions and checks that their sum agrees with Qdrant's score within numerical tolerance.

{{< code-snippet path="/documentation/headless/snippets/tutorial-ecommerce-search/" block="explanation" >}}

These results come from the notebook run on November 25, 2026. The free-returns weight is 0.08, the proximity weight is 0.15, and the distance scale is 5,000 meters with a midpoint of 0.5. The prefetch limit is 1,123; 812 products meet the eligibility filter. Product names are shortened, and each score component is independently rounded to four decimal places.

| Product (ID) | Similarity | Distance (km) | Returns Bonus | Proximity Bonus | Final Score |
| --- | ---: | ---: | ---: | ---: | ---: |
| Dells (18777) | 0.8799 | 1.8063 | 0.0800 | 0.1370 | 1.0969 |
| Mcdonough (24264) | 0.8342 | 0.6456 | 0.0800 | 0.1483 | 1.0624 |
| Sunnyvale (12456) | 0.8337 | 0.6456 | 0.0800 | 0.1483 | 1.0620 |
| Balido (32394) | 0.8472 | 2.6704 | 0.0800 | 0.1231 | 1.0502 |
| Genowefa (9000) | 0.8079 | 0.6456 | 0.0800 | 0.1483 | 1.0362 |

Product 2075 led the eligible semantic ranking with a similarity of 0.9497. Its simulated offer has no free returns and is 6.52 kilometers away. Dells has lower similarity, but its returns and proximity bonuses move it into first place. All five combined results have an Exact WANDS label for "writing desk."

Compare the original and final ranks alongside the product descriptions and labels. A rank change demonstrates that the preference affected ordering. It does not, by itself, demonstrate better product relevance.

The example weights are starting points for this query and score distribution. A bonus that is large relative to the similarity differences can reverse many relevance decisions. Recalibrate the weights when changing the embedding model or introducing a different score scale, such as hybrid fusion.

## Check Relevance and Candidate Coverage

The notebook compares the eligible semantic ranking, combined ranking, and an intentionally excessive proximity boost. Its small relevance audit uses the WANDS labels for the selected query. The same eligible judged pool supplies the reference ordering, so changing the formula does not change the evaluation universe.

First, increase the proximity weight while keeping the query, filter, and candidates fixed. Inspect the promoted product's description and label. A nearby weak match can win when proximity dominates. Set both bonuses to zero to recover similarity ordering over the same eligible pool; the order of tied scores is not significant.

{{< code-snippet path="/documentation/headless/snippets/tutorial-ecommerce-search/" block="overweight" >}}

The diagnostic uses NDCG@5, which rewards placing more relevant products earlier in the first five results. We map Exact to grade 2, Partial to 1, and Irrelevant to 0, then normalize against the ideal ordering within the eligible pool. A value of 1 means the top five achieve that ideal score under this grading rule.

{{< code-snippet path="/documentation/headless/snippets/tutorial-ecommerce-search/" block="relevance" >}}

In this run, all three policies have NDCG@5 of 1.0: every top-five result is labeled Exact. Increasing the proximity weight to 5 moves product 24264 into first place and makes the geographic bonus dominate the score, but it does not produce a measured relevance loss under these labels. The stress test exposes the weight's influence; it does not establish that the new ordering is worse for this shopper.

The labels describe whether the product matches the query. They do not judge pickup convenience, stock, or free returns. Treat the audit as a way to detect relevance tradeoffs, not as evidence that the simulated offer preferences improve shopping outcomes. Choose weights on separate development queries and evaluate on held-out queries before making a broader quality claim.

Next, reduce the prefetch limit and compare the results with a run that considers every eligible product in the slice. A formula can only rescore prefetched points. An offer outside that candidate set cannot enter the final results, even if its combined score would be high.

In the notebook run, prefetching only three semantic matches misses all three products that lead the wider combined ranking: 18777, 24264, and 12456. Expanding the candidate pool lets the formula consider those offers.

For a larger catalog, compare candidate limits on representative queries and judged results. Larger prefetches give the formula more candidates and more work. This exhaustive comparison is a small diagnostic example, not a production latency or full-catalog relevance benchmark.

## Try Another Shopping Decision

Move the shopper's origin in the notebook exercise. Predict which offers will benefit, then inspect their score components. Moving the origin changes both the eligible set and the proximity contribution; it does not require new product embeddings.

Try making free returns mandatory: add the flag to the eligibility filter and remove its bonus. Compare which offers remain with the earlier soft preference. Requirements determine the candidate set; preferences determine how eligible matches are ordered.

To try another WANDS query, use query ID 34, 124, or 425 and rerun the data-selection and embedding cells. This reloads the corresponding judged products and labels. The comparison tables expect at least five eligible products, so very small judged pools need adjusted display limits. Changing only the query text would leave you evaluating against judgments for a different request.

## Extend to Amazon ESCI Embeddings

For a larger experiment, the [Amazon ESCI products embeddings bucket](https://huggingface.co/buckets/itsclelia/esci-products-embeddings) provides precomputed product representations. This avoids embedding the full catalog yourself, but introduces a much larger download and ingestion step than the WANDS slice.

The bucket's README describes about 5.78 million product records, with dense and BM25 vectors, neural sparse vectors, and smaller CLIP and ColBERT subsets. The complete bucket is about 17.7 GB in decimal units. With a recent Hugging Face CLI that supports buckets, download it using:

{{< code-snippet path="/documentation/headless/snippets/tutorial-ecommerce-search/esci-download/" >}}

Inspect the README and each folder's `meta.json` before ingestion. The base export uses `asin` as the product ID; additional vector files use `id` for the same identifier. Join on that identifier rather than row position, and account for missing vectors. Different representations need separate vector configurations and compatible query encoders.

The base dense vectors have 384 dimensions, but the inspected README and metadata do not identify their encoder. Do not query them with this tutorial's BGE model merely because its dimension matches. Verify the original encoder and preprocessing first, or generate a new, consistent set of document and query embeddings.

The bucket also does not contain the original ESCI search queries and relevance judgments. Its 2,000 "queries" are held-out product titles. You need separate judged search queries for a relevance evaluation comparable to the WANDS exercise; do not treat a title-retrieval experiment as an ESCI search benchmark.

Keep the same separation of concerns: retrieve product candidates, filter verified offer eligibility, and apply optional score preferences. Join real operational metadata by product or offer ID in your own application, or label any simulated fields explicitly. Do not infer pickup locations from product text.

The [score boosting reference](/documentation/search/search-relevance/) describes the supported expressions. The [query-stage documentation](/documentation/search/hybrid-queries/) explains how prefetches feed a later query. For a broader e-commerce retrieval lesson, continue with [fine-tuning sparse embeddings on Amazon ESCI](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-1/).
