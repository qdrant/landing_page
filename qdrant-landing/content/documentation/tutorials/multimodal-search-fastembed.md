---
title: Multimodal Search with Fastembed
weight: 4
---

# Multimodal Search with Qdrant and FastEmbed

| Time: 30 min | Level: Beginner | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1prS561Vqqh1p6v_5wUsaHwIBfbZhePNb#scrollTo=cR2a4cWcHxc3)   |
| --- | ----------- | ----------- |

In this tutorial you will setup a simple Multimodal Image & Text Search with Qdrant & FastEmbed

## What is multimodal search?

Frequently, we perceive and transfer data of different modalities better in combinations. We have cross-modal associations (taste of comfort food bringing you to a childhood diafilm of memories), we search a song by a description "pam pam clap" and use emojies and stickerpacks instead of 1000 words.

Modalities of data such as text, images, video and audio in various combinations form valuable use cases for Semantic Search applications.

Vector databases, being modality-agnostic, are perfect for building these applications. This tutorial will show you how to use Qdrant for Multimodality Search.

For this simple example we chose two most common modalities: images and texts. However, it's possible to create a Semantic Search application with any combinations of modalities if choosing the right embedding model able to deal with the semantic gap.

> Semantic gap refers to the difference between low-level features (aka brigtness) and high-level concepts (aka cuteness).

For example, the ImageBind model from Meta AI is said to bind all 4 mentioned modailities in one shared space.

.....add more 