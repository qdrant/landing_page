---
title: "All Vectors Lead to Community: Vector Space Day 2025 Recap"
draft: false
slug: vector-space-day-2025-recap
short_description: "Vector Space Day 2025 gathered 400 developers in Berlin to explore vector search, agentic AI, and real-world retrieval systems."
description: "Vector Space Day 2025 in Berlin brought together nearly 400 developers, researchers, and industry leaders to explore vector search, agentic AI, and real-world retrieval architectures through keynotes, breakout talks, lightning sessions, and community networking."
preview_image: /blog/vsd25-post-event/blog-hero.jpg
social_preview_image: /blog/vsd25-post-event/blog-hero.jpg
date: 2025-09-30
author: Qdrant
featured: true
tags:
  - news
  - blog
---

[**\[See all event slides here\]**](https://drive.google.com/drive/folders/1DbRQmwmMg8U255g3-ooo7Ojt9FPgHNc9?usp=sharing)

On September 26, 2025, nearly **400 developers, researchers, and engineers** came together at the Colosseum Theater in Berlin for the first-ever **Qdrant Vector Space Day**.  

From the start, the day belonged to the community. Over coffee and fresh Qdrant swag, the conversations quickly moved to embeddings, hybrid search, and AI agents. Laptops flipped open, QR codes were shared, and the room filled with people eager to trade ideas and learn from one another.  

What made the event special wasn’t the stage or the setup, but the chance to connect in person with the practitioners driving this technology forward. Vector Space Day felt less like a traditional conference and more like a **community launchpad** - a place to share challenges, compare approaches, and shape what comes next in AI-native search.  

That sense of ownership showed up everywhere, even after the talks. Astronaut-themed photo edits started circulating online, turning the event’s playful theme into something the community made their own.

![astronauts](/blog/vsd25-post-event/astronaut3.png)

*(Thanks Emil \- [we love these](https://www.linkedin.com/posts/ugcPost-7378046497935740928-U-9I?utm_source=share&utm_medium=member_desktop&rcm=ACoAABQp8ysBnS0IBNNy1YubFmEo1fObKF8ZsiI)\!* 😎*)*

Seeing the community make it their own \- from playful photo edits to serious technical exchanges \- showed us how alive that vision really is. 🚀

We know many of you in our community would have liked to attend as well, so we wanted to give you a chance to re-live part of the event with this blog. We will share the recordings of all sessions in the next weeks as well. Let’s dive right in. 

<!--![vector space day](/blog/vsd25-post-event/keynote-stage.png)-->


### Opening Keynotes

Our Co-Founder and CEO [**André Zayarni**](https://www.linkedin.com/in/zayarni/) opened the day by framing the **shift to AI-native search**. His slides mapped out the evolution in AI Native Search that we are currently seeing:

* **Wave 1: RAG 1.0 (Static Assistants)** — where retrieval was mostly about plugging a search index into a chatbot.  
* **Wave 2: Agentic AI (Multi-step Reasoning)** — today’s landscape, where agents plan, retrieve, and act but still struggle with memory and precision.  
* **Wave 3: Embedded AI (On-edge \+ Physical Agents)** — the next frontier, where vector-native search underpins real-time, multimodal agents running on devices and in physical environments. Something we started to venture into with [Qdrant Edge](https://qdrant.tech/blog/qdrant-edge/).

![Three Waves](/blog/vsd25-post-event/keynote-andre2.jpg)

André highlighted the underlying forces driving this shift:

* **Unstructured data growth** far outpacing legacy search systems.  
* **Agents as new end-users**, where every query is a chain of calls.  
* **Legacy search falling short** on speed and filtering.  
* **Vector search as the missing layer** to make AI systems stateful, precise, and responsive at scale.

We are convinced that if AI is going to evolve beyond static assistants, it needs a **retrieval layer built for unstructured data and agent workflows**. 

Next on stage, our Co-Founder and CTO [**Andrey Vasnetsov**](https://www.linkedin.com/in/andrey-vasnetsov-75268897/) emphazised our belief that ‘vector database’ is actually the wrong term to describe what we are building at Qdrant. **Qdrant is not “a vector database”** because vectors themselves are not data, but representations.

![Not a Vector DB](/blog/vsd25-post-event/keynote-notvdb.png)

After a short technical explanation of this distinction, Andrey shifted to what Qdrant *is*, rooted in the original vision that inspired its creation:

* **Qdrant is a search engine**  
* **Qdrant is for vectors**  
* **Qdrant is standalone**

Anything outside those three principles, Andrey argued, falls outside our long-term vision. This clarity set the stage for the rest of the keynote block.

The morning session continued with keynotes from our partners and team:

* [**Robert Eichensheer (Microsoft)**](https://www.linkedin.com/in/roberteichenseer/) showed the transformation of NLWeb in action and how Qdrant is being applied in enterprise-scale use cases.  
* [**Rocco Fortuna (Qdrant)**](https://www.linkedin.com/in/roccofortuna/) followed with a walkthrough of NLWeb as a managed service, highlighting how developers can run complex workloads without operational overhead.  
* [**Manuel Meyer (Qdrant)**](https://www.linkedin.com/in/meyermanuel/) showcased the flexibility of **Qdrant Cloud**, emphasizing that Qdrant can run anywhere (**OSS, Cloud, Hybrid, or Private**) with enterprise-ready reliability.  
* [**Kevin Cochrane (Vultr)**](http://linkedin.com/in/kevinvcochrane/) demonstrated how Qdrant powers their AI-native developer experience and how Qdrant integrates into Vultr’s global cloud infrastructure, including Kubernetes-based reference architectures for scalable inference and search.  
* [**Neil Kanungo (Qdrant)**](https://www.linkedin.com/in/neilkanungo/) closed the keynote block with a focus on developer experience and community growth, showing how programs like **Qdrant Stars** and improvements in onboarding accelerate adoption.

Next up were talks from our fantastic expert speakers from around the globe, bringing their knowledge to the Qdrant community in stellar fashion.

### Breakout Talks

After a short break, our community had the choice between two content tracks: Milky Way and Andromeda, for a packed schedule of **16 breakout talks** from industry experts, each diving deeper into retrieval pipelines, scaling patterns, and applied agentic AI use cases.

A few highlights:

![Rachel Rapp](/blog/vsd25-post-event/breakout-rachel.jpg)
*Rachel Rapp explains tradeoffs to dimensionality and quantization*

* [**Rachel Rapp (Baseten)**](https://www.linkedin.com/in/rachelrapp/) **– High-Throughput, Low-Latency Embedding Pipelines**  
  Rachel shared lessons from companies running embedding inference at scale. Her talk focused on where latency and throughput degrade in production and the architectural fixes that help, from model selection trade-offs to dimensionality and quantization choices. She also introduced open source tools that boost embedding APIs and gave deployment tips for compound AI systems where multiple models and tools need to coordinate.

* [**Roman Grebennikov (Delivery Hero)**](https://www.linkedin.com/in/romangrebennikov/) **– How to Cheat at Benchmarking Search Engines**  
  Roman explained why published search benchmarks are often misleading: different datasets, different configs, and non-comparable parameters. He presented Delivery Hero’s approach to building a reproducible benchmarking harness and public leaderboard designed for fair comparisons across modern search engines.

![Dat Ngo](/blog/vsd25-post-event/breakout-dat.jpg) 
*Attendees raved about Dat’s talk on agentic RAG evaluations*

* [**Dat Ngo (Arize AI)**](https://www.linkedin.com/in/datdarylngo/) **– Self-Improving Evaluations for Agentic RAG**  
  Dat tackled the evaluation problem for agentic RAG systems. He demonstrated how to trace multi-step reasoning plans, surface hidden failure modes like tool misuse or hallucinated context, and measure not just per-turn accuracy but also trajectory coherence and multi-turn consistency. His talk went further by showing how to close the loop with improvement mechanisms such as routing across sources, refining eval prompts, and fixing context injection so that agentic systems do not just get measured, they get better over time.

* [**Martin O’Hanlon (Neo4j)**](https://www.linkedin.com/in/martinohanlon/) **– Hands-On GraphRAG**  
  Martin introduced GraphRAG, showing how knowledge graphs can enrich retrieval-augmented generation with structure, relationships, and provenance. His presentation included building a knowledge graph from unstructured text and integrating it into a LangChain agent for better grounding and explainability.

![Marcel n8n](/blog/vsd25-post-event/breakout-marcel.jpg) 
*Marcel Claus-Ahrens shares some Dr. Pure Eval insights 😈*

* [**Marcel Claus-Ahrens (n8n Ambassador)**](https://www.linkedin.com/in/geckse/) **– Evaluate Your Qdrant-RAG Agents with No-Code n8n Evaluations**  
  Marcel showed how agent evaluation can be made accessible without writing custom infrastructure. Using n8n’s no-code workflows, he built a RAG agent backed by Qdrant, indexed a small knowledge base, and then walked through native evaluation methods. The session covered how to apply LLM-as-a-Judge, design test sets, track regressions over time, and wire alerts for quality drift. 

In addition, we also had inspiring sessions from many other speakers, which you can view in the slide deck below. (Sorry we can’t list all of them in detail in this blog 🙈 but we will share more once we publish the recordings on the [Qdrant YouTube Channel](https://www.youtube.com/@qdrant)… stay tuned\!)

Thanks to the other speakers from **AskNews, Linkup, cognee, Neo4j, Superlinked, Arize AI, Jina AI, LlamaIndex, TwelveLabs, deepset, GoodData, Google DeepMind**.

**👉 [To see all speaker slides, go here](https://drive.google.com/drive/folders/1DbRQmwmMg8U255g3-ooo7Ojt9FPgHNc9?usp=sharing)**

Special thanks to our amazing Qdrant Stars ✨ [**Clelia Astra Bertelli**](https://www.linkedin.com/in/clelia-astra-bertelli-583904297/), [**M K Pavan Kumar**](https://www.linkedin.com/in/kameshwara-pavan-kumar-mantha-91678b21/), and [**Robert Caulk**](https://www.linkedin.com/in/rcaulk/) who came from across the globe to attend our event and share their experience with our community. 🙌 

![Qdrant Stars](/blog/vsd25-post-event/3stars.png)
*Qdrant Stars presenting at Vector Space Day*

### Networking

Throughout the day, the Colosseum buzzed with conversations. Speakers and attendees connected between sessions, traded ideas, and asked tough technical questions. QR codes flashed as LinkedIn connections were made, laptops opened for impromptu demos, and groups gathered over coffee to debate architectures and share lessons from their own deployments.

![Marcel Networking](/blog/vsd25-post-event/networking-marcel.jpg)
*Speakers and attendees got a chance to deep dive on special topics together*

We were thrilled to feel the energy of our community in person. Vector Space Day wasn’t just a conference \- it was a chance for us and our community to learn from one another, share ideas, and connect. What stood out most to us was simply being in the same room, seeing conversations spark and relationships form.

![Networking Swag](/blog/vsd25-post-event/networking1.jpg)

*The Qdrant DevRel Team hands out some free swag to attendees during networking time*

### Lightning Talks

In the afternoon, the stage shifted to our startup community with a series of rapid 10-minute lightning talks. These sessions gave emerging teams the chance to showcase how they are applying vector search in real-world use cases. [**Marc-André Lampe**](https://www.linkedin.com/in/marc-andr%C3%A9-lampe-b3430099/) **and [Lionel Schulz](https://www.linkedin.com/in/lionel-schulz-6b0104214/) of iCompetence** presented *“Multimodal Vectors for Instant, Personalized Product Discovery,”* highlighting how combining multiple data types can unlock richer and more accurate recommendations. [**Jakob Edding**](https://www.linkedin.com/in/edding/) **and [Raphael Lachtner](https://www.linkedin.com/in/raphael-lachtner-875112228/) of bakdata** followed with a talk on *“Searchable Knowledge from Massive Text Streams,”* demonstrating how large-scale text data can be transformed into actionable, queryable knowledge using Qdrant.

### Hackathon Winners

![Hackathon](/blog/vsd25-post-event/vsd-hack.png)

In the weeks leading up to Vector Space Day, the global Qdrant Community was challenged to virtually compete and “Think Outside the Bot” to create AI solutions with Vector Search beyond simple RAG chatbots ([details here](https://try.qdrant.tech/hackathon-2025)).

Developers worldwide built creative, AI apps with Qdrant that showcased:

* Adaptive robotics memory  
* NPCs with spatio-temporal recall  
* Immersive 3D e-commerce  
* Dance choreographies powered by embeddings  
* Multi-modal classroom assistants  
* Social networks by cosmic identity  
* and more

The Grand Prize was awarded to [**Benedict Counsell**](https://www.linkedin.com/in/benedict-counsell/) with [**Vector Vintage**](https://github.com/kanungle/vector-vintage-public) for a creative take on immersive 3D commerce using Qdrant, Mistral AI, and Neo4j. See the video below to learn more, and visit our [recent blog](https://qdrant.tech/blog/vector-space-hackathon-winners-2025/) to read about all the winners.

<iframe width="560" height="315"
  src="https://www.youtube.com/embed/ZyAM6TPmmKM?si=tqZsVjJYjzRRdJI2&rel=0"
  title="YouTube video player"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

### After Party

![After Party](/blog/vsd25-post-event/afterparty.jpg)

The day wrapped up with an after party that felt lively and and upbeat with DJs, pizza, and drinks in the Colosseum’s open atrium. Conversations didn’t stop; they just shifted tempo, with embeddings, search architectures, and vector math carrying on late into the night.

### Thank you

To our community, attendees, and sponsors: thank you. Vector Space Day would not have been possible without you. Qdrant would not be possible without you. And the future of AI will only be possible with you.

Your energy and ideas inspire us every day. You leave us motivated to keep building, keep improving, and keep supporting the developer community that makes all of this real.

– The Qdrant Team

![Qdrant Crew](/blog/vsd25-post-event/thankyou.png)