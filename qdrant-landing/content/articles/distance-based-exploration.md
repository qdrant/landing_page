---
title: "Distance-based data exploration"
short_description: "Efficient visualization and clusterization of high-dimensional data with Qdrant"
description: "Explore your data under a new angle with Qdrant's tools for dimensionality reduction, clusterization, and visualization."
social_preview_image: /articles_data/distance-based-exploration/social-preview.jpg
preview_dir: /articles_data/distance-based-exploration/preview
weight: -250
author: Andrey Vasnetsov
date: 2025-03-11T12:00:00+03:00
draft: false
keywords:
  - clusterization
  - dimensionality reduction
  - vizualization
category: data-exploration
---


## Hidden Structure

When working with large collections of documents, images, or other arrays of unstructured data, it often becomes useful to understand the big picture.
Examining data points individually is not always the best way to grasp the structure of the data.

{{< figure src="/articles_data/distance-based-exploration/no-context-data.png" alt="Data visualization" caption="Datapoints without context, pretty much useless" >}}

As numbers in a table obtain meaning when plotted on a graph, visualising distances (similar/dissimilar) between unstructured data items can reveal hidden structures and patterns.

{{< figure src="/articles_data/distance-based-exploration/data-on-chart.png" alt="Data visualization" caption="Vizualized chart, very intuitive" >}}
There are many tools to investigate data similarity, and Qdrant's [1.12 release](https://qdrant.tech/blog/qdrant-1.12.x/) made it much easier to start this investigation.  With the new [Distance Matrix API](/documentation/concepts/explore/#distance-matrix), Qdrant handles the most computationally expensive part of the process—calculating the distances between data points.

In many implementations, the distance matrix calculation was part of the clustering or visualization processes, requiring either brute-force computation or building a temporary index. With Qdrant, however, the data is already indexed, and the distance matrix can be computed relatively cheaply.

In this article, we will explore several methods for data exploration using the Distance Matrix API.

## Dimensionality Reduction

Initially, we might want to visualize an entire dataset, or at least a large portion of it, at a glance. However, high-dimensional data cannot be directly visualized. We must apply dimensionality reduction techniques to convert data into a lower-dimensional representation while preserving important data properties.

In this article, we will use [UMAP](https://github.com/lmcinnes/umap) as our dimensionality reduction algorithm.

Here is a **very** simplified but intuitive explanation of UMAP:

1. *Randomly generate points in 2D space*: Assign a random 2D point to each high-dimensional point.
2. *Compute distance matrix for high-dimensional points*: Calculate distances between all pairs of points.
3. *Compute distance matrix for 2D points*: Perform similarly to step 2.
4. *Match both distance matrices*: Adjust 2D points to minimize differences.

{{< figure src="/articles_data/distance-based-exploration/umap.png" alt="UMAP" caption="Canonical example of UMAP results, [source](https://github.com/lmcinnes/umap?tab=readme-ov-file#performance-and-examples)" >}}

UMAP preserves the relative distances between high-dimensional points; the actual coordinates are not essential. If we already have the distance matrix, step 2 can be skipped entirely.

Let's use Qdrant to calculate the distance matrix and apply UMAP.
We will use one of the default datasets perfect for experimenting in Qdrant--[Midjourney Styles dataset](https://midlibrary.io/).

Use this command to download and import the dataset into Qdrant:

```http
PUT /collections/midlib/snapshots/recover
{
  "location": "http://snapshots.qdrant.io/midlib.snapshot"
}
```

<details>
<summary>We also need to prepare our python enviroment:</summary>

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
client = QdrantClient("http://localhost:6333")
```

</details>

After this is done, we can compute the distance matrix:

```python

# Request distances matrix from Qdrant
# `_offsets` suffix defines a format of the output matrix.
result = client.search_matrix_offsets(
  collection_name="midlib",
  sample=1000, # Select a subset of the data, as the whole dataset might be too large
  limit=20, # For performance reasons, limit the number of closest neighbors to consider
)

# Convert distances matrix to python-native format 
matrix = csr_matrix(
    (result.scores, (result.offsets_row, result.offsets_col))
)

# Make the matrix symmetric, as UMAP expects it.
# Distance matrix is always symmetric, but qdrant only computes half of it.
matrix = matrix + matrix.T
```

Now we can apply UMAP to the distance matrix:

```python
umap = UMAP(
    metric="precomputed", # We provide ready-made distance matrix
    n_components=2, # output dimension
    n_neighbors=20, # Same as the limit in the search_matrix_offsets
)

vectors_2d = umap.fit_transform(matrix)
```

That's all that is needed to get the 2d representation of the data.

{{< figure src="/articles_data/distance-based-exploration/umap-midlib.png" alt="UMAP on Midlib" caption="UMAP applied to Midlib dataset" >}}

<aside role="status">Interactive version of this plot is available in <a href="https://qdrant.tech/documentation/web-ui/"> Qdrant Web UI </a>!</aside>

UMAP isn't the only algorithm compatible with our distance matrix API. For example, `scikit-learn` also offers:

- [Isomap](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.Isomap.html) - Non-linear dimensionality reduction through Isometric Mapping.
- [SpectralEmbedding](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.SpectralEmbedding.html) - Forms an affinity matrix given by the specified function and applies spectral decomposition to the corresponding graph Laplacian.
- [TSNE](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.TSNE.html) - well-known algorithm for dimensionality reduction.

## Clustering

Another approach to data structure understanding is clustering--grouping similar items.

*Note that there's no universally best clustering criterion or algorithm.*

{{< figure src="/articles_data/distance-based-exploration/clustering.png" alt="Clustering" caption="Clustering example, [source](https://scikit-learn.org/)" width="80%" >}}

Many clustering algorithms accept precomputed distance matrix as input, so we can use the same distance matrix we calculated before.

Let's consider a simple example of clustering the Midlib dataset with **KMeans algorithm**.

From [scikit-learn.cluster documentation](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html) we know that `fit()` method of KMeans algorithm prefers as an input: 


> `X : {array-like, sparse matrix} of shape (n_samples, n_features)`:  
> Training instances to cluster. It must be noted that the data will be converted to C ordering, which will cause a memory copy if the given data is not C-contiguous. If a sparse matrix is passed, a copy will be made if it’s not in CSR format.


So we can re-use `matrix` from the previous example:


```python
from sklearn.cluster import KMeans

# Initialize KMeans with 10 clusters
kmeans = KMeans(n_clusters=10)

# Generate index of the cluster each sample belongs to
cluster_labels = kmeans.fit_predict(matrix)
```

With this simple code, we have clustered the data into 10 clusters, while the main CPU-intensive part of the process was done by Qdrant.

{{< figure src="/articles_data/distance-based-exploration/clustering-midlib.png" alt="Clustering on Midlib" caption="Clustering applied to Midlib dataset" >}}


<details>
<summary>How to plot this chart</summary>

```python
sns.scatterplot(
    # Coordinates obtained from UMAP
    x=vectors_2d[:, 0], y=vectors_2d[:, 1],
    # Color datapoints by cluster
    hue=cluster_labels,
    palette=sns.color_palette("pastel", 10),
    legend="full",
)
```
</details>


## Graphs

Clustering and dimensionality reduction both aim to provide a more transparent overview of the data.
However, they share a common characteristic - they require a training step before the results can be visualized.

This also implies that introducing new data points necessitates re-running the training step, which may be computationally expensive.

Graphs offer an alternative approach to data exploration, enabling direct, interactive visualization of relationships between data points.
In a graph representation, each data point is a node, and similarities between data points are represented as edges connecting the nodes.

Such a graph can be rendered in real-time using [force-directed layout](https://en.wikipedia.org/wiki/Force-directed_graph_drawing) algorithms, which aim to minimize the system's energy by repositioning nodes dynamically--the more similar the data points are, the stronger the edges between them.

Adding new data points to the graph is as straightforward as inserting new nodes and edges without the need to re-run any training steps.

In practice, rendering a graph for an entire dataset at once may be computationally expensive and overwhelming for the user. Therefore, let's explore a few strategies to address this issue.

### Expanding from a single node

This is the simplest approach, where we start with a single node and expand the graph by adding the most similar nodes to the graph.

{{< figure src="/articles_data/distance-based-exploration/graph.gif" alt="Graph" caption="Graph representation of the data" >}}

<aside role="status">An interactive version of this plot is available in <a href="https://qdrant.tech/documentation/web-ui/"> Qdrant Web UI </a>!</aside>

### Sampling from a collection

Expanding a single node works well if you want to explore neighbors of a single point, but what if you want to explore the whole dataset?
If your dataset is small enough, you can render relations for all the data points at once. But it is a rare case in practice.

Instead, we can sample a subset of the data and render the graph for this subset.
This way, we can get a good overview of the data without overwhelming the user with too much information.

Let's try to do so in [Qdrant's Graph Exploration Tool](https://qdrant.tech/blog/qdrant-1.11.x/#web-ui-graph-exploration-tool):

```json
{
  "limit": 5, # node neighbors to consider
  "sample": 100 # nodes
}
```

{{< figure src="/articles_data/distance-based-exploration/graph-sampled.png" alt="Graph" caption="Graph representation of the data ([Qdrant's Graph Exploration Tool](https://qdrant.tech/blog/qdrant-1.11.x/#web-ui-graph-exploration-tool))">}}

This graph captures some high-level structure of the data, but as you might have noticed, it is quite noisy.
This is because the differences in similarities are relatively small, and they might be overwhelmed by the stretches and compressions of the force-directed layout algorithm.

To make the graph more readable, let's concentrate on the most important similarities and build a so called [Minimum/Maximum Spanning Tree](https://en.wikipedia.org/wiki/Minimum_spanning_tree).

```json
{
  "limit": 5,
  "sample": 100,
  "tree": true
}
```

{{< figure src="/articles_data/distance-based-exploration/spanning-tree.png" alt="Graph" caption="Spanning tree of the graph ([Qdrant's Graph Exploration Tool](https://qdrant.tech/blog/qdrant-1.11.x/#web-ui-graph-exploration-tool))" width="80%" >}}

This algorithm will only keep the most important edges and remove the rest while keeping the graph connected.
By doing so, we can reveal clusters of the data and the most important relations between them.

In some sense, this is similar to hierarchical clustering, but with the ability to interactively explore the data.
Another analogy might be a dynamically constructed mind map.


<!--

We can talk about building graphs for search response as well, but it would require experiments
and this article is stale already. Maybe later we can either extend this or create a new article.

**Using search response**


ToDo

-->

## Conclusion

Vector similarity goes beyond looking up the nearest neighbors--it provides a powerful tool for data exploration.
Many algorithms can construct human-readable data representations, and Qdrant makes using them easy.

Several data exploration instruments are available in the Qdrant Web UI ([Visualization and Graph Exploration Tools](https://qdrant.tech/articles/web-ui-gsoc/)), and for more advanced use cases, you could directly utilise our distance matrix API.

Try it with your data and see what hidden structures you can reveal!
