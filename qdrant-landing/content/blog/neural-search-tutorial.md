---
title: Neural Search Tutorial
short_description: Step-by-step guide on how to build a neural search service.
description: Our step-by-step guide on how to build a neural search service with BERT + Qdrant + FastAPI.
preview_image: /articles_data/neural-search-tutorial/preview.png
small_preview_image: /articles_data/neural-search-tutorial/tutorial.svg
weight: 10
date: 2021-05-27T01:36:43+03:00
featured: true
categories: 
- news
tags:
- tag1
- tag3
---

## How to build a neural search service with BERT + Qdrant + FastAPI

![Intro](https://gist.githubusercontent.com/generall/c229cc94be8c15095286b0c55a3f19d7/raw/d866e37a60036ebe65508bd736faff817a5d27e9/intro.png)

Information retrieval technology is one of the main technologies that enabled the modern Internet to exist.
These days, search technology is the heart of a variety of applications.
From web-pages search to product recommendations.
For many years, this technology didn't get much change until neural networks came into play.

In this tutorial we are going to find answers to these questions:

* What is the difference between regular and neural search?
* What neural networks could be used for search?
* In what tasks is neural network search useful?
* How to build and deploy own neural search service step-by-step?

## What is neural search?

A regular full-text search, such as Google's, consists of searching for keywords inside a document.
For this reason, the algorithm can not take into account the real meaning of the query and documents.
Many documents that might be of interest to the user are not found because they use different wording.

Neural search tries to solve exactly this problem - it attempts to enable searches not by keywords but by meaning.
To achieve this, the search works in 2 steps.
In the first step, a specially trained neural network encoder converts the query and the searched objects into a vector representation called embeddings.
The encoder must be trained so that similar objects, such as texts with the same meaning or alike pictures get a close vector representation.

![Encoders and embedding space](https://gist.githubusercontent.com/generall/c229cc94be8c15095286b0c55a3f19d7/raw/e52e3f1a320cd985ebc96f48955d7f355de8876c/encoders.png)

Having this vector representation, it is easy to understand what the second step should be.
To find documents similar to the query you now just need to find the nearest vectors.
The most convenient way to determine the distance between two vectors is to calculate the cosine distance.
The usual Euclidean distance can also be used, but it is not so efficient due to [the curse of dimensionality](https://en.wikipedia.org/wiki/Curse_of_dimensionality).
