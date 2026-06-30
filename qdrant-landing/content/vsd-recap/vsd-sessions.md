---
title: Watch the Talks from Vector Space Day 2026
featuredVideoId: eMLRVlUPoZw
playlistUrl: https://www.youtube.com/playlist?list=PL9IXkWSmb3691YPJcUloHXXfdPHIYjTlM
badgeIconsPath: themes/qdrant-2024/static/img/vsd-sf-26/agenda/
sessions:
  - title: We do it the hard way
    description: Qdrant started for search, and remained for search. From its roots as an open source side project to millions of downloads and thousands of community members worldwide, Qdrant always sought to build the highest quality search engine, even when that meant doing things the hard way. Andre Zayarni, Qdrant Co-Founder and CEO, shared our origins, the decisions that shaped the product, and our future trajectory. Welcome to Vector Space Day.
    companyLogo: /img/qdrant-logo-red-black.svg
    badge: QDRANT
    badge_type: qdrant
    badge_icon: presentation
    videoId: 6CIoByd0Vjs
    speakers:
      - name: Andre Zayarni
        role: CEO, Co-Founder
  - title: When Search Gets Serious
    description: From a strong Rust core to composable retrieval primitives, Qdrant was built from the start for speed, accuracy, and flexibility. It supported thousands of projects and a growing number of enterprise businesses around the world, all from the same core engine. Manuel Meyer and Neil Kanungo shared where Qdrant is headed next and what it means for the teams building on it.
    companyLogo: /img/qdrant-logo-red-black.svg
    badge: QDRANT
    badge_type: qdrant
    badge_icon: presentation
    reverse: true
    videoId: _hOPIlTSWwI
    speakers:
      - name: Manuel Meyer
        role: COO
      - name: Neil Kanungo
        role: Head of DevRel
  - title: Continual Learning Starts with Memory
    description: Continual learning has long been treated as a training problem — new data, new gradients, new weights. But for production agents, the first unlock isn't retraining, it's memory. This talk reframed continual learning as a memory, retrieval, and state-management problem, showing how agents capture interactions, structure durable context, and improve decisions over time. Taranjeet shared patterns from building Mem0, including trade-offs of a memory layer on vector databases and what breaks at scale.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Mem0.svg
    badge: AGENTS & MEMORY
    badge_type: agents
    badge_icon: brain
    videoId: yw-7Ofr27ro
    speakers:
      - name: Taranjeet Singh
        role: CEO, Co-Founder
  - title: Using GraphRAG to Improve Enterprise Governance
    description: Enterprise AI agents are only as trustworthy as the rules they operate within. This talk presented a practical blueprint for combining Qdrant's vector search with a Neo4j graph governance layer — building agents that retrieve fast and stay policy-compliant. Through a live demo, they showed how the same query returns different results for different users based on governance, not just relevance. Attendees left with a concrete architecture for enterprise AI agents that are smart, fast, and safe.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Adobe.svg
    badge: SEARCH & RETRIEVAL
    badge_type: search
    badge_icon: search
    reverse: true
    videoId: ulnJo3eOUU8
    speakers:
      - name: Murthy Chandrapaty
        role: Principal Engineer
      - name: Ankush Gumber
        role: Software Engineer
  - title: "Literal Skill Issue: Are SKILLS.md Holding Your Agents Back?"
    description: SKILLS.md files have saved us from the massive headache of MCP servers, but having a human manually write and update static markdown files just doesn't scale. This session broke down the very real limitations of hardcoding what your agents can do, from brittle maintenance loops to capability ceilings that cap what agents can learn on their own. Paige Bailey explained why SKILLS.md is just our awkward transitional phase, and how we're going to replace it with dynamic, autonomous tooling that evolves as your agents do.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Google-Deepmind.svg
    badge: AGENTS & MEMORY
    badge_type: agents
    badge_icon: brain
    videoId: KEW0KGsLIZw
    speakers:
      - name: Paige Bailey
        role: Developer Relations Lead
  - title: Free Your Agent's Mind...with Context Graphs
    description: AI systems need more than intelligence; they need context that persists. Without it, even strong models misinterpret information, lose decision rationale, or repeat mistakes. Context Graphs address this — a living graph capturing not just what was retrieved, but how context led to actions through tool calls, constraints, and outcomes, stitched across entities and time. This talk showed how context graphs complement retrieval with multi-hop structured assembly and built-in provenance for enterprise-ready AI.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Neo4j.svg
    badge: AGENTS & MEMORY
    badge_type: agents
    badge_icon: brain
    reverse: true
    videoId: SFsG3uBoHnA
    speakers:
      - name: Stephen Chin
        role: VP of Developer Relations
  - title: Building the Infra Behind 20 Billion+ Vectors
    description: This talk traced HubSpot's journey from a Helm-based Qdrant deployment, where cluster provisioning and scaling were manual, error-prone, multi-step processes, to a fully automated Kubernetes Operator built on HubSpot's internal kube-operators framework. The team shared how they designed the operator to handle rolling upgrades, automated scaling, and self-healing across a fleet managing 20 billion+ vectors, and the lessons learned running Qdrant at this scale in production.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Hubspot.svg
    badge: SEARCH & RETRIEVAL
    badge_type: search
    badge_icon: search
    videoId: 46aQff4pxRE
    speakers:
      - name: Oleg Tereshin
        role: Sr Software Engineer
      - name: Xin Liu
        role: Tech Lead
  - title: "Scaling to Billions: Lessons from Slack's Semantic Search Indexing"
    description: Slack's semantic search indexes trillions of messages into vectors, kept searchable within seconds. This open discussion skipped the "perfect world" diagrams and covered what it actually takes to run a vector pipeline at this scale — a Lambda architecture with a "snowball" caching system to avoid recomputing billions of embeddings weekly, greedy batching for a 3x inference speedup, and a candid look at why complex quantization methods failed in production.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Slack.svg
    badge: SEARCH & RETRIEVAL
    badge_type: search
    badge_icon: search
    reverse: true
    videoId: 2cUC38rv7PQ
    speakers:
      - name: Avirek Ghatia
        role: Staff Software Engineer
      - name: Brian O'Grady
        role: Head of Solutions Architecture
  - title: Building the DNA of Search
    description: Qdrant was engineered from the ground up for performance, scale, and flexibility — and Oncotelic Therapeutics put it to the test. Indexing 28M PubMed abstracts to power AI-driven drug development, Oncotelic compressed concept-to-clinic to ~2 years — a fraction of the typical biotech timeline. Qdrant Engineering and Oncotelic walked through what matters most for search at scale — hybrid retrieval, MeSH-enriched metadata filtering, and the operational realities of running a vector database in production.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Co-Logos-Row.svg
    companyLogoWide: true
    companyLogoOffset:
      placement: top
      value: -4
    badge: QDRANT
    badge_type: qdrant
    badge_icon: presentation
    videoId: srmU9n95ce0
    speakers:
      - name: Bastian Hofmann
        role: Head of Product, Qdrant
      - name: Saran Saund
        role: CBO, Oncotelic Therapeutics
      - name: Scott Myers
        role: PM, Oncotelic Therapeutics
  - title: Building Distributed, Enterprise-ready Agentic AI
    description: A high-level look at building intelligent, enterprise-grade AI agents using modern tools and infrastructure. This session explored how scalable systems can support context-aware reasoning, long-term memory, and real-time decision-making at production scale — from retrieval and orchestration to evaluation and observability. Gabriel Lebow shared how Vultr's global cloud infrastructure powers distributed AI workloads for companies shipping agents today.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Vultr.svg
    badge: AGENTS & MEMORY
    badge_type: agents
    badge_icon: brain
    reverse: true
    videoId: 6t9EC8bSJ64
    speakers:
      - name: Gabriel Lebow
        role: Sr GPU Solutions Engineer
  - title: "The Document Harness: What Your AI Misses in the 90%"
    description: An estimated 90% of enterprise data is unstructured, living in PDFs, PowerPoints, Word, and Excel files that power a majority of knowledge work. There's a huge opportunity to build autonomous agents that can understand, reason over, and edit massive quantities of documents. But real-world documents are too complex for even frontier models to understand. This session walked through core challenges and advances in document OCR and agent harnesses enabling modern document workflow automation.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/LlamaIndex.svg
    badge: AGENTS & MEMORY
    badge_type: agents
    badge_icon: brain
    videoId: eO7l6j55PxE
    speakers:
      - name: Preston Carlson
        role: AI Engineer
  - title: "Stop Vibe Shipping: Evaluate Your Retrieval"
    description: '"Looks good to me" is not an evaluation strategy. Yet most teams ship retrieval systems that way — tweak the chunking, run a few demo queries, call it done. This talk replaced vibes with measurement, covering retrieval metrics that actually matter, how to build golden datasets that survive contact with reality, where LLM-as-judge helps and where it lies, and how to wire continuous evals into CI so regressions show up before customer complaints.'
    companyLogo: /img/vsd-sf-26/vsd-logos-color/ArizeAI.svg
    badge: SEARCH & RETRIEVAL
    badge_type: search
    badge_icon: search
    reverse: true
    videoId: mhhMjHq2yN8
    speakers:
      - name: Laurie Voss
        role: Head of Developer Relations
  - title: "Beyond the Single API Call: Agentic Video Intelligence"
    description: Video is a highly information-dense modality, and processing it at scale requires more than standard embed-store-retrieve pipelines. This talk explored how Twelve Labs' multimodal foundation models enable rich semantic understanding of video, from domain-specific search to structured metadata extraction. James Le walked through a real-world anomaly detection app built on Twelve Labs and Qdrant, and introduced Jockey, an agentic framework for multi-step video workflows.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/TwelveLabs.svg
    badge: SEARCH & RETRIEVAL
    badge_type: search
    badge_icon: search
    videoId: i8xZeKP6t6k
    speakers:
      - name: James Le
        role: Head of Dev Experience
  - title: The Long and the Short of AI Memory
    description: What is AI Memory today? Where does it live — markdown files, vectors, graphs, or somewhere else? And where will it be tomorrow? The answer matters because memory is quickly becoming the differentiator between agents that forget everything between sessions and agents that actually compound knowledge over time. In this talk, Dave shared examples of how short-term and long-term memory are used in production today, using OpenClaw as a hands-on example to illustrate the patterns and trade-offs.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Cognee.svg
    badge: AGENTS & MEMORY
    badge_type: agents
    badge_icon: brain
    reverse: true
    videoId: UKw6PUgsUTQ
    speakers:
      - name: Dave Nielsen
        role: Head of Developer Relations
  - title: The World is Becoming More Searchable
    description: The surface areas of search are only increasing as more and more data is captured from the physical and digital world. Embeddable systems unlock the ability to run local search across millions of devices, enabling AI at the edge without relying on round trips to the cloud. Dylan Couzon shared what Qdrant Edge is, how it's built, the use cases it opens up, and why it fundamentally changes the game for teams building on-device AI experiences.
    companyLogo: /img/qdrant-logo-red-black.svg
    badge: EDGE & ROBOTICS
    badge_type: edge
    badge_icon: database
    videoId: RRhbORtWeMI
    speakers:
      - name: Dylan Couzon
        role: Developer Relations Engineer
  - title: "When Latency Is the Product: Practical Patterns for On-Device GenAI"
    description: Agents are moving from the cloud to the edge — onto phones, PCs, and edge devices that perceive and act in real time. Alan Zhu shared practical patterns for building agentic AI on-device — how to run models and tap local context for retrieval and memory. He covered the NPU — a chip built for AI inference — and why sustained, private, low-latency AI workloads win on the edge, and how Qualcomm AI Hub lets you optimize any model and run it across devices.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/Qualcomm.svg
    badge: EDGE & ROBOTICS
    badge_type: edge
    badge_icon: database
    reverse: true
    videoId: FlAmmVSYbZY
    speakers:
      - name: Alan Zhu
        role: Senior Product Manager
  - title: Tell the Robot What You Want
    description: Sandhya Subramani demonstrated how to build robots that respond to natural language commands using an open-source agentic AI framework. Sensors and actuators became agent tools, translating intents into actions. A lightweight hybrid architecture handled low-latency control locally on edge devices while delegating complex reasoning to the cloud. She explored hybrid edge-cloud patterns for low-latency control and intelligent planning, demonstrated live with a working robot.
    companyLogo: /img/vsd-sf-26/vsd-logos-color/AWS.svg
    badge: EDGE & ROBOTICS
    badge_type: edge
    badge_icon: database
    videoId: lfW9CjAh7a0
    speakers:
      - name: Sandhya Subramani
        role: Sr. Dev Advocate, GenAI
sitemapExclude: true
---
