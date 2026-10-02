---
draft: false
title: "How Himalayas Built Semantic Job Matching for 100,000+ Remote Listings with Qdrant"
short_description: "Himalayas runs job search, personalized matches, and related-job recommendations on Qdrant Cloud."
description: "How Himalayas moved remote job matching from keyword search to hybrid retrieval on Qdrant Cloud: 25M+ requests a month, around 30 ms median time in Qdrant, and a 19-point recall gain."
preview_image: /blog/case-study-himalayas/social_preview.png
social_preview_image: /blog/case-study-himalayas/social_preview.png
date: 2026-09-18T00:00:00.000Z
author: Daniel Azoulai
featured: false
tags:
  - Himalayas
  - case study
  - vector search
  - hybrid search
  - payload filtering
  - recommendations
  - job matching
  - Qdrant Cloud
partition: case-studies
---

![Himalayas is a remote job board and AI job search platform with 100,000+ live remote job listings and 300,000+ public talent profiles, running job search, personalized matches, and related-job recommendations on Qdrant Cloud. Qdrant serves 25M+ requests a month at around 30 ms median, and recent retrieval improvements added 19 points of recall](/blog/case-study-himalayas/bento_box.png)

<a href="https://himalayas.app/" target="_blank">Himalayas</a> is a remote job board and AI job search platform. It brings together more than 100,000 live remote job listings and over 300,000 public talent profiles, and it works both sides of the market. Job seekers explore roles by skills, salary, location, and time zone, research remote companies, and receive personalized job matches. Employers advertise remote roles and discover candidates. Around that core, Himalayas offers tools to tailor resumes and cover letters, practice interviews, and track applications.

For a marketplace like this, search is the product. If a job seeker in Lisbon who has spent five years as a "growth engineer" never sees a listing for a "product-minded full-stack developer" in a compatible time zone, both sides lose. Getting discovery right across hundreds of thousands of constantly changing documents, each written in a different company's vocabulary, is the problem the Himalayas team set out to solve.

## Keyword Search Could Not Bridge the Vocabulary Gap, and It Was Expensive at Scale

Himalayas started on Algolia. As the listing and profile corpus grew, the team found Algolia difficult to scale cost-effectively, so they moved to Elasticsearch. Elasticsearch was a meaningful cost for a small team, and adding semantic search on top would have meant scaling up to much larger, memory-heavy clusters. That approach was not going to scale with them.

The deeper issue was that both systems were built around keyword matching. Job titles and descriptions vary widely between companies, so relevant opportunities often do not use the same wording as a candidate's profile or search query. A search engine that only matches tokens will miss a large share of the roles a person is qualified for, and it will surface roles that share words but not substance.

The team wanted to move beyond keyword matching to something that understood related experience. Their first trial of vector search ran on Pinecone in early 2023.

{{< quote
  text="We trialed Pinecone in early 2023, but it felt more like a vector database than a search engine. We needed keyword matching and precise filters working alongside semantic similarity in one query, and that's the direction Qdrant was built for."
  name="Jack Walsh"
  role="Co-founder"
  company="Himalayas"
  logo="/img/customers-case-studies-logo/himalayas.svg" >}}

Himalayas moved to Qdrant Cloud in May 2023.

## Why Himalayas Chose Qdrant for Semantic Understanding and Precise Filters in One Engine

Semantic similarity alone was not enough. Recognizing that two differently worded roles describe the same work matters, but so do specific skills and practical requirements: where someone can legally work, which time zones they overlap with, and whether they want full-time or contract employment. A job match that ignores those constraints is not a match.

Himalayas needed semantic retrieval alongside precise keyword matching and structured filters, all applied within the same query rather than stitched together across services. Qdrant's [hybrid search](https://qdrant.tech/documentation/search/hybrid-queries/) covers the first two, and [payload filtering](https://qdrant.tech/documentation/search/filtering/) covers the third without falling back to post-filtering a long candidate list.

Room to grow mattered too. The team described Qdrant as a foundation they could develop as their matching needs evolved, rather than a fixed pipeline they would have to work around.

{{< quote
  text="Qdrant Cloud has been a dependable foundation for search and job matching on Himalayas. The APIs are intuitive, updates are one click, and we can spend our time improving the experience for job seekers while Qdrant handles the infrastructure."
  name="Jack Walsh"
  role="Co-founder"
  company="Himalayas"
  logo="/img/customers-case-studies-logo/himalayas.svg"
  featured="true" >}}

## How the Retrieval Pipeline Works in Production

Himalayas runs a hybrid retrieval setup that combines semantic and keyword search, with structured filters for requirements such as location, time zone, and employment type.

A search query or a candidate profile provides the starting point. The system retrieves potential matches from Qdrant, applies the relevant constraints as filters, and ranks the results for the specific surface: search results, personalized matches, or related-job recommendations. Qdrant handles retrieval and filtering, and the Himalayas application shapes the final ranking and presentation.

![Himalayas retrieval pipeline: a search query or candidate profile enters one hybrid query in Qdrant that combines semantic and keyword retrieval with payload filters for location, time zone, and employment type. Qdrant returns filtered, ranked candidates, and the Himalayas application ranks and presents them for job search, personalized matches, and related-job recommendations](/blog/case-study-himalayas/himalayas-retrieval-architecture.png)

The team runs on [Qdrant Cloud](https://qdrant.tech/cloud/), which takes infrastructure management off their plate. Updates are one click, the service has been reliable, and the APIs are intuitive. For a small team whose differentiation lives in matching quality rather than in operating databases, those are the clearest operational benefits.

## From a Search Feature to the Core of Discovery

Since adopting Qdrant in 2023, Himalayas has expanded its use from job search to personalized matches and related-job recommendations. Qdrant is now a core part of discovery across the product. The same retrieval layer serves a job seeker typing a query, a job seeker opening a feed of recommended roles, and a job seeker reading one listing and looking for similar ones.

Today, Qdrant handles hundreds of thousands of requests a day for Himalayas, or more than 25 million a month, across roughly 3 million points. Median time spent inside Qdrant is around 30 ms, with p95 around 200 ms. Query embedding happens separately.

Himalayas also evaluates search quality offline as the retrieval system evolves. Recent improvements increased recall by about 19 percentage points and cut the irrelevant results making it through by roughly 4x.

## What's Next: Using AI to Evaluate and Improve Match Quality

The team is prioritizing experiments with its search and matching algorithms first, and treating storage and memory optimization as a later step.

The current focus is on using AI to both evaluate quality and improve results. That includes assessing how well a set of results answers a search, and how closely a recommended job fits a candidate's profile. It would turn the offline evaluation baseline into a continuous feedback loop for the matching algorithms.
