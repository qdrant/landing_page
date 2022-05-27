---
title: Similarity Learning for Car Search
short_description: "How to use similarity learning to search for similar cars"
description: Learn how to train a similarity model that can retrieve similar car images in novel categories. 
preview_image: /articles_data/cars-recognition/preview.png
small_preview_image: /articles_data/cars-recognition/icon.svg
weight: 30
author: Yusuf Sarıgöz
author_link: https://medium.com/@yusufsarigoz
date: 2022-05-04T13:00:00+03:00
draft: false
---

Supervised classification is one of the most widely used training objectives in machine learning,
but not every task can be defined as such. For example,

1. Your classes may change quickly --e.g., new classes may be added over time,
2. You may not have samples from every possible categories,
3. It may be impossible to enumerate all the possible classes during the training time,
4. You may have an essentially different task, e.g., search or retrieval.

All such problems may be efficiently solved with similarity learning.

N.B.: If you are new to the similarity learning concept, checkout the [awesome-metric-learning](https://github.com/qdrant/awesome-metric-learning) repo for great resources and use case examples.

However, similarity learning comes with its own difficulties such as:

1. need for larger batch sizes usually,
2. more sophisticated loss functions,
3. changing architectures between training and inference.

These are challenges that not every practitioner can overcome easily.
Luckily, Quaterion is built to tackle such problems.
It offers great functionalities such as:

1. caching for smaller memory footprint and an incredible speedup.
2. annotated built-in loss functions, and a wrapper over [pytorch-metric-learning](https://kevinmusgrave.github.io/pytorch-metric-learning/) when you need even more,
3. training and inference abstraction to easily go from experimentation to model serving.

## A closer look at Quaterion
Quaterion is built upon [PyTorch Lightning](https://www.pytorchlightning.ai/), which is advertized with the motto, "spend more time on research, less on engineering."
This is also true for Quaterion. Let's break down some important modules:

- `TrainableModel`: A subclass of `pl.LightNingModule` that has additional hook methods such as `configure_encoders`, `configure_head`, `configure_metrics` and others
to define objects needed for training and evaluation.
- `SimilarityModel`: An inference-only export method to boost code transfer and lower dependencies during the inference time.
In fact, Quaterion is composed of two packages:
    1. `quaterion_models`: package that you need for inference.
    2. `quaterion`: package that defines objects needed for training and also depends on `quaterion_models`.
- `Encoder` and `EncoderHead`: Two objects that form a `SimilarityModel`.
In most of the cases, you may use a frozen pretrained encoder, e.g., ResNets from `torchvision`, or language modelling
models from `transformers`, with a trainable `EncoderHead` stacked on top of it.
`quaterion_models` offers several ready-to-use `EncoderHead` implementations,
but you may also create your own by subclassing a parent class or easily listing PyTorch modules in a `SequentialHead`.

Quaterion has other objects such as distance functions, evaluation metrics, evaluators, convenient dataset and data loader classes, but these are mostly self-explanatory.
Additionally, caching is one of the best features of Quaterion, and it is strongly recommended that you read and fully understand the [tutorial on caching in Quaterion](https://quaterion.qdrant.tech/).
The focus of this tutorial is step-by-step solution of a similarity learning problem with Quaterion.
This will also help us better understand how the abovementioned objects fit together in a real project.
Let's start walking through some of the important parts of the code.
If you are looking for the complete source code instead, you can find it under the [examples](https://github.com/qdrant/quaterion/tree/master/examples/cars) directory in the Quaterion repo.