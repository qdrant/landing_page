---
draft: false
title: "How My AskAI Built Self-Improving Support Agents"
short_description: "My AskAI scaled reliable support agents on Qdrant Cloud."
description: "Discover how My AskAI built a self-improving customer support agent platform with Qdrant Cloud, enabling scalable retrieval, hybrid search iteration, and faster operations."
preview_image: /blog/case-study-my-askai/social_preview_partnership-my-askai.png
social_preview_image: /blog/case-study-my-askai/social_preview_partnership-my-askai.png
date: 2026-02-25
author: "Daniel Azoulai"
featured: true

tags:
- My AskAI
- vector search
- customer support
- rag
- hybrid search
- llm agents
- case study
---

![My AskAI overview](/blog/case-study-my-askai/my-askai-bento-box.png)

[My AskAI](https://myaskai.com) built a managed platform for AI customer support agents that plug directly into existing helpdesk tools like [Intercom](https://myaskai.com/ai-agent-integration/intercom) and [Zendesk](https://myaskai.com/ai-agent-integration/zendesk-tickets). The goal was to make AI behave like a reliable coworker, not a brittle chatbot. In production, My AskAI's agents are designed to resolve a large portion of inbound support requests automatically, then hand over to a human when the agent cannot answer confidently. My AskAI positions this as [deflecting around 75 percent of support requests](https://myaskai.com/blog/my-askai-edel-optics-case-study-2026) and sustaining a resolution rate in the low to mid 70s, depending on the time window and workload mix.

As My AskAI narrowed its focus, the team discovered that customer support was not just a use case; it was **the use case**. Support data is messy, unstructured, and constantly changing. Success required strong retrieval, predictable latency, and an infrastructure layer that could scale without forcing the team to become full-time database operators. That combination ultimately led My AskAI to standardize on [Qdrant Cloud](http://cloud.qdrant.io) as the vector search backbone of its platform.

## Customer Support Created Unique Retrieval Requirements

My AskAI started as a broader "chat with your data" product. Users could connect sources like Google Drive, PDFs, and web content, then ask questions in natural language. As usage grew, My AskAI looked for the accounts that were most engaged and willing to pay for the product's value.

That analysis showed a clear pattern.

"When we double clicked on our users, the stickiest users and the ones generating the most revenue, we saw that pretty much all of them were using it in a customer support use case," explains Alex Rainey, co-founder of My AskAI. "So we thought, there's something interesting happening here. Let's focus on this niche."

These teams cared about accuracy, speed, and guardrails because every answer represented their brand. In practice, that meant My AskAI needed to index and retrieve from large sets of unstructured documents and historical support interactions. Keyword search alone was not enough. Customers often described issues differently than the help article headings, and support tickets were full of partial context and inconsistent phrasing. My AskAI needed semantic retrieval that could match intent, not just exact terms.

## Embeddings and RAG Made the Product Viable

My AskAI's earliest attempts at working with customer data hit a wall quickly. Before embedding models were widely available, the team tried fine-tuning early language models on customer support tickets to generate answers to new questions.

>"We tried to do some fine-tuning, which was obviously the wrong way to approach the problem. Fine-tuning on customer support tickets to answer new questions just didn't make sense. It was very early days."


Everything changed when OpenAI released its embedding model. Instead of hoping users would guess the right keyword, My AskAI could retrieve relevant passages by semantic similarity and pass them into an LLM as context. This became the basis of My AskAI's customer support workflow.

>"That was a transformational moment for us. Now we could have hundreds of help articles ingested in the system, and a user can ask a question, and we can answer that really specifically and cheaply and quickly."


Over time, the team also learned that semantic search was strong but not universally sufficient, especially when tickets contained product names, error codes, or specific identifiers that benefit from lexical matching. That realization led My AskAI toward experimentation with [hybrid search](https://qdrant.tech/documentation/concepts/hybrid-queries/) as a way to blend semantic similarity with keyword signals, while keeping the operational footprint small.

## Why My AskAI Chose Qdrant: Scalability, Integrations, and Developer Experience

As My AskAI's usage scaled, the team evaluated vector search choices through a longer-term lens. Switching vector search infrastructure later can be painful, so the decision had to hold up as the product grew 10x.

My AskAI ultimately selected Qdrant for three reasons.

First, cost and scalability needed to be predictable as workloads increased. The team modeled their projected growth and found that their previous provider's pricing would become prohibitively expensive at scale.

Second, the platform needed to integrate smoothly into an ecosystem of connectors and support tools. My AskAI was building integrations with third-party connector tools for sources like Google Drive, Notion, Intercom, and Zendesk, and Qdrant was natively supported as a plugin in that ecosystem.

Third, the developer experience had to be straightforward so the team could scale and manage instances without constant engineering effort.

The team also leaned on community signal to validate the decision. "A lot of developers were building in public, speaking about exactly what infra they were using under the hood. I just kept seeing Qdrant coming up. Engineers at our third-party connector tool spoke extremely highly of Qdrant for scalability and latency."

The migration itself was smooth, in part because My AskAI used the transition to build a V2 of their product focused purely on customer support. That gave them a clean start with Qdrant and a modernized stack, rather than requiring a large-scale data migration.

## What Changed After Migrating

Once on Qdrant Cloud, My AskAI leaned into a workflow where scaling and day-to-day operations were simple. The team relied on the dashboard for performance visibility and managed scaling with a few UI actions, while still using the API for collection setup and configuration when needed.

>"Scaling horizontally or vertically is like two clicks away. It's not really a concern we have. If we notice anything, we get the alert, and we can jump in and scale things up or down as we need to." 

The ideal infrastructure, as Alex puts it, is the kind you don't have to think about. "I didn't want to have to think about it."

My AskAI also began running customer-specific proofs of concept for [hybrid search](https://qdrant.tech/documentation/concepts/hybrid-queries/), aiming to find the right blend that improved retrieval in the edge cases where semantic-only results were not enough. Before Qdrant, managing hybrid search had required spinning up separate infrastructure on AWS and handling reranking externally. With Qdrant, the team could enable hybrid search per collection and iterate without managing additional systems.

>"Just being able to turn on hybrid search is super useful. It removes that headache and pushes management of hybrid search down to the vendor."

Just as importantly, My AskAI highlighted the hands-on, highly technical support experience as part of why the platform felt dependable for production workloads.

"Qdrant support is always phenomenal. Super fast, super technical, very hands on. We've always had great experiences whenever we needed them."

## What's Next: Self-Learning Support Agents Powered by Clustered Knowledge

My AskAI's most important next step is self-learning.

When an AI agent escalates a conversation to a human, My AskAI now monitors what the human does next and treats it as a [learning opportunity](https://myaskai.com/features/self-learning). The system compares the human response to what the AI would have done, identifies gaps, and stores new learnings. Those learnings are then clustered and compiled into what My AskAI calls a self-learning article, a continuously updated body of knowledge derived from real support outcomes.

"Most of the time it's because companies just don't keep their help articles super up to date. It's not easy to do that," Alex explains. "These learnings get stored, get clustered, and then we push those into what we call a self-learning article, a collection of new knowledge that doesn't exist in public help articles but exists in the human agent replies."

Those generated articles are re-indexed in Qdrant so the next time the question appears, the agent can answer correctly, sometimes as soon as the next day.

"The next day the question can be answered, because the human agent gave us the answer and that knowledge has now been indexed."