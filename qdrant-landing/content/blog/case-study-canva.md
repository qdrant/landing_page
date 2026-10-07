---
draft: false
title: "How Canva Built Multimodal Search at Scale with Qdrant"
short_description: "Canva runs media discovery and private document search on Qdrant Cloud, with each engineering team owning and tuning its own clusters."
description: "How Canva runs vector search over a 180M+ item media library on Qdrant Cloud: int8 quantization, filterable HNSW, hybrid retrieval, and a self-serve model where engineering teams own and tune their own clusters."
preview_image: /blog/case-study-canva/social_preview.png
social_preview_image: /blog/case-study-canva/social_preview.png
date: 2026-10-06T00:00:00.000Z
author: Daniel Azoulai
featured: false
tags:
  - Canva
  - case study
  - vector search
  - multimodal search
  - hybrid search
  - quantization
  - Qdrant Cloud
partition: case-studies
---

![Canva runs vector search for a public media library of more than 180 million items, plus private user content, on Qdrant Cloud. Three vendors were tested on Canva's production workloads and Qdrant came out fastest and cheapest. Hybrid search, filterable HNSW, and native int8 quantization power media discovery and private document search, on a self-serve model where each team owns its own clusters](/blog/case-study-canva/bento_box.png)

<a href="https://www.canva.com/" target="_blank">Canva</a> is a visual communication platform used by hundreds of millions of people to design everything from social posts to presentations to branded campaigns. Behind that drag-and-drop experience sits one of the larger search operations in consumer software: a discovery platform that powers how users find images, templates, and content across a public media library of more than 180 million items, plus a fast-growing universe of private, user-generated content.

That platform is owned by Canva's discovery platform team, a group of platform engineers who don't tune search relevance themselves. Instead, they build the infrastructure that lets Canva's search and quality engineers iterate. They run the base layer that everything else stands on: more than 20 search clusters, a multi-stage retrieval pipeline, and, increasingly, vector search. As Canva pushed deeper into multimodal and AI-powered features, the team needed a vector search engine that could scale with them without forcing every workload into the same mold.

{{< quote
  text="Qdrant's technical architecture and performance capabilities have proven to be exactly what we need as we scale our AI-powered features across the platform. They are an ideal partner as we standardize our vector search infrastructure to serve millions of users worldwide."
  name="Colin Chauvet"
  role="Director of Engineering"
  company="Canva"
  featured="true" >}}

## Why One-Size-Fits-All Vector Search Stopped Scaling

Canva's search isn't a single use case. It's a portfolio of them. There's media search, where a user describes what they want in rich detail and gets back the exact image that matches, not just a keyword filter. There's image similarity search, which lets content creators swap an image for something visually close, or replace a delisted asset. There's face matching, private document search across knowledge bases and branded templates, and a growing set of multimodal workloads that combine several models to chunk, embed, and retrieve.

For the smaller collections, Canva built an in-memory approach: a daily training process selects the most popular items per category, trains a model, and ships that subset directly into the same container as the inference model. Under roughly 10 million items, everything fits in memory and works fine. That model breaks down at scale. The public media library alone holds more than 180 million items, each represented as a vector, far past what fits in memory. Private user-generated content compounds the problem: every document may need to be chunked into many vectors, and each user's content has to stay private, which calls for flexible multitenancy.

The team had been working with another vector search provider. Canva has strict latency and cost requirements: the team isn't willing to spend millions of dollars a year for a few percentage points of search uplift, and many of its workloads need tuning of their own. As Canva looked to scale further, the team hit a limit that prevented it from expanding to a few new use cases, and that pushed it to reconsider its options.

{{< quote
  text="[PLACEHOLDER: draft quote, not yet approved by Canva] Search at Canva isn't one workload. Media search, image similarity, and private documents each need a different balance of latency, cost, and recall, so we needed a vector search engine we could tune use case by use case."
  name="Konstantin Kashkovskii"
  role="Senior Software Engineer"
  company="Canva" >}}

## Why Canva Chose Qdrant Cloud

Canva ran a structured internal evaluation, shortlisting several vector search options and testing three of them on the same production use cases. The criteria were demanding: the team needed to balance cost, latency, and the flexibility to tune each workload independently. Across those tests, Qdrant came out fastest and cheapest.

*[PLACEHOLDER: relative speed and cost numbers against the other two vendors tested, pending Canva]*

Just as important was the operating model. Canva runs on a self-serve infrastructure philosophy: the engineers who use a system own it, including its maintenance, cost optimization, and security. That ruled out heavier, database-style architectures aimed at teams that want to hand off operational concerns.

Qdrant fit the self-serve model, giving individual teams the control they needed across many different workloads. Provisioning through the [Qdrant Cloud Terraform provider](https://qdrant.tech/documentation/cloud-tools/terraform/) meant infrastructure could be managed without handing every engineer access to the cloud console, one less friction point in an organization already wary of operational overhead.

Qdrant's open source core also helped. The publicly available Docker image delivers the same capabilities as the managed service, so Canva's engineers could increase integration testing coverage without depending on the hosted environment for every test.

The team also weighed self-hosting Qdrant directly. In a company the size of Canva, standing up new self-hosted infrastructure requires capacity, alignment, and approvals from a separate infrastructure organization, work that could have taken another year or two. Qdrant Cloud resolved that tension. It removed the operational lift of self-hosting while keeping the per-workload tuning the team needed.

{{< quote
  text="In our company, the engineers who use the infrastructure usually own the infrastructure. They're responsible for maintenance, cost optimization, security. It's more of a self-serve model, and Qdrant fit that."
  name="Konstantin Kashkovskii"
  role="Senior Software Engineer"
  company="Canva" >}}

## What Changed: Tuning, Quantization, and Hybrid Retrieval

The move to Qdrant Cloud gave Canva's teams direct control over the trade-offs that matter at their scale. One of the biggest wins was native [quantization](https://qdrant.tech/documentation/manage-data/quantization/). Canva uses int8 scalar quantization for media workloads, which keeps memory and cost in check while still letting the team rescore against original vectors and apply reranking for an acceptable recall rate. Because quantization is native to Qdrant, the team doesn't have to handle it on the inference side.

Canva runs [hybrid search](https://qdrant.tech/documentation/search/hybrid-queries/) across its public surfaces and private documents, combining full-text retrieval with vector search and using its own models to refine results. The team also relies on [filterable HNSW](https://qdrant.tech/articles/filterable-hnsw/) and [metadata filtering](https://qdrant.tech/documentation/search/filtering/) on the Qdrant side, so a single query can blend semantic relevance with hard metadata constraints. For private content, Qdrant's [multitenancy](https://qdrant.tech/documentation/manage-data/multitenancy/) gives the team the flexibility it needs to keep each user's documents scoped to that user. To keep cost and throughput in line at high query volumes, the team skips vector search when it won't help, for example when a user has typed a single word.

The team was also quick to adopt new capabilities. To speed up indexing, Canva uses [GPU-accelerated indexing](https://qdrant.tech/documentation/tutorials-operations/gpu-accelerated-hnsw-indexing/) in Qdrant Cloud. Canva is also exploring [TurboQuant](https://qdrant.tech/documentation/manage-data/quantization/#turboquant-quantization), a quantization method in Qdrant that offers comparable recall to scalar quantization at double the compression. The pattern matters: when Qdrant ships something new, Canva can evaluate it without re-architecting.

{{< quote
  text="[PLACEHOLDER: draft quote, not yet approved by Canva] GPU-accelerated indexing has helped us cut the time it takes to build indexes on large collections, so we can bring new use cases online and iterate on them faster."
  name="Konstantin Kashkovskii"
  role="Senior Software Engineer"
  company="Canva" >}}

## How It Works in Production

Qdrant sits inside a multi-stage retrieval pipeline rather than serving as the whole of search. A dedicated query understanding service does the heavy lifting of interpreting user intent and choosing a retrieval strategy, deciding, for example, whether a given query should hit vector search at all. From there, Canva runs separate candidate generators: one handles full-text retrieval, the other queries Qdrant for vectors. The results merge, then move through ranking phases before they reach the user.

![Canva's multi-stage retrieval pipeline: a query understanding service interprets intent and decides whether a query needs vector search. Two candidate generators run side by side, full-text retrieval and vector retrieval on Qdrant Cloud with filterable HNSW, metadata filters, and int8 quantization with rescoring. Their candidates merge and pass through ranking phases before results reach media search, image similarity, and private document search](/blog/case-study-canva/canva-retrieval-architecture.png)

{{< quote
  text="We use filterable HNSW, which is one of the features of Qdrant. We use metadata filtering on the Qdrant side, and we merge results from full-text search plus Qdrant. We use all of the abilities we can."
  name="Konstantin Kashkovskii"
  role="Senior Software Engineer"
  company="Canva" >}}

On the Qdrant side, the team provisions clusters through the Terraform provider, so spinning up infrastructure is straightforward. The harder question is sizing. For the initial public media proof of concept, Canva evaluated against roughly 140 million items and leaned on Qdrant's solution engineers, who reviewed cluster metrics directly to get the sizing right. For newer private-content work, Canva has handed provisioning and scaling over to its own quality engineers, the self-serve end state the team was aiming for, with Qdrant support available when scaling questions come up.

{{< quote
  text="We integrated with the Terraform provider, so provisioning a cluster is not a problem. Any time we can file a support ticket, it gets handled."
  name="Konstantin Kashkovskii"
  role="Senior Software Engineer"
  company="Canva" >}}

## What's Next: New Modalities and Larger Datasets

There's room to grow on the multimodal side. Face matching, which lets users tag a person in a photo and surface every photo of them, currently runs on in-memory indexes, but it's a candidate to move onto Qdrant as it scales.

The broader direction is consistent. As Canva's AI features expand across more modalities and larger datasets, the vector search layer is built to expand with them.

## Vector Search Tuned to Each Workload

Canva set out to make search work across a sprawling set of use cases, from media discovery to private documents, all under strict latency and cost constraints. Those workloads needed per-workload tuning and the flexible multitenancy that private content depends on, and full self-hosting carried too much operational weight. Qdrant Cloud gave the team the balance it needed: managed infrastructure with per-workload control over quantization, hybrid retrieval, and filtering, on a self-serve model that fits how Canva's engineers already work. As new modalities and larger datasets arrive, that foundation is built to keep scaling.
