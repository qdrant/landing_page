---
draft: false
title: "How Sapu Indexed 28 Million PubMed Abstracts to Accelerate Cancer Research with Qdrant"
short_description: "Sapu indexed 28M PubMed abstracts into Qdrant to power AI-driven biomedical research for cancer drug development."
description: "Discover how Sapu, a nanomedicine biotech company, indexed 28 million PubMed abstracts into a single Qdrant collection, enabling researchers to query the entire biomedical literature corpus and accelerating hard-to-treat cancer therapy development."
preview_image: /blog/case-study-sapu/sapu-preview.png
social_preview_image: /blog/case-study-sapu/sapu-preview.png
date: 2026-05-12
author: "Daniel Azoulai"
featured: false

tags:
- Sapu
- vector search
- biomedical research
- PubMed
- hybrid search
- Qdrant Cloud Premium
- case study
partition: case-studies
---

![Summary](/blog/case-study-sapu/sapu-bento-box.png)

<a href="https://www.sapubio.com/" target="_blank">Sapu</a> is an early-stage biopharmaceutical company developing treatments for hard-to-treat cancers. From its San Diego facility, the team is pioneering a nanomedicine pipeline that takes existing FDA-approved drugs and re-engineers them at the nanoscale, making them smaller, more effective, and less toxic. Building on already-approved compounds gives Sapu a stronger and faster path to therapeutic success in an industry where most candidates never reach patients.

Behind the lab work sits an AI tooling suite that does the reading, searching, and synthesis that would otherwise take researchers thousands of hours. Sapu's internal AI platform supports research paper authorship, references standard operating procedures, and lets the team query its document corpus with the precision biotech R\&D requires. As the company grew, so did the volume of documents, the variety of use cases, and the demands placed on the underlying retrieval infrastructure.

## Why Early Vector Search Options Didn't Work

Sapu started building its AI platform shortly after ChatGPT became available, beginning with a command-line prototype and graduating to a full user interface as the system matured. Documents were initially stored as text snippets, with no vector retrieval at all. As use cases expanded into research paper ingestion and SOP-aware chatbots, the team needed a vector search engine that worked.

Scott Myers, who leads much of the AI development at Sapu, evaluated several options. "I just looked up vector search solutions and tried a couple of others. I couldn't get them to work at first. Qdrant happened to work really well right out of the box, and so we stuck with it."

The team initially ran Qdrant self-hosted on Docker. That worked well enough to get the platform off the ground, but as Sapu scaled the variety and volume of its workloads, operating its own cluster became a liability. The setup wasn't optimized, stability issues started appearing, and the team didn't have Qdrant infrastructure expertise in-house to debug them. The cost of self-hosting was no longer just dollars: it was reliability and engineering attention pulled away from the actual research mission.

## Why Sapu Moved to Qdrant Cloud Premium

Sapu signed a [Qdrant Cloud](https://qdrant.tech/documentation/cloud-premium/) Premium partnership to get reliability without dedicating engineering bandwidth to managing infrastructure. The shift solved the stability problems immediately.

>"So far it's paid dividends. We haven't run into the issues we had previously." — Scott Myers, Product Manager, Sapu

Compliance was a second deciding factor. Sapu plans to license its AI platform to other biotech companies, so the underlying infrastructure has to carry credible certifications. SOC 2 compliance lets Sapu tell prospective licensees that the platform their data sits on meets enterprise security standards.

Support quality also stood out. Myers described being surprised when a support engineer followed up on a ticket hours after the initial response with additional findings. "That does not happen with a larger company. Once they respond to a ticket, they move on. They don't keep looking at it."

The continuous pace of new capabilities reinforced the decision. Recent releases like audit logging and Multi-Availability Zone deployment for Premium customers landed during Sapu's tenure on the platform, giving the team enterprise features without a migration or upgrade project.

## Indexing 28 million PubMed Abstracts in a Single Collection

The headline outcome is scale. Sapu's team indexed every abstract in the PubMed database, 28 million records, into a single Qdrant collection. Before this, researchers had to upload subsets of abstracts whenever they wanted to query. Now the entire corpus of biomedical literature is searchable in place. Researchers can query a small filtered slice using metadata, or run vector search across all 28 million abstracts at once.

>"We indexed every single abstract from the PubMed database into a Qdrant vector database. That's 28 million abstracts. Now we can query across all of them, and that's something that just was not possible a few years ago." — Scott Myers, Product Manager, Sapu

The downstream impact has been concrete. Sapu has published seven peer-reviewed research papers that used the AI tooling in the underlying research work. Editors reviewing the methods sections have asked specifically about the AI components. Internal adoption is broad: the CEO uses the AI tools daily, and the San Diego research staff relies on them for SOP lookup, document research, and paper drafting.

The platform has also opened external opportunities. Sapu recently announced a partnership with Techforce, a robotics company, to extend the AI suite into robotic workflows for the lab.

## Architecture: Hybrid Retrieval and Per-document Parallel Querying

Sapu's pipeline runs OpenAI's text-embedding-3-large model at 3,072 dimensions, with LangChain orchestrating the ingestion path that writes to Qdrant Cloud. The team uses Qdrant for both vector search and pure metadata-filtered retrieval. Some queries use semantic similarity; others rely entirely on payload filtering over indexed metadata like tags, departments, and dates, with no vector component at all.

Department-level access control combines a separate SQL database (which maps users to departments) with Qdrant payload filters that restrict each query to documents the user is authorized to see. Authentication is handled through NFT-based wallet login.

The team also developed a novel querying pattern that goes beyond standard vector search. For some research workflows, retrieving the most relevant snippets across a corpus is the wrong default. Instead, Sapu's platform can split a corpus of, say, 1,000 documents into 1,000 independent queries, each scoped to a single document, and run them in parallel. This produces 1,000 independent responses rather than one synthesized answer. For literature review and abstract triage, that pattern surfaces context that single-shot retrieval misses.

Documents themselves are stored in three forms today: snippets, full document content, and page images. Sapu is migrating the large content payloads to S3, with Qdrant retaining only a URL pointer, which will reduce collection size and improve query performance.

## What's Next: Edge Deployments, Robotics, and Inference at the Cloud layer

Sapu's near-term roadmap centers on extending the AI suite to robotics. The Techforce partnership will introduce physical robots into the lab, both for task automation and for compliance enforcement, ensuring procedures are followed and capturing voice and hands-free interactions when researchers can't operate a keyboard in a fully gowned environment.

For closed lab systems with no internet access, the team is evaluating Qdrant Edge for on-device vector search. Air-gapped deployment is a hard requirement for facilities where data leakage is not an acceptable risk.

Sapu is also exploring [Qdrant Cloud Inference](https://qdrant.tech/cloud-inference/) to simplify its embedding pipeline and explore lower-dimensional embedding models that could reduce storage and query costs without compromising relevance.

## From Prototype to Production-Scale Biomedical Retrieval

What started as a command-line prototype shortly after ChatGPT's release has become a production AI platform that touches every part of Sapu's research workflow, from drug development paper drafting to SOP-aware chatbots to a 28 million abstract literature index. Qdrant moved from a piece of evaluation software that "just worked" to the retrieval foundation under research that is now publishing in peer-reviewed journals and being licensed to external partners. For a biotech company building therapies for hard-to-treat cancers, the math is simple: the faster researchers can find what they need across the world's biomedical literature, the faster the next therapy reaches patients.  