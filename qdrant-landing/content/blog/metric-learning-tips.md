---
title: Metric Learning Tips & Tricks
short_description: How to train an object matching model and serve it in production.
description: Practical recommendations on how to train a matching model and serve it in production. Even with no labeled data.
preview_image: /articles_data/metric-learning-tips/preview.png
small_preview_image: /articles_data/metric-learning-tips/scatter-graph.svg
weight: 20
category: main
date: 2021-05-21T01:36:43+03:00
author: Qdrant
categories:
- news
- another
tags:
- tag1
- tag3
---


## How to train object matching model with no labeled data and use it in production


Currently, most machine-learning-related business cases are solved as a classification problems.
Classification algorithms are so well studied in practice that even if the original problem is not directly a classification task, it is usually decomposed or approximately converted into one.

However, despite its simplicity, the classification task has requirements that could complicate its production integration and scaling.
E.g. it requires a fixed number of classes, where each class should have a sufficient number of training samples.

In this article, I will describe how we overcome these limitations by switching to metric learning.
By the example of matching job positions and candidates, I will show how to train metric learning model with no manually labeled data, how to estimate prediction confidence, and how to serve metric learning in production.


## What is metric learning and why using it?

According to Wikipedia, metric learning is the task of learning a distance function over objects.
In practice, it means that we can train a model that tells a number for any pair of given objects.
And this number should represent a degree or score of similarity between those given objects.
For example, objects with a score of 0.9 could be more similar than objects with a score of 0.5
Actual scores and their direction could vary among different implementations.

In practice, there are two main approaches to metric learning and two corresponding types of NN architectures.
The first is the interaction-based approach, which first builds local interactions (i.e., local matching signals) between two objects. Deep neural networks learn hierarchical interaction patterns for matching.
Examples of neural network architectures include MV-LSTM, ARC-II, and MatchPyramid.

![MV-LSTM, example of interaction-based model](https://gist.githubusercontent.com/generall/4821e3c6b5eee603d56729e7a156e461/raw/b0eb4ea5d088fe1095e529eb12708ac69f304ce3/mv_lstm.png)
> MV-LSTM, example of interaction-based model, [Shengxian Wan et al.
](https://www.researchgate.net/figure/Illustration-of-MV-LSTM-S-X-and-S-Y-are-the-in_fig1_285271115) via Researchgate