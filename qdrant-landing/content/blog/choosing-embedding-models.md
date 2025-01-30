---
title: "Using Sentrev to Find the Right Embedding Model"
draft: false
short_description: Simplify the evaluation of embedding models.
description: Simplify the evaluation of embedding models with a handy Python library.
preview_image: /blog/choosing-embedding-models/social_preview.png 
social_preview_image: /blog/choosing-embedding-models/social_preview.png 
date: 2025-01-30T00:40:24-03:00
author: Clelia Astra Bertelli
featured: no
---

In the ever-expanding landscape of large language models (LLMs) and retrieval-augmented generation (RAG), choosing the right embedding model for your application is critical. With over 10,000 models available on Sentence Transformers alone, it can be overwhelming to determine the best fit for your specific dataset and use case.

Enter **Sentrev**, a Python library designed by Clelia Astra Bertelli to simplify the evaluation of embedding models, helping users determine which model works best for their text-based documents. In this blog, we will explore Sentrev, its methodology, and why choosing the right embedding model is crucial for building high-performing LLM applications.

---

## Why Choosing the Right Embedding Model Matters

Embedding models convert text into vector representations, allowing similarity searches and contextual understanding within vector databases like Qdrant. However, not all embedding models are created equal.

Factors influencing model choice include:

1. **Type of Data** – Some models excel at structured documents (e.g., PDFs, Word files), while others are better suited for informal text (e.g., tweets).
2. **Performance vs. Efficiency** – Larger models may provide better accuracy but require more computational resources. Smaller models can be more efficient but may sacrifice performance.
3. **Retrieval Accuracy** – The ability of a model to correctly retrieve relevant information affects downstream applications like RAG.
4. **Hardware and Cost Considerations** – Some models perform well on CPUs, while others require GPUs.
5. **Carbon Footprint** – Running embedding models has an environmental impact, and understanding this can help optimize efficiency.

A poorly chosen embedding model can lead to ineffective search results, increased latency, and wasted resources. Sentrev aims to solve this by providing an evaluation framework that identifies the best model for a given dataset.

---

## Introducing Sentrev: A Python Library for Model Evaluation

Sentrev offers a streamlined workflow for evaluating embedding models. It is integrated with **Qdrant** (a leading open-source vector database), **FastEmbed** (a sparse embedding model library), and **Hugging Face** (which hosts a vast array of models).

### Features of Sentrev:

- **Evaluates Dense and Sparse Embeddings** – Supports models from Sentence Transformers and FastEmbed.
- **Works with Various Text-Based Formats** – Supports PDFs, Word documents, HTML, XML, CSV, and more.
- **Retrieval Accuracy Metrics** – Computes **success rate, mean reciprocal rank (MRR), and precision**.
- **Performance Analysis** – Measures retrieval speed to ensure time-efficient search.
- **Carbon Emission Tracking** – Uses CodeCarbon to estimate the environmental impact of running embedding models.

---

## How Sentrev Works

### Step 1: Install and Set Up Sentrev

Sentrev can be installed using pip:

```bash
pip install sentrev
```

### Step 2: Load Your Data

Sentrev supports various document formats, including PDFs, Word files, and structured text formats. The library converts all input into a standardized format for easier processing.

### Step 3: Connect to a Vector Database

Sentrev integrates seamlessly with Qdrant, allowing users to upload and retrieve vectorized documents:

```python
from qdrant_client import QdrantClient
client = QdrantClient("http://localhost:6333")
```

### Step 4: Evaluate Embedding Models

Users can run Sentrev’s evaluation pipeline on different models to compare their performance:

```python
from sentrev import SentrevEvaluator

evaluator = SentrevEvaluator(client=client, data_files=["data1.pdf", "data2.docx"], models=["all-mpnet-base-v2", "mini-lm"])
evaluator.evaluate()
```

Sentrev will output retrieval success rates, ranking metrics, and execution times to help users determine the best model.

---

## Key Findings from Sentrev

1. **Smaller Models Can Outperform Larger Ones** – Mini-LM (300MB) outperformed MPNet, a much larger model, in some cases.
2. **Model Performance Varies by Data Type** – Some models work better for PDFs, while others excel with plain text.
3. **Carbon Emissions Are Non-Trivial** – Larger models consume more power, highlighting the need for optimization.

---

## Future of Sentrev: Expanding to Multi-Modal Retrieval

Sentrev is currently focused on text data but plans to expand to **multi-modal retrieval**, incorporating image and audio embeddings. As the demand for hybrid search grows, Sentrev will provide insights into evaluating models across diverse data types.

---

## Conclusion

Choosing the right embedding model is essential for optimizing retrieval accuracy, efficiency, and resource consumption. Sentrev simplifies this process by providing a comprehensive framework for evaluating different models, making it easier for developers to build high-performance LLM applications.

With tight integration with Qdrant and FastEmbed, Sentrev is a powerful tool for anyone working on retrieval-augmented generation and semantic search. If you're looking to fine-tune your search quality and optimize your AI system, Sentrev is definitely worth exploring.

For more information, visit Sentrev’s GitHub repository and join the Qdrant community to stay updated on the latest advancements in vector search!

---

