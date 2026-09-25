---
draft: false
title: "How Poliscope Made All of Germany's Local Politics Searchable on One Server with Qdrant"
short_description: "Poliscope runs hybrid search over 120M points of German municipal records on a single self-hosted Qdrant node."
description: "How Poliscope indexed 4,500+ German council portals into one self-hosted Qdrant collection of 120M points: hybrid search, tenant and prefix filtering, and 2-bit TurboQuant on one bare-metal server, taking searches from 20 seconds to 1.5."
preview_image: /blog/case-study-poliscope/social_preview.png
social_preview_image: /blog/case-study-poliscope/social_preview.png
date: 2026-09-25T00:00:00.000Z
author: Daniel Azoulai
featured: false
tags:
  - Poliscope
  - case study
  - vector search
  - hybrid search
  - multitenancy
  - payload filtering
  - quantization
  - GovTech
  - open source
partition: case-studies
---

![Poliscope makes all of Germany's local political data searchable in one place, crawling 4,500+ council portals and indexing 120M+ points in a single self-hosted Qdrant collection. Hybrid search, multitenancy, and 2-bit TurboQuant on one bare-metal server took mean search time from 20 seconds to 1.5 seconds, and tenant partitioning alone cut a typical query by 82%](/blog/case-study-poliscope/bento_box.png)

<a href="https://poliscope.de/" target="_blank">Poliscope</a> makes Germany's local political data searchable in one place. Germany has about 11,000 municipalities, and almost every one of them runs its own council information system (in German, a Ratsinformationssystem). That is where agendas, minutes, proposals, and planning documents get published. More than 4,500 of these portals exist, built on roughly a dozen software products, each with its own quirks, and none of them talk to each other.

This is the layer of politics that people feel most directly: a zoning decision for a wind farm, a new school building, whether the bus keeps running. It is also the layer nobody could search. To find out which councils in Germany were discussing wind energy, you opened the portals one at a time.

Poliscope crawls all of them, runs optical character recognition (OCR) over every PDF, and puts the result behind one search box. Its first customers were renewable energy project developers, who need to know the moment a council starts zoning a new area for wind or solar so they can reach landowners first. Journalists, city planners, and companies that sell to municipalities followed. Today the corpus covers roughly 500,000 meetings, 5.2 million agenda items, and 5.2 million documents, with about 20,000 new meetings arriving every month. In Qdrant that is 120 million points, 110 million of them document chunks. The company has four people, and one engineer maintains search.

## Before Qdrant, There Was No Search

Poliscope's first version did not search anything. Each meeting got a language-model relevance score for a handful of fixed topics, wind and solar among them, based only on agenda item titles. Nobody looked inside the PDFs. That was enough for the first customers, because those were the only topics they cared about, but it could not stretch to "search for anything."

The documents are where the real answers live: what was said, what was decided, how the vote went. Getting to them meant OCR over 4.3 TB of PDFs, ranging from one-page notices to 700-page planning files with embedded maps, and then a retrieval layer that could hold 100 million chunks and still answer in the time a person is willing to wait.

## Why Poliscope Chose Qdrant: Hybrid Search, Hierarchical Filters, and a Server It Could Own

Kolja Martens, Poliscope's co-founder and CTO, wrote down what the search engine had to do before he chose one. German keyword matching was non-negotiable: compound nouns make pure semantic search miss exact terms, so the engine needed dense and sparse retrieval in one query. Results had to be filterable by a hierarchical region code, because most users search one state, one district, or one town. Results had to be grouped by meeting. And the whole stack had to run on one large machine that Poliscope operated itself.

That last requirement was about jurisdiction as much as cost. Poliscope wanted an EU-only stack for the data, self-hosted, with no US vendor holding the index and no exposure to the US CLOUD Act. Data sovereignty comes up in Poliscope's own sales conversations, and a managed service in a US hyperscaler's region did not answer it.

In late 2025, Kolja evaluated Typesense and the usual managed vector offerings. Typesense turned out to be built for typo-tolerant product catalogs, with vector search as a secondary feature. Among the managed options, grouping search results was either missing or a workaround. He tried Qdrant on the free cloud tier before committing to a server, and in February 2026, Poliscope went to production on Qdrant open source.

{{< quote
  text="What tipped it for Qdrant: it is a pro tool. Everything is tunable, which means you can either shoot yourself in the foot or build something seriously fast, and we did both. At the same time it stays easy to use, the docs are good, and coding agents find their way around it without hand-holding."
  name="Kolja Martens"
  role="Co-Founder and CTO"
  company="Poliscope"
  featured="true" >}}

Cost predictability sealed the choice of one bare-metal server over a managed cluster. Kolja knows what the machine costs each month and which cores are doing optimization versus search.

{{< quote
  text="When I have nightmares, I have nightmares about an unhinged bill from my cloud provider."
  name="Kolja Martens"
  role="Co-Founder and CTO"
  company="Poliscope" >}}

## From 20-Second Searches to 1.5 Seconds Over 120 Million Points

Poliscope launched search in a hurry, with about 70 million points already indexed and little tuning. Single searches took up to 20 seconds. Waiting through one on a sales call was, in Kolja's words, an uncomfortable silence.

The fixes came from Qdrant's own knobs, each measured in production. Together they brought mean search time to 1.5 seconds, including cross-encoder reranking, which is now the most expensive step in the query.

**Tenant partitioning by state.** Most people search within one region. Germany has 16 states, which Poliscope grouped into 12 tenants using Qdrant's [multitenancy](https://qdrant.tech/documentation/manage-data/multitenancy/) support, with the same 12 groups as the collection's shards. Because a query almost always carries a region, it can discard up to 80% of the corpus before the vector search starts.

**A prefix index on the region hierarchy.** German administrative IDs are strictly hierarchical: every sub-entity's ID starts with its parent's ID. A single [prefix match](https://qdrant.tech/documentation/search/filtering/#prefix-match) on that field, backed by a keyword index with the prefix option, covers "everything inside this district" in one condition. Adding the level for exact matches, instead of a `match.any` over a list of IDs, replaced the slowest filter in the system.

**Flat query plus application-side grouping.** Poliscope groups hits into meetings so a result is a meeting, not a chunk. For its production query shape, the combination of hybrid search and server-side `group_by` was about 60x slower than a flat query, so the grouping moved into the application. Kolja plans to file a reproducible issue with the Qdrant team.

**2-bit TurboQuant.** Poliscope ran binary quantization first, then re-ingested with 2-bit [TurboQuant](https://qdrant.tech/documentation/manage-data/quantization/#turboquant-quantization) when Qdrant 1.18 shipped it. Dense vectors live on disk and the quantized index in RAM, with 3x oversampling and rescoring against the originals.

The table summarizes the production measurements Poliscope shared for each change.

| Change | Query type | Before | After |
|---|---|:---:|:---:|
| Tenant partitioning | Typical term | 1,315 ms | 235 ms |
| Tenant partitioning | Broad bounding-box query | 3.2 s | 1.7 s |
| Prefix index on region ID | Single-town search | 6 to 10 s | 0.3 to 0.8 s |
| Flat query, app-side grouping | Production query shape, server-side | 2.6 s | 45 ms |

Precision and recall are harder to give against a baseline, because the baseline was "not searchable." Poliscope handles quality by retrieving a broad pool from Qdrant and letting a reranker order it, then checking reference searches by hand. The team wants a systematic evaluation set and plans to build one.

{{< quote
  text="That still gives me a bit of a kick: one search box, and you see every council in the country that touched your topic last week. Monitoring at the municipal level went from practically impossible to something as easy as a Google search."
  name="Kolja Martens"
  role="Co-Founder and CTO"
  company="Poliscope" >}}

## How a Query Moves Through Poliscope

![Poliscope's pipeline: crawlers pull meetings and PDFs from 4,500+ council portals, an OCR queue on a GPU machine turns pages into Markdown, a BullMQ worker chunks and embeds them into one Qdrant collection with dense and BM25 sparse vectors. At query time, a tenant filter and region prefix filter narrow the corpus, a hybrid prefetch fuses BM25 and 2-bit quantized dense results with DBSF, the pool is grouped into meetings, and a Jina cross-encoder reranks them before results deep-link to the PDF page](/blog/case-study-poliscope/poliscope-search-architecture.png)

**Ingest.** Crawlers pull meetings, agenda items, proposals, and PDFs from the 4,500+ portals into Poliscope's database. PDFs go through an OCR queue on Poliscope's own GPU machine, where a vision model (LightOnOCR-2-1B) turns every page into Markdown. A database hook enqueues BullMQ jobs. A worker chunks the Markdown with a heading-aware chunker, so every chunk carries its heading breadcrumb, at about 1,200 characters with 150 characters of overlap. It embeds each chunk with OpenAI `text-embedding-3-small` (1,536 dimensions) and upserts it into Qdrant with Qdrant's built-in BM25 as the sparse vector, using the IDF modifier. Most changes reach Qdrant right after they land in the database. A weekly reconcile job cleans up the rest.

**Query.** Search serves Poliscope's on-platform search, its Model Context Protocol (MCP) server, agents, and monitoring services. The query parser supports OR sub-queries in hybrid mode, plus AND, NOT, and exact phrases in keyword mode. A [hybrid](https://qdrant.tech/documentation/search/hybrid-queries/) prefetch runs BM25 and dense search in one request, with the dense side served from the 2-bit quantized index and rescored at 3x oversampling, and fuses the two with distribution-based score fusion (DBSF). The result pool is grouped into meetings, then a Jina cross-encoder reranks the grouped pool. Every hit carries its PDF page range, so results deep-link to the right page of the source document.

**Setup.** Qdrant 1.18, a single node with 12 shards and one collection of 120 million points, on a Hetzner bare-metal server in Germany: an AMD EPYC 9454, 256 GB of RAM, and two 1.9 TB NVMe drives. Dense vectors sit on disk and the TurboQuant index in RAM. The collection takes 1.3 TB on disk and about 180 GB resident.

## One Engineer, One Server

There is no search team at Poliscope. One engineer maintains search alongside everything else, and one bare-metal server runs the whole platform.

Self-hosting has costs that a managed service would have absorbed. Kolja learned about sharding after the first ingest and had to re-ingest the collection to reshard it, which he did by standing up a second collection and switching over. Backups are on his list. He weighed those against the control he gets in return: knowing which cores serve queries and which run the optimizer, and being able to plan a backfill run around production.

Documentation carried a lot of that weight. Kolja develops with coding agents and a documentation MCP server, and Qdrant's docs and source were enough for the agents to find the right setting without hand-holding.

{{< quote
  text="Qdrant lets us make all of German local politics semantically searchable on a single server with only a small team. Every scaling problem we ran into had a knob for it, and the knob was well documented."
  name="Kolja Martens"
  role="Co-Founder and CTO"
  company="Poliscope" >}}

## What's Next: Ten More Years of Data and a Second Node

Poliscope's data starts in January 2024, the year the company started. A project with a research university will extend coverage back to 2016, which multiplies the corpus several times over. That growth will push the collection past one machine, so Kolja is planning a second node and [sharding](https://qdrant.tech/documentation/scaling/distributed_deployment/) across the two, and will revisit the self-hosted versus managed question when the dataset is larger.

On the retrieval side, the team is considering shorter dense vectors, since hybrid retrieval with BM25 has not produced misses they know of at 1,536 dimensions, and wants to replace gut feel with a measured recall and precision baseline before the next round of configuration changes.

## From Practically Impossible to a Search Box

Poliscope started with a monitoring problem that companies used to solve by handing interns a list of portals. It now runs hybrid search over 120 million points of German municipal records, filtered by tenant and region prefix, quantized to 2 bits, on one server that a four-person company owns outright. A search across every council in Germany returns in 1.5 seconds with reranking, and every result links back to the page it came from.
