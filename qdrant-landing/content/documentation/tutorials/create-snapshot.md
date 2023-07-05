---
title: Create Dataset Snapshot
weight: 14
---

# Exporting Qdrant collections into snapshots

| Time: 20 min | Level: Beginner |  |    |
|--------------| ----------- | ----------- |----------- |

The best way to export a Qdrant collection is to create a snapshot of it. Then, you may use the snapshot to backup or restore your collection to whichever environment you see fit. 
Snapshots contain vectors with their ids and payloads, as well as internal Qdrant data structures used to keep the search efficient.

This tutorial will show you how to import the data into a Qdrant collection and create a snapshot from it. 

Please note that the process of importing the data strongly depends on the input data format. All the tips from the [Bulk Upload Vectors](/documentation/tutorials/bulk-upload/) tutorial also apply here.

<aside role="status">Snapshots cannot be created in local mode of Python SDK. You need to spin up a Qdrant Docker container or use Qdrant Cloud.</aside>

## Prerequisites

The sample dataset for this tutorial is [LAION-5B](https://laion.ai/blog/laion-5b/). We are going to use the first 1000 entries from the subset - [laion2b-en-vit-l-14-embeddings](https://huggingface.co/datasets/laion/laion2b-en-vit-l-14-embeddings). Since we don't want to download the whole dataset, we are going to download just the first batch:

- metadata: https://huggingface.co/datasets/laion/laion2b-en-vit-l-14-embeddings/resolve/main/metadata/metadata_0000.parquet
- image embeddings: https://huggingface.co/datasets/laion/laion2b-en-vit-l-14-embeddings/resolve/main/img_emb/img_emb_0000.npy
- text embeddings: https://huggingface.co/datasets/laion/laion2b-en-vit-l-14-embeddings/resolve/main/text_emb/text_emb_0000.npy


## Initial setup

Install the required dependencies.

```shell
pip install qdrant-client numpy pandas pyarrow
```

Create a subdirectory `data` in your working directory and download all the datasets there.

Next, print the metadata from your dataset to see how it looks:

```python
import pandas as pd

metadata_df = pd.read_parquet("data/metadata_0000.parquet")
print(metadata_df.iloc[0].to_dict())
```

A single row should look like this:

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

## Create a collection

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

## Upload the dataset

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

## Create a snapshot

Qdrant exposes HTTP endpoint to request creating a snapshot, but we can also call it with the Python SDK. Creating a snapshot may take a while. If you encounter any timeout, that doesn't mean the process is not running.

```python
snapshot_info = client.create_snapshot(collection_name=collection_name)
print(snapshot_info)
```

<aside role="status">You may get a timeout error. The process is still running, but creating a snapshot may take a while.</aside>

As a response, we should see a similar output:

```python
name='LAION-5B-1217055918586176-2023-07-04-11-51-24.snapshot' creation_time='2023-07-04T11:51:25' size=74202112

```

## List all snapshots
You can always check what are the snapshots available for a particular collection.

```python
snapshots = client.list_snapshots(collection_name=dataset_name)
print(snapshots)
```

This endpoint exposes all the snapshots in the same format as before:

```python
[SnapshotDescription(name='LAION-5B-1217055918586176-2023-07-04-11-51-24.snapshot', creation_time='2023-07-04T11:51:25', size=74202112)]
```

We can use the same naming convention to create the URL to download it.

## Download the snapshot

We can now build the URL to the snapshot in the following manner:

```bash
{QDRANT_URL}/collections/{collection_name}/snapshots/{snapshot_name}
```

In our case, since we are using a local Docker container, our `collection_name = "LAION-5B"`, and `snapshot_name = "LAION-5B-1217055918586176-2023-07-04-11-51-24.snapshot"`,
the snapshot might be downloaded using the following URL:

```bash
http://localhost:6333/collections/LAION-5B/snapshots/LAION-5B-1217055918586176-2023-07-04-11-51-24.snapshot
```


