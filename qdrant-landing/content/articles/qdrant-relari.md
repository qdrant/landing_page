---
title: "Qdrant<>Relari: Best Practices for a Data-driven Approach to Building RAG systems"
short_description: "Improve RAG systems by combining Qdrant's storage with Relari's evaluation tools for better performance and user experience."
description: How does Top-K and Auto Prompt Optimization improve RAG systems?
social_preview_image: 
preview_dir: 
weight:
author: Thierry Damiba
author_link: https://x.com/thierrypdamiba
date: 2024-09-09T10:00:00+01:00
draft: false
keywords: evaluation, top k, prompt
---

# Qdrant<>Relari: Best Practices for a Data-driven Approach to Building RAG Systems

When you think of the typical RAG (Retrieval-Augmented Generation) application, it is usually difficult to pinpoint a metric for measurement. Consider an app like ChatGPT: How does OpenAI know if their app is functioning properly? More importantly, how can they measure its performance?


![How a RAG works](/articles_data/what-is-rag-in-ai/how-rag-works.jpg)

At first, you might think accuracy is the right metric. We could measure how often ChatGPT is accurate compared to other models or previous versions, and if it is more accurate, it must be performing better. This seems logical at first, but deeper examination reveals issues with this approach. 

What if someone asks ChatGPT a subjective question, such as "What’s the best movie ever made?" You could use IMDB ratings as a guide, but what if your target audience is horror enthusiasts? They wouldn't care that _Forrest Gump_ is highly rated.

You might instead approach the problem with a product mindset, focusing on how responses affect user churn. However, in some applications, such as medical assistants, you wouldn’t want an inaccurate app that simply doesn’t churn users.

The reality is that no single evaluation method can fully capture how to build and monitor a production-grade application. With LLMs (Large Language Models), there is often confusion around evaluation methods and tracking performance. Many applications face the challenge of determining how to measure performance.

We recently partnered with **Relari** for a webinar discussing the best methods for building and evaluating RAG systems. Relari is a toolkit designed for improving LLM applications using both intrinsic and extrinsic evaluation methods. Paired with **Qdrant**, which efficiently stores large amounts of data, Relari provides a comprehensive evaluation framework.

In this blog post, I’ll cover two evaluation methods you can use with Qdrant and Relari and highlight some use cases for each.

## Evaluation Metrics: Top-K and Auto Prompt Optimization

When evaluating a RAG system, optimizing how the model performs in real-world situations is crucial. Traditional metrics like precision, recall, and rank-aware methods are useful but can only go so far. Two impactful strategies for holistic evaluation are **Top-K Parameter Optimization** and **Auto Prompt Optimization**. These methods enhance the likelihood that your model performs optimally with real users.

### Top-K Parameter Optimization

The **Top-K** parameter determines how many top results are shown to a user. Imagine using a search engine that returns only one result each time. While that result may be good, most users prefer more options. However, too many results can overwhelm the user.

For example, in a product recommendation system, the Top-K setting will determine how many items a user sees—whether it's the top 3 best-sellers or 10 options. Adjusting this parameter ensures the user has enough relevant choices without feeling lost.

With Relari and Qdrant, experimenting with different Top-K values is simple. Here’s how you can optimize it:

1. Load and embed your data into a Qdrant collection using Langchain.
2. Embed it with FastEmbed and upsert your data into Qdrant.
3. Run experiments with different Top-K values to optimize retrieval performance.
4. Submit evaluations to Relari to analyze precision, recall, and rank-aware metrics (e.g., MAP, MRR, NDCG).
5. Use Relari’s dashboard to visualize insights and fine-tune Top-K for better user satisfaction.

### Auto Prompt Optimization

In conversational applications like chatbots, **Auto Prompt Optimization** improves the app’s ability to communicate. This technique adapts the chatbot's responses over time, learning from past interactions to adjust phrasing for better results.

For example, in a customer service chatbot, the phrasing of questions can significantly affect user satisfaction. Consider ordering in French vs. English in a Parisian cafe—the same information may be transmitted, but it will be received differently.

Auto Prompt Optimization continuously refines the chatbot’s responses to improve user interactions. Here's how you can implement it with Relari:

1. Set up your pipeline to track bot interactions.
2. Submit evaluations to Relari, which will suggest prompt adjustments based on performance metrics.
3. Use the Relari dashboard to review results and fine-tune your chatbot.

This iterative process ensures that your application continuously improves, providing more accurate and contextually relevant responses.

---

Combining **Relari** and **Qdrant** allows you to create a data-driven evaluation framework, improving your RAG system for optimal real-world performance.

Happy coding!
