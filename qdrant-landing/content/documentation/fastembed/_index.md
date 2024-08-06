---
title: "FastEmbed" 
weight: 6
---

# What is FastEmbed?
FastEmbed is a lightweight Python library built for embedding generation. It supports popular embedding models and offers a user-friendly experience for embedding data into vector space. 

By using FastEmbed, you can ensure that your embedding generation process is not only fast and efficient but also highly accurate, meeting the needs of various machine learning and natural language processing applications.

FastEmbed easily integrates with Qdrant for a variety of multimodal search purposes.

## How to get started with FastEmbed

|Beginner|Advanced|
|:-:|:-:|
|[Generate Text Embedings with FastEmbed](fastembed-quickstart/)|[Combine FastEmbed with Qdrant for Vector Search](fastembed-semantic-search/)|

## Why is FastEmbed popular?

- Light & Fast: FastEmbed is designed to be efficient and quick, utilizing quantized model weights to reduce the computational load.
- ONNX Runtime for Inference: The library leverages ONNX Runtime, which allows for fast inference on various hardware platforms, ensuring high performance.
- Accuracy and Recall: FastEmbed aims to provide better accuracy and recall compared to other models like OpenAI’s Ada-002. The default embedding model is `BAAI/bge-small-en-v1.5`, which has shown strong results on the MTEB leaderboard.
- Supported Models: FastEmbed supports many models, including multilingual ones, to cater to a wide range of use cases.

## Supported Models
We are continuously updating the list with better and useful models. Please note that this list changes often.
Click on each list to expand it.

<details>

<summary> Text Embedding Models </summary>

| model                                      | dim | description                                                                     | size_in_GB |
|--------------------------------------------|-----|---------------------------------------------------------------------------------|------------|
| BAAI/bge-small-en-v1.5                     | 384 | Fast and Default English model                                                  | 0.067      |
| BAAI/bge-small-zh-v1.5                     | 512 | Fast and recommended Chinese model                                              | 0.090      |
| snowflake/snowflake-arctic-embed-xs        | 384 | Based on all-MiniLM-L6-v2 model with only 22m ...                               | 0.090      |
| sentence-transformers/all-MiniLM-L6-v2     | 384 | Sentence Transformer model, MiniLM-L6-v2                                        | 0.090      |
| jinaai/jina-embeddings-v2-small-en         | 512 | English embedding model supporting 8192 sequen...                              | 0.120      |
| BAAI/bge-small-en                          | 384 | Fast English model                                                              | 0.130      |
| snowflake/snowflake-arctic-embed-s         | 384 | Based on infloat/e5-small-unsupervised, does n...                              | 0.130      |
| nomic-ai/nomic-embed-text-v1.5-Q           | 768 | Quantized 8192 context length english model                                     | 0.130      |
| BAAI/bge-base-en-v1.5                      | 768 | Base English model, v1.5                                                        | 0.210      |
| sentence-transformers/paraphrase-multilingual-... | 384 | Sentence Transformer model, paraphrase-multili...                              | 0.220      |
| Qdrant/clip-ViT-B-32-text                  | 512 | CLIP text encoder                                                               | 0.250      |
| jinaai/jina-embeddings-v2-base-de          | 768 | German embedding model supporting 8192 sequenc...                              | 0.320      |
| BAAI/bge-base-en                           | 768 | Base English model                                                              | 0.420      |
| snowflake/snowflake-arctic-embed-m         | 768 | Based on intfloat/e5-base-unsupervised model, ...                              | 0.430      |
| nomic-ai/nomic-embed-text-v1.5             | 768 | 8192 context length english model                                               | 0.520      |
| jinaai/jina-embeddings-v2-base-en          | 768 | English embedding model supporting 8192 sequen...                              | 0.520      |
| nomic-ai/nomic-embed-text-v1               | 768 | 8192 context length english model                                               | 0.520      |
| snowflake/snowflake-arctic-embed-m-long    | 768 | Based on nomic-ai/nomic-embed-text-v1-unsuperv...                              | 0.540      |
| mixedbread-ai/mxbai-embed-large-v1         | 1024 | MixedBread Base sentence embedding model, does...                              | 0.640      |
| jinaai/jina-embeddings-v2-base-code        | 768 | Source code embedding model supporting 8192 se...                              | 0.640      |
| sentence-transformers/paraphrase-multilingual-... | 768 | Sentence-transformers model for tasks like clu...                              | 1.000      |
| snowflake/snowflake-arctic-embed-l         | 1024 | Based on intfloat/e5-large-unsupervised, large...                              | 1.020      |
| thenlper/gte-large                         | 1024 | Large general text embeddings model                                             | 1.200      |
| BAAI/bge-large-en-v1.5                     | 1024 | Large English model, v1.5                                                       | 1.200      |
| intfloat/multilingual-e5-large             | 1024 | Multilingual model, e5-large. Recommend using ...                              | 2.240      |

</details>

<details>

<summary> Image Embedding Models </summary>

| model                       | dim  | description                                          | size_in_GB |
|-----------------------------|------|------------------------------------------------------|------------|
| Qdrant/resnet50-onnx        | 2048 | ResNet-50 from `Deep Residual Learning for Ima...    | 0.10       |
| Qdrant/clip-ViT-B-32-vision | 512  | CLIP vision encoder based on ViT-B/32                | 0.34       |
| Qdrant/Unicom-ViT-B-32      | 512  | Unicom Unicom-ViT-B-32 from open-metric-learning     | 0.48       |
| Qdrant/Unicom-ViT-B-16      | 768  | Unicom Unicom-ViT-B-16 from open-metric-learning     | 0.82       |

</details>

<details>

<summary> Sparse Embedding Models </summary>

| model                                       | vocab_size | description                                                                       | size_in_GB | requires_idf |
|---------------------------------------------|------------|-----------------------------------------------------------------------------------|------------|--------------|
| Qdrant/bm25                                  | NaN        | BM25 as sparse embeddings meant to be used with...                                | 0.010      | True         |
| Qdrant/bm42-all-minilm-l6-v2-attentions      | 30522.0    | Light sparse embedding model, which assigns an...                                 | 0.090      | True         |
| prithvida/Splade_PP_en_v1                    | 30522.0    | Misspelled version of the model. Retained for...                                  | 0.532      | NaN          |
| prithivida/Splade_PP_en_v1                   | 30522.0    | Independent Implementation of SPLADE++ Model for dense and sparse retrieval tasks | 0.532      | NaN          |

</details>

<details>

<summary> Late Interactio Embedding Models </summary>

| model                    | dim | description             | size_in_GB |
|--------------------------|-----|-------------------------|------------|
| colbert-ir/colbertv2.0   | 128 | Late interaction model  | 0.44       |

</details>