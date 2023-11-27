---
title: Practice Datasets
weight: 31
---

# Common Datasets in Snapshot Format

You may find that creating embeddings from datasets is a very resource-intensive task. 
If you need a practice dataset, feel free to pick one of the ready-made snapshots on this page.
These snapshots contain pre-computed vectors that you can easily import into your Qdrant instance.

## Available datasets

Our snapshots are generated from publicly available datasets, which are often used for commercial 
r academic purposes. The following datasets are currently available. Please click on a dataset 
name to see the detailed description.

| Dataset                                    | Model                                                       | Vector size | Documents | Size   | Qdrant snapshot                                                                                                                       | HF Hub                                                                                 |
|--------------------------------------------|-------------------------------------------------------------|-------------|-----------|--------|---------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| [Arxiv.org titles](#arxivorg-titles)       | [InstructorXL](https://huggingface.co/hkunlp/instructor-xl) | 768         | 2.3M      | 7.1 GB | [Download](https://storage.googleapis.com/common-datasets-snapshots/arxiv_titles-3083016565637815127-2023-05-29-13-56-22.snapshot)    | [Open](https://huggingface.co/datasets/Qdrant/arxiv-titles-instructorxl-embeddings)    |
| [Arxiv.org abstracts](#arxivorg-abstracts) | [InstructorXL](https://huggingface.co/hkunlp/instructor-xl) | 768         | 2.3M      | 8.4 GB | [Download](https://storage.googleapis.com/common-datasets-snapshots/arxiv_abstracts-3083016565637815127-2023-06-02-07-26-29.snapshot) | [Open](https://huggingface.co/datasets/Qdrant/arxiv-abstracts-instructorxl-embeddings) |

Once you download a snapshot, you need to [restore it](/documentation/concepts/snapshots/#restore-snapshot) 
using the Qdrant CLI upon startup.

## Qdrant on Hugging Face

<p align="center">
  <a href="https://huggingface.co/Qdrant">
    <img style="max-width: 500px" src="/content/images/hf-logo-with-title.svg" alt="HuggingFace" title="HuggingFace">
  </a>
</p>

[Hugging Face](https://huggingface.co/) provides a platform for sharing and using ML models and 
datasets. [Qdrant](https://huggingface.co/Qdrant) is one of the organizations there! We aim to 
provide you with datasets containing neural embeddings that you can use to practice with Qdrant 
and build your applications based on semantic search. **Please let us know if you'd like to see
a specific dataset!**

If you are not familiar with [Hugging Face datasets](https://huggingface.co/docs/datasets/index),
or would like to know how to combine it with Qdrant, please refer to the [tutorial](/documentation/tutorials/huggingface-datasets/).

## Arxiv.org

[Arxiv.org](https://arxiv.org) is a highly-regarded open-access repository of electronic preprints in multiple 
fields. Operated by Cornell University, arXiv allows researchers to share their findings with 
the scientific community and receive feedback before they undergo peer review for formal 
publication. Its archives host millions of scholarly articles, making it an invaluable resource 
for those looking to explore the cutting edge of scientific research. With a high frequency of 
daily submissions from scientists around the world, arXiv forms a comprehensive, evolving dataset 
that is ripe for mining, analysis, and the development of future innovations.

<aside role="status">
Arxiv.org snapshots were created using precomputed embeddings exposed by <a href="https://alex.macrocosm.so/download">the Alexandria Index</a>.
</aside>

### Arxiv.org titles

This dataset contains embeddings generated from the paper titles only. Each vector has a
payload with the title used to create it, along with the DOI (Digital Object Identifier).

```json
{
    "title": "Nash Social Welfare for Indivisible Items under Separable, Piecewise-Linear Concave Utilities",
    "DOI": "1612.05191"
}
```

The embeddings generated with InstructorXL model have been generated using the following
instruction:

> Represent the Research Paper title for retrieval; Input:

The following code snippet shows how to generate embeddings using the InstructorXL model:

```python
from InstructorEmbedding import INSTRUCTOR

model = INSTRUCTOR("hkunlp/instructor-xl")
sentence = "3D ActionSLAM: wearable person tracking in multi-floor environments"
instruction = "Represent the Research Paper title for retrieval; Input:"
embeddings = model.encode([[instruction, sentence]])
```

The snapshot of the dataset might be downloaded [here](https://storage.googleapis.com/common-datasets-snapshots/arxiv_titles-3083016565637815127-2023-05-29-13-56-22.snapshot).

### Arxiv.org abstracts

This dataset contains embeddings generated from the paper abstracts. Each vector has a
payload with the abstract used to create it, along with the DOI (Digital Object Identifier).

```json
{
    "abstract": "Recently Cole and Gkatzelis gave the first constant factor approximation\nalgorithm for the problem of allocating indivisible items to agents, under\nadditive valuations, so as to maximize the Nash Social Welfare. We give\nconstant factor algorithms for a substantial generalization of their problem --\nto the case of separable, piecewise-linear concave utility functions. We give\ntwo such algorithms, the first using market equilibria and the second using the\ntheory of stable polynomials.\n  In AGT, there is a paucity of methods for the design of mechanisms for the\nallocation of indivisible goods and the result of Cole and Gkatzelis seemed to\nbe taking a major step towards filling this gap. Our result can be seen as\nanother step in this direction.\n",
    "DOI": "1612.05191"
}
```

The embeddings generated with InstructorXL model have been generated using the following
instruction:

> Represent the Research Paper abstract for retrieval; Input:

The following code snippet shows how to generate embeddings using the InstructorXL model:

```python
from InstructorEmbedding import INSTRUCTOR

model = INSTRUCTOR("hkunlp/instructor-xl")
sentence = "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train."
instruction = "Represent the Research Paper abstract for retrieval; Input:"
embeddings = model.encode([[instruction, sentence]])
```

The snapshot of the dataset might be downloaded [here](https://storage.googleapis.com/common-datasets-snapshots/arxiv_abstracts-3083016565637815127-2023-06-02-07-26-29.snapshot).