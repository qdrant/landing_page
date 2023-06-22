---
title: "Introducing Qdrant 1.3.0"
short_description: "Check out what Qdrant 1.3 brings to vector search"
description: "Check out what Qdrant 1.3 brings to vector search"
social_preview_image: /articles_data/qdrant-1.3.x/social_preview.png
small_preview_image: /articles_data/qdrant-1.3.x/icon.svg
preview_dir: /articles_data/qdrant-1.3.x/preview
weight: 1
author: David Sertic
author_link: 
date: 
draft: false
keywords:
  - vector search
  - new features
  - oversampling
  - grouping lookup
  - io_uring
  - appendable mmap
  - group requests
---

A brand-new [Qdrant 1.3.0 release](https://github.com/qdrant/qdrant/releases/tag/v1.3.0) comes packed with a plethora of new features, performance improvements and bux fixes:

1. [Oversampling for Quantization:](#oversampling-for-quantization) Improve the accuracy and performance of your queries while using Scalar or Product Quantization
2. [Asynchronous I/O interface:](#asychronous-io-interface) Reduce overhead by managing I/O operations asynchronously, and by minimizing the need for context switches.
3. [Grouping API lookup:](#grouping-api-lookup) Storage optimization method that lets you look for points in another collection using group ids.
4. [Qdrant Web UI:](#qdrant-web-user-interface) A convenient dashboard to help you manage data stored in Qdrant.
5. [Temp directory for Snapshots:](#temporary-directory-for-snapshots) Set a separate storage directory for temporary snapshots on a faster disk.
6. [Other important changes](#important-changes)

Your feedback is valuable to us, and are always tying to include some of your feature requests into our roadmap. Join [our Discord community](https://qdrant.to/discord) and help us build Qdrant!.

## New features

### Oversampling for quantization

We are introducing [oversampling](/documentation/guides/quantization/#oversampling) as a new way to help you improve the accuracy and performance of similarity search algorithms. With this method, you are able to significantly compress high-dimensional vectors in memory and then compensate the accuracy loss by re-scoring additional points with the original vectors. 

You will experience much faster performance with quantization due to parallel disk usage when reading vectors. Much better IO means that you can keep quantized vectors in RAM, so the pre-selection will be even faster. Finally, once pre-selection is done, you can use parallel IO to retrieve original vectors, which is significantly faster than traversing HNSW on slow disks.

#### Set the oversampling factor via query:

Here is how you can configure the oversampling factor - define how many extra vectors should be pre-selected using the quantized index, and then re-scored using original vectors.  

```http
POST /collections/{collection_name}/points/search

{
  "params": {
    "quantization": {
      "ignore": false,
      "rescore": true,
      "oversampling": 2.4
    }
  },
  "vector": [0.2, 0.1, 0.9, 0.7],
  "limit": 100
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.search(
    collection_name="{collection_name}",
    query_vector=[0.2, 0.1, 0.9, 0.7],
    search_params=models.SearchParams(
        quantization=models.QuantizationSearchParams(
            ignore=False,
            rescore=True,
            oversampling=2.4
        )
    )
)
```

In this case, if `oversampling` is 2.4 and `limit` is 100, then 240 vectors will be pre-selected using quantized index, and then the top 100 vectors will be returned after re-scoring.

As you can see from the example above, this parameter is set during the query. This is a flexible method that will let you tune query accuracy. While the index is not changed, you can decide how many points you want to retrieve using quantized vectors.

### Asychronous I/O interface

Going forward, we will support the `io_uring` asychnronous interface for storage devices on Linux-based systems. Since its introduction, `io_uring` has been proven to speed up slow-disk deployments wherever the OS syscall overhead gets too high and the software becomes IO bound.

<aside role="status">This experimental feature works on Linux kernels > 5.4 </aside>

`io_uring` uses a ring buffer data structure to queue and manage I/O operations asynchronously, minimizing the need for context switches and reducing overhead. It supports features like submission and completion queues, event-driven I/O, and batch processing, allowing for efficient handling of I/O events and reducing the CPU overhead associated with traditional I/O.

#### Enable async storage interface from the storage configuration file:

```python
storage:
	# enable the async scorer which uses io_uring
	async_scorer: true
```
You can return to the mmap based backend by either deleting the `async_scorer` entry or setting the value to `false`.

This operation generates a lot of disk IO, so it is a prime candidate for possible improvements.
Please keep in mind that this feature is experimental and that the interface may change in further versions.

### Grouping API lookup

In version 1.2.0, we introduced a mechanism for requesting groups of points. Our new feature extends this functionality by giving you the option to look for points in another collection using the group ids. We wanted to add this feature, since having a single point for the shared data of the same item optimizes storage use, particularly if the payload is large.

This has the extra benefit of having a single point to update when the information shared by the points in a group changes. 

![Group Lookup](/articles_data/qdrant-1.3.x/group-lookup.png)

For example, if you have a collection of documents, you may want to chunk them and store the points for the chunks in a separate collection, making sure that you store the point id from the document it belongs in the payload of the chunk point.

#### Adding the parameter to grouping API request:

When using the [grouping API](#grouping-api), add the `with_lookup` parameter to bring the information from those points into each group:

```http
POST /collections/chunks/points/search/groups
{
    // Same as in the regular search API
    "vector": [1.1],
    ...,
    // Grouping parameters
    "group_by": "document_id",  
    "limit": 2,                 
    "group_size": 2,            
    // Lookup parameters
    "with_lookup": {
        // Name of the collection to look up points in
        "collection_name": "documents",
        // Options for specifying what to bring from the payload 
        // of the looked up point, true by default
        "with_payload": ["title", "text"],
        // Options for specifying what to bring from the vector(s) 
        // of the looked up point, false by default
        "with_vector: false,
    }
}
```

```python
client.search_groups(
    collection_name="chunks",

    # Same as in the regular search() API
    vector=[1.1],
    ...,

    # Grouping parameters
    group_by="document_id", # Path of the field to group by
    limit=2,                # Max amount of groups
    group_size=2,           # Max amount of points per group

    # Lookup parameters
    with_lookup=models.WithLookup(
        # Name of the collection to look up points in
        collection_name="documents",

        # Options for specifying what to bring from the payload 
        # of the looked up point, True by default
        with_payload=["title", "text"]

        # Options for specifying what to bring from the vector(s) 
        # of the looked up point, False by default
        with_vector=False, 
    )
)
```

### Qdrant web user interface

We are excited to announce a more user-friendly way to organize and work with your collections inside of Qdrant. Our dashboard's design is simple, but very intuitive and easy to access.

Try it out now! If you have Docker running, you can [quickstart Qdrant](https://qdrant.tech/documentation/quick-start/) and access the Dashboard locally from [http://localhost:6333/dashboard](http://localhost:6333/dashboard). You should see this simple access point to Qdrant:

![Optional vectors](/articles_data/qdrant-1.3.x/web-ui.png)

### Temporary directory for Snapshots

Currently, temporary snapshot files are created inside the `/storage` directory. Oftentimes `/storage` is a network-mounted disk. Therefore, we found this method suboptimal because `/storage` is limited in disk size and also because writing data to it may affect disk performance as it consumes bandwidth. This new feature allows you to specify a different directory on another disk that is faster. We expect this feature to significantly optimize cloud performance.

To change it, access `config.yaml` and set `storage.temp_path` to another directory location.

## Important changes

The latest release focuses not only on the new features but also introduces some changes making 
Qdrant even more reliable.

### Optimizing group requests

Internally, we improved the way grouping API requests are handled. Specifically, `is_empty` was not using the index when it was called, so it had to deserialize the whole payload to see if the key had values or not. Our new update makes sure to check the index first, before confirming with the payload if it is actually `empty`/`null`, so these changes improve performance only when the negated condition is true (e.g. it improves when the field is not empty).

### Faster read access with mmap

If you used mmap, you most likely found that segments were always created with cold caches. The first request to the database needed to request the disk, which made startup slower despite plenty of RAM being available. We have implemeneted a way to ask the kernel to "heat up" the disk cache and make initialization much master.

The function is expected to be used on startup and after segment optimization and reloading of newly indexed segment. So far this is only implemented for "immutable" memmaps.

## Release notes

As usual, [our release notes](https://github.com/qdrant/qdrant/releases/tag/v1.3.0) describe all the changes 
introduced in the latest version.
