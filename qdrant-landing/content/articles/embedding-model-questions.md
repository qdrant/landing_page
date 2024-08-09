---
title: "5 questions you need to ask yourself if you are not using FastEmbed and Qdrant for your RAG APP"
short_description: "FastEmbed and Qdrant provide a fast and performant option for your AI Application"
description: "Why aren't you using FastEmbed?"
social_preview_image: /articles_data/embedding-model-questions/tree.png
small_preview_image: /articles_data/embedding-model-questions/tree.png
preview_dir: /articles_data/embedding-model-questions/preview
weight: -40
author: Thierry Damiba
author_link: https://x.com/thierrypdamiba 
date: 2024-08-07T13:00:00+03:00
draft: false
keywords:
  - vector search
  - binary quantization
  - memory optimization
  - FastEmbed
  - Qdrant
  - embedding models
---

# 5 Questions to Ask Yourself if You're Not Using FastEmbed and Qdrant for Your RAG App
!(/blog/openai/Oversampling_Impact.png)

As a data scientist learning about building AI applications, one of the branches of the RAG tree that has given me the most trouble is embedding models. There is a lot of discussion, research, and videos on frontier models like GPT-4 and Llama 3. There is much less fanfare surrounding the different embedding models and embedding model libraries.

As I have begun to learn more about the embedding model ecosystem and started using Qdrant every day, I started to see where FastEmbed could be powerful. In this article, I will pose three key questions I believe builders should be asking themselves when choosing an embedding model library if they are not already using FastEmbed & Qdrant.

## 1. What Kind of Data Do You Have?
Is your data in English? Are you working with code? Different embedding models were trained on different text, so they will perform better on retrieval when paired with the correct type of data.

Let’s say you are building an app to teach people how to learn new languages. Your data is going to be composed of documents of text in different languages. Your app would benefit from Intfloat’s Multilingual E5 Large Model. This model has multilingual capabilities, allowing it to understand and generate text in different languages. 

Consider, however, you are building a site to help engineers learn how to code. Jina AI’s Embeddings V2 Base Code would be an excellent choice. This model is designed specifically to handle code, meaning it understands the syntax and structure of various programming languages better than general language models.

With FastEmbed and Qdrant, you get access to 30+ embedding models that cover a wide variety of use cases. Changing the embedding model of your application is as easy as changing one line of code. All you need to do is change the model name to your desired model, and you are good to go!

## 2. How Much Data Do You Have?
Do you have millions or billions of documents? FastEmbed sets itself apart by maintaining a low minimum RAM/Disk usage. Combining FastEmbed with Qdrant allows you to easily encode and upload LARGE datasets. Most embedding libraries use Torch or TensorFlow under the hood, but FastEmbed uses the ONNX runtime. FastEmbed splits the workload into multiple batches using multiprocessing by taking advantage of Python’s multiprocessing library. FastEmbed only has 5 dependencies!

This leads to speed that is 50% faster than Pytorch Transformers while maintaining a better performance than Sentence Transformers and ADA. If you’re working with a massive scale dataset and speed matters, FastEmbed will shine.

We use BAAI/bge-small-en-v1.5 as our default embedding, hence we’ve chosen that for comparison.

## 3. What Is Your Budget?
GPUs are expensive! FastEmbed is a CPU-first design that can be used on your existing hardware, providing efficient performance without the need for GPUs. If you’re working in a resource-constrained environment, FastEmbed is perfect because of its light footprint. You can also quickly prototype and iterate as you get your embeddings lightning fast!

## 4. Is Model Size and Efficiency a Concern?
In FastEmbed, all models are quantized. Quantization allows for faster model inference by reducing the number of operations the model has to go through. We make a small tradeoff in accuracy for a big improvement in speed and cost. Cosine similarity of quantized and original model vectors is 0.92. If you’re working with resource constraints or deploying your model to devices that don’t have strong capabilities, you will benefit from the smaller model.

## 5. What Kind of Application Are You Building?
If you’re building a recommendation system, fast results will be key to a good user experience. If you’re building an academic research tool, your users don’t need the results as quickly. FastEmbed excels in applications where the query needs to be delivered with speed, like a customer support chatbot or a financial market predictor.

These are five questions that you should ask yourself. If you want to get started with FastEmbed and Qdrant, you can sign up for a free 1GB cluster [here](https://qdrant.tech/). If you have any questions, please reach out to us on Discord!
