---
title: Vector Space Day SF — Agenda
heading: AGENDA
logo: /img/qdrant-logo.svg
social_preview_image: /vsd/vsd-link-preview.jpg
hero_image: /img/vsd-sf-26/agenda/hero.png
badge_icons_path: static/img/vsd-sf-26/agenda/
description: Check-in begins at 8:30 AM.<br> First 200 to arrive get exclusive t-shirt.
date_info: "June 11th, 2026"
location: "The Midway, San Francisco"
url: /vector-space-day-sf-26/agenda/
build:
  render: always

slots:
  - type: talk
    title: Welcome
    speaker_name: Adam Chan
    speaker_role: "CEO, HackerSquad"
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/adam-chan.png
    duration: "5'"
    time: "9:30 AM"

  - type: talk
    title: We Do it the Hard Way
    description: "Qdrant started for search, and remains for search. From its roots as an open source side project to millions of downloads and thousands of community members worldwide, Qdrant has always sought to build the highest quality search engine, even when that meant doing things the hard way. Hear about our origins, the decisions that shaped the product, and our future trajectory from Qdrant Co-Founder and CEO, Andre Zayarni. Welcome to Vector Space Day."
    company_logo: /img/logo-white.png
    badge: QDRANT
    badge_type: qdrant
    badge_icon: presentation
    speaker_name: Andre Zayarni
    speaker_role: "CEO, Co-Founder"
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/andre-zayarni.png
    duration: "10'"
    time: "9:35 AM"

  - type: talk
    title: When Search Gets Serious
    description: "From a strong Rust core to composable retrieval primitives, Qdrant was built from the start for speed, accuracy, and flexibility. Today it supports thousands of projects and a growing number of enterprise businesses around the world, all from the same core engine. But the roadmap is far from finished. Where is Qdrant headed next, and what does it mean for the teams building on it? Come to this session to find out what's coming and why it matters."
    company_logo: /img/logo-white.png
    badge: QDRANT
    badge_type: qdrant
    badge_icon: presentation
    speaker_name: "Manuel Meyer & Neil Kanungo"
    speaker_role: "COO & Head of DevRel"
    duration: "15'"
    time: "9:45 AM"

  - type: talk
    title: Continual Learning Starts with Memory
    description: "Continual learning has long been treated as a training problem: new data, new gradients, new weights. But for production agents, the first unlock isn't retraining, it's memory. This talk reframes continual learning as a memory, retrieval, and state-management problem, showing how agents capture interactions, structure durable context, and improve decisions over time. Taranjeet shares patterns from building Mem0, including trade-offs of a memory layer on vector databases and what breaks at scale."
    company_logo: /img/vsd-sf-26/vsd-logos/Mem0.svg
    badge: "AGENTS & MEMORY"
    badge_type: agents
    badge_icon: brain
    speaker_name: Taranjeet Singh
    speaker_role: CEO
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/taranjeet-singh.png
    duration: "20'"
    time: "10:00 AM"

  - type: talk
    title: Using GraphRAG to Improve Enterprise Governance
    description: "Enterprise AI agents are only as trustworthy as the rules they operate within. This talk presents a practical blueprint for combining Qdrant's vector search with a Neo4j graph governance layer — building agents that retrieve fast and stay policy-compliant. Through a live demo, we show how the same query returns different results for different users based on governance, not just relevance. Attendees leave with a concrete architecture for enterprise AI agents that are smart, fast, and safe."
    company_logo: /img/vsd-sf-26/vsd-logos/Adobe.svg
    badge: "SEARCH & RETRIEVAL"
    badge_type: search
    badge_icon: search
    speaker_name: "Murthy Chandrapaty & Ankush Gumber"
    speaker_role: "Principal Engineer & Software Engineer"
    duration: "20'"
    time: "10:20 AM"

  - type: break
    title: Coffee Break
    duration: "15'"
    time: "10:40 AM"

  - type: talk
    title: "Literal Skill Issue: How Skills.md Might Be Holding Your Agents Back"
    description: "SKILLS.md files have saved us from the massive headache of MCP servers, but having a human manually write and update static markdown files just doesn't scale. This session will break down the very real limitations of hardcoding what your agents can do, from brittle maintenance loops to capability ceilings that cap what agents can learn on their own. Come find out why SKILLS.md is just our awkward transitional phase, and how we're going to replace it with dynamic, autonomous tooling that evolves as your agents do."
    company_logo: /img/vsd-sf-26/vsd-logos/Google-Deepmind.svg
    badge: "AGENTS & MEMORY"
    badge_type: agents
    badge_icon: brain
    speaker_name: Paige Bailey
    speaker_role: Developer Relations Lead
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/paige-bailey.png
    duration: "20'"
    time: "10:55 AM"

  - type: talk
    title: "Free Your Agent's Mind...with Context Graphs"
    description: "AI systems need more than intelligence; they need context that persists. Without it, even strong models misinterpret information, lose decision rationale, or repeat mistakes. Context Graphs address this: a living graph capturing not just what was retrieved, but how context led to actions through tool calls, constraints, and outcomes, stitched across entities and time. This talk shows how context graphs complement retrieval with multi-hop structured assembly and built-in provenance for enterprise-ready AI."
    company_logo: /img/vsd-sf-26/vsd-logos/Neo4j.svg
    badge: "AGENTS & MEMORY"
    badge_type: agents
    badge_icon: brain
    speaker_name: Stephen Chin
    speaker_role: VP of DevRel
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/stephen-chin.png
    duration: "20'"
    time: "11:15 AM"

  - type: talk
    title: Building the Infra Behind 20 Billion+ Vectors
    description: "This talk traces HubSpot's journey from a Helm-based Qdrant deployment, where cluster provisioning and scaling were manual, error-prone, multi-step processes, to a fully automated Kubernetes Operator built on HubSpot's internal kube-operators framework. Learn how the team designed the operator to handle rolling upgrades, automated scaling, and self-healing across a fleet managing 20 billion+ vectors, and the lessons learned running Qdrant at this scale in production."
    company_logo: /img/vsd-sf-26/vsd-logos/Hubspot.svg
    badge: "SEARCH & RETRIEVAL"
    badge_type: search
    badge_icon: search
    speaker_name: "Oleg Tereshin & Xin Liu"
    speaker_role: "Sr SWE II & Tech Lead"
    duration: "20'"
    time: "11:35 AM"

  - type: talk
    title: "Scaling to Billions: Lessons from Slack's Semantic Search Indexing"
    description: "Slack's semantic search indexes trillions of messages into vectors, kept searchable within seconds. This open discussion skips the \"perfect world\" diagrams and covers what it actually takes to run a vector pipeline at this scale: a Lambda architecture with a \"snowball\" caching system to avoid recomputing billions of embeddings weekly, greedy batching for a 3x inference speedup, and a candid look at why complex quantization methods failed in production."
    company_logo: /img/vsd-sf-26/vsd-logos/Slack.svg
    badge: "SEARCH & RETRIEVAL"
    badge_type: search
    badge_icon: search
    speaker_name: "Avirek Ghatia & Brian O'Grady"
    speaker_role: "Staff Software Engineer at Slack & Head of Solutions Architecture at Qdrant"
    duration: "20'"
    time: "11:55 AM"

  - type: break
    title: House Keeping
    duration: "5'"
    time: "12:15 PM"

  - type: break
    title: Lunch Break
    duration: "60'"
    time: "12:20 PM"

  - type: talk
    title: Building the DNA of Search
    description: "Qdrant was engineered from the ground up for performance, scale, and flexibility — and Oncotelic Therapeutics put it to the test. Indexing 28M PubMed abstracts to power AI-driven drug development, Oncotelic compressed concept-to-clinic to ~2 years — a fraction of the typical biotech timeline. In this conversation, Qdrant Engineering and Oncotelic walk through what matters most for search at scale: hybrid retrieval, MeSH-enriched metadata filtering, and the operational realities of running a vector database in production."
    company_logo: /img/vsd-sf-26/vsd-logos/qdrant+oncotelic.svg
    company_logo_offset:
      placement: top
      value: -8
    badge: QDRANT
    badge_type: qdrant
    badge_icon: presentation
    speaker_name: "Bastian Hofmann, Head of Product at Qdrant & Saran Saund, CBO at Oncotelic Therapeutics & Scott Myers, PM at Oncotelic Therapeutics"
    duration: "20'"
    time: "1:20 PM"

  - type: talk
    title: "Building Distributed, Enterprise-ready Agentic AI"
    description: "A high-level look at building intelligent, enterprise-grade AI agents using modern tools and infrastructure. This session explores how scalable systems can support context-aware reasoning, long-term memory, and real-time decision-making at production scale. We frame the key architectural patterns behind reliable AI agents in enterprise environments, from retrieval and orchestration to evaluation and observability. Learn how Vultr's global cloud infrastructure powers distributed AI workloads for companies shipping agents today."
    company_logo: /img/vsd-sf-26/vsd-logos/Vultr.svg
    badge: "AGENTS & MEMORY"
    badge_type: agents
    badge_icon: brain
    speaker_name: Gabriel Lebow
    speaker_role: Sr GPU Solutions Engineer
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/gabriel-lebow.png
    duration: "20'"
    time: "1:40 PM"

  - type: talk
    title: "The Document Harness: What Your AI Misses in the 90%"
    description: "An estimated 90% of enterprise data is unstructured, living in PDFs, PowerPoints, Word, and Excel files that power a majority of knowledge work. There's a huge opportunity to build autonomous agents that can understand, reason over, and edit massive quantities of documents. But real-world documents are too complex for even frontier models to understand. This session walks through core challenges and advances in document OCR and agent harnesses enabling modern document workflow automation."
    company_logo: /img/vsd-sf-26/vsd-logos/LlamaIndex-white.svg
    badge: "AGENTS & MEMORY"
    badge_type: agents
    badge_icon: brain
    speaker_name: Preston Carlson
    speaker_role: AI Engineer
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/preston-carlson.png
    duration: "20'"
    time: "2:00 PM"

  - type: talk
    title: "Stop Vibe Shipping: Evaluate Your Retrieval"
    description: "\"Looks good to me\" is not an evaluation strategy. Yet most teams ship retrieval systems that way: tweak the chunking, run a few demo queries, call it done. This talk replaces vibes with measurement. We'll cover retrieval metrics that actually matter, how to build golden datasets that survive contact with reality, where LLM-as-judge helps and where it lies, and how to wire continuous evals into CI so regressions show up before customer complaints."
    company_logo: /img/vsd-sf-26/vsd-logos/ArizeAI.svg
    badge: "SEARCH & RETRIEVAL"
    badge_type: search
    badge_icon: search
    speaker_name: Laurie Voss
    speaker_role: Head of DevRel
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/laurie-voss.png
    duration: "20'"
    time: "2:20 PM"

  - type: talk
    title: "Beyond the Single API Call: Agentic Video Intelligence"
    description: "Video is a highly information-dense modality, and processing it at scale requires more than standard embed-store-retrieve pipelines. This talk explores how Twelve Labs' multimodal foundation models enable rich semantic understanding of video, from domain-specific search to structured metadata extraction. We'll walk through a real-world anomaly detection app built on Twelve Labs and Qdrant, and introduce Jockey, an agentic framework for multi-step video workflows."
    company_logo: /img/vsd-sf-26/vsd-logos/TwelveLabs.svg
    badge: "SEARCH & RETRIEVAL"
    badge_type: search
    badge_icon: search
    speaker_name: James Le
    speaker_role: Head of Dev Experience
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/james-le.png
    duration: "20'"
    time: "2:40 PM"

  - type: break
    title: Coffee Break
    duration: "15'"
    time: "3:00 PM"

  - type: talk
    title: The Long and the Short of AI Memory
    description: "What is AI Memory today? Where does it live: markdown files, vectors, graphs, or somewhere else? And where will it be tomorrow? The answer matters because memory is quickly becoming the differentiator between agents that forget everything between sessions and agents that actually compound knowledge over time. In this talk, Dave will share examples of how short-term and long-term memory are used in production today, using OpenClaw as a hands-on example to illustrate the patterns and trade-offs."
    company_logo: /img/vsd-sf-26/vsd-logos/Cognee.svg
    badge: "AGENTS & MEMORY"
    badge_type: agents
    badge_icon: brain
    speaker_name: Dave Nielsen
    speaker_role: Head of DevRel
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/dave-nielsen.png
    duration: "20'"
    time: "3:15 PM"

  - type: talk
    title: The World is Becoming More Searchable
    description: "The surface areas of search are only increasing as more and more data is captured from the physical and digital world. Embeddable systems unlock the ability to run local search across millions of devices, enabling AI at the edge without relying on round trips to the cloud. Come to this session to hear about Qdrant Edge: what it is, how it's built, the use cases it opens up, and why we think it fundamentally changes the game for teams building on-device AI experiences."
    company_logo: /img/logo-white.png
    badge: "EDGE & ROBOTICS"
    badge_type: edge
    badge_icon: database
    speaker_name: Dylan Couzon
    speaker_role: DevRel Engineer
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/dylan-couzon.png
    duration: "20'"
    time: "3:35 PM"

  - type: talk
    title: "When Latency Is the Product: Practical Patterns for On-Device GenAI"
    description: "Agents are moving from the cloud to the edge - onto phones, PCs, and edge devices that perceive and act in real time. I'll share practical patterns for building agentic AI on-device: how to run models and tap local context for retrieval and memory. This runs on the NPU - a chip built for AI inference. That's why sustained, private, low-latency AI workloads win on the edge. And Qualcomm AI Hub is how you ship it: optimize any model and run it across devices."
    company_logo: /img/vsd-sf-26/vsd-logos/Qualcomm.svg
    badge: "EDGE & ROBOTICS"
    badge_type: edge
    badge_icon: database
    speaker_name: Alan Zhu
    speaker_role: DevRel Engineer
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/alan-zhu.png
    duration: "20'"
    time: "3:55 PM"

  - type: talk
    title: Tell the Robot What You Want
    description: "Learn how to build robots that respond to natural language commands using an open-source agentic AI framework. Sensors and actuators become agent tools, translating intents into actions. A lightweight hybrid architecture handles low-latency control locally on edge devices while delegating complex reasoning to the cloud. Explore hybrid edge-cloud patterns for low-latency control and intelligent planning, demonstrated live with a working robot."
    company_logo: /img/vsd-sf-26/vsd-logos/AWS.svg
    badge: "EDGE & ROBOTICS"
    badge_type: edge
    badge_icon: database
    speaker_name: Sandhya Subramani
    speaker_role: "Sr. Dev Advocate, GenAI"
    speaker_avatar: /img/vsd-sf-26/agenda/speakers/sandhya-subramani.png
    duration: "20'"
    time: "4:15 PM"

  - type: break
    title: "Closing Remarks & Hackathon Winners"
    duration: "25'"
    time: "4:35 PM"

  - type: break
    title: "Happy Hour 🎉"
    time: "5:00 PM"
---
