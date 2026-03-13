---
title: "Convolve 4.0 - IIT Hackathon Winners"
draft: false
slug: iit-hack-winners
short_description: "Discover the winners of Qdrant’s Convolve 4.0 - IIT Hackathon, where developers built innovative vector search applications using Multi-Agent Intelligence Systems - from e-commerce to healthcare, trends, and more."
preview_image: blog/iit-hack-2026/convolve.png
social_preview_image: blog/iit-hack-2026/convolve.png
date: 2026-02-27
author: Manas Chopra
featured: true
tags:
  - news
  - blog
---
Builders from across India came together for Convolve 4.0 - A Pan IIT AI/ML Hackathon, hosted by IIT Madras, to develop impactful, real-world AI systems across critical domains. The hackathon focused on multi-agent systems, retrieval-augmented generation (RAG), vector memory, multimodal intelligence, and production-ready AI pipelines.

Participants built solutions spanning healthcare and medical reasoning, disaster response and crisis intelligence, climate and risk monitoring, legal-tech and governance systems, misinformation detection, public safety, infrastructure auditing, education, and civic-tech platforms. Many projects emphasized persistent AI memory, domain-aware guardrails, spatial intelligence, and collaborative agent architectures designed for long-term, scalable deployment.

With a prize pool of around ₹2 lakh, Convolve 4.0 highlighted how advanced AI/ML systems—powered by intelligent retrieval, multimodal data, and agentic workflows - can address complex societal and national-scale challenges.

👉 Full hackathon details: [Hackathon page](https://unstop.com/hackathons/convolve-40-a-pan-iit-aiml-hackathon-open-to-all-iit-guwahati-1609886)

Let’s dive into the top projects and what we liked about each of them.

---

## 🏆 Overall Winners

### 🥇 1st Place: Masthishq (Krishna Koushik Padigala)

**Total Prize: `₹1,25,000 Cash and Qdrant Goodie box`**

**What it is:** Masthishq is a multimodal AI agent that acts as a cognitive prothesis. By leveraging Computer Vision (FaceNet, YOLO), Vector search (Qdrant), and Large Language Models (Llama 3 via Groq), the system provides real-time, context-aware assistance. It identifies people and objects in the patient's environment, retrieves associated long-term memories ("This is Jill, your sister"), and engages in empathetic, looped conversations to soothe the patient. The system includes a Patient App featuring an animated avatar for accessibility and a Caregiver Dashboard for secure memory management.

Repo: [Masthishq Repo](https://github.com/krishk2/Masthishq/)

### 📸 Project Showcase

![Masthishq Patient Interface](/blog/iit-hack-2026/ss-1.png)

---

### 🥈 2nd Place: SignalWeave - A Temporal AI Memory System for Emerging Trendsk (T Mohamed Yaser)

**Total Prize: `₹75,000 Cash and Qdrant Goodie box`**

**What it is:** SignalWeave is a temporal AI memory system for detecting emerging trends from weak signals - small, scattered mentions that typically go unnoticed. It continuously ingests content, converts each signal into vector embeddings, clusters related signals, and accumulates them over time. Instead of treating data as snapshots, it promotes trends only after they gather enough evidence, enabling early detection through temporal merging and growth scoring.

Qdrant serves as the system’s persistent vector memory layer. It stores signal embeddings and evolving cluster centroids, enables fast cosine similarity search for merging and retrieval, and preserves historical context across runs, making temporal trend accumulation possible.

**Demo App:** [SignalWeave](https://signalweave.vercel.app/)

**Repo:** [SignalWeave Repo](https://github.com/Yaser-123/signalweave)

### 📸 Project Showcase

![SignalWeave Trend Detection](/blog/iit-hack-2026/ss-2.png)

---

### 🥉 3rd Place: Demeter (Debarghya Das)

**Total Prize: `₹50,000 Cash and Qdrant Goodie box`**

**What it is:** Demeter is an autonomous multi-agent system for hydroponic farm management that creates a digital twin of the growing environment and makes expert-level decisions without constant human supervision. It ingests multimodal data - crop images and sensor readings (pH, EC, temperature, humidity) - and fuses them into a unified vector representation called a Farm Memory Unit (FMU), which is stored in Qdrant for long-term memory and retrieval.

Qdrant acts as the system’s persistent cognitive backbone, storing fused plant states, agronomic knowledge for RAG, and plant biography histories. Specialized agents (Water, Atmospheric, Doctor, Supervisor) retrieve historical cases, similar environmental states, and scientific references from Qdrant to make grounded decisions. A Contextual Bandit then selects the safest optimal strategy, while feedback from a Judge agent updates Qdrant with outcome data - allowing Demeter to continuously learn which interventions work best over time.

**Repo:** [Demeter Repo](https://github.com/Deb044/Demeter)

### 📸 Project Showcase

![Demeter Dashboard](/blog/iit-hack-2026/ss-3.png)

---

## Why These Projects Matter

These winners stand out because they treat memory and retrieval as foundational infrastructure - not add-ons. Instead of one-off AI outputs, they built systems that remember, reason over history, and improve over time.
- Masthishq uses multimodal vector memory to reconnect dementia patients with people and past context.
- SignalWeave accumulates weak signals over time, using persistent clustering and hybrid search to detect emerging trends early.
- Demeter stores multimodal farm states and historical interventions to power safe, learning-driven hydroponic automation.

Across all three, Qdrant acts as the long-term memory layer, enabling grounded decisions, reuse of past knowledge, and continuous improvement.

As always, many strong projects competed, but these winners highlight what’s possible when AI systems are designed to truly remember.

## What’s Next

A huge thank you to everyone who built, mentored, or joined. You’ve proven that with Qdrant, the possibilities are limitless.

👉 Join the community: [qdrant.tech/community](https://qdrant.tech/community)
