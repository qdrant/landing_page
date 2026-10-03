---
title: "Qdrant Summer of Code 2024 - ONNX Cross Encoders in Python"
short_description: "Explore Celine Hoang's 2024 Qdrant Summer of Code work adding ONNX cross-encoder models and score checks to FastEmbed."
description: "Explore Celine Hoang's 2024 Qdrant Summer of Code project adding ONNX cross-encoder reranking to FastEmbed, with paired inputs and score tests."
social_preview_image: /blog/cross-encoder-integration-gsoc/preview/social_preview.jpg
author: Huong (Celine) Hoang
author_link: https://www.linkedin.com/in/celine-h-hoang/
date: 2024-10-14T08:00:00+03:00
draft: false
keywords:
  - cross-encoder
  - reranking
  - fastembed
  - qsoc'24
hideFromList: true
slug: cross-encoder-integration-gsoc
preview_image: /blog/cross-encoder-integration-gsoc/preview/title.jpg
small_preview_image: /blog/cross-encoder-integration-gsoc/preview/preview.jpg
featured: false
tags:
  - Open Source
  - Summer of Code
aliases:
  - /articles/cross-encoder-integration-gsoc/
---

> Editor's note: The score tests check numerical agreement between model implementations. This 2024 post was edited for length and clarity. Read the [original version](https://github.com/qdrant/landing_page/blob/bb7f15b97237c97748fdbeea45499e2fcaba2377/qdrant-landing/content/articles/cross-encoder-integration-gsoc.md).

I'm Huong (Celine) Hoang, and I worked on cross-encoder reranking in FastEmbed during Qdrant Summer of Code 2024. FastEmbed already generated embeddings for retrieval. My project added models that score a query together with each candidate document, so applications could reorder retrieved results.

This post records my 2024 internship. For current models and runnable examples, use the [FastEmbed reranker documentation](/documentation/fastembed/fastembed-rerankers/).

## Adding a Different Model Output

Embedding models turn text into vectors. Cross-encoders instead take query-document pairs and return relevance scores. That required a new input-output scheme in FastEmbed.

I worked on `TextCrossEncoderBase` and `OnnxCrossEncoder`, drawing on the existing embedding classes. The interface needed to hide model loading and tokenization while giving users access to the scores.

The project included models such as `Xenova/ms-marco-MiniLM-L-6-v2`, `Xenova/ms-marco-MiniLM-L-12-v2`, and BAAI rerankers. We used Open Neural Network Exchange (ONNX) models so FastEmbed could run them without requiring PyTorch or TensorFlow.

{{< figure src="/blog/cross-encoder-integration-gsoc/rerank-workflow.svg" caption="FastEmbed scores the candidates retrieved by Qdrant; the application orders them by those scores." alt="A query retrieves candidates from Qdrant, a cross-encoder scores each query-document pair, and the application sorts the results" >}}

## Tokenization and Model Integration

A cross-encoder processes the query and document together. I configured paired-input tokenization and, for models that use them, token type IDs to distinguish the two inputs. Model-specific configurations needed care because the supported models did not all tokenize inputs in the same way.

Loading an ONNX model was only part of the work. The runtime inputs, batching, and output handling also had to agree with the original model. I added batching support so users could score multiple candidates through the same interface.

## Checking the Scores

We compared ONNX outputs with the corresponding PyTorch models to check the conversions. Tests used the same query and documents in each implementation, then compared the resulting scores.

One test used the query "What is the capital of France?" with documents about Paris and Berlin. It checked FastEmbed's scores against saved PyTorch outputs with an absolute tolerance of `1e-3`.

Model configurations, tokenizers, and tests all needed debugging. My mentor, George Panchuk, helped me work through those issues and keep the code readable during review.

## Lessons From the Internship

The project added cross-encoder support for the FastEmbed `0.4.0` release. At the end of the internship, possible follow-ups included more models, improved batch processing, and additional tokenizer support.

The main lesson for me was to test the complete user experience. A model that loads successfully still needs correct inputs, useful outputs, and an interface developers can understand.

Thank you to George and the Qdrant team for their guidance. To try reranking in an application, follow the [current FastEmbed reranker example](/documentation/fastembed/fastembed-rerankers/).
