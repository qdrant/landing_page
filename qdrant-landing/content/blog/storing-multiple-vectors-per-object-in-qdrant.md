---
draft: false
title: Optimizing Semantic Search by Managing Multiple Vectors
slug: storing-multiple-vectors-per-object-in-qdrant
short_description: Qdrant's approach to storing multiple vectors per object,
  unraveling new possibilities in data representation and retrieval.
description: Discover the power of vector storage optimization and learn how to efficiently manage multiple vectors per object for enhanced semantic search capabilities.
preview_image: /blog/from_cms/andrey.vasnetsov_a_space_station_with_multiple_attached_modules_853a27c7-05c4-45d2-aebc-700a6d1e79d0.png
date: 2022-10-05T10:05:43.329Z
author: Kacper Łukawski
featured: false
tags:
  - Data Science
  - Neural Networks
  - Database
  - Search
  - Similarity Search
---

# How to Optimize Vector Storage by Storing Multiple Vectors Per Object

In a real case scenario, a single object might be described in several different ways. If you run an e-commerce business, then your items will typically have a name, longer textual description and also a bunch of photos. While cooking, you may care about the list of ingredients, and description of the taste but also the recipe and the way your meal is going to look. Up till now, if you wanted to enable [semantic search](https://qdrant.tech/documentation/tutorials/search-beginners/) with multiple vectors per object, Qdrant would require you to create separate collections for each vector type, even though they could share some other attributes in a payload. However, since Qdrant 0.10 you are able to store all those vectors together in the same collection and share a single copy of the payload!

Running the new version of Qdrant is as simple as it always was. By running the following command, you are able to set up a single instance that will also expose the HTTP API:


```
docker run -p 6333:6333 qdrant/qdrant:v0.10.1
```

## Creating a collection

Adding new functionalities typically requires making some changes to the interfaces, so no surprise we had to do it to enable the multiple vectors support. Currently, if you want to create a collection, you need to define the configuration of all the vectors you want to store for each object. Each vector type has its own name and the distance function used to measure how far the points are.

```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance

client = QdrantClient()
client.create_collection(
   collection_name="multiple_vectors",
   vectors_config={
       "title": VectorParams(
           size=100,
           distance=Distance.EUCLID,
       ),
       "image": VectorParams(
           size=786,
           distance=Distance.COSINE,
       ),
   }
)
```

In case you want to keep a single vector per collection, you can still do it without putting a name though.

```python
client.create_collection(
   collection_name="single_vector",
   vectors_config=VectorParams(
       size=100,
       distance=Distance.COSINE,
   )
)
```

All the search-related operations have slightly changed their interfaces as well, so you can choose which vector to use in a specific request. However, it might be easier to see all the changes by following an end-to-end Qdrant usage on a real-world example.

## Building service with multiple embeddings

Quite a common approach to building search engines is to combine semantic textual capabilities with image search as well. For that purpose, we need a dataset containing both images and their textual descriptions. There are several datasets available with [MS_COCO_2017_URL_TEXT](https://huggingface.co/datasets/ChristophSchuhmann/MS_COCO_2017_URL_TEXT) being probably the simplest available. And because it’s available on HuggingFace, we can easily use it with their [datasets](https://huggingface.co/docs/datasets/index) library.

```python
from datasets import load_dataset

dataset = load_dataset("ChristophSchuhmann/MS_COCO_2017_URL_TEXT")
```

Right now, we have a dataset with a structure containing the image URL and its textual description in English. For simplicity, we can convert it to the DataFrame, as this structure might be quite convenient for future processing.

```python
import pandas as pd

dataset_df = pd.DataFrame(dataset["train"])
```

The dataset consists of two columns: *TEXT* and *URL*. Thus, each data sample is described by two separate pieces of information and each of them has to be encoded with a different model.

## Processing the data with pretrained models

Thanks to [embetter](https://github.com/koaning/embetter), we can reuse some existing pretrained models and use a convenient scikit-learn API, including pipelines. This library also provides some utilities to load the images, but only supports the local filesystem, so we need to create our own class that will download the file, given its URL.

```python
from pathlib import Path
from urllib.request import urlretrieve
from embetter.base import EmbetterBase

class DownloadFile(EmbetterBase):

   def __init__(self, out_dir: Path):
       self.out_dir = out_dir

   def transform(self, X, y=None):
       output_paths = []
       for x in X:
           output_file = self.out_dir / Path(x).name
           urlretrieve(x, output_file)
           output_paths.append(str(output_file))
       return output_paths
```

Now we’re ready to define the pipelines to process our images and texts using *all-MiniLM-L6-v2* and *vit_base_patch16_224* models respectively. First of all, let’s start with Qdrant configuration.

## Creating Qdrant collection

We’re going to put two vectors per object (one for image and another one for text), so we need to create a collection with a configuration allowing us to do so.

```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance

client = QdrantClient(timeout=None)
client.create_collection(
   collection_name="ms-coco-2017",
   vectors_config={
       "text": VectorParams(
           size=384,
           distance=Distance.EUCLID,
       ),
       "image": VectorParams(
           size=1000,
           distance=Distance.COSINE,
       ),
   },
)
```

## Defining the pipelines

And since we have all the puzzles already in place, we can start the processing to convert raw data into the embeddings we need. The pretrained models come in handy.

```python
from sklearn.pipeline import make_pipeline
from embetter.grab import ColumnGrabber
from embetter.vision import ImageLoader, TimmEncoder
from embetter.text import SentenceEncoder

output_directory = Path("./images")

image_pipeline = make_pipeline(
   ColumnGrabber("URL"),
   DownloadFile(output_directory),
   ImageLoader(),
   TimmEncoder("vit_base_patch16_224"),
)

text_pipeline = make_pipeline(
   ColumnGrabber("TEXT"),
   SentenceEncoder("all-MiniLM-L6-v2"),
)
```


Thanks to the scikit-learn API, we can simply call each pipeline on the created DataFrame and put created vectors into Qdrant to enable fast vector search. For convenience, we’re going to put the vectors as other columns in our DataFrame.

```python
sample_df = dataset_df.sample(n=2000, random_state=643)
image_vectors = image_pipeline.transform(sample_df)
text_vectors = text_pipeline.transform(sample_df)
sample_df["image_vector"] = image_vectors.tolist()
sample_df["text_vector"] = text_vectors.tolist()
```


The created vectors might be easily put into Qdrant. For the sake of simplicity, we’re going to skip it, but if you are interested in details, please check out the [Jupyter notebook](https://gist.github.com/kacperlukawski/961aaa7946f55110abfcd37fbe869b8f) going step by step.

## Searching with multiple vectors

If you decided to describe each object with several [neural embeddings](https://qdrant.tech/articles/neural-search-tutorial/), then at each search operation you need to provide the vector name along with the [vector embedding](https://qdrant.tech/articles/what-are-embeddings/), so the engine knows which one to use. The interface of the search operation is pretty straightforward and requires an instance of NamedVector.

```python
from qdrant_client.http.models import NamedVector

text_results = client.search(
   collection_name="ms-coco-2017",
   query_vector=NamedVector(
       name="text",
       vector=row["text_vector"],
   ),
   limit=5,
   with_vectors=False,
   with_payload=True,
)
```

If we, on the other hand, decided to search using the image embedding, then we just provide the vector name we have chosen while creating the collection, so instead of “text”, we would provide “image”, as this is how we configured it at the very beginning.

## The results: image vs text search

Since we have two different vectors describing each object, we can perform the search query using any of those. That shouldn’t be surprising then, that the results are different depending on the chosen embedding method. The images below present the results returned by Qdrant for the image/text on the left-hand side.

### Image search

If we query the system using image embedding, then it returns the following results:

![](/blog/from_cms/0_5nqlmjznjkvdrjhj.webp "Image search results")

### Text search

However, if we use textual description embedding, then the results are slightly different:

![](/blog/from_cms/0_3sdgctswb99xtexl.webp "Text search However, if we use textual description embedding, then the results are slightly different:")

It is not surprising that a method used for creating neural encoding plays an important role in the search process and its quality. If your data points might be described using several vectors, then the latest release of Qdrant gives you an opportunity to store them together and reuse the payloads, instead of creating several collections and querying them separately.

### Summary:

- Qdrant 0.10 introduces efficient vector storage optimization, allowing seamless management of multiple vectors per object within a single collection.
- This update streamlines semantic search capabilities by eliminating the need for separate collections for each vector type, enhancing search accuracy and performance.
- With Qdrant's new features, users can easily configure vector parameters, including size and distance functions, for each vector type, optimizing search results and user experience.


If you’d like to check out some other examples, please check out our [full notebook](https://gist.github.com/kacperlukawski/961aaa7946f55110abfcd37fbe869b8f) presenting the search results and the whole pipeline implementation.