---
draft: false
title: "How Xaver scaled personalized financial advice with Qdrant"
short_description: "Xaver built a compliant AI advisory engine with Qdrant."
description: "Discover how Xaver used Qdrant to power its two-tier knowledge engine, enabling sub-second, compliant AI-assisted financial consultations across chat, video, and phone."
preview_image: /blog/case-study-xaver/social_preview_partnership-xaver.jpg
social_preview_image: /blog/case-study-xaver/social_preview_partnership-xaver.jpg
date: 2025-11-13
author: "Daniel Azoulai"
featured: true

tags:
- Xaver
- vector search
- financial services
- AI agents
- knowledge engine
- latency optimization
- case study
---

![Xaver Overview](/blog/case-study-xaver/xaver-bento-box-dark.jpg)

## How Xaver Built its AI Knowledge Engine with Qdrant

<a href="https://www.xaver.com/" target="_blank">Xaver</a> is tackling a core challenge in the financial industry: scaling personalized financial and retirement advice. As demographic shifts increase demand for private pensions, traditional, manual consultation models are proving too slow and costly to support everyone who needs help.

To solve this, Xaver provides banks, insurers and distributors with a vertically specialized and compliant agentic sales platform. This technology acts as both an AI sales assistant for human advisors and as an autonomous agent to deliver compliant, personalized financial guidance to consumers via phone, video avatars, messengers and web journeys.

One core component of the platform is a fast, flexible knowledge engine designed to provide instant, contextually accurate answers for consulting AI agents. 

*“Every second of latency matters in a phone or video consultation. Qdrant gave us the performance foundation to serve knowledge in real time without sacrificing quality.”*  
Ole Breulmann, Founder / CPTO**, Xaver**

### The challenge: Bringing scale and speed to pension consultation

Private pension products are critical to addressing old-age poverty, yet the process of advising consumers remains highly manual and fragmented. Sales and consultation are typically handled by human brokers or advisers, each with their own methods, tools, and systems. This creates barriers to access, especially for consumers who expect digital-first financial services available on demand.

Xaver’s goal was to empower financial institutions to meet this demand with an always-available, AI-assisted advisory experience that maintains the trust and compliance standards of traditional consultation. That required:

* Real-time performance for interactive use cases like voice or video conversations.

* Reliable knowledge retrieval across channels such as WhatsApp, web chat, and advisor co-pilots.

* High-quality responses with guardrails for confidence and accuracy.

To make this work, Xaver needed a system that could manage knowledge retrieval and reasoning under tight latency constraints while remaining transparent, explainable, and easy to scale.

### The solution: Semantic caching, or a two-layer knowledge engine

[Qdrant](https://qdrant.tech/documentation/overview/) was selected after extensive evaluation for several reasons:
Xaver’s AI platform includes a “knowledge engine,” an [indexing](https://qdrant.tech/documentation/concepts/indexing/) and [retrieval](https://qdrant.tech/documentation/beginner-tutorials/retrieval-quality/) layer that feeds contextually relevant insights to both automated and human-assisted consultations. It powers two key functions:

1. Automated consultation through AI-led sessions via phone, video avatar, messengers, or web chat.

2. Advisor co-pilot that provides real-time context and recommendations for human consultants during live sessions.

To meet latency goals and maintain precision, Xaver implemented a two-tier retrieval architecture:

* **Tier 1: Condensed knowledge base (CKB).** A curated index of pre-summarized answers for the most common use case specific questions. This enables near-instant recall without triggering new large language model (LLM) summarization steps.

* **Tier 2: Full knowledge base.** A deeper corpus containing regulatory, financial, and policy documents, used when Tier 1 confidence is low or when a query requires more detailed reasoning.

This architecture enables the Xaver platform to deliver knowledge for the most common conversational situations instantly, while supporting rare or complex cases through a second-tier retrieval layer. The approach minimizes computational overhead, reduces response time by two to three seconds in typical cases, and preserves conversational flow, which is crucial for voice and video experiences.

![Xaver Retrieval Process](/blog/case-study-xaver/xaver-retrieval-process.jpg)

*Figure: Xaver’s retrieval process*

### Why Qdrant

When designing the knowledge engine, Xaver deliberately chose to focus on its application layer instead of building core infrastructure from scratch. The team wanted to dedicate engineering effort to customer-facing innovation, not database maintenance.

[Qdrant](https://qdrant.tech/documentation/overview/) was selected after extensive evaluation for several reasons:

* **High performance at low latency.** Its [Rust-based core](https://qdrant.tech/articles/why-rust/) allowed Xaver to meet strict real-time response thresholds for conversational use cases.

* **Developer simplicity.** Qdrant’s [intuitive API](https://api.qdrant.tech/api-reference) and clean operational model helped the team integrate quickly without diverting resources to maintain infrastructure.

* **Flexible deployment.** The platform could run both the condensed and full knowledge bases side by side with custom confidence thresholds and filters.

* **Future readiness.** Qdrant’s stability and scalability aligned with Xaver’s roadmap to expand across channels and markets without adding infrastructure complexity.

By relying on Qdrant for the vector storage and retrieval layer, Xaver was able to stay focused on what truly differentiated its product: the AI logic, compliance workflows, and personalized advisory experience that sit above the database layer.

*“Qdrant turned vector search from a bottleneck into a runway; faster results and more room to innovate with indexing strategies in production.”*  
Arijit Das, PhD, Senior AI Engineer, Xaver

### Results: Real-time guidance and trusted digital advisory

With Qdrant underpinning the knowledge engine, Xaver achieved a responsive and reliable consultation experience across multiple modalities:

* Sub-second retrieval for common intents in real-time phone and video sessions.

* Improved advisor efficiency through contextual recommendations delivered in co-pilot mode.

* Unified knowledge management across all channels from chat to audio.

These gains allowed financial institutions to modernize customer interactions while preserving the human quality and regulatory rigor that define financial advice.

![multi-channel approach for financial advisory](/blog/case-study-xaver/xaver_qdrant.png)
*Xaver’s multi-channel approach for financial advisory*

### Providing the speed, reliability, and simplicity for efficient AI-driven consultations

For Xaver, success is about prioritization: investing deeply in the vertical AI expertise and the user experience while outsourcing the heavy lifting of vector search infrastructure to a trusted partner. Qdrant provided the speed, reliability, and simplicity needed to make efficient AI-driven consultation a reality for financial institutions.

The result is a scalable, human-centered system that brings trusted financial guidance into the digital age, fast, compliant, and ready for the future.
