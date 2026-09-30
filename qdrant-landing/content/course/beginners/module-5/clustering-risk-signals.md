---
title: "Clustering Risk Signals"
short_description: "Module 5 of the Beginner Course: group signals describing the same event across sources."
description: "Cluster signals that describe the same underlying event even when they arrive from different sources, using the shared text vector on every point."
weight: 6
isLesson: true
---

{{< date >}} Module 5 {{< /date >}}

# Clustering Risk Signals

Clustering groups signals that describe the same underlying event, even when they arrive from different sources. A factory fire appears in a local news article, a captioned satellite image, and an earnings call answer. Because [Ingestion Pipeline](/course/beginners/module-5/ingestion-pipeline/) put a `text_dense` vector on all three, clustering can surface them as one event.

Qdrant uses the word for one other thing: a Qdrant Cloud cluster is the deployment that holds your collection. The clustering in this section runs in your own code, over the vectors already stored there.

This is the one part of the capstone that Modules 1 through 4 did not teach. Everything else here is a bigger version of something you have already built.

### The Clustering Approach

- **Cluster assignment**: retrieve the day's vectors with `scroll`, run a lightweight k-means (a standard algorithm that groups vectors around k center points) over them, and write a `cluster_id` back to each point.
- **Centroids**: a cluster's center point is itself a vector. Query with it to pull in older signals about the same theme.
- **Cross-supplier clustering**: run the same job with no `supplier_id` filter to find themes affecting many suppliers at once.

### Retrieving Signals for a Supplier

`scroll` returns one page at a time, so page until it hands back a null offset. A single capped call would silently cluster a busy supplier on partial data.

```python
import numpy as np
from datetime import datetime, timedelta, timezone

def get_supplier_signals_last_24h(supplier_id: str):
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    scroll_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="supplier_id", match=models.MatchValue(value=supplier_id),
            ),
            models.FieldCondition(
                key="published_at", range=models.DatetimeRange(gte=since),
            ),
        ]
    )

    points, offset = [], None
    while True:
        batch, offset = client.scroll(
            collection_name="supplier_signals",
            scroll_filter=scroll_filter,
            with_vectors=True,        # needed to compute centroids
            limit=256,
            offset=offset,
        )
        points.extend(batch)
        if offset is None:            # no further pages
            break
    return points

def dense_matrix(points):
    """text_dense vectors, with the point IDs they belong to."""
    ids, vecs = [], []
    for p in points:
        # A signal with no text at all, an uncaptioned image, has no text_dense
        # vector and drops out here. That is why ingestion captions images.
        if p.vector and "text_dense" in p.vector:
            ids.append(p.id)
            vecs.append(p.vector["text_dense"])
    if not vecs:
        return [], None
    return ids, np.asarray(vecs, dtype=np.float32)
```

The collection stores `text_dense` with cosine distance, and Qdrant normalizes vectors on upload for cosine, so what comes back from `scroll` is already unit length. That matters for k-means, which measures Euclidean distance: on unit vectors, Euclidean distance and cosine distance rank pairs the same way, so no extra normalization step is needed here.

### Writing Cluster IDs Back to Payload

```python
from sklearn.cluster import KMeans

def cluster_and_tag(supplier_id: str, n_clusters: int = 5):
    points   = get_supplier_signals_last_24h(supplier_id)
    ids, arr = dense_matrix(points)

    if arr is None or len(ids) < n_clusters:
        return None  # not enough signals to cluster meaningfully

    model = KMeans(
        n_clusters=n_clusters,
        n_init=10,
        random_state=42,    # reproducible runs while you're learning
    ).fit(arr)

    # One call per cluster, not one per point
    for label in sorted(set(int(l) for l in model.labels_)):
        client.set_payload(
            collection_name="supplier_signals",
            payload={"cluster_id": label},
            points=[pid for pid, l in zip(ids, model.labels_) if int(l) == label],
        )
    return model.cluster_centers_
```

A fixed `n_clusters=5` is a placeholder, not a recommendation. The number of distinct risk themes in a day varies by supplier, so treat k as something to evaluate rather than a constant.

### Querying With a Centroid

A centroid is just a vector, so it can be a query. This is how you find older signals about a theme that only became visible today:

```python
def signals_like_cluster(centroid, limit: int = 20):
    return client.query_points(
        collection_name="supplier_signals",
        query=centroid.tolist(),
        using="text_dense",
        limit=limit,
        with_payload=True,
    )

centroids = cluster_and_tag("SUP-7291")
if centroids is not None:
    matches = signals_like_cluster(centroids[0])
```

A centroid is the mean of unit vectors, so it is not unit length itself. That costs you nothing here, because Qdrant normalizes query vectors on a cosine collection, and it can be passed straight in.

### Reading a Cluster Back

This is what indexing `cluster_id` bought you. One integer on each point turns a night of clustering into a view an analyst can page through:

```python
def signals_in_cluster(supplier_id: str, cluster_id: int):
    """Every signal the daily job put in one cluster."""
    points, _ = client.scroll(
        collection_name="supplier_signals",
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="supplier_id", match=models.MatchValue(value=supplier_id),
                ),
                models.FieldCondition(
                    key="cluster_id", match=models.MatchValue(value=cluster_id),
                ),
            ]
        ),
        limit=50,
    )
    return points
```
