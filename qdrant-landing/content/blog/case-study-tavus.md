---
draft: false
title: "How Tavus used Qdrant Edge to create conversational AI "
short_description: "Tavus built its Conversational Video Interface with Qdrant edge retrieval to achieve subsecond, human-grade conversations."
description: "Tavus used Qdrant edge retrieval to cut latency and deliver natural, human-grade conversational AI."
preview_image: /blog/case-study-tavus/social_preview_partnership-tavus.jpg
social_preview_image: /blog/case-study-tavus/social_preview_partnership-tavus.jpg
date: 2025-09-12
author: "Daniel Azoulai"
featured: true

tags:
- Tavus
- vector search
- conversational AI
- retrieval augmented generation
- latency optimization
- case study
---

![Tavus Overview](/blog/case-study-tavus/tavus-bento-box-dark.jpg)

## How Tavus delivered human-grade conversational AI with edge retrieval on Qdrant

Tavus is a human–computer research lab building CVI, the [Conversational Video Interface](https://www.tavus.io/). CVI presents a face-to-face AI that reads tone, gesture, and on-screen context in real time, allowing for humans to interface with powerful, functional AI like never before. The team’s north star was simple to say and hard to ship: conversations should feel natural. That meant tracking conversational dynamics like utterance-to-utterance timing, back-channeling, and turn-taking while grounding replies in a customer’s private knowledge.

Early iterations of CVI focused on live conversation quality, but not retrieval. Customers who needed document grounding or recall brought their own RAG layer, which added latency and inconsistency. Tavus wanted to internalize RAG so they could guarantee performance, simplify onboarding, and keep the experience cohesive.

“I read your docs, had a clear idea of what to do, implemented it, and it just worked. The simplicity and performance were there from day one.”  
 **Mert Gerdan, ML Engineer, Tavus**

## Why network hops threatened subsecond conversational flow

Human conversation tolerates very little lag. Literature on conversational systems shows that in highly engaging exchanges, the optimal time from one speaker finishing to the other starting is about 200ms. For CVI, even 500 to 600ms best case end to end felt tight once you include understanding, planning, text to speech, facial rendering, and streaming.

Adding network hops for retrieval threatened to push utterance-to-utterance into the 800 to 900ms range. On top of that, customers needed multimodal grounding that spans video, audio, and screen share, as well as per-conversation isolation for security and correctness. The retrieval layer had to be fast, local, and simple.

## How per-conversation edge vector stores removed latency

Tavus implemented a self-hosted central Qdrant and spun up per-conversation edge collections that were colocated with the conversational worker. Each conversation generated embeddings on a local GPU and queried its local Qdrant store, which removed the network latency during retrieval. 

### Design choices that balanced speed and quality

The first choice was to keep both embedding and approximate nearest neighbor lookup local to the node where the conversation runs. Because the data never left the machine, the system avoided serialization and transit delays that would otherwise dominate the latency budget. Most of the usage is in a few collections, and they filter based on conversation id. This made reasoning about context scope easier and created a clean boundary for privacy, auditing, and lifecycle management.

With the network hop removed, the team chose simplicity over tuning. They did not need quantization or aggressive compression to chase a few extra milliseconds, so they focused on retrieval quality and multimodal accuracy instead. That simplicity enabled a second architectural move: retrieval on every utterance. Each turn could fire an embedding and vector search without imposing a perceptible pause. Finally, Tavus layered speculative execution on top, predicting likely continuations so the agent could prepare responses while the user was still speaking. Together, these choices produced a pipeline that felt natural without sacrificing correctness.

### Business impact from faster retrieval and smoother launches

By eliminating the network hop, Tavus reduced retrieval to roughly 20 to 25ms at the edge. End-to-end utterance-to-utterance timing now landed near 500 to 600ms in the best case, leaving enough headroom to add artificial delays for deeper topics where a slower cadence feels more human. Because retrieval was cheap in terms of perceived latency, the team could ground every turn and keep answers accurate even as conversations grew complex.

The operational picture improved as well. Within the first three weeks, Tavus indexed about 3 to 3.5 million points, with each point representing around 1,500 characters. The launch was uneventful in a good way. Support queues stayed quiet, and customers were able to bring private knowledge into CVI without standing up their own RAG stacks. Developer velocity benefited from a smaller, clearer deployment model that was easier to reason about and extend.

“We wanted companies to experience CVI’s quality without building a RAG system themselves. With Qdrant at the edge, retrieval became effectively invisible to the user.”  
 **Mert Gerdan, ML Engineer, Tavus**

## What the team learned about architecture and speed

Tavus validated that architecture beats micro-optimizations. Removing the network hop and colocating compute with data produced a larger latency win than squeezing a few milliseconds with quantization. With per-conversation edge stores in place, the team could optimize for quality and safety, such as richer multimodal features and better turn-taking, without sacrificing speed.