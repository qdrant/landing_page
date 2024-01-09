---
draft: true
title: "Binary Quantization - Andrey Vasnetsov | Vector Space Talk #001"
slug: vector-space-talk-001
short_description: Andrey Vasnetsov, CTO of Qdrant, discusses the concept of
  binary quantization and its applications in vector indexing.
description: Andrey Vasnetsov, CTO of Qdrant, discusses the concept of binary
  quantization and its benefits in vector indexing, including the challenges and
  potential future developments of this technique.
preview_image: /blog/from_cms/andrey-vasnetsov.png
date: 2024-01-09T10:30:10.952Z
author: Demetrios Brinkmann
featured: true
tags:
  - Vector Space Talks
  - Binary Quantization
  - Qdrant
---

> *"Everything changed when we actually tried binary quantization with OpenAI model.”*\
> -- Andrey Vasnetsov

Ever wonder why we need quantization for vector indexes? Andrey Vasnetsov explains the complexities and challenges of searching through proximity graphs. Binary quantization reduces storage size and boosts speed by 30x, but not all models are compatible. 

Andrey worked as a Machine Learning Engineer most of his career. He prefers practical over theoretical, working demo over arXiv paper. He is currently working as the CTO at Qdrant a Vector Similarity Search Engine, which can be used for semantic search, similarity matching of text, images or even videos, and also recommendations.

***Listen to the episode on [Spotify](https://open.spotify.com/episode/7dPOm3x4rDBwSFkGZuwaMq?si=Ip77WCa_RCCYebeHX6DTMQ), Apple Podcast, Podcast addicts, Castbox. You can also watch this episode on [YouTube](https://youtu.be/4aUq5VnR_VI).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/4aUq5VnR_VI?si=CdT2OL-eQLEFjswr" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe style="border-radius:12px" src="https://open.spotify.com/embed/episode/7dPOm3x4rDBwSFkGZuwaMq/video?utm_source=generator" width="496" height="279" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>

## Top Takeaways:

Discover how oversampling optimizes precision in real-time, enhancing the accuracy without altering stored data structures in our very first episode of the Vector Space Talks by Qdrant, with none other than the CTO of Quadrant, Andrey Vasnetsov. 

In this episode, Andrey shares invaluable insights into the world of binary quantization and its profound impact on Vector Space technology. 

5 Keys to Learning from the Episode:

1. The necessity of quantization and the complex challenges it helps to overcome.
2. The transformative effects of binary quantization on processing speed and storage size reduction.
3. A detailed exploration of oversampling and its real-time precision control in query searches.
4. Understanding the simplicity and effectiveness of binary quantization, especially when compared to more intricate quantization methods.
5. The ongoing research and potential impact of binary quantization on future models.

> Fun Fact: Binary quantization can deliver processing speeds over 30 times faster than traditional quantization methods, which is a revolutionary advancement in vector space technology.
> 

## Show Notes:

00:00 Overview of HNSW vector index.\
03:57 Efficient storage needed for large vector sizes.\
07:49 Oversampling controls precision in real-time search.\
12:21 Comparison of vectors using dot production.\
15:20 Experimenting with models, OpenAI has compatibility.\
18:29 Qdrant architecture doesn't support removing original vectors.

## More Quotes from Andrey:

*"Inside Qdrant we use HNSW vector Index, which is essentially a proximity graph. You can imagine it as a number of vertices where each vertex is representing one vector and links between those vertices representing nearest neighbors.”*\
-- Andrey Vasnetsov

*"The main idea is that we convert the float point elements of the vector into binary representation. So, it's either zero or one, depending if the original element is positive or negative.”*\
-- Andrey Vasnetsov

*"We tried most popular open source models, and unfortunately they are not as good compatible with binary quantization as OpenAI.”*\
-- Andrey Vasnetsov

## Transcript:
