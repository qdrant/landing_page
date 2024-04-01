---
draft: false
title: "Introducing FastLLM: Qdrant’s Revolutionary LLM"
short_description: The most powerful LLM known to human...or LLM. 
description: Lightweight and open-source. Custom made for RAG and completely integrated with Qdrant.
preview_image: /blog/fastllm-announcement/fastllm.png
date: 2024-04-01T00:00:00Z
author: David Myriel
featured: false
weight: 0 
tags:
  - Qdrant
  - FastEmbed
  - LLM
  - Vector Database
---

Today, we're happy to announce that **FastLLM (FLLM)**, our lightweight Language Model tailored specifically for Retrieval Augmented Generation (RAG) use cases, has officially entered Early Access! 

Developed to seamlessly integrate with Qdrant, **FastLLM** represents a significant leap forward in AI-driven content generation. Up to this point, LLM’s could only handle up to a few million tokens. 

**As of today, FLLM offers a context window of 1 billion tokens.**

However, what sets FastLLM apart is its optimized architecture, making it the ideal choice for RAG applications. With minimal effort, you can combine FastLLM and Qdrant to launch applications that process vast amounts of data. Leveraging the power of Qdrant's scalability features, FastLLM promises to revolutionize how enterprise AI applications generate and retrieve content at massive scale.

> *“First we introduced [FastEmbed](https://github.com/qdrant/fastembed*). But then we thought - why stop there? Embedding is useful and all, but our users should do everything from within the Qdrant ecosystem. FastLLM is just the natural progression towards a large-scale consolidation of AI tools.” Andre Zayarni, President & CEO, Qdrant*
> 

## Going Big: Quality & Quantity

Very soon, an LLM will come out with a context window so wide, it will completely eliminate any value a measly vector database can add. 

***We know this. That’s why we trained our own LLM to obliterate the competition. Also, in case vector databases go under, at least we'll have an LLM left!*** 

As soon as we entered Series A, we knew it was time to ramp up our training efforts. FLLM was trained on 300,000 NVIDIA H100s connected by 5Tbps Infiniband. It took weeks to fully train the model, but our unified efforts produced the most powerful LLM known to human…..or LLM.

We don’t see how any other company can compete with FastLLM. Most of our competitors will soon be burning through graphics cards trying to get to the next best thing. But it is too late. By this time next year, we will have left them in the dust. 

> ***“Everyone has an LLM, so why shouldn’t we? Let’s face it - the more products and features you offer, the more they will sign up. Sure, this is a major pivot…but life is all about being bold.”***  *David Myriel, Director of Product Education, Qdrant*
> 

## Extreme Performance

Qdrant’s R&D is proud to stand behind the most dramatic benchmark results. Across a range of standard benchmarks, FLLM surpasses every single model in existence. In the [Needle In A Haystack](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) (NIAH) test, FLLM found the embedded text with 100% accuracy, always within blocks containing 1 billion tokens. We actually believe FLLM can handle more than a trillion tokens, but it’s quite possible that it is hiding its true capabilities.

FastLLM has a fine-grained mixture-of-experts architecture and a whopping 1 trillion total parameters. As developers and researchers delve into the possibilities unlocked by this new model, they will uncover new applications, refine existing solutions, and perhaps even stumble upon unforeseen breakthroughs. As of now, we're not exactly sure what problem FLLM is solving, but hey, it's got a lot of parameters!

> *Our customers ask us “What can I do with an LLM this extreme?” I don’t know, but it can’t hurt to build another RAG chatbot.” Kacper Lukawski, Senior Developer Advocate, Qdrant*
> 

## Get Started!

Don't miss out on this opportunity to be at the forefront of AI innovation. Join FastLLM's Early Access program now and embark on a journey towards AI-powered excellence!

Stay tuned for more updates and exciting developments as we continue to push the boundaries of what's possible with AI-driven content generation.

Happy Generating! 🚀

[Sign Up for Early Access](https://qdrant.to/cloud)