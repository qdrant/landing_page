---
title: "Data Exploration with Qdrant's Distance Matrix API"
short_description: "Efficient visualization and clusterization of high-dimensional data with Qdrant"
description: "Explore your data under a new angle with Qdrant's tools for dimensionality reduction, clusterization, and visualization."
social_preview_image: /articles_data/distance-based-exploration/preview/social_preview.jpg
preview_dir: /articles_data/distance-based-exploration/preview
weight: 10
author: Andrey Vasnetsov
date: 2025-03-11T12:00:00+03:00
draft: false
keywords:
  - clusterization
  - dimensionality reduction
  - visualization
category: data-exploration
---


## Hidden Structure

When working with large collections of documents, images, or other arrays of unstructured data, it often becomes useful to understand the big picture.
Examining data points individually is not always the best way to grasp the structure of the data.

{{< figure src="/articles_data/distance-based-exploration/no-context-data.png" alt="A table of data points with no visible structure" caption="Datapoints without context, pretty much useless" >}}

As numbers in a table obtain meaning when plotted on a graph, visualizing distances (similar/dissimilar) between unstructured data items can reveal hidden structures and patterns.

{{< figure src="/articles_data/distance-based-exploration/data-on-chart.png" alt="The same data points plotted on a chart, forming visible groups" caption="Visualized chart, very intuitive" >}}

There are many tools to investigate data similarity, and Qdrant's [1.12 release](/blog/qdrant-1.12.x/) made it much easier to start this investigation. With the new [Distance Matrix API](/documentation/search/explore/#distance-matrix), Qdrant handles the most computationally expensive part of the process: calculating the distances between data points.

In many implementations, the distance matrix calculation was part of the clustering or visualization processes, requiring either brute-force computation or building a temporary index. With Qdrant, however, the data is already indexed, so the server can use that index to find the nearest neighbors of each sampled point.

In this article, we will use the Distance Matrix API for dimensionality reduction, clustering, and graph exploration.

## Dimensionality Reduction

Initially, we might want to visualize an entire dataset, or at least a large portion of it, at a glance. However, high-dimensional data cannot be directly visualized. We must apply dimensionality reduction techniques to convert data into a lower-dimensional representation while preserving important data properties.

We will use [UMAP](https://github.com/lmcinnes/umap) as our dimensionality reduction algorithm.

Here is a very simplified but intuitive explanation of UMAP: it finds which points are close to each other in the high-dimensional space, then places them on a 2D plane so that the same points stay close.

{{< island path="content/documentation/headless/distance-matrix/fashion-umap" width="100%" ratio="1 / 1" title="UMAP on the Fashion-MNIST dataset, recreated from the example in the UMAP documentation, [source](https://github.com/lmcinnes/umap?tab=readme-ov-file#performance-and-examples)" >}}
![UMAP of the Fashion-MNIST dataset, with each clothing category forming its own region](/articles_data/distance-based-exploration/umap.png)
{{< /island >}}

UMAP keeps neighborhoods, not exact distances, so the gaps between groups and the size of a group on the plot carry no meaning. It only needs the nearest neighbors of each point, which is what the sparse matrix from Qdrant holds.

Let's use Qdrant to calculate the distance matrix and apply UMAP.
We will use one of the default datasets perfect for experimenting in Qdrant: [Midjourney Styles dataset](https://midlibrary.io/).

Use this command to download and import the dataset into Qdrant:

```http
PUT /collections/midlib/snapshots/recover
{
  "location": "http://snapshots.qdrant.io/midlib.snapshot"
}
```

<details>
<summary>We also need to prepare our python environment:</summary>

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
# For visualization
import seaborn as sns
```

Establish connection to Qdrant:

```python
client = QdrantClient("http://localhost:6333")
```

</details>

After this is done, we can request the matrix. For each of the 1000 sampled points, Qdrant returns the scores of its 20 closest points within the sample, which makes a sparse 1000 by 1000 matrix. The Midlib collection uses the Cosine metric, so the scores are similarities, where a larger score means a closer point.

```python
# Request the matrix from Qdrant.
# The `_offsets` suffix defines the format of the output matrix.
result = client.search_matrix_offsets(
  collection_name="midlib",
  # Select a subset of the data, as the whole dataset might be too large
  sample=1000,
  # For performance reasons, limit the number of closest neighbors to consider
  limit=20,
)

# Convert the matrix to a python-native format.
# An explicit shape keeps the matrix square.
n = len(result.ids)
similarity = csr_matrix(
    (result.scores, (result.offsets_row, result.offsets_col)),
    shape=(n, n),
)

# Make the matrix symmetric, as UMAP expects it.
# A pair often appears in one direction only.
# The maximum fills in the missing direction.
similarity = similarity.maximum(similarity.T)

# UMAP expects distances, where a smaller value means a closer point.
# For the Cosine metric, the distance is 1 - similarity.
distances = similarity.copy()
distances.data = 1 - distances.data
```

With the Euclid metric, the scores are already distances and the last step is not needed.

Now we can apply UMAP to the distances:

```python
umap = UMAP(
    # We provide a ready-made distance matrix
    metric="precomputed",
    # Output dimension
    n_components=2,
    # Same as the limit in the search_matrix_offsets
    n_neighbors=20,
)

vectors_2d = umap.fit_transform(distances)
```

That's all that is needed to get the 2d representation of the data.

{{< island path="content/documentation/headless/distance-matrix/midlib-umap" width="100%" ratio="3 / 2" title="UMAP applied to 1000 sampled items from the Midlib dataset. KMeans clusters colors the same points by the groups found in the Clustering section." >}}
![UMAP map of 1000 Midlib items: one connected cloud of points](/articles_data/distance-based-exploration/umap-midlib.png)
{{< /island >}}

<aside role="status">An interactive version of this plot is available in the <a href="/documentation/web-ui/">Qdrant Web UI</a>. It requests the distance matrix from the server, so raw vectors stay out of the browser, and it supports UMAP, t-SNE, and PCA, coloring points by a payload field, and filters.</aside>

UMAP isn't the only algorithm compatible with our distance matrix API. For example, `scikit-learn` also offers the following, each with its own expectations about the matrix:

- [Isomap](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.Isomap.html) - Non-linear dimensionality reduction through Isometric Mapping. Use `metric="precomputed"` with `distances`. It needs `n_neighbors` smaller than `limit`, such as 19.
- [SpectralEmbedding](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.SpectralEmbedding.html) - Forms an affinity matrix given by the specified function and applies spectral decomposition to the corresponding graph Laplacian. Use `affinity="precomputed"` with `similarity`, as an affinity is larger for closer points.
- [TSNE](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.TSNE.html) - well-known algorithm for dimensionality reduction. Use `metric="precomputed"` with `distances`, `init="random"`, and a `perplexity` of at most `(limit - 2) / 3`, which is 6 for `limit=20`.

## Clustering

Another approach to data structure understanding is clustering, which groups similar items.

*Note that there's no universally best clustering criterion or algorithm.*

{{< island path="content/documentation/headless/distance-matrix/sklearn-clustering" width="100%" ratio="4 / 5" title="Six of the clustering algorithms compared in the scikit-learn example, recreated on the same toy datasets. The [full example](https://scikit-learn.org/stable/auto_examples/cluster/plot_cluster_comparison.html) compares eleven." >}}
![Six clustering algorithms applied to six two-dimensional datasets](/articles_data/distance-based-exploration/clustering.png)
{{< /island >}}

Let's consider a simple example of clustering the Midlib dataset with the KMeans algorithm.

KMeans does not take a distance matrix. Its [`fit()` method](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html) takes a table of features with shape `(n_samples, n_features)`, and a sparse matrix is accepted. So we pass `similarity` as that table: each row describes one sampled point by its similarity to all 1000 sampled points, with zeros for the points outside its 20 closest.

This is a different representation of the data, not the original 512-dimensional embeddings. KMeans groups the points that have similar neighbors, so the clusters can differ from the ones KMeans would find in the embeddings themselves, and a cluster center is a point in the similarity space, not a vector from the collection.

We use `similarity` rather than `distances` because a missing entry reads as zero, which means "not similar" in the first matrix and "identical" in the second.

```python
from sklearn.cluster import KMeans

# Initialize KMeans with 10 clusters
kmeans = KMeans(n_clusters=10)

# Generate index of the cluster each sample belongs to
cluster_labels = kmeans.fit_predict(similarity)
```

With this simple code, we have clustered the data into 10 clusters, while Qdrant did the neighbor search. Algorithms that work on the neighbor graph directly, such as [SpectralClustering](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.SpectralClustering.html) with `affinity="precomputed"`, accept `similarity` as is.

Select KMeans clusters on the Midlib map in the Dimensionality Reduction section to see these clusters drawn on the UMAP layout.


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
However, they share a common characteristic: they require a training step before the results can be visualized.

This also means that new data points require re-running the training step, which can be expensive.

Graphs are an alternative approach to data exploration: they show the relationships between data points directly and interactively.
In a graph representation, each data point is a node, and similarities between data points are represented as edges connecting the nodes.

Such a graph can be rendered in real-time using [force-directed layout](https://en.wikipedia.org/wiki/Force-directed_graph_drawing) algorithms, which aim to minimize the system's energy by repositioning nodes dynamically. The more similar the data points are, the stronger the edges between them.

Adding new data points to the graph is as straightforward as inserting new nodes and edges without the need to re-run any training steps.

In practice, rendering a graph for an entire dataset at once may be computationally expensive and overwhelming for the user. Therefore, let's explore a few strategies to address this issue.

### Expanding from a single node

This is the simplest approach, where we start with a single node and expand the graph by adding the most similar nodes to the graph.

{{< figure src="/articles_data/distance-based-exploration/graph.gif" alt="Graph" caption="Graph representation of the data" >}}

<aside role="status">An interactive version of this plot is available in <a href="/documentation/web-ui/">Qdrant Web UI</a>.</aside>

### Sampling from a collection

Expanding a single node works well if you want to explore neighbors of a single point, but what if you want to explore the whole dataset?
If your dataset is small enough, you can render relations for all the data points at once. But it is a rare case in practice.

Instead, we can sample a subset of the data and render the graph for this subset.
This way, we can get a good overview of the data without overwhelming the user with too much information.

Let's try to do so in [Qdrant's Graph Exploration Tool](/blog/qdrant-1.11.x/#web-ui-graph-exploration-tool):

```json
{
  "limit": 5, # node neighbors to consider
  "sample": 100 # nodes
}
```

{{< figure src="/articles_data/distance-based-exploration/graph-sampled.png" alt="A sampled graph of the collection, with points linked to their nearest neighbors" caption="Graph representation of the data ([Qdrant's Graph Exploration Tool](/blog/qdrant-1.11.x/#web-ui-graph-exploration-tool))">}}

This graph captures some high-level structure of the data, but as you might have noticed, it is quite noisy.
This is because the differences in similarities are relatively small, and they might be overwhelmed by the stretches and compressions of the force-directed layout algorithm.

To make the graph more readable, let's concentrate on the most important similarities and build a so-called [Minimum/Maximum Spanning Tree](https://en.wikipedia.org/wiki/Minimum_spanning_tree).

```json
{
  "limit": 5,
  "sample": 100,
  "tree": true
}
```

{{< figure src="/articles_data/distance-based-exploration/spanning-tree.png" alt="A spanning tree of the sampled graph, with one path connecting all points" caption="Spanning tree of the graph ([Qdrant's Graph Exploration Tool](/blog/qdrant-1.11.x/#web-ui-graph-exploration-tool))" width="80%" >}}

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

Vector similarity goes beyond looking up the nearest neighbors. It also gives you a tool for data exploration.
Many algorithms can construct human-readable data representations, and Qdrant supplies the neighbor data they need.

The Qdrant Web UI includes data exploration tools ([Visualization and Graph Exploration Tools](/articles/web-ui-gsoc/)), and for more advanced use cases, you can call the Distance Matrix API directly.

The same distances also help to find mislabeled and out-of-place items in a categorized dataset, as shown in [Detecting Dataset Errors with Similarity Search](/articles/dataset-quality/).

Try it on your own collection and see which groups show up.
