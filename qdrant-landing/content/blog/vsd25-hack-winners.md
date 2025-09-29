---
title: "Thinking Outside the Bot with 2025 Hackathon Winners"
draft: false
slug: vector-space-hackathon-winners-2025
short_description: "Discover the winners of Qdrant’s global Think Outside the Bot hackathon, where developers built innovative vector search applications beyond chatbots — from robotics to gaming, e-commerce, and more."
preview_image: /blog/vector-space-hackathon-2025/hackathon-hero.jpg
social_preview_image: /blog/vector-space-hackathon-2025/hackathon-hero.jpg
date: 2025-09-29
author: Qdrant
featured: true
tags:
  - news
  - blog
---
Over the past several weeks, builders from around the world proved that vector search is about much more than chatbots. We challenged teams to think beyond RAG, and they delivered: robotics safety reflexes, event discovery on routes, 3D shopping, video game characters, and more.

Winners were announced live in Berlin on Friday, September 26, 2025 at [Vector Space Day](https://luma.com/p7w9uqtz). Full hackathon details are here: [Hackathon page](https://try.qdrant.tech/hackathon-2025).

With numerous submissions from around the world, hackathon judges used criteria of Creativity, Technical Depth, and Qdrant Usage to evaluate each submission and determine the top projects. There was $10,000 in prizes from Qdrant as well as many additional bonus prizes for using partner tech:

![Hackathon Prizes](/blog/vector-space-hackathon-2025/VSD-Prizes.png)

Let’s dive into the top projects and what we liked about each of them.

---

## 🏆 Overall Winners

### 🥇 1st Place: Vector Vintage (Benedict Counsell)

**Bonus Prize: Best use of Neo4j**  
**Total Prize: $5000\_USD + $1000 Neo4j Credits**

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/ZyAM6TPmmKM?si=tqZsVjJYjzRRdJI2&rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

**What it is:** A 3D product exploration experience that turns e-commerce discovery into an explorable world. Categories become mountains; subcategories become hills; terrain height reflects result counts; and an LLM “guide” (Q-Bert) leads a curated tour.

**How it works:** Embeddings (Mistral) → Qdrant similarity search → Neo4j graph curation → UMAP visualization → 3D terrain in React Three Fiber. Final 7 items are narrated by the guide agent.

Repo: [Vector Vintage](https://github.com/kanungle/vector-vintage-public)

---

### 🥈 2nd Place: RoboBank (Sanya Kapoor)

**Total Prize: $3000 USD**

<iframe width="560" height="315" src="https://www.youtube.com/embed/lELdPxdO10Y&si=AbvbJf1xauB5WYgG&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

**What it is:** An AI trajectory memory and reflex suggestion system for robots. It “banks” short sensor-action sequences as vectors, labels them by safety, and retrieves the safest neighbor to suggest the next move. Demoed in a 2D simulator, designed for real robotics.

**Stack:** Qdrant for trajectory memory, near-neighbor retrieval, real-time fallback suggestions, safe/unsafe labels, and reflex replay.

**Repo:** [RoboBank](https://github.com/kanungle/RoboBank)

---

### 🥉 3rd Place: Spatio-Temporal NPCs (cortexandcode)

**Total Prize: $2000 USD**

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/lELdPxdO10Y?si=AbvbJf1xauB5WYgG&rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

**What it is:** Non-Playable Characters (NPCs) that *remember* places, events, and interactions using spatio-temporal memory, so behavior evolves naturally instead of being scripted.

**How it works:**

* **Brain:** GPT-OSS-120B (MoE) as the conscious planner; subconscious memory in Qdrant.

* **Memories:** CLIP embeddings \+ scene descriptions for “image memories”; text embeddings for “event memories”; all tagged with locations.

* **Perception & I/O:** whisper-cpp for speech, PiperTTS for output, CLIP \+ MiniLM for embeddings.

* **Performance:** Runs locally with \~3GB VRAM, 1-2s latency, and \<$1/day in compute.

**Repo:** [Spatio-Temporal NPCs](https://github.com/kanungle/spatio-temporal-npcs)

---

## 🌟 Best-in-Category

### CrewAI Prize: ReMap (TatankAm Explorers)

**Total Prize: 1 Year of CrewAI Enterprise**

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/LR4ojcDxOXo?si=XiyUDkuctw60oAqE&rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

A **route-aware event discovery** platform. Enter a route \+ time window, and ReMap finds relevant events using **hybrid semantic search** plus **geospatial/temporal filters**, visualized on OpenStreetMap. Synthetic data today, real ingestion planned.

**Repo**: [ReMap](https://github.com/kanungle/remap)

---

### Mistral Prize: CosmicTwin (Inferno)

**Total Prize: $3000 of Mistral AI Credits**

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/MLXmNpJ4MF0?si=VMUoGgdG2G4mtwtN&rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

A playful **personality-driven social platform**: take a quiz, get matched to a “home planet,” and find **cosmic twinmates** via vector similarity. Built with Qdrant \+ Mistral AI \+ React Three Fiber, with global and per-planet chat.

**Repo**: [CosmicTwin](https://github.com/kanungle/cosmic-twin)

---

### Superlinked Prize: Bachata Vibes (Bachata Vibes team)

**Total Prize: $1000 USD**

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/rPdeiVc8maE?si=J3zdgbTnkm0kX5fm&rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

(Note: Music is removed from above video due to copyright reasons — use your imagination a bit\!)

An **AI choreographer** that generates personalized Bachata sequences by matching music features to labeled dance clips. Uses Superlinked embeddings \+ Qdrant Cloud for retrieval. A joyful fusion of music, dance, and AI.

**Repo**: [Bachata Vibes](https://github.com/kanungle/bachata_vibes)

---

### TwelveLabs Prize: Qlassroom (YHHA)

**Total Prize: $1000 in TwelveLabs Credits**

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/v-EywTyyU50?si=JZJ9PQnsJteBd8nU&rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

A **multi-modal classroom assistant** that captures **speech, video, slides, images, and documents** together into a searchable knowledge memory. Uses TwelveLabs embeddings \+ Qdrant retrieval for linked, contextual recall.

**Repo**: [Qlassroom](https://github.com/kanungle/qlassroom)

---

## 🙌 Honorable Mentions

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/REEx1Jd_Qe4?si=K-SDe9WyLK1NSTY8&rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

* **Quant Memory Palace** (*The Mondays*)  
  A **3D knowledge universe** for documents. Semantic clusters you can fly through with real-time previews and search.  
  **Repo**: [Quant Memory Palace](https://github.com/kanungle/quant-memory-palace)

* **OmniVault** (*Lone Qdrantic Agent*)  
  A **fully local, privacy-first personal knowledge companion**. Indexes local files \+ web browsing, provides multimodal semantic search, and even has Chrome extensions that highlight and scroll to recalled text. Stack: Qdrant \+ Redis \+ CLIP \+ Ollama.  
  **Repo**: [OmniVault](https://github.com/kanungle/omni-vault)

* **Drawland** (*Drawland*)  
  A **kid-friendly creativity playground** that uses vector retrieval to fuel interactive drawing and storytelling. A reminder that serious tech can spark playful experiences.  
  **Repo**: [Drawland](https://github.com/kanungle/drawland)

---

## Why These Projects Matter

These projects show what happens when developers apply vector retrieval to new domains:

* Robots that learn safer behavior.  
* NPCs that grow with memory.  
* Social platforms that connect people by personality.  
* Music and dance fused through embeddings.  
* Route-aware discovery tools and multi-modal classrooms.  
* Local-first, privacy-preserving knowledge vaults.

We really enjoyed these projects’ creativity especially, and the direction many of them took towards the use of future edge technologies with vector retrieval, like with [Qdrant Edge](https://qdrant.tech/edge/).

As with any hackathon, there were tons of amazing submissions, and we wish we could showcase them all, but we hope this sample showcases the strong power of the Qdrant Community when tasked with new challenges and creative approaches.

## What’s Next

We’ll be publishing deep dives and hosting winner interviews over the coming weeks and months. Keep an eye out for these by [subscribing to our newsletter](https://qdrant.tech/community/)\!

A huge thank you to everyone who built, mentored, or joined. You’ve proven that with Qdrant, the possibilities are limitless.

👉 Join the community: [qdrant.tech/community](https://qdrant.tech/community)
