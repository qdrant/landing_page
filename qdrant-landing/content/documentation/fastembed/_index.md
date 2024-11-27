---
title: "FastEmbed" 
weight: 7
partition: qdrant
---

# What is FastEmbed?
FastEmbed is a lightweight Python library built for embedding generation. It supports popular embedding models and offers a user-friendly experience for embedding data into vector space. 

By using FastEmbed, you can ensure that your embedding generation process is not only fast and efficient but also highly accurate, meeting the needs of various machine learning and natural language processing applications.

FastEmbed easily integrates with Qdrant for a variety of multimodal search purposes.

## How to get started with FastEmbed

|Beginner|Advanced|
|:-:|:-:|
|[Generate Text Embedings with FastEmbed](/documentation/fastembed/fastembed-quickstart/)|[Combine FastEmbed with Qdrant for Vector Search](/documentation/fastembed/fastembed-semantic-search/)|

## Why is FastEmbed useful?

- Light: Unlike other inference frameworks, such as PyTorch, FastEmbed requires very little external dependencies. Because it uses the ONNX runtime, it is perfect for serverless environments like AWS Lambda.
- Fast: By using ONNX, FastEmbed ensures high-performance inference across various hardware platforms.
- Accurate: FastEmbed aims for better accuracy and recall than models like OpenAI’s `Ada-002`. It always uses model which demonstrate strong results on the MTEB leaderboard.
- Support: FastEmbed supports a wide range of models, including multilingual ones, to meet diverse use case needs.


