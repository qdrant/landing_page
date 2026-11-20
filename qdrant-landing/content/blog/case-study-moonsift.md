---
draft: false
title: "How Moonsift Shipped AI Shopping Search Over a Catalog It Rewrites Every Day"
short_description: "Daily bulk deletes kept crashing Moonsift's previous provider and stalled its launch. On Qdrant, the 15M-product catalog turns over every day without incident, and the shopping AI is live."
description: "Moonsift adds up to 1M fashion and homeware products a day and deletes expired ones daily, while shoppers search by image and text. How it moved that workload to Qdrant, got three people off database firefighting, and launched its shopping AI, with the architecture and the human-evaluation process behind it."
preview_image: /blog/case-study-moonsift/social_preview.png
social_preview_image: /blog/case-study-moonsift/social_preview.png
date: 2026-11-20T00:00:00.000Z
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

![Moonsift searches about 15M fashion and homeware products by image and text on Qdrant. It adds up to 1M products a day and deletes expired ones every day while shoppers search. After moving from a previous provider that crashed on those deletes, Moonsift has run on Qdrant for about 1.5 years without a database incident, and launched its shopping AI to all users in month 2026.](/blog/case-study-moonsift/bento_box.png)

<a href="https://www.moonsift.com/" target="_blank">Moonsift</a> runs a shopping search over about 15 million fashion and homeware products, and the catalog is never the same two days running. Every day Moonsift adds up to 1 million new products and deletes the ones that have aged out, while shoppers search it by image and by text.

On its previous provider, those daily bulk deletes kept crashing the database. Three people, including Moonsift's machine learning engineer, spent their weeks firefighting instead of building, and the shopping AI couldn't ship. After the move to Qdrant, the deletes stopped being an event. The team went back to product work, and Moonsift launched its shopping AI to all of its users in [PLACEHOLDER: month 2026], [PLACEHOLDER: N months] after the switch.

{{< quote
  text="[PLACEHOLDER, built from David's words on the November 19 call, for his approval:] We had so many weeks where we'd made real improvements, got to the company testing session, and the database had crashed again. Three of us were spending so much time on it that we couldn't do any product work."
  name="David Wood"
  role="Co-Founder"
  company="Moonsift"
  >}}

## Where People Keep What They're Thinking of Buying

Shoppers save products from any online store to Moonsift with a browser extension or the iOS and Android apps, much the way they'd pin something. Moonsift extracts the product data and adds it to their collections. The point is to slow shopping down: save now, decide later. Moonsift earns affiliate commission when a saved product sells. In the past year, shoppers saved about [PLACEHOLDER: confirm "10 million"] items from about [PLACEHOLDER: confirm "100,000"] retailers.

Co-founders Alex Reed (CEO) and David Wood always meant to build an intelligent shopping assistant on top of that data. They spent the first four to five years building the wishlist and its user base, then raised money for the AI. The result is a search built for personal taste. Moonsift curates its catalog, removing roughly 90% to 95% of the mainstream, low-quality brands that fill most general shopping results [PLACEHOLDER: optional one line with Moonsift's own stat, about 75% of results on a general shopping engine; confirm and whether to name it].

Shoppers search three ways, and they use text search and "find similar" about equally:

- Type a query, as they would in any shopping search
- Pick a product they saved, or one they're looking at on a retailer's site, and find similar items
- Take a product image and change it with words, such as "this hat, without the bobble" or "this, but darker"

Moonsift calls the third one semantic transfer search [PLACEHOLDER: how the image and the text edit are combined, for example adding vectors in embedding space, recommend-style positive and negative examples, or a model rewriting the query, and whether Qdrant or Moonsift's code does the combining]. Search is part of Moonsift Pro, which shoppers unlock by referring a friend.

[PLACEHOLDER: 10 to 20 second demo video from Moonsift's machine learning engineer, no audio, with burned-in captions marking where Qdrant runs. Suggested beats: save an item, "find similar", a text edit such as "make it darker", results.]

## The Hard Part: A Rolling Catalog Under Live Traffic

Moonsift's catalog is a rolling window. Products arrive every day from many sources. Moonsift tags them and embeds them with a [PLACEHOLDER: confirm "CLIP-based"] vision-language model. Every day it also deletes products older than the window, which is shrinking from about two months to about one. That's [PLACEHOLDER: "hundreds of thousands" or "up to 1 million"] inserts and a similar volume of deletes every day, on a collection of about 15 million points that shoppers are querying the whole time.

[PLACEHOLDER: how the daily delete runs, from David: by filter on a timestamp payload field or by batches of IDs, points deleted per day, how long the job takes, and search latency while it runs. If Moonsift considered one collection per time window swapped with aliases, why it chose one collection.]

On the previous provider, bulk deletes with filters crashed the database again and again. Moonsift runs a weekly session where the whole company tests the latest build. For [PLACEHOLDER: "most weeks for about N months"], the team arrived with improvements to show and found the database down. Moonsift's machine learning engineer spent most of her time keeping it running instead of working on models. The lead software engineer, who knows databases best, got pulled in, and so did David. That was three people on a team of [PLACEHOLDER: team size at the time] working on infrastructure instead of the product.

## Why Moonsift Moved to Qdrant

David wanted an open-source engine [PLACEHOLDER: why open source mattered while running on managed Qdrant Cloud, for example "so we could always run it ourselves"]. Before switching, he talked through the delete problem with Qdrant CEO André Zayarni.

On Qdrant, the daily deletes stopped crashing anything. Filtering held up under the delete load, and Qdrant took large write batches and worked through them. David also found search faster than before [PLACEHOLDER: any before-and-after number, such as upsert rate, indexing lag, or search latency during deletes].

When the collection doubled, from about 4 million to 8 million points, some settings needed tuning. Qdrant CTO Andrey Vasnetsov and an engineer joined a call with the team that Friday evening and worked through it [PLACEHOLDER: what the configuration problem was and what changed]. In May 2025, after moving payloads out of RAM and upgrading to Qdrant 1.14, memory use dropped enough for Moonsift to move to a smaller instance [PLACEHOLDER: confirm OK to publish]. The setup has been stable since, and Moonsift now plans to grow the collection 4x.

{{< quote
  text="[PLACEHOLDER, built from David's words, for his approval:] For the past year and a half, Qdrant has just worked, and we haven't had to worry about it. Our data comes in through several pipelines scraping data from all over the place, and something in those is always failing somewhere. Having the part that's a relatively new technology be the reliable one is huge for us."
  name="David Wood"
  role="Co-Founder"
  company="Moonsift"
  >}}

## How a Search Moves Through Moonsift

[PLACEHOLDER: architecture diagram in Qdrant style, redrawn from David's sketch. Working alt text: "Moonsift's pipeline: products from many retailers are extracted, standardized, tagged, and embedded with a vision-language model, then upserted into one Qdrant collection on a rolling window with daily deletes. At query time, a language model preprocesses the shopper's input, Moonsift runs several grouped Qdrant queries that return thousands of candidates, and its own ranking picks the top 40 the shopper sees."]

**Ingest.** Products come from items shoppers save and from catalog sources [PLACEHOLDER: confirm wording]. Vision-language models extract and standardize product data from very different retailer pages. Making that step affordable took a lot of Moonsift's engineering effort, since sending every full page to a large model would run up costs fast. Each product gets [PLACEHOLDER: named vectors, for example an image vector and a text vector, with dimensions and distance] and payload fields, then goes into Qdrant.

**Query.** A language model preprocesses the shopper's input. Moonsift then runs [PLACEHOLDER: confirm "five"] Qdrant queries per search, [PLACEHOLDER: what each one searches on], each grouped with the [grouping API](https://qdrant.tech/documentation/search/search/#grouping-api) by [PLACEHOLDER: field, for example product or retailer] so one search returns thousands of candidates [PLACEHOLDER: limit and group_size]. At query time Moonsift filters on [PLACEHOLDER: payload fields, for example category, price, or retailer, and which are indexed]. Moonsift recently raised the number of candidates per query from about 250, because its ranking got faster and better with more to choose from.

**Ranking.** Ranking runs outside Qdrant, and it's where most of Moonsift's product work goes. Shoppers look at about the top 40 results. Raw embedding similarity has quirks for shopping: it returns ten products from one retailer because their photos share a style, or because the same model wears all of them, and it has to decide what to do with one product sold by several retailers. Moonsift's ranking handles both.

**Setup.** [PLACEHOLDER: Qdrant version, Qdrant Cloud on GCP (confirm), node count, RAM, shards and replicas, quantization type if any, what sits on disk.] Qdrant-only search latency for one grouped query is [PLACEHOLDER: P50] at the median and [PLACEHOLDER: P95] at P95.

## Shipping on Evals, Not Gut Feel

What most sets Moonsift apart is how it decides what ships. It has a team of human evaluators who match its target shoppers, and they have scored almost every release. They don't test made-up queries. They shop for things they actually want to buy, because shopping for a hypothetical is nothing like shopping for real.

Each evaluator ranks every result in an evaluation interface, marking what they like and what they don't, and adds comments. The ratings roll up into a numeric score for each release, and a language model reads the comments to pull out recurring themes. Moonsift built this early because without it, a fix for one problem would quietly make other queries worse and nobody would know. The evaluators also told the team something useful for scaling: they rate production results higher than staging, partly because production has more products to choose from. That's a big reason for growing the catalog.

Since launch, Moonsift also tracks a live signal: whether shoppers save items from their search results [PLACEHOLDER: save rate from search, or its growth, if shareable].

{{< quote
  text="[PLACEHOLDER: quote from Moonsift's machine learning engineer on building search for fashion, or on the evals process.]"
  name="[PLACEHOLDER: name]"
  role="Machine Learning Engineer"
  company="Moonsift"
  >}}

## Results

- Moonsift launched its shopping AI to all users in [PLACEHOLDER: month 2026], [PLACEHOLDER: N months] after moving to Qdrant, and some shoppers already come back to it regularly [PLACEHOLDER: repeat-search or retention number, if shareable].
- The machine learning engineer works on models and ranking again, and the lead software engineer and David are back on product [PLACEHOLDER: share of the ML engineer's week on the database then versus now].
- The daily delete job runs against a collection of about 15 million products while shoppers search, and Qdrant has run for [PLACEHOLDER: about 1.5 years] without [PLACEHOLDER: confirm "a database incident"].
- [PLACEHOLDER, keep only if confirmed: Qdrant costs about the same as the previous provider did, and memory tuning let Moonsift move to a smaller instance.]

{{< quote
  text="[PLACEHOLDER: quote from Alex Reed, CEO. Angles: what it meant to fund the AI work and watch it stall on infrastructure; choosing a layer an 11-person team never has to think about; growing to 60M products on the same setup.]"
  name="Alex Reed"
  role="Co-Founder and CEO"
  company="Moonsift"
  >}}

## What's Next

Moonsift plans to grow the catalog from 15 million to about 60 million products over the next few months, by adding sources and ingesting up to 2 million products a day. Over the next six months it plans to personalize results for each shopper, starting with the brands each person already saves and moving toward learning their style [PLACEHOLDER: confirm OK to publish the roadmap].

[PLACEHOLDER: CTA. Option A: "Running search over a catalog that changes every day? Talk to us" (Contact Sales). Option B: the e-commerce solutions page, https://qdrant.tech/e-commerce/.]
