---
title: "Qdrant's 2023 Seed Round"
short_description: "Read Qdrant's April 2023 seed funding announcement, including its open-source goals and plans for vector search."
description: "Read Qdrant's April 2023 seed funding announcement, including the $7.5M round led by Unusual Ventures and plans for open-source vector search."
social_preview_image: /blog/seed-round/seed-social.png
author: Andre Zayarni
draft: false
author_link: https://www.linkedin.com/in/zayarni
date: 2023-04-19T00:42:00.000Z
slug: seed-round
preview_image: /blog/seed-round/preview/title.jpg
small_preview_image: /blog/seed-round/preview/preview.jpg
featured: false
tags:
  - Funding
  - Announcement
aliases:
  - /articles/seed-round/
---

> Editor's note: This 2023 post was edited for length and clarity. Read the [original version](https://github.com/qdrant/landing_page/blob/bb7f15b97237c97748fdbeea45499e2fcaba2377/qdrant-landing/content/articles/seed-round.md).

This is Qdrant's April 2023 seed-round announcement. It records our plans and perspective at the time.

We raised $7.5M in seed funding led by [Unusual Ventures](https://www.unusual.vc/why-we-led-qdrants-7-5m-seed-round/), with angels and existing investors participating. The funding supported our work on open-source vector search and the infrastructure engineers need to build applications with unstructured data.

## Why We Built Qdrant

Text, images, audio, and other unstructured data are difficult to search through exact matches alone. Neural network models represent these objects as vectors, so applications can retrieve items by similarity.

That retrieval supports semantic search, recommendations, matching, and anomaly detection. With large language models, it also lets applications retrieve relevant information to supply as context. The embedding model still has to suit the data and the task.

We built Qdrant as a vector search engine in Rust. Our goal was to combine similarity search with the filtering, updates, and deployment options that production applications need. The open-source engine gave developers access to the implementation and a way to help shape it.

## Our Plans in 2023

We launched Qdrant Cloud early in 2023. At the time of the announcement, it served more than 1,000 clusters, as recorded in [Unusual Ventures' announcement](https://www.unusual.vc/why-we-led-qdrants-7-5m-seed-round/). We were also extending our offering toward managed on-premise deployments for enterprise customers.

Making billion-scale vector search affordable was a central goal. Scalar quantization had recently introduced a way to reduce vector memory usage, and product quantization was part of our plans. Today's options are documented in the [quantization guide](/documentation/manage-data/quantization/).

Our custom [filterable HNSW implementation](/articles/filterable-hnsw/) combined approximate nearest-neighbor search with payload filters. Distributed deployment and replication supported applications that needed to grow beyond one node. Rust let us work directly on memory use and low-level performance.

## Choosing Our Investor

We received several offers during the fundraising process. We chose Unusual Ventures because they understood open-source projects and the communities around them. We wanted an operational partner who would help us build the company as well as invest in it.

My advice to investors interested in open source was to spend time with the community. Product feedback and adoption tell a different story from a pitch deck. The community and adopters ultimately decide which products succeed.

Engineers do not need to over-engineer a solution or chase a valuation to build something customers use. Focus, technical knowledge, and a team that understands the problem matter.

## Thank You to Our Community

Our contributors, adopters, customers, and team helped us reach this point. Their feedback shaped the engine, and their trust made it possible to keep building in the open.

For our later funding announcements, read about the [Series A](/blog/series-a-funding-round/) and [Series B](/blog/series-b-announcement/). To build with Qdrant today, start with the [current quickstart](/documentation/quickstart/).
