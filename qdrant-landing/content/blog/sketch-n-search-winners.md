---
title: "Sketch & Search: Google Deepmind x Qdrant x Freepik Hackathon Winners"
draft: false
slug: sketch-n-search-winners
short_description: "Discover the winners of Qdrant’s Sketch & Search Hackathon in collaboration with Google Deepmind and Freepik, where developers built innovative vector search applications beyond chatbots - from robotics to gaming, e-commerce, and more."
preview_image: blog/sketch-n-search-2025/sketch.png
social_preview_image: blog/sketch-n-search-2025/sketch.png
date: 2026-02-03
author: Manas Chopra
featured: true
tags:
  - news
  - blog
---
Builders from around the world came together for Sketch & Search, a global hackathon powered by Google DeepMind, Freepik, and Qdrant, to explore the future of AI-driven creative pipelines.

Teams were challenged to go beyond single-prompt generation and build end-to-end systems combining generative models, visual creation, and vector search. Submissions showcased consistent characters and style memory, image-as-prompt and image-to-video workflows, intelligent asset discovery, recommendations, and built-in brand-safe guardrails.

The hackathon kicked off in San Francisco on November 22, 2025, followed by a two-week virtual build window and a live demo day where winners were announced. Projects were judged on creative quality, effective search and similarity, UX tradeoffs, guardrails, and real-world applicability.

With over $25,000 in prizes, including cash awards and Gemini API credits, Sketch & Search highlighted how generation, search, and creativity come together to power production-ready applications.

👉 Full hackathon details: [Hackathon page](https://luma.com/2kt11r0m)

Let’s dive into the top projects and what we liked about each of them.

---

## 🏆 Overall Winners

### 🥇 1st Place: Prometheus (Harry Kabodha)

**Bonus Prize: Best use of Gemini**  
**Total Prize: `$1500 USD Cash & 500 Gift Card` \+ `$10000 Gemini API Credits`**

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/IwCNnaGZLuM?rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

**What it is:** Prometheus turns a PDB file (molecule format) into a cinematic, structure-faithful “mechanism trailer” for scientists and biotech storytellers. Gemini interprets the protein (domains, active site, flexible regions) and writes shot prompts grounded by Mol* renders. Qdrant searches your prior targets to reuse the best prompt/camera templates, then stores what works to build an institutional “visual memory.” Nano Banana generates consistent keyframes, and Freepik stitches them into a short animation ready for decks, talks, and internal knowledge bases.

**Stack:** Gemini/Flash, Nano Banana, Qdrant, Freepik

Repo: [Prometheus](https://github.com/resilienthike/Prometheus)

---

### 🥈 2nd Place: Roast My Snack (Jay Ozer)

**Total Prize: `$500 Cash & 300 Gift Card`**

<iframe width="560" height="315"
  src="https://www.loom.com/embed/b1568b443acb4c1db7f3a2af903e2d14"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

**What it is:** Roast My Snack transforms snack photos into 4-panel comics where Dr. Hawley - a Gen-Z molar with Adult Swim energy - roasts your snack's "aesthetic threat level" to your smile. The insight: Telling teens "sugar causes cavities" doesn't work. But "that snack is gonna turn your smile yellow"? That lands.
We use vanity as a force for good. Built with Gemini Vision, Qdrant semantic search, and clinic-validated dental science from Poppy Kids Pediatric Dentistry. Age-adaptive roasts (Spicy for tweens, Savage for teens), transparent risk scoring, and Instagram-ready exports. Dental education kids actually want to share.

**Stack:** Gemini/Flash, Nano Banana, Qdrant, Freepik

**Repo:** [Roast My Snack](https://github.com/jayozer/snackswap_comics)

---

### 🥉 3rd Place: AutoScape (Tommy Purcell & Rae Jin)

**Bonus Prize: Best use of Nano Banana** 

**Total Prize: `$250 Cash & 150 Gift Card` \+ `$10,000 Gemini API Credits`**

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/giOQIApFRzE?rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

**What it is:** AutoScape is an AI-powered landscape design platform that takes you from a single photo to a build-ready outdoor project. But it's more than a generic image generation tool. AutoScape is a full platform for homeowners, designers, contractors, and public-sector teams working on residential, commercial, or civic spaces. AutoScape produces photorealistic designs, materials lists, and labor cost estimates with product links, exportable to Excel or Google Sheets. Designs can be shared for collaboration. Unlike generic AI tools, AutoScape uses a Qdrant-powered RAG system and curated plant database grounded in real materials and pricing. A public gallery enables inspiration and reuse globally.

**Stack:** Gemini/Flash, Nano Banana, Qdrant, Freepik

**Repo:** [AutoScape](https://github.com/tommypurcell/AutoScape)

---

## Why These Projects Matter

These winners stand out because they treat retrieval as an engineering primitive - not a bolt-on feature. Instead of generating “one-off” outputs, they build systems that can *remember*, *reuse*, and *stay grounded* as inputs and requirements change:
- Prometheus turns structured scientific data (PDB + Mol* renders) into a repeatable video pipeline, and uses similarity search to reuse proven camera/prompt templates across targets.
- Roast My Snack couples vision + semantic search with an explicit scoring layer (age-adaptive tone, transparent risk signals) so the output is controllable and consistent - not just funny.
- AutoScape anchors image-to-design generation in a curated plant/material catalog with retrieval, so designs come with real constraints (availability, pricing) and can be iterated, shared, and audited.

Across all three, Qdrant enables the “long-term memory” layer: storing embeddings of past assets, prompts, and outcomes so future runs can start from what already worked - faster iteration, better consistency, and less prompt thrash.

As with any hackathon, there were tons of amazing submissions, and we wish we could showcase them all, but we hope this sample showcases the strong power of the Qdrant Community when tasked with new challenges and creative approaches.

## What’s Next

We’ll be publishing deep dives and hosting winner interviews over the coming weeks and months. Keep an eye out for these by [subscribing to our newsletter](https://qdrant.tech/community/)\!

A huge thank you to everyone who built, mentored, or joined. You’ve proven that with Qdrant, the possibilities are limitless.

👉 Join the community: [qdrant.tech/community](https://qdrant.tech/community)
