---
draft: false
title: "How Poliscope Made All of Germany's Local Politics Searchable on One Server with Qdrant"
short_description: "Poliscope runs hybrid search over 130M points of German municipal records on a single self-hosted Qdrant node."
description: "How Poliscope indexed about 4,800 German council portals into one self-hosted Qdrant collection of 130M points: hybrid search, tenant and prefix filtering, and TurboQuant on one bare-metal server, taking mean search time from 20 seconds to 0.87 seconds."
preview_image: /blog/case-study-poliscope/social_preview.png
social_preview_image: /blog/case-study-poliscope/social_preview.png
date: 2026-10-13T00:00:00.000Z
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
  - TurboQuant
  - GovTech
  - open source
partition: case-studies
---

![Poliscope makes all of Germany's local political data searchable in one place, crawling about 4,800 council portals into a single self-hosted Qdrant collection of 130M+ points. Mean end-to-end search time fell from up to 20 seconds at launch to 0.87 seconds, and moving the original vectors to TurboQuant 4-bit cut the collection's disk footprint by 55%](/blog/case-study-poliscope/bento_box.png)

<a href="https://poliscope.de/" target="_blank">Poliscope</a> makes Germany's local political data searchable in one place. Germany has about 11,000 municipalities, and almost every one of them publishes through a council information system (in German, a Ratsinformationssystem). That is where agendas, minutes, proposals, and planning documents get published. Many portals serve several municipalities at once, so Poliscope's roughly 4,800 active portals cover about 90% of German municipalities and 98% of the population. They run on roughly a dozen software products, each with its own quirks, and none of them talk to each other.

This is the layer of politics that people feel most directly: a zoning decision for a wind farm, a new school building, whether the bus keeps running. It is also the layer nobody could search. To find out which councils in Germany were discussing wind energy, you opened the portals one at a time.

Poliscope crawls all of them, runs optical character recognition (OCR) over every PDF, and puts the result behind one search box. Its first customers were renewable energy project developers, who need to know the moment a council starts zoning a new area for wind or solar so they can reach landowners first. Journalists, city planners, and companies that sell to municipalities followed. Today the corpus covers about 532,000 meetings, 5.5 million agenda items, and 5.6 million documents, with about 20,000 new meetings arriving every month. In Qdrant that is 130 million points, 117 million of them document chunks.

## Before Qdrant, There Was No Search

Poliscope's first version did not search anything. Each meeting got a language-model relevance score for a handful of fixed topics, wind and solar among them, based only on agenda item titles. Nobody looked inside the PDFs. That was enough for the first customers, because those were the only topics they cared about, but it could not stretch to "search for anything."

The documents are where the real answers live: what was said, what was decided, how the vote went. Getting to them meant OCR over 4.3 TB of PDFs, ranging from one-page notices to 700-page planning files with embedded maps, and then a retrieval layer that could hold more than 100 million chunks and still answer in the time a person is willing to wait.

## Why Poliscope Chose Qdrant: Hybrid Search, Hierarchical Filters, and a Server It Could Own

Kolja Martens, Poliscope's co-founder and CTO, wrote down what the search engine had to do before he chose one. German keyword matching was non-negotiable: compound nouns make pure semantic search miss exact terms, so the engine needed dense and sparse retrieval in one query. Results had to be filterable by a hierarchical region code, because most users search one state, one district, or one town. Results had to be grouped by meeting or by proposal. And the search stack had to run on one large machine that Poliscope operated itself.

That last requirement was about jurisdiction as much as cost. Poliscope wanted an EU-only stack for the data, self-hosted, with no US vendor holding the index and no exposure to the US CLOUD Act. Data sovereignty comes up in Poliscope's own sales conversations, and a managed service in a US hyperscaler's region did not answer it.

In late 2025, Kolja evaluated Typesense and the usual managed vector offerings. He found Typesense geared toward typo-tolerant product catalogs, with vector search as a secondary feature. Among the managed options, grouping search results was either missing or a workaround. He tried Qdrant on the free cloud tier before committing to a server, and in February 2026, Poliscope went to production on Qdrant open source.

{{< quote
  text="What tipped it for Qdrant: it is a pro tool. Everything is tunable, which means you can either shoot yourself in the foot or build something seriously fast, and we did both. At the same time it stays easy to use, the docs are good, and coding agents find their way around it without hand-holding."
  name="Kolja Martens"
  name_url="https://www.linkedin.com/in/kolja-martens-762b47160/"
  role="Co-Founder and CTO"
  company="Poliscope"
  avatar="/img/customers/kolja-martens.png"
  logo="/img/customers-case-studies-logo/poliscope.svg"
  featured="true" >}}

## From 20-Second Searches to Under a Second Over 130 Million Points

Poliscope got a first version of search to customers early, with about 70 million points already indexed and little tuning. Single searches took up to 20 seconds. Waiting through one on a sales call was, in Kolja's words, an uncomfortable silence.

The fixes came from Qdrant's own settings, each measured on the production corpus.

**Tenant partitioning by state.** Most people search within one region. Germany has 16 states, which Poliscope grouped into 12 tenants using Qdrant's [multitenancy](https://qdrant.tech/documentation/manage-data/multitenancy/) support, with the same 12 groups as the collection's shards. Because a query almost always carries a region, it can discard up to 80% of the corpus before the vector search starts.

**A prefix index on the region hierarchy.** German administrative IDs are strictly hierarchical: every sub-entity's ID starts with its parent's ID. A single [prefix match](https://qdrant.tech/documentation/search/filtering/#prefix-match) on that field, backed by a keyword index with the prefix option, covers "everything inside this district" in one condition. This replaced the slowest filter in the system.

The table shows the production measurements Poliscope shared for both changes.

| Change | Query type | Before | After |
|---|---|:---:|:---:|
| Tenant partitioning | Typical term | 1,315 ms | 235 ms |
| Tenant partitioning | Broad bounding-box query | 3.2 s | 1.7 s |
| Prefix index on region ID | Single-town search | 6 to 10 s | 0.3 to 0.8 s |

**TurboQuant for the index and for the originals.** Poliscope started with Qdrant's 2-bit [binary quantization](https://qdrant.tech/documentation/manage-data/quantization/#15-bit-and-2-bit-quantization). On September 26, 2026, it switched the in-RAM index to 1.5-bit [TurboQuant](https://qdrant.tech/documentation/manage-data/quantization/#turboquant-quantization), a configuration change that needed no re-ingest. Two days later, on Qdrant 1.19, it moved the original vectors on disk from float32 to the [`turbo4` datatype](https://qdrant.tech/documentation/manage-data/vectors/#turbo4), copying the data into a new collection to do it. Storage on the server was starting to run low, and the move freed it while improving recall.

The table shows Poliscope's before and after measurements for each step, with latency measured on the Qdrant query alone.

| Step | Metric | Before | After |
|---|---|:---:|:---:|
| Binary 2-bit to TurboQuant 1.5-bit (in-RAM index) | Quantized index size | 45.9 GiB | 35.1 GiB |
| Binary 2-bit to TurboQuant 1.5-bit (in-RAM index) | P50 latency | 16.8 ms | 11.7 ms |
| Binary 2-bit to TurboQuant 1.5-bit (in-RAM index) | Recall@10 without rescoring | 69.5% | 75.1% |
| float32 to `turbo4` (originals on disk) | Disk footprint | 1,174 GiB | 531 GiB |
| float32 to `turbo4` (originals on disk) | P50 latency | 12.6 ms | 8.5 ms |
| float32 to `turbo4` (originals on disk) | P95 latency | 23.9 ms | 12.5 ms |

Recall after the `turbo4` step was practically unchanged.

Today the Qdrant query takes 8.5 ms at P50 and 12.5 ms at P95 in Poliscope's benchmark. Measured end to end since September 29, 2026, including embedding the query, the Qdrant search, and reranking, a search takes 0.87 seconds on average, 0.59 seconds at the median, and 2.1 seconds at P95.

{{< quote
  text="That still gives me a bit of a kick: one search box, and you see every council in the country that touched your topic last week. Monitoring at the municipal level went from practically impossible to something as easy as a Google search."
  name="Kolja Martens"
  name_url="https://www.linkedin.com/in/kolja-martens-762b47160/"
  role="Co-Founder and CTO"
  company="Poliscope"
  avatar="/img/customers/kolja-martens.png"
  logo="/img/customers-case-studies-logo/poliscope.svg" >}}

## How a Query Moves Through Poliscope

![Poliscope's pipeline: crawlers on their own machine pull meetings and PDFs from about 4,800 council portals, and a separate GPU machine runs OCR to turn pages into Markdown. On the main server, which holds the database, API, and Qdrant, workers chunk and embed the text into one Qdrant collection with dense and BM25 sparse vectors. At query time, a tenant filter and region prefix filter narrow the corpus, a hybrid prefetch fuses BM25 and TurboQuant dense results with DBSF, results are grouped by meeting or proposal, and a Jina cross-encoder reranks them before they deep-link to the PDF page](/blog/case-study-poliscope/poliscope-search-architecture.png)

**Ingest.** Crawlers on a dedicated machine pull meetings, agenda items, proposals, and PDFs from the portals into Poliscope's database. PDFs go through an OCR queue on a separate GPU machine, where a vision model turns every page into Markdown. A database hook enqueues BullMQ jobs. A worker chunks the Markdown, embeds each chunk in 1,536 dimensions, and upserts it into Qdrant with Qdrant's built-in BM25 as the sparse vector, using the IDF modifier. Most changes reach Qdrant right after they land in the database. A weekly reconcile job cleans up the rest.

**Query.** Search serves Poliscope's on-platform search, its Model Context Protocol (MCP) server, agents, and monitoring services. The query parser supports OR sub-queries in hybrid mode, plus AND, NOT, and exact phrases in keyword mode. A [hybrid](https://qdrant.tech/documentation/search/hybrid-queries/) prefetch runs BM25 and dense search in one request, with the dense side served from the 1.5-bit TurboQuant index and rescored against the `turbo4` originals at 3x oversampling, and fuses the two with distribution-based score fusion (DBSF). Results are grouped by meeting or by proposal, then a Jina cross-encoder (`jina-reranker-v2-base-multilingual`) reranks them. Every hit carries its PDF page range, so results deep-link to the right page of the source document.

**Setup.** Qdrant 1.19, a single node with 12 shards and one collection of 130 million points, on a Hetzner bare-metal server in Germany: an AMD EPYC 9454, 256 GB of RAM, and two 1.9 TB NVMe drives. The database, the API, and Qdrant share this server. The collection takes about 550 GiB on disk. Of about 200 GB of RAM in use, 83 GB is Qdrant's own memory: 38 GB of quantized vectors, about 37 GB of payload indexes, and 5 GB for the ID tracker. Another 114 GB sits in the page cache, including the full 44 GB HNSW graph.

## Small Team, One Server

Running search on its own hardware was a deliberate choice for Poliscope. It keeps customer data on servers in Germany, under Poliscope's control, and it lets the team tune the system around how its users actually search.

That control is concrete: the team decides which cores answer queries and which run the optimizer, and it schedules large backfills around production traffic instead of around a provider's limits. The trade-off is that decisions a managed service would make for you land on your own desk. The shard layout was one of them, and Poliscope changed it early by building a new collection alongside the old one and switching over.

None of this needed a dedicated search team. Search is one part of a platform where most of the engineering effort goes into the harder problem of keeping thousands of portals crawled reliably. Qdrant had to fit into that without becoming a project of its own, and documentation is a large part of why it did. Kolja develops with coding agents and a documentation MCP server, and Qdrant's docs and source were enough for the agents to find the right setting without hand-holding.

{{< quote
  text="Qdrant lets us make all of German local politics semantically searchable on a single server with only a small team. Every scaling problem we ran into had a knob for it, and the knob was well documented."
  name="Kolja Martens"
  name_url="https://www.linkedin.com/in/kolja-martens-762b47160/"
  role="Co-Founder and CTO"
  company="Poliscope"
  avatar="/img/customers/kolja-martens.png"
  logo="/img/customers-case-studies-logo/poliscope.svg" >}}

## What's Next: Ten More Years of Data and a Second Node

Poliscope's data starts in January 2024, the year the company started. Collaborations with research centers will extend coverage back to 2016, which multiplies the corpus several times over. The TurboQuant migration bought headroom on the current server, and when growth does push the collection past one machine, Kolja plans a second node and [sharding](https://qdrant.tech/documentation/scaling/distributed_deployment/) across the two, and will revisit the self-hosted versus managed question then.

On the retrieval side, the team has started measuring recall for each configuration change, beginning with the quantization migration, and is considering shorter dense vectors, since hybrid retrieval with BM25 has not produced misses they know of at 1,536 dimensions.

## From Practically Impossible to a Search Box

Poliscope started with a monitoring problem that companies used to solve by handing interns a list of portals. It now runs hybrid search over 130 million points of German municipal records, filtered by tenant and region prefix and compressed with TurboQuant, on one server that a small team owns and operates. A search across every council in Germany takes 0.87 seconds on average, and every result links back to the page it came from.
