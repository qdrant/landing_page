---
title: Create Dataset Snapshot
weight: 15
---

# Exporting Qdrant collection into snapshots

| Time: 20 min | Level: Beginner |  |    |
|--------------| ----------- | ----------- |----------- |

Snapshots are the best way to export a Qdrant collection, either for backup purposes, or for restoring them, even in a different environment.
They contain not only the vectors with their ids and payloads, but also the internal Qdrant data structures, used to keep the search efficient.

This tutorial will cover all the steps required to import the data into Qdrant collection, and create a snapshot out of it. **Please note, the
process of importing the data strongly depends on the input data format.** In general, all the hints described in the [Bulk Upload Vectors](/documentation/tutorials/bulk-upload/)
tutorial apply here as well.

<aside role=”alert”>Snapshots cannot be created in local mode of Python SDK. You need to spin up Qdrant container or use Qdrant Cloud.</aside>

## Loading data into Qdrant collection

We're going to use part of the [LAION-5B](https://laion.ai/blog/laion-5b/) dataset. Let's install the required dependencies.

```shell
pip install qdrant-client numpy pandas pyarrow
```

### Checking the dataset

We are going to use just 1000 entries of one of the LAION-5B subsets - [laion2b-en-vit-l-14-embeddings](https://huggingface.co/datasets/laion/laion2b-en-vit-l-14-embeddings).
Since we don't want to download the whole dataset, we are going to download just the first batch:

- metadata: https://huggingface.co/datasets/laion/laion2b-en-vit-l-14-embeddings/resolve/main/metadata/metadata_0000.parquet
- image embeddings: https://huggingface.co/datasets/laion/laion2b-en-vit-l-14-embeddings/resolve/main/img_emb/img_emb_0000.npy
- text embeddings: https://huggingface.co/datasets/laion/laion2b-en-vit-l-14-embeddings/resolve/main/text_emb/text_emb_0000.npy

Please create a directory `data` in your working directory and download all the files there. Now, we can read the metadata to see how it looks like:

```python
import pandas as pd

metadata_df = pd.read_parquet("data/metadata_0000.parquet")
print(metadata_df.iloc[0].to_dict())
```

A single row should look like following:

```json
{
  'image_path': '185120009', 
  'caption': 'Color version PULP FICTION alternative poster art', 
  'NSFW': 'UNLIKELY', 
  'similarity': 0.33966901898384094, 
  'LICENSE': '?', 
  'url': 'http://cdn.shopify.com/s/files/1/0282/0804/products/pulp_1024x1024.jpg?v=1474264437', 
  'key': '185120009', 
  'status': 'success', 
  'error_message': null, 
  'width': 384,
  'height': 512, 
  'original_width': 768, 
  'original_height': 1024, 
  'exif': '{"Image Orientation": "Horizontal (normal)", "Image XResolution": "100", "Image YResolution": "100", "Image ResolutionUnit": "Pixels/Inch", "Image YCbCrPositioning": "Centered", "Image ExifOffset": "102", "EXIF ExifVersion": "0210", "EXIF ComponentsConfiguration": "YCbCr", "EXIF FlashPixVersion": "0100", "EXIF ColorSpace": "Uncalibrated", "EXIF ExifImageWidth": "768", "EXIF ExifImageLength": "1024"}', 
  'md5': '46c4bbab739a2b71639fb5a3a4035b36'
}
```

Now, we can iterate through the rows and their corresponding embeddings to store them into Qdrant. We are not going to import a whole batch,
but upload just the first 1000 entries.

```python
import numpy as np

image_embeddings = np.load("data/img_emb_0000.npy")
text_embeddings = np.load("data/text_emb_0000.npy")
```

### Creating a Qdrant collection

First things first, we need to create our collection. We're not going to play with the configuration of it, but it makes sense do it right now. 
The configuration is also a part of the collection snapshot.

```python
from qdrant_client import QdrantClient, models

collection_name = "LAION-5B"

client = QdrantClient("localhost")
client.recreate_collection(
    collection_name=collection_name,
    vectors_config={
        "image": models.VectorParams(
            size=image_embeddings.shape[1], 
            distance=models.Distance.COSINE
        ),
        "text": models.VectorParams(
            size=text_embeddings.shape[1], 
            distance=models.Distance.COSINE
        ),
    },
)
```

### Uploading the data

While loaded, it is pretty straightforward to upload the collection from the precomputed embeddings. Calculating the embeddings is usually
a bottleneck of the vector search pipelines, but we are happy to have them in place already.

```python
client.upload_collection(
    collection_name=collection_name,
    vectors={
        "image": image_embeddings[:1000],
        "text": image_embeddings[:1000],
    },
    payload=metadata_df.iloc[:1000].to_dict(orient="records"),
    batch_size=64,
    parallel=2,
)
```

### Creating a snapshot

Qdrant exposes HTTP endpoint to request creating a snapshot, but we can also call it with the Python SDK.

```python
snapshot_info = client.create_snapshot(collection_name=collection_name)
print(snapshot_info)
```

As a response, we should see a similar output:

```
name='LAION-5B-1217055918586176-2023-07-04-11-51-24.snapshot' creation_time='2023-07-04T11:51:25' size=74202112
```

We can now build the URL to the snapshot in the following manner:

```
{QDRANT_URL}/collections/{collection_name}/snapshots/{snapshot_name}
```

In our case, since we are using a local Docker container, our `collection_name = "LAION-5B"`, and `snapshot_name = "LAION-5B-1217055918586176-2023-07-04-11-51-24.snapshot"`,
the snapshot might be downloaded using the following URL:

```
http://localhost:6333/collections/LAION-5B/snapshots/LAION-5B-1217055918586176-2023-07-04-11-51-24.snapshot
```

<aside role="status">Please consider passing the `wait=True` parameter while creating the snapshot. That operation will process the whole collection, 
so it's expected it needs more time to finish.</aside>

### Listing existing snapshots

Creating a snapshot may take a while. If you encounter any timeout, that doesn't mean the process is not running. You can always
check what are the snapshots available for a particular collection.

```python
snapshots = client.list_snapshots(collection_name=dataset_name)
print(snapshots)
```

This endpoint exposes all the snapshots in the same format as before:

```
[SnapshotDescription(name='LAION-5B-1217055918586176-2023-07-04-11-51-24.snapshot', creation_time='2023-07-04T11:51:25', size=74202112)]
```

We can use the same naming convention to create the URL to download it.
