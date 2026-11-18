---
title: Practice Datasets
short_description: "Skip the embedding step with ready-made Qdrant snapshots of public datasets you can import and explore right away."
description: "Download pre-computed Qdrant snapshots of Qdrant docs, Amazon products, arXiv papers, and more to practice vector search without generating embeddings."
weight: 1500
partition: ecosystem
---

# Common Datasets in Snapshot Format

You may find that creating embeddings from datasets is a very resource-intensive task. 
If you need a practice dataset, feel free to pick one of the ready-made snapshots on this page.
These snapshots contain pre-computed vectors that you can easily import into your Qdrant instance.

## Available Datasets

Our snapshots are usually generated from publicly available datasets, which are often used for 
non-commercial or academic purposes. The following datasets are currently available. Please click 
on a dataset name to see its detailed description.

| Dataset                                    | Model                                                                       | Vector size | Documents | Size   | Qdrant snapshot                                                                                          | HF Hub                                                                                 |
|--------------------------------------------|-----------------------------------------------------------------------------|-------------|-----------|--------|----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| [Qdrant Documentation](#qdrant-documentation) | [multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) | 384      | 3.6K      | 24 MB  | [Download](https://snapshots.qdrant.io/qdrant-docs-2026-10-25.snapshot)                                  | [Open](https://huggingface.co/datasets/Qdrant/qdrant-docs-multilingual-e5-small-embeddings) |
| [Amazon ESCI Products](#amazon-esci-products) | [multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) | 384      | 165K      | 488 MB | [Download](https://snapshots.qdrant.io/esci-products.snapshot)                                           | [Open](https://huggingface.co/datasets/Qdrant/esci-products-multilingual-e5-small-embeddings) |
| [Amazon Berkeley Objects](#amazon-berkeley-objects) | [clip-ViT-B-32](https://huggingface.co/sentence-transformers/clip-ViT-B-32) | 512  | 45K       | 183 MB | [Download](https://snapshots.qdrant.io/amazon-berkeley-objects.snapshot)                                 | [Open](https://huggingface.co/datasets/Qdrant/amazon-berkeley-objects-clip-ViT-B-32-embeddings) |
| [Arxiv.org Titles](#arxivorg-titles)       | [InstructorXL](https://huggingface.co/hkunlp/instructor-xl)                 | 768         | 2.3M      | 7.7 GB | [Download](https://snapshots.qdrant.io/arxiv_titles-2108082541245612-2026-06-04-09-55-52.snapshot)       | [Open](https://huggingface.co/datasets/Qdrant/arxiv-titles-instructorxl-embeddings)    |
| [Arxiv.org Abstracts](#arxivorg-abstracts) | [InstructorXL](https://huggingface.co/hkunlp/instructor-xl)                 | 768         | 2.3M      | 9.2 GB | [Download](https://snapshots.qdrant.io/arxiv_abstracts-2108082541245612-2026-06-04-09-56-06.snapshot)    | [Open](https://huggingface.co/datasets/Qdrant/arxiv-abstracts-instructorxl-embeddings) |
| [Wolt Food](#wolt-food)                    | [clip-ViT-B-32](https://huggingface.co/sentence-transformers/clip-ViT-B-32) | 512         | 1.7M      | 6.8 GB | [Download](https://snapshots.qdrant.io/wolt-clip-2108082541245612-2026-06-04-09-56-17.snapshot)          | [Open](https://huggingface.co/datasets/Qdrant/wolt-food-clip-ViT-B-32-embeddings)      |

Once you download a snapshot, you need to [restore it](/documentation/snapshots/#restore-snapshot) 
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
or would like to know how to combine it with Qdrant, please refer to the [tutorial](/documentation/tutorials-basics/huggingface-datasets/).

## Qdrant Documentation

This dataset contains the Qdrant documentation, courses, and articles from [qdrant.tech](https://qdrant.tech),
as of October 25, 2026, split into 3,593 chunks by page section. A section that fits in 480 tokens becomes
one chunk, and larger sections are split further. Each point stores a dense vector named `dense` and a
payload with the chunk text, its page title and URL, the section breadcrumb, the content type
(`documentation`, `course`, or `article`), and whether the chunk contains code:

```json
{
    "url": "/course/essentials/day-6/final-project/",
    "title": "Final Project: Production-Ready Documentation Search Engine",
    "section": "Build Steps > Step 3: Parse and Chunk Documents",
    "content_type": "course",
    "text": "Final Project: Production-Ready Documentation Search Engine > Build Steps > Step 3: Parse and Chunk Documents\n\nPick a documentation set and parse it into structured sections. Preserve the hierarchy users expect.\n\n...",
    "has_code": false
}
```

The `content_type`, `url`, and `has_code` fields have payload indexes for filtering, and `text` has a full-text index with BM25 scoring for keyword and hybrid search. The index uses the code tokenizer on both the prose and the code, so identifiers match across naming styles: efConstruct finds ef_construct. Where a page shows the same code example in several client languages, only the Python version is kept.


The embeddings were generated with the multilingual-e5-small model from the `text` field with fenced
code blocks, Markdown images, and link URLs removed, using the `passage: ` prefix. Embed your search
queries with the `query: ` prefix instead, and pass `using="dense"` when you query. On Qdrant Cloud,
this model is available for free through [Cloud Inference](/documentation/cloud/inference/) as
`intfloat/multilingual-e5-small`, so you can embed queries without hosting it yourself. The following
code snippet shows how to generate embeddings using the multilingual-e5-small model:

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("intfloat/multilingual-e5-small")
text = "Final Project: Production-Ready Documentation Search Engine > Build Steps > Step 3: Parse and Chunk Documents"
embeddings = model.encode([f"passage: {text}"], normalize_embeddings=True)
query_embedding = model.encode(["how to chunk documentation"], prompt="query: ", normalize_embeddings=True)
```

[Download the snapshot](https://snapshots.qdrant.io/qdrant-docs-2026-10-25.snapshot) of the dataset.
It requires Qdrant 1.20 or later.

#### Importing the Dataset

The easiest way to use the provided dataset is to recover it via the API by passing the
URL as a location. It works also in [Qdrant Cloud](https://cloud.qdrant.io/). The following
code snippet shows how to create a new collection and fill it with the snapshot data:

```http request
PUT /collections/{collection_name}/snapshots/recover
{
  "location": "https://snapshots.qdrant.io/qdrant-docs-2026-10-25.snapshot"
}
```

## Amazon ESCI Products

This dataset contains 164,900 product listings from the [Amazon Shopping Queries Dataset](https://github.com/amazon-science/esci-data)
(ESCI): every product judged for the US test queries of the dataset's small version. Each point represents
a product and stores a dense vector named `dense`. The payload holds the product ID (ASIN), title, brand,
and color where available, along with the text used to create the embedding: the title, the brand, and
the product bullet points.

```json
{
    "product_id": "B01MT0QDPO",
    "title": "Nature Valley Sweet and Salty Nut Granola Bars, Cashew, 12 ct, 14.8 oz",
    "brand": "Nature Valley",
    "text": "Nature Valley Sweet and Salty Nut Granola Bars, Cashew, 12 ct, 14.8 oz\nBrand: Nature Valley\nGRANOLA BAR: Nature Valley granola bars are made with whole grain oats roasted peanuts and peanut butter\n..."
}
```
The `product_id`, `brand`, and `color` fields have payload indexes for filtering, and `text`
has a full-text index with BM25 scoring for keyword and hybrid search. The snapshot contains the
products only. The 8,956 search queries and their 181,701 relevance labels are in the `judgments`
configuration of the [Hugging Face dataset](https://huggingface.co/datasets/Qdrant/esci-products-multilingual-e5-small-embeddings).
They are the rows of the [source repository](https://github.com/amazon-science/esci-data) with
`product_locale` set to `us`, `small_version` set to `1`, and `split` set to `test`.

The embeddings were generated with the multilingual-e5-small model from the `text` field with the
`passage: ` prefix. Embed your search queries with the `query: ` prefix instead, and pass `using="dense"`
when you query. On Qdrant Cloud, this model is available for free through
[Cloud Inference](/documentation/cloud/inference/) as `intfloat/multilingual-e5-small`. The following code
snippet shows how to generate embeddings using the multilingual-e5-small model:

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("intfloat/multilingual-e5-small")
text = "Nature Valley Sweet and Salty Nut Granola Bars, Cashew, 12 ct, 14.8 oz\nBrand: Nature Valley"
embeddings = model.encode([f"passage: {text}"], normalize_embeddings=True)
query_embedding = model.encode(["cashew granola bars"], prompt="query: ", normalize_embeddings=True)
```

[Download the snapshot](https://snapshots.qdrant.io/esci-products.snapshot) of the dataset.
It requires Qdrant 1.20 or later. The Shopping Queries Dataset is provided by Amazon Science under the
[Apache 2.0 license](https://github.com/amazon-science/esci-data/blob/main/LICENSE).

#### Importing the Dataset

The easiest way to use the provided dataset is to recover it via the API by passing the
URL as a location. It works also in [Qdrant Cloud](https://cloud.qdrant.io/). The following
code snippet shows how to create a new collection and fill it with the snapshot data:

```http request
PUT /collections/{collection_name}/snapshots/recover
{
  "location": "https://snapshots.qdrant.io/esci-products.snapshot"
}
```

## Amazon Berkeley Objects

This dataset contains 44,932 products from the [Amazon Berkeley Objects](https://amazon-berkeley-objects.s3.amazonaws.com/index.html)
(ABO) dataset. Each point represents a product with its main image, represented as a single unnamed
vector of 512 float numbers. Products that share a main image, usually size or color variants, are kept
once, and products whose main image is a placeholder rather than a photo are left out. The payload holds
the item ID, product name, brand, color where available, product type, marketplace country, and the image URL:

```json
{
    "item_id": "B0716KHKRX",
    "name": "Amazon Brand - Solimo Travel Case for Small Electronics and Accessories (Red)",
    "brand": "Amazon Brand - Solimo",
    "color": "Red",
    "product_type": "PORTABLE_ELECTRONIC_DEVICE_COVER",
    "country": "IN",
    "image_url": "https://amazon-berkeley-objects.s3.amazonaws.com/images/small/f3/f3de0cfd.jpg"
}
```

The `item_id`, `brand`, `color`, `product_type`, and `country` fields have payload indexes for
filtering, and `name` has a full-text index with BM25 scoring.

The embeddings were generated with the clip-ViT-B-32 model from the image at `image_url`, using the
following code snippet. Because CLIP maps text and images into the same space, you can search the images
with text queries encoded by the same model. On Qdrant Cloud, the same models are available through
[Cloud Inference](/documentation/cloud/inference/) as `qdrant/clip-vit-b-32-vision` and `qdrant/clip-vit-b-32-text`:

```python
from PIL import Image
from sentence_transformers import SentenceTransformer

image_path = "f3de0cfd.jpg"

model = SentenceTransformer("clip-ViT-B-32")
embedding = model.encode(Image.open(image_path))
query_embedding = model.encode("a red travel case")
```

[Download the snapshot](https://snapshots.qdrant.io/amazon-berkeley-objects.snapshot) of the dataset.
It requires Qdrant 1.20 or later. ABO is provided by Amazon.com and UC Berkeley under the
[CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/). This collection is a modified subset:
products with an English name and a photo as their main image, one product per main image, and 1,000 of
the phone cases, with a CLIP embedding of each main image added.

#### Importing the Dataset

The easiest way to use the provided dataset is to recover it via the API by passing the
URL as a location. It works also in [Qdrant Cloud](https://cloud.qdrant.io/). The following
code snippet shows how to create a new collection and fill it with the snapshot data:

```http request
PUT /collections/{collection_name}/snapshots/recover
{
  "location": "https://snapshots.qdrant.io/amazon-berkeley-objects.snapshot"
}
```

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

### Arxiv.org Titles

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

[Download the snapshot](https://snapshots.qdrant.io/arxiv_titles-2108082541245612-2026-06-04-09-55-52.snapshot) of the dataset.

#### Importing the Dataset

The easiest way to use the provided dataset is to recover it via the API by passing the
URL as a location. It works also in [Qdrant Cloud](https://cloud.qdrant.io/). The following
code snippet shows how to create a new collection and fill it with the snapshot data:

```http request
PUT /collections/{collection_name}/snapshots/recover
{
  "location": "https://snapshots.qdrant.io/arxiv_titles-2108082541245612-2026-06-04-09-55-52.snapshot"
}
```

### Arxiv.org Abstracts

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

[Download the snapshot](https://snapshots.qdrant.io/arxiv_abstracts-2108082541245612-2026-06-04-09-56-06.snapshot) of the dataset.

#### Importing the Dataset

The easiest way to use the provided dataset is to recover it via the API by passing the
URL as a location. It works also in [Qdrant Cloud](https://cloud.qdrant.io/). The following
code snippet shows how to create a new collection and fill it with the snapshot data:

```http request
PUT /collections/{collection_name}/snapshots/recover
{
  "location": "https://snapshots.qdrant.io/arxiv_abstracts-2108082541245612-2026-06-04-09-56-06.snapshot"
}
```

## Wolt Food

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

[Download the snapshot](https://snapshots.qdrant.io/wolt-clip-2108082541245612-2026-06-04-09-56-17.snapshot) of the dataset.

#### Importing the Dataset

The easiest way to use the provided dataset is to recover it via the API by passing the
URL as a location. It works also in [Qdrant Cloud](https://cloud.qdrant.io/). The following
code snippet shows how to create a new collection and fill it with the snapshot data:

```http request
PUT /collections/{collection_name}/snapshots/recover
{
  "location": "https://snapshots.qdrant.io/wolt-clip-2108082541245612-2026-06-04-09-56-17.snapshot"
}
```
