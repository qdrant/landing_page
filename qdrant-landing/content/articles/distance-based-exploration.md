---
title: "Distance-based data exploration"
short_description: "Efficient visualization and clusterization of high-dimensional data with Qdrant"
description: "Explore your data under a new angle with Qdrant's tools for dimensionality reduction, clusterization, and visualization."
social_preview_image: /articles_data/distance-based-exploration/social-preview.jpg
preview_dir: /articles_data/distance-based-exploration/preview
weight: -250
author: Qdrant team
date: 2024-10-20T12:00:00+03:00
draft: false
keywords:
  - clusterization
  - dimensionality reduction
  - vizualization
---


## Hidden Structure

When working with large collections of documents, images or other arrays of unstructured data, it ofter becomes useful to understand the big picture.
Looking at datapoints one by one is not always the best way to understand the structure of the data.

{{< figure src="/articles_data/distance-based-exploration/no-context-data.png" alt="Data visualization" caption="Datapoints without context, pretty much useless" >}}

Similar to how numbers in a table obtain meaning when plotted on a graph, similarities between items of the unstructured data can reveal hidden structures and patterns.

{{< figure src="/articles_data/distance-based-exploration/data-on-chart.png" alt="Data visualization" caption="Vizualized chart, very intuitive" >}}

There are many tools to investigate data similarity, but with the latest release of Qdrant it became much easier to start working with them.
With the new [Distance Matrix API](/documentation/concepts/explore/#distance-matrix), Qdrant takes care of the most computationally expensive part of the process - calculating the distances between data points.

In many implementations, the distance matrix was calculated on the same process that performed the clustering or visualization, but that either required a brute-force computation or building a temporary index.
With Qdrant, on the other hand, the data is already indexed and distance matrix can be calculated relatively cheaply.

In this article we will take a look at a few ways to explore the data using the distance matrix API.

## Dimensionality Reduction

As a first instinct, we might want have an ability to look at the whole dataset, or at least a large part of it, with a single glance.
But when the data is high-dimensional, it is not possible to visualize it directly. We need to apply a technique called dimensionality reduction.
Dimensionality reduction allows us to convert high-dimensional data into a lower-dimensional representation, while preserving the most important properties of the data.

In this article we will use the [UMAP](https://github.com/lmcinnes/umap) as our dimensionality reduction algorithm of choice.
It will be very easy to understand why we chose UMAP, if we quickly recap how it works.

Here is a **very** simplified, but intuitive explanation of UMAP:

1. *Randomply generate points in the 2d space*: for each high-dimensional point, generate a random 2d point.
1. *Generate distance matrix for the the high-dimensional points*: calculate distances between all pairs of points.
1. *Generate distance matrix for the 2d points*:  the same way as in the high-dimensional space.
1. *Try to match both distance matricies to each other*: move 2d points around until the difference is minimized.

{{< figure src="/articles_data/distance-based-exploration/umap.png" alt="UMAP" caption="Canonical example of UMAP results, [source](https://github.com/lmcinnes/umap?tab=readme-ov-file#performance-and-examples)" >}}

As you can see, UMAP tries to preserve the relative distances between points in the high-dimensional space, while the actual high-dimensional coordinates are not important.
In fact, we can skip the second step completely if we have the distance matrix already calculated.

Let's see how we can use Qdrant to calculate the distance matrix and then apply UMAP to it.
We will one of the default datasets that come with Qdrant - Midjourney Styles dataset.

Use this command to download the dataset and import it into Qdrant:

```http
PUT /collections/midlib/snapshots/recover
{
  "location": "http://snapshots.qdrant.io/midlib.snapshot"
}
```

<details>
<summary>We also need to prepare our python enviroment</summary>

```bash
pip install umap-learn seaborn matplotlib qdrant-client
```

Import the necessary libraries:

```python
# Used to talk to Qdrant
from qdrant_client import QdrantClient
# Package with original UMAP implementation
from umap import UMAP
# Python implementation for sparse matrices
from scipy.sparse import csr_matrix
# For vizualization
import seaborn as sns
```

Establish connection to Qdrant:

```python
qdrant = QdrantClient("http://localhost:6333")
```

</details>

After this is done, we can compute the distance matrix:

```python

# Request distances matrix from Qdrant
# `_offsets` suffix defines a format of the output matrix.
result = client.search_matrix_offsets(
  collection_name="midlib",
  sample=1000, # Select subset of the data, as whole dataset might be too large
  limit=20, # For performance reasons, limit number of closest neighbors to consider
)

# Convert distances matrix to python-native format 
matrix = csr_matrix(
    (result.scores, (result.offsets_row, result.offsets_col))
)

# Make matrix symmetric, as UMAP expects it.
# Distance matrix is always symmetric, but qdrant only computes half of it.
matrix = matrix + matrix.T
```

Now we can apply UMAP to the distance matrix:

```python
umap = UMAP(
    metric="precomputed", # We providing ready made distance matrix
    n_components=2, # output dimension
    n_neighbors=20, # Same as limit in the search_matrix_offsets
)

vectors_2d = umap.fit_transform(matrix)
```

That's all that is needed to get the 2d representation of the data.

{{< figure src="/articles_data/distance-based-exploration/umap-midlib.png" alt="UMAP on Midlib" caption="UMAP applied to Midlib dataset" >}}

<aside role="status">Interactive version of this plot is available in Qdrant Web UI!</aside>

UMAP is not the only dimensionality reduction algorithm, compatible with Sparse Distance Matrix input.

Sci-kit learn has a list of algorithms that can work with precomputed distances:

- [Isomap](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.Isomap.html) - Non-linear dimensionality reduction through Isometric Mapping
- [SpectralEmbedding](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.SpectralEmbedding.html) - Forms an affinity matrix given by the specified function and applies spectral decomposition to the corresponding graph laplacian.
- [TSNE](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.TSNE.html) - well-known algorithm for dimensionality reduction

and multiple others.

## Clustering

ToDo

## Graphs

### Global Graph

ToDo

### Response Graph

ToDo