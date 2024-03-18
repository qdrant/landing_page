---
title: "Grok Chatbot: Accessing Real-Time Knowledge via Qdrant"
draft: false
slug: qdrant-grok
short_description: xAI just released Grok in open source, suggesting their vector database of choice.
description: xAI just released Grok in open source, suggesting their vector database of choice.
preview_image: /blog/qdrant-grok/qdrant-grok.png 
Date: 2024-03-18T13:22:31+01:00
author: David Myriel
featured: false 
tags: 
  - grok
  - xai
  - qdrant
  - retrieval augmented generation
weight: 0
---

[Grok-1](https://x.ai/blog/grok-os) is a powerful Large Language Model (LLM) trained from scratch by xAI. It is currently used to power the [Grok Chatbot](https://grok.x.ai/), an early access alternative to ChatGPT.

xAI kept their promise and open-sourced the model yesterday. We are more than happy to see Qdrant among the two repositories forked under xAI's GitHub organization. Having kept a close watch on our documentation's traffic, we knew something was going on - but it's still exciting to see our product making a huge difference.

![qdrant-grok-repo](/blog/qdrant-grok/qdrant-grok-repo.png)

## Grok's Value Proposition

Grok helps users gather and analyze data, so that they can make the most informed decisions as they use the X platform. As a chatbot, Grok takes user prompts and generates innovative responses, all based on fresh information.

> Grok's edge over alternatives is that it can build on real-time knowledge of the world and events. Specifically, it draws on data from X and web searches to quickly find and apply the latest data. 

Let's ask Grok about the open source announcement yesterday:

![qdrant-grok-question](/blog/qdrant-grok/qdrant-grok-question.jpg)

Even though it was trained a while ago, Grok still knows that the model was just open sourced. **It gathers info in the same way as us - by searching for relevant but missing information.** 

> On top of being a chatbot, Grok untangles drama going on in discussions on X. As you use X, Grok suggests highly relevant topics that are present in discussions worldwide.

## Using Qdrant to add Real Time to AI 

LLMs shouldn't operate in a vacuum. They are best used within [compound systems](https://bair.berkeley.edu/blog/2024/02/18/compound-ai-systems/) that enable efficient, scalable and cost-effective uses of artificial intelligence. In the case of Grok, a vector database like Qdrant is best suited to provide real-time memory. It is fast, efficient at retrieval of semantically relevant info and very affordable. 

This is something we call Retrieval Augmented Generation (RAG). It is a method of empowering AI applications with additional memory that can be continuously added in real-time. Grok's chatbot is currently one of the most prominent use cases of RAG. However, [we see RAG becoming a mainstay](https://qdrant.tech/articles/rag-is-dead/) in the AI/ML space.

For massive businesses like X, RAG can have enormous benefits in terms of efficiency, scale and cost. On their own, even the most powerful LLMs can only [achieve 60-80% accuracy](https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf). 

> "*According to our estimations, vector search queries are at least 100 million times cheaper than queries made by LLMs.*" Andrey Vasnetsov, CTO and cofounder of Qdrant.

## RAG is Only the Beginning

Chatbots are fairly simple implementations of RAG and vector databases. 
The addition of different optimization features turns Qdrant into a full-fledged vector search platform:

- Businesses like X, which rely on semantic meaning and recommendations can get maximum performance from [Binary Quantization](https://qdrant.tech/articles/binary-quantization-openai/).
- Global corporations, which handle sensitive data can leverage [Custom Sharding and Multitenancy](https://qdrant.tech/articles/multitenancy/) to segment users within the same Qdrant instance.
- E-commerce platforms can leverage different types of vector search, to allow for [low or high context](https://qdrant.tech/articles/discovery-search/) search, [high quality recommendations](https://qdrant.tech/articles/new-recommendation-api/). 
- Qdrant even supports [regular keyword search](https://qdrant.tech/articles/sparse-vectors/) for more streamlined scenarios.

## Next Steps

- Qdrant is open source and you can [quickstart locally](https://qdrant.tech/documentation/quick-start/), [install it via Docker](https://qdrant.tech/documentation/quick-start/), [or to Kubernetes](https://github.com/qdrant/qdrant-helm/). 

- We also offer [a free-tier of Qdrant Cloud](https://cloud.qdrant.io/) for prototyping and testing.

- For best integration with LangChain, read the [official LangChain documentation](https://python.langchain.com/docs/integrations/vectorstores/qdrant/). 

- For all other cases, [Qdrant documentation](https://qdrant.tech/documentation/integrations/langchain/) is the best place to get there.

> We offer additional support tailored to your business needs. [Contact us](https://qdrant.to/contact-us) to learn more about implementation strategies and integrations that suit your company.