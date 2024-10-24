---
title: Practice Datasets
weight: 29
partition: build
---

# Common Datasets in Snapshot Format

You may find that creating embeddings from datasets is a very resource-intensive task. 
If you need a practice dataset, feel free to pick one of the ready-made snapshots on this page.
These snapshots contain pre-computed vectors that you can easily import into your Qdrant instance.

## Available datasets

Our snapshots are usually generated from publicly available datasets, which are often used for 
non-commercial or academic purposes. The following datasets are currently available. Please click 
on a dataset name to see its detailed description.

| Dataset                                    | Model                                                                       | Vector size | Documents | Size   | Qdrant snapshot                                                                                          | HF Hub                                                                                 |
|--------------------------------------------|-----------------------------------------------------------------------------|-------------|-----------|--------|----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| [Arxiv.org titles](#arxivorg-titles)       | [InstructorXL](https://huggingface.co/hkunlp/instructor-xl)                 | 768         | 2.3M      | 7.1 GB | [Download](https://snapshots.qdrant.io/arxiv_titles-3083016565637815127-2023-05-29-13-56-22.snapshot)    | [Open](https://huggingface.co/datasets/Qdrant/arxiv-titles-instructorxl-embeddings)    |
| [Arxiv.org abstracts](#arxivorg-abstracts) | [InstructorXL](https://huggingface.co/hkunlp/instructor-xl)                 | 768         | 2.3M      | 8.4 GB | [Download](https://snapshots.qdrant.io/arxiv_abstracts-3083016565637815127-2023-06-02-07-26-29.snapshot) | [Open](https://huggingface.co/datasets/Qdrant/arxiv-abstracts-instructorxl-embeddings) |
| [Wolt food](#wolt-food)                    | [clip-ViT-B-32](https://huggingface.co/sentence-transformers/clip-ViT-B-32) | 512         | 1.7M      | 7.9 GB | [Download](https://snapshots.qdrant.io/wolt-clip-ViT-B-32-2446808438011867-2023-12-14-15-55-26.snapshot) | [Open](https://huggingface.co/datasets/Qdrant/wolt-food-clip-ViT-B-32-embeddings)      |

Once you download a snapshot, you need to [restore it](/documentation/concepts/snapshots/#restore-snapshot) 
using the Qdrant CLI upon startup or through the API.

## Qdrant on Hugging Face

<p align="center">
  <a href="https://huggingface.co/Qdrant">
    <img style="width: 500px; max-width: 100%;" src="/content/images/hf-logo-with-title.svg" alt="HuggingFace" title="HuggingFace">
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

The snapshot of the dataset might be downloaded [here](https://snapshots.qdrant.io/arxiv_titles-3083016565637815127-2023-05-29-13-56-22.snapshot).

#### Importing the dataset

The easiest way to use the provided dataset is to recover it via the API by passing the
URL as a location. It works also in [Qdrant Cloud](https://cloud.qdrant.io/). The following
code snippet shows how to create a new collection and fill it with the snapshot data:

```http request
PUT /collections/{collection_name}/snapshots/recover
{
  "location": "https://snapshots.qdrant.io/arxiv_titles-3083016565637815127-2023-05-29-13-56-22.snapshot"
}
```

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

The snapshot of the dataset might be downloaded [here](https://snapshots.qdrant.io/arxiv_abstracts-3083016565637815127-2023-06-02-07-26-29.snapshot).

#### Importing the dataset

The easiest way to use the provided dataset is to recover it via the API by passing the
URL as a location. It works also in [Qdrant Cloud](https://cloud.qdrant.io/). The following
code snippet shows how to create a new collection and fill it with the snapshot data:

```http request
PUT /collections/{collection_name}/snapshots/recover
{
  "location": "https://snapshots.qdrant.io/arxiv_abstracts-3083016565637815127-2023-06-02-07-26-29.snapshot"
}
```

## Wolt food

Our [Food Discovery demo](https://food-discovery.qdrant.tech/) relies on the dataset of 
food images from the Wolt app. Each point in the collection represents a dish with a single 
image. The image is represented as a vector of 512 float numbers. There is also a JSON 
payload attached to each point, which looks similar to this:

```json
{
    "cafe": {
        "address": "VGX7+6R2 Vecchia Napoli, Valletta",
        "categories": ["italian", "pasta", "pizza", "burgers", "mediterranean"],
        "location": {"lat": 35.8980154, "lon": 14.5145106},
        "menu_id": "610936a4ee8ea7a56f4a372a",
        "name": "Vecchia Napoli Is-Suq Tal-Belt",
        "rating": 9,
        "slug": "vecchia-napoli-skyparks-suq-tal-belt"
    },
    "description": "Tomato sauce, mozzarella fior di latte, crispy guanciale, Pecorino Romano cheese and a hint of chilli",
    "image": "https://wolt-menu-images-cdn.wolt.com/menu-images/610936a4ee8ea7a56f4a372a/005dfeb2-e734-11ec-b667-ced7a78a5abd_l_amatriciana_pizza_joel_gueller1.jpeg",
    "name": "L'Amatriciana"
}
```

The embeddings generated with clip-ViT-B-32 model have been generated using the following
code snippet:

```python
from PIL import Image
from sentence_transformers import SentenceTransformer

image_path = "5dbfd216-5cce-11eb-8122-de94874ad1c8_ns_takeaway_seelachs_ei_baguette.jpeg"

model = SentenceTransformer("clip-ViT-B-32")
embedding = model.encode(Image.open(image_path))
```

The snapshot of the dataset might be downloaded [here](https://snapshots.qdrant.io/wolt-clip-ViT-B-32-2446808438011867-2023-12-14-15-55-26.snapshot).

#### Importing the dataset

The easiest way to use the provided dataset is to recover it via the API by passing the
URL as a location. It works also in [Qdrant Cloud](https://cloud.qdrant.io/). The following
code snippet shows how to create a new collection and fill it with the snapshot data:

```http request
PUT /collections/{collection_name}/snapshots/recover
{
  "location": "https://snapshots.qdrant.io/wolt-clip-ViT-B-32-2446808438011867-2023-12-14-15-55-26.snapshot"
}
```
