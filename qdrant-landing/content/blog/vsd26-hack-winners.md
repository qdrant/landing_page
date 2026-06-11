---
title: "Vector Space Hackathon 2026"
draft: false
slug: vector-space-hackathon-winners-2026
short_description: "Discover the winners of Qdrant’s global Think Outside the Bot hackathon, where developers built innovative vector search applications beyond chatbots."
description: "Meet the 2025 Qdrant Hackathon winners building beyond chatbots: vector search projects spanning robotics, e-commerce, and gaming."
preview_image: /blog/vector-space-hackathon-2026/hero_image.png
social_preview_image: /blog/vector-space-hackathon-2026/hero_image.png
date: 2026-06-11
author: Neil Kanungo
featured: true
tags:
  - news
  - blog
---

Wow. So many cool and creative submissions for this year's hackathon; we really had a tough time picking only 3 winners! The submissions ranged from early mental health detection to crowd-reaction simulators, tactical football search, and infrastructure stress-testing. We're excited to share the results with you.
 
## The Hackathon
 
Qdrant's 2026 "Think Outside the Bot" hackathon pushed the creative boundaries of vector search. Participants from around the world were challenged to create innovative uses of Qdrant, without the use of RAG or simple chatbots. Submissions were judged on the criteria of Innovation, Creativity, and Technical Depth. The hackathon ran for 5 weeks with winners announced at Vector Space Day 2026 with a total of $10k in prizes. Keep reading to learn about the winning submissions.
 
## Winning Submissions
 
### 1st Place: MemoryAtlas (Aritra Mazumder)
 
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/0RzoS6exGZ8?rel=0"
  title="MemoryAtlas"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Mental health spirals build slowly and are hard to spot from the inside. MemoryAtlas catches the pattern early, then retrieves the one thing that can interrupt it: proof from the user's own history that they have been here before and got out.
 
Every memory lands in Qdrant as six named vectors under a single point ID: semantic meaning, emotion distribution, audio prosody, linguistic structure, cross-modal dissonance, and raw audio. TwelveLabs Marengo 3.0 produces 512-dimensional audio embeddings independent of the transcript, surfacing distress that never reached words, while a custom PyTorch transformer encodes 14-day emotional sequences to catch recurring spirals even when the surface content changes. Once a spiral is confirmed, the Recommend API treats the current entries as negative examples and applies a datetime payload filter to pull the recovery window that followed the last spiral. The user never asks a question. The system finds the answer anyway.
 
[Repository](https://github.com/aritra741/MemoryAtlas)
 
### 2nd Place: Crowd Whisperer (Latent DJs)
 
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/VERtvTuRuYs?rel=0"
  title="Crowd Whisperer"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Every person in a crowd carries a distinct musical identity across genre, energy, novelty, and timbre. Crowd Whisperer simulates how hundreds of those individuals react to a set in real time, then shows whether the room is converging or polarizing around the music being played.
 
Each persona is a 532-dimensional hybrid vector (LAION-CLAP semantic plus acoustic features) stored in Qdrant. Every 15 seconds, the system scores each listener with a reward formula weighing taste affinity, transition surprise, novelty, session energy coherence, and fatigue, then drifts the persona's preference vector to model how exposure reshapes taste over a show. The output is a time series of crowd reaction projected into 2D, exposing clusters, outliers, and how the room's preference landscape shifts song by song.
 
[Repository](https://github.com/Gustavobrg/crowd-whisperer)

### 3rd Place: Synthara (Mohammed Roqa)
 
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/02au1NLX3-I?rel=0"
  title="Synthara"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Synthara is a memory-driven dark fantasy role-playing game built on Next.js 16, Google Gemini, and Qdrant Cloud, where the narrative is generated rather than scripted. Every decision, quest victory, defeat, and NPC refusal becomes a vector embedding in Qdrant, forming a searchable "soul history" that persists across play sessions.
 
When a player approaches an NPC, the game queries Qdrant for semantic history tied to that character, and gemini-2.5-flash synthesizes voice-authentic dialogue that references the player's exact past deeds. Quests branch through Gemini-generated stages whose outcomes shape the resolution, and progression gates stay locked until the player accumulates enough episodic memories, for example 3 distinct entries before The Black Citadel opens.
 
[Repository](https://github.com/mroqa/RBG-Synthara.git)

## Honorable Mentions
 
### DejaPlay (Syed Shahriyar Ali)
 
<iframe width="560" height="315"
  src="https://drive.google.com/file/d/118GCFUoDQ8WZmYFVMOe2tF39mDhAXvHE/preview"
  title="DejaPlay"
  frameborder="0"
  allow="autoplay"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Finding tactically similar football plays by hand is slow and subjective. DejaPlay turns it into a visual semantic search problem: it encodes StatsBomb possessions into compact embeddings, indexes them in Qdrant with rich metadata filters, and retrieves matches by vector similarity or Mistral-powered natural-language queries. Analysts get ranked results and side-by-side pitch animation to see how alike situations unfolded.
 
[Repository](https://github.com/SyedShahriyarAli/DejaPlay)
 
### Cardinal (Nicholas Zhu)
 
<iframe width="560" height="315"
  src="https://www.loom.com/embed/a08fb75e85da402db17a02e13dbf16b5"
  title="Cardinal"
  frameborder="0"
  allow="autoplay; fullscreen; picture-in-picture"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Most "AI investing" tools put a language model in the decision seat, where it hallucinates protocols that don't exist, can't read numeric risk structure, and returns a different answer every time. Cardinal inverts that. It indexes 83 DeFi and real-world-asset yield products in Qdrant as six named vectors each: narrative, risk, yield source, correlation, tax treatment, and composability.
 
The language model is touched only twice per session, once to translate plain English into a structured query and once to narrate the result. Everything in between is Qdrant doing the work: Recommend with positive and negative anchors, multi-vector prefetch with RRF fusion, payload-filtered HNSW traversal, and the Discovery API. The vectors are deterministic and inspectable, and they don't hallucinate.
 
[Repository](https://github.com/yoyobeverage/cardinal)
 
### Sprouty (Cory Micek)
 
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/DPgmu28xSec?rel=0"
  title="Sprouty"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

First-time gardeners don't have a gardening problem, they have an information overload problem. Sprouty takes 90 seconds or less of voice input, searches a curated gardening knowledge base with Qdrant's hybrid retrieval, and returns a complete 12-week plan: crop list, weekly tasks, shopping list, and an AI-generated vision board of what the garden could look like. No chatbot, no typing.
 
[Repository](https://github.com/micek/sprouty)
 
### Afterimage (Karan Singh Bisht)
 
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/vKp0ZD9ZuTc?rel=0"
  title="Afterimage"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Conventional camera systems either record passively or rely on per-object detectors trained on labeled data, so they miss anything they were never taught to watch for. Afterimage gives any physical space a searchable visual memory instead. It embeds each watched region of a frame with CLIP into a single Qdrant object_memory collection, letting every region learn what "normal" looks like from the footage itself.
 
On each sampled frame it runs three Qdrant queries: a filtered nearest-neighbor search against a data-derived floor of mean minus three sigma, a distance map across watched regions with search_matrix_pairs, and a best_score Recommend query to surface the strongest outlier. The result flags the exact region the moment something appears or disappears, with no training, no labels, and no per-object rules. Because it uses CLIP, you can also search the whole space in plain language.
 
[Live Demo](https://afterimage-qdrant.vercel.app)
 
### Black Swan (Yusra)
 
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/iBJ77lSbvMg?rel=0"
  title="Black Swan"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Most infrastructure tooling watches systems after deployment. Black Swan helps engineers reason about distributed architecture before it ships. It converts plain-text infrastructure descriptions into semantic embeddings and uses Qdrant to retrieve similar production-grade patterns, then maps service dependencies as interactive graphs and flags scalability bottlenecks, single points of failure, and high-risk couplings.
 
From there it simulates cascading failures, including database outages, message broker failures, DNS issues, and regional network disruptions, to measure resilience and blast radius before anything reaches production. It closes the loop with evolution recommendations that point toward more fault-tolerant, higher-concurrency designs.
 
[Repository](https://github.com/Usrafatima/black-swan)
 
## See You Next Year!
 
Congrats to all of our hackathon winners and thank you to everyone that participated. We'll see you next year for another chance to win!