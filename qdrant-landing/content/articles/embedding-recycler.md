---
title: Layer Recycling and Fine-tuning Efficiency
short_description: Tradeoff between speed and performance in layer recycling
description: Learn when and how to use layer recycling to achieve different performance targets.
preview_image: /articles_data/embedding-recycling/preview.jpeg
small_preview_image: /articles_data/embedding-recycling/icon.svg
weight: 10
author: Yusuf Sarıgöz
author_link: https://medium.com/@yusufsarigoz
date: 2022-07-20T13:00:00+03:00
draft: true
---

A recent [paper](https://arxiv.org/abs/2207.04993)
by Allen AI has attracted attention in the NLP community as they cache the output of a certain intermediate layer
in the training and inference phases to achieve a speedup of ~83%
with a negligible loss in model performance.
This technique is quite similar to [the caching mechanism in Quaterion](https://quaterion.qdrant.tech/tutorials/cache_tutorial.html),
but the latter is intended for any data modalities while the former focuses only on language models
despite presenting inportant insights from their experiments.
In this post, I will share our findings combined with those,
hoping to provide the community with a wider perspective on layer recycling.
