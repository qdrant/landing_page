---
draft: false
title: "How Moonsift Shipped AI Shopping Search Over a Catalog It Rewrites Every Day"
short_description: "Daily bulk deletes kept crashing other providers and stalled its shopping AI. On Qdrant Cloud, the catalog of over 15M products turns over every day, and the shopping AI is live."
description: "Moonsift adds over 1M fashion and homeware products a day and deletes expired ones daily, while shoppers search by image and text. How it moved that workload to Qdrant, got three people off database firefighting, and launched its shopping AI, with the search pipeline and the human-evaluation process behind it."
preview_image: /blog/case-study-moonsift/social_preview.png
social_preview_image: /blog/case-study-moonsift/social_preview.png
date: 2026-11-30T00:00:00.000Z
author: Daniel Azoulai
featured: false
tags:
  - Moonsift
  - case study
  - vector search
  - image search
  - multimodal search
  - e-commerce
  - payload filtering
partition: case-studies
---

![Moonsift is a shopping AI for fashion and homeware that searches millions of products by image and text on Qdrant Cloud. It adds over 1M products a day and deletes expired ones daily while shoppers search. After moving off other providers that crashed on those deletes, three people went back to product work and Moonsift launched its shopping AI to all users.](/blog/case-study-moonsift/bento_box.png)

<a href="https://www.moonsift.com/" target="_blank">Moonsift</a> wants to be the best place to keep your shopping context. You save what you're thinking of buying from any store, and a shopping AI that knows your taste finds more of what you'd want across many retailers. The goal is shopping that gets more personal the more you save.

The search behind it runs over more than 15 million fashion and homeware products, and the catalog is never the same two days running. Every day Moonsift adds over 1 million new products and deletes the ones that have aged out, while shoppers search it by image and by text.

<figure>
  <video autoplay muted loop playsinline controls preload="metadata" width="100%" poster="/blog/case-study-moonsift/moonsift-find-similar-poster.jpg" aria-label="Captioned screen recording: a shopper saves a red dress in Moonsift and asks for more like it, then Qdrant returns similar dresses from across retailers">
    <source src="/blog/case-study-moonsift/moonsift-find-similar.mp4" type="video/mp4">
  </video>
  <figcaption>A shopper saves a dress, and Qdrant finds similar products across more than 15 million items.</figcaption>
</figure>

With other providers Moonsift tried, those daily bulk deletes kept crashing the database. Three people on a small team, including Moonsift's machine learning engineer, spent their weeks firefighting instead of building, and the shopping AI couldn't ship. After the move to Qdrant, the deletes stopped being an event. The team went back to product work, and in November 2026 Moonsift rolled its shopping AI out to all of its users.

{{< quote
  text="Having a reliable vector database is crucial. It allows us to focus our time where we can be most innovative: building the shopping copilot."
  name="David Wood"
  name_url="https://www.linkedin.com/in/davidwooduk/"
  role="Co-Founder and CTO"
  company="Moonsift"
  avatar="/img/customers/david-wood.png"
  logo="/img/customers-case-studies-logo/moonsift.svg"
  featured="true" >}}

## Where People Keep What They're Thinking of Buying

Shoppers save products from any online store to Moonsift with a browser extension or the iOS and Android apps, much the way they'd pin an image. Moonsift extracts the product data and adds it to their collections. The point is to make shopping easier and more considered: save now, decide later. In the past year, shoppers saved over 10 million items from about 250,000 retailers.

Co-founders Alex Reed (CEO) and David Wood (CTO) always planned to build an intelligent shopping assistant on top of that data. In the early years they built the wishlist and its user base. Following a successful product-market fit, they raised venture capital to build the AI. The result is a search built for personal taste. Whereas a typical shopping search is dominated by mass-market, lower-quality brands, Moonsift focuses on surfacing higher-quality products.

Shoppers can use Moonsift to search in three ways:

- Type a query, as they would in any shopping search
- Pick a product they saved, or one they're looking at on a retailer's site, and find similar items
- Take a product image and change it with words, such as "this hat, without the bobble" or "this, but darker"

Moonsift calls the third one "Semantic Transfer Search." A language model reads what the shopper wants changed, Moonsift fuses the vector of the original product with vectors for the requested features, and Qdrant retrieves the products closest to the result. As David puts it, it's only really possible because of vectors.

<figure>
  <video autoplay muted loop playsinline controls preload="metadata" width="100%" poster="/blog/case-study-moonsift/moonsift-change-with-words-poster.jpg" aria-label="Captioned screen recording: a shopper types make it floral print under a red dress, then Qdrant returns similar dresses in floral prints">
    <source src="/blog/case-study-moonsift/moonsift-change-with-words.mp4" type="video/mp4">
  </video>
  <figcaption>Semantic Transfer Search: the same dress, changed with words.</figcaption>
</figure>

<figure>
  <video autoplay muted loop playsinline controls preload="metadata" width="100%" poster="/blog/case-study-moonsift/moonsift-text-search-poster.jpg" aria-label="Captioned screen recording: a shopper types ankle boots, Qdrant retrieves matching boots, the shopper adds I like it flat, and Qdrant returns flat ankle boots">
    <source src="/blog/case-study-moonsift/moonsift-text-search.mp4" type="video/mp4">
  </video>
  <figcaption>Text search with a refinement. Each change runs a new search in Qdrant.</figcaption>
</figure>

## The Hard Part: A Rolling Catalog Under Live Traffic

Moonsift's catalog is a rolling window. Products arrive every day from many sources. Moonsift tags them and embeds them with its own CLIP-inspired vision-language model. Every day it also deletes products older than the window. That can mean over 1 million inserts a day, and a matching stream of deletes, on a collection of more than 15 million points that shoppers are querying the whole time.

With those other providers, bulk deletes with filters crashed the database again and again. Moonsift runs a weekly session where the whole company tests the latest build. For several weeks, the team arrived with improvements to show and found the database down.

The cost landed on people. Moonsift's machine learning engineer spent most of her time keeping the database running instead of working on models. The lead software engineer, who knows databases best, got pulled in, and so did David. On a small team, that was three people not improving search.

## Why Moonsift Moved to Qdrant

David compared several engines and wanted one that was open source. Before switching, he talked through the delete problem with Qdrant CEO André Zayarni.

On Qdrant, the daily deletes stopped crashing anything. [Filtering](https://qdrant.tech/documentation/search/filtering/) held up under the delete load, and Qdrant took large write batches and worked through them. David also found search faster than before.

It wasn't all automatic. When the collection doubled, from about 4 million to 8 million points, some settings needed tuning. Qdrant CTO Andrey Vasnetsov and an engineer joined a call with the team late on a Friday evening and worked through the configuration with them. In May 2025, after upgrading and moving payloads out of RAM, memory use dropped to what the team expected, and Moonsift used the freed capacity to hold more products. Today Moonsift runs on [Qdrant Cloud](https://qdrant.tech/cloud/), with separate staging and production clusters.

{{< quote
  text="For the past year, Qdrant has just worked, and we haven't had to worry about it. Our data comes in through several pipelines, and these require frequent maintenance. Having this part that's a relatively new database technology be the reliable one is super important."
  name="David Wood"
  name_url="https://www.linkedin.com/in/davidwooduk/"
  role="Co-Founder and CTO"
  company="Moonsift"
  avatar="/img/customers/david-wood.png"
  logo="/img/customers-case-studies-logo/moonsift.svg" >}}

## How a Search Moves Through Moonsift

![Moonsift's search pipeline. To keep the catalog current, the latest stock goes through feature extraction and embedding (image, description, and features) and is inserted into Qdrant, which stores 15M+ vectors with daily inserts and deletes. At search time, a text search or product search is interpreted by a language model, Moonsift fuses the input and feature vectors into a query vector, Qdrant retrieves candidate products, and Moonsift postprocesses (personalize, dedupe, score, spread) and ranks the results.](/blog/case-study-moonsift/moonsift-search-architecture.png)

**Ingest.** Products come from the items shoppers save and from catalog sources. Vision-language models extract and standardize product data from very different retailer pages. Making that step affordable took a lot of Moonsift's engineering effort, because sending every full page to a large model would run up costs fast. Moonsift extracts features from each product, embeds its image, description, and features, and upserts it into Qdrant with its payload.

**Query.** A language model interprets the shopper's intent, and for a product search it extracts the features of the input product. Moonsift fuses the input and feature vectors into the query. It then runs multiple Qdrant queries per search, each one grouped with the [grouping API](https://qdrant.tech/documentation/search/search/#grouping-api), so a single search returns thousands of candidates.

**Ranking.** Ranking runs outside Qdrant, and it's where a significant amount of Moonsift's product work goes. Raw embedding similarity has quirks for shopping: it returns ten products from one retailer because their photos share a style, or because the same model wears all of them. It also has to decide what to do with one product sold by several retailers. Moonsift's postprocessing dedupes, scores, and spreads the candidates before ranking them, highest fit first.

## Shipping on Human Evals

One thing that sets Moonsift apart is how it decides what ships. It has a team of human evaluators who match its target shoppers, and they have scored almost every release.

Each evaluator ranks every result in an evaluation interface, marking what they like and what they don't, and adds comments. The ratings roll up into a numeric score for each release, and a language model reads the comments to pull out recurring themes. Moonsift built this early, because without it a fix for one problem would quietly make other queries worse and nobody would know.

{{< quote
  text="Qdrant's flexible retrieval strategies allow us to experiment with different ways of capturing shopping intent. Combined with our human evaluation framework, we can continuously refine retrieval and ranking to deliver more relevant results."
  name="I-chun Han"
  name_url="https://www.linkedin.com/in/ichun-han/"
  role="Lead Machine Learning Engineer"
  company="Moonsift"
  avatar="/img/customers/i-chun-han.png"
  logo="/img/customers-case-studies-logo/moonsift.svg" >}}

## Lower Risk: The Team Ships Product Instead of Fixing Search

David sums up what Qdrant changed in one word: risk. Before the move, any week could end with search down, a testing session lost, and three people pulled off the product to fix it. Now the team plans around what it wants to ship, not around whether search will still be up.

- Moonsift rolled its shopping AI out to all users in November 2026, and some shoppers already come back to it regularly.
- The machine learning engineer works on models and ranking again, and the lead software engineer and David are back on product. For the past six months, the team's focus has been personalization and ranking, and it has barely had to touch Qdrant.
- The daily delete job runs against a collection of over 15 million products, and scaling up, while shoppers search.
- In a November 2026 load test, Moonsift ingested over 2 million products in a day.

## What's Next: 60 Million Products and Personal Taste

Moonsift is growing the catalog from 15 million to about 60 million products over the next few months by adding sources. Over the next six months it will be personalizing results for each shopper by learning their style.

## From Firefighting to Shipping

Moonsift spent years earning the right to build a shopping AI, and then watched it stall on databases that couldn't keep up with a catalog that changes every day. Moving that catalog to Qdrant took the database off the team's list of problems. The people who had been fixing it went back to models, ranking, and evals, and the shopping AI reached every Moonsift user.

Running search over a catalog that changes every day? See how teams use [Qdrant for e-commerce](https://qdrant.tech/e-commerce/), or [talk to us](https://qdrant.tech/contact-us/).
