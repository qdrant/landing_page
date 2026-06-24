---
title: "Qdrant Lands in SF: Vector Space Day 2026 Recap"
author: Neil Kanungo 
draft: false
featured: true
slug: vector-space-day-2026-recap
short_description: "Vector Space Day 2026 brought developers, researchers, and engineers to San Francisco for a day of agents, retrieval, and robotics, with keynotes, breakout talks, a hackathon, and a community happy hour."
description: "Our first Vector Space Day in the United States brought developers, researchers, and engineers to San Francisco for a day of agents, retrieval, and robotics, across keynotes, breakout talks, a hackathon, and a community happy hour." 
preview_image: /blog/vsd26-post-event/hero.png 
social_preview_image: /blog/vsd26-post-event/hero.png  
date: 2026-06-24
tags:
  - news
  - blog
---

On June 11th, 2026, over 350 developers, researchers, and engineers came together at The Midway in San Francisco for **Vector Space Day**, our first event of its kind in the United States and our first major gathering in San Francisco.

This was a single day, single stage, across three tracks: Agents and Memory, Search and Retrieval, and Edge and Robotics. Hosted by our MC for the day, [Adam Chan](https://www.linkedin.com/in/itsajchan/), who kept the energy flowing from opening keynotes to the final hackathon reveal.

As with our first Vector Space Day in Berlin, this event was for a community of builders. Conversations moved around the venue from embeddings to hybrid search, agentic memory, and on-device retrieval. Laptops opened, QR codes were traded, and the room buzzed with excitement.

Since we know many of you could not make it in person, this recap is a chance to relive the day.

<iframe width="560" height="415"
  src="https://www.youtube.com/embed/eMLRVlUPoZw?rel=0"
  title="Vector Space Day Highlights"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

* **Access all session [slides](https://docs.google.com/presentation/d/1vX1gJOTqUaKv26iWqfdShCU7rZdgaodiyPChLhNCbUs/edit?usp=sharing) and [recordings](https://www.youtube.com/playlist?list=PL9IXkWSmb3691YPJcUloHXXfdPHIYjTlM)**

### From the Community

The energy did not stay in the room. Throughout the day, attendees shared takeaways, photos, and experiences under **\#vectorspaceday**, and watching the event come to life through your posts is one of our favorite parts of doing this.

![social](/blog/vsd26-post-event/image1.png)

### Opening Keynotes

Our Co-Founder and CEO [**André Zayarni**](https://www.linkedin.com/in/zayarni/) opened with **"We Do It the Hard Way,"** a simple thesis: Qdrant does the hard engineering so the people building on it do not have to. He traced the path from a 2021 GitHub side project to a search engine now used by brand new startups and century-old enterprises alike, including Bosch, Bayer, and Johnson and Johnson, all of whom need the same thing, a flexible, scalable, composable retrieval layer.

![Andre](/blog/vsd26-post-event/image2.jpg)

Doing it the hard way means a Rust core, an in-house storage layer called GridStore, vendor-agnostic GPU-accelerated indexing, and TurboQuant, Qdrant's own approach to vector compression. The throughline: use cases keep evolving, from semantic search to RAG to agents running retrieval in a loop, and robots are next in line for the same tools.

Next, our COO [**Manuel Meyer**](https://www.linkedin.com/in/meyermanuel/) and Head of DevRel [**Neil Kanungo**](https://www.linkedin.com/in/neilkanungo/) presented **"When Search Gets Serious,"** opening with a clarification we care about deeply: **Qdrant is not a vector database, it is a vector search engine.** Built from scratch from the storage layer to the query engine, it can trade a little perfect consistency for the scale, speed, and resilience that real search demands.

![Manuel](/blog/vsd26-post-event/image3.jpg)

The core idea: **retrieval is the primitive** behind product search, RAG, recommendations, multimodal search, and agentic memory. Because no two workloads are alike, Qdrant exposes retrieval as tunable pieces through what Neil called the three C's, composability, controllability, and configurability, plus built-in extras like a custom HNSW and one-stage payload filtering. The same engine follows your workload anywhere, from managed cloud to private and on-premises to Qdrant Edge, all from one open source binary. Manuel closed with customer proof points, including Canva running multimodal search for millions of users and Tripadvisor scaling an AI trip planner across billions of vectors.

### Breakout Talks

After the keynotes, the day opened up into a packed schedule of technical talks across all three tracks. Here are three we want to spotlight.

#### Neo4j: Free Your Agent's Mind with Context Graphs

[**Stephen Chin**](https://www.linkedin.com/in/steveonjava/), VP of Developer Relations at Neo4j, made the case for pairing vector search with knowledge graphs to build AI that is both more accurate and more explainable. He split agent memory into three types, short-term, long-term, and reasoning, and argued that reasoning memory, the decision traces and provenance, is the piece most systems are missing. A simple GraphRAG pattern, vector search first and then graph traversal, grounds the model and produces answers you can explain, which he illustrated with a healthcare example.

![Stephen](/blog/vsd26-post-event/image4.jpg)

#### HubSpot: Building the Infra Behind 20 Billion+ Vectors

[**Oleg Tereshin**](https://www.linkedin.com/in/olegtereshin/) and [**Xin Liu**](https://www.linkedin.com/in/xinnyliuu/) pulled back the curtain on Vector-as-a-Service, HubSpot's centralized search platform built on Qdrant, running more than 20 billion vectors across 150 clusters and five regions. The heart of the talk was their migration off Helm, which could not handle Qdrant's stateful lifecycle, onto a Kubernetes operator pattern. The payoff: cluster spin-up dropped from hours to minutes, shard management became automatic, and one rebalancing run cut resource usage skew by 65%.

![HubSpot](/blog/vsd26-post-event/image5.jpg)

#### Arize: Stop Vibe Shipping, Evaluate Your Retrieval

[**Laurie Voss**](https://www.linkedin.com/in/seldo/), Head of Developer Relations at Arize AI, delivered the line of the day: "Looks good to me" is not an evaluation strategy. His core point: **similarity and relevance are not the same thing.** Vector search returns similar documents, not relevant ones, and the gap is where failures hide silently. The fix is to measure relevance directly with metrics like hit rate, precision, and recall, build a golden dataset from real production traces, and reach for better chunking, hybrid search, and a reranker before fine-tuning embeddings.

![Arize](/blog/vsd26-post-event/image6.jpg)

### More from the Stage

The three tracks were full from morning to late afternoon. A few more highlights, one from each track:

* **Slack, "Scaling to Billions"** *(Search and Retrieval).* In a one-on-one interview, [**Avirek Ghatia**](https://www.linkedin.com/in/avirek-ghatia-06705971/) and **[Brian O'Grady](https://www.linkedin.com/in/brian-ogrady/)** shared what it actually takes to index trillions of messages and keep them searchable within seconds, including a Lambda architecture with a snowball caching system to avoid recomputing billions of embeddings, greedy batching for a 3x inference speedup, and a candid look at why some quantization methods failed in production.  
* **Google DeepMind, "Literal Skill Issue: Are SKILLS.md Holding Your Agents Back?"** *(Agents and Memory).* [**Paige Bailey**](https://www.linkedin.com/in/dynamicwebpaige/) made a provocative case that hand-written, static markdown skill files are a transitional phase, and walked through where they break down and what dynamic, autonomous tooling could look like instead.  
* **AWS, "Tell the Robot What You Want"** *(Edge and Robotics).* [**Sandhya Subramani**](https://www.linkedin.com/in/sandhyasubramani/) closed the robotics track with a live robot that turned natural language commands into actions, using a hybrid edge-cloud architecture that keeps low-latency control on-device while delegating heavier reasoning to the cloud.

We also heard from Mem0, Adobe, Oncotelic Therapeutics with Qdrant Engineering on indexing 28 million PubMed abstracts for drug development, Vultr, LlamaIndex, Twelve Labs, Cognee, Qualcomm, and our own [Dylan Couzon](https://www.linkedin.com/in/dcouzon/) on Qdrant Edge. We can't do every session justice here, so the full set is on the **[Vector Space Day playlist](https://youtube.com/playlist?list=PL9IXkWSmb3691YPJcUloHXXfdPHIYjTlM)**.

### Hackathon Winners

In the weeks leading up to the event, the global Qdrant community took on our **"Think Outside the Bot"** hackathon: build something creative with vector search, without leaning on RAG or a simple chatbot. The challenge ran for five weeks, with submissions judged on innovation, creativity, and technical depth, and a total of $10,000 in prizes awarded on stage.

Picking only three winners was genuinely hard. The submissions ranged from early mental health detection to crowd-reaction simulators, tactical football search, and infrastructure stress-testing.

* **1st Place: [MemoryAtlas](https://www.youtube.com/watch?v=0RzoS6exGZ8)** by Aritra Mazumder, which catches the early pattern of a mental health spiral and uses the Recommend API to retrieve proof from the user's own history that they have recovered before, storing each memory as six named vectors under one point ID.  
* **2nd Place: [Crowd Whisperer](https://www.youtube.com/watch?v=VERtvTuRuYs)** by Latent DJs, which simulates how hundreds of distinct musical personas react to a set in real time and shows whether the room is converging or polarizing around the music.  
* **3rd Place: [Synthara](https://www.youtube.com/watch?v=02au1NLX3-I)** by Mohammed Roqa, a memory-driven role-playing game where every choice becomes a vector embedding, forming a searchable "soul history" that NPCs reference across play sessions.

Our honorable mentions were DejaPlay, Cardinal, Sprouty, Afterimage, and Black Swan. You can read the full breakdown of these projects in the [Vector Space Hackathon 2026 winners blog](https://qdrant.tech/blog/vector-space-hackathon-winners-2026/).

### Networking and Happy Hour

When the talks wrapped, the day shifted into a happy hour right at the venue. Engineers and business leaders who had spent the day comparing retrieval architectures kept the conversation going over drinks, with demos still open on laptops and new connections still being made. For our first event in San Francisco, it was exactly the space we hoped for.

![Networking](/blog/vsd26-post-event/image7.jpg)

### Thank You

To our community, our attendees, our speakers, and our sponsors: thank you. Vector Space Day would not be possible without you, and neither would Qdrant. This was our first Vector Space Day in San Francisco. It will not be our last. We're here to stay.

See you next time.

\- The Qdrant Team

![Team](/blog/vsd26-post-event/image8.jpg)
