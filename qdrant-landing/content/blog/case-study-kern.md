---
draft: false
title: "Kern AI & Qdrant: Precision AI Solutions for Finance and Insurance"
short_description: "Transforming customer service in finance and insurance with vector search-based retrieval."
description: "Revolutionizing customer service in finance and insurance by leveraging vector search for faster responses and improved operational efficiency."
preview_image: /blog/case-study-kern/preview.png
social_preview_image: /blog/case-study-kern/preview.png
date: 2024-08-28T00:02:00Z
author: Qdrant
featured: false
tags:
  - Kern
  - Vector Search
  - AI-Driven Insights
  - Johannes Hötter 
  - Data Analysis
  - Markel Insurance
---

![kern-case-study](/blog/case-study-kern/kern-case-study.png)

## About Kern AI

[Kern AI](https://kern.ai/) specializes in data-centric AI. Originally an AI consulting firm, the team led by Co-Founder and CEO Johannes Hötter quickly realized that developers spend 80% of their time reviewing data instead of focusing on model development. This inefficiency significantly reduces the speed of development and adoption of AI. To tackle this challenge, Kern AI developed a low-code platform that enables developers to quickly analyze their datasets and identify outliers using vector search. This innovation led to enhanced data accuracy and streamlined workflows for the rapid deployment of AI applications.

With the rise of ChatGPT, Kern AI expanded its platform to support the quick development of accurate and secure Generative AI by integrating large language models (LLMs) like GPT, tailoring solutions specifically for the financial services sector. Kern AI’s solution enhances the reliability of any LLM by modeling and integrating company data in a way LLMs can understand, offering a platform with leading data modeling capabilities.

## The Challenge

Kern AI has partnered with leading insurers to efficiently streamline the process of managing complex customer queries within customer service teams, reducing the time and effort required. Customer inquiries are often complex, and support teams spend significant time locating and interpreting relevant sections in insurance contracts. This process leads to delays in responses and can negatively impact customer satisfaction.

To tackle this, Kern AI developed an internal AI chatbot for first-level support teams. Their platform helps data science teams improve data foundations to expedite application production. By using embeddings to identify relevant data points and outliers, Kern AI ensures more efficient and accurate data handling. To avoid being restricted to a single embedding model, they experimented with various models, including sentiment embeddings, leading them to discover Qdrant.

![kern-user-interface](/blog/case-study-kern/kern-user-interface.png)

*Kern AI Refinery, is an open-source tool to scale, assess and maintain natural language data.*

The impact of their solution is evident in the case of [Markel Insurance SE](https://www.markel.com/), which reduced the average response times from five minutes to under 30 seconds per customer query. This change significantly enhanced customer experience and reduced the support team's workload. Johannes Hötter notes, "Our solution has revolutionized how first-level support operates in the insurance industry, drastically improving efficiency and customer satisfaction."

## The Solution

Kern AI discovered Qdrant and was impressed by its interactive Discord community, which highlighted the active support and continuous improvements of the platform. Qdrant was the first vector database the team used, and after testing other alternatives, they chose Qdrant for several reasons:

- **Multi-vector Storage**: This feature was crucial as it allowed the team to store and manage different search indexes. Given that no single embedding fits all use cases, this capability brought essential diversity to their embeddings, enabling more flexible and robust data handling.
- **Easy Setup**: Qdrant's straightforward setup process enabled Kern AI to quickly integrate and start utilizing the database without extensive overhead, which was critical for maintaining development momentum.
- **Open Source**: The open-source nature of Qdrant aligned with Kern AI's own product development philosophy. This allowed for greater customization and integration into their existing open-source projects.
- **Rapid Progress**: Qdrant's swift advancements and frequent updates ensured that Kern AI could rely on continuous improvements and cutting-edge features to keep their solutions competitive.
- **Multi-vector Search**: Allowed Kern AI to perform complex queries across different embeddings simultaneously, enhancing the depth and accuracy of their search results.
- **Hybrid Search/Filters**: Enabled the combination of traditional keyword searches with vector searches, allowing for more nuanced and precise data retrieval.

Kern AI uses Qdrant's open-source, on-premise solution for both their open-source project and their commercial end-to-end framework. This framework, focused on the financial and insurance markets, is similar to LangChain or LlamaIndex but tailored to the industry-specific needs.

![kern-data-retrieval](/blog/case-study-kern/kern-data-retrieval.png)

*Configuring data retrieval in Kern AI: Fine-tuning search inputs and metadata for optimized information extraction.*

## The Results

Kern AI's primary use case focuses on enhancing customer service with extreme precision. Leveraging Qdrant's advanced vector search capabilities, Kern AI consistently maintains hallucination rates under 1%. This exceptional accuracy allows them to build the most precise RAG (Retrieval-Augmented Generation) chatbot for financial services.

Key Achievements:

- **<1% Hallucination Rate**: Ensures the highest level of accuracy and reliability in their chatbot solutions for the financial and insurance sector.
- **Reduced Customer Service Response Times**: Using Kern AI's solution, Markel Insurance SE reduced response times from five minutes to under 30 seconds, significantly improving customer experience and operational efficiency.

By utilizing Qdrant, Kern AI effectively supports various use cases in financial services, such as:

- **Claims Management**: Streamlining the claims process by quickly identifying relevant data points.
- **Similarity Search**: Enhancing incident handling by finding similar cases to improve decision-making quality.

## Outlook

Kern AI plans to expand its use of Qdrant to support both brownfield and greenfield use cases across the financial and insurance industry.