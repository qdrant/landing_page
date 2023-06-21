---
title: "Introducing Qdrant 1.3.x"
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

A brand-new Qdrant 1.3 release comes packed with a plethora of new features, some of which
were highly requested by our users. If you want to shape the development of the Qdrant vector
database, please [join our Discord community](https://qdrant.to/discord) and let us know
how you use it!

## New features

As usual, a minor version update of Qdrant brings some interesting new features. We love to see your 
feedback, and we tried to include the features most requested by our community.

### Introducing oversampling

Oversampling refers to a technique used to improve the accuracy and performance of similarity search algorithms. Vector databases often face challenges when dealing with imbalanced or sparse data distributions. Oversampling is used to address these challenges by artificially increasing the representation of minority or less frequent vectors in the database.

As of 1.3.0, you can set the oversampling factor for quantization. This factor defines how many extra vectors should be pre-selected using the quantized index, and then re-scored using original vectors. For example, if `oversampling` is 2.4 and `limit` is 100, then 240 vectors will be pre-selected using quantized index, and then the top 100 vectors will be returned after re-scoring.

INSERT OVERSAMPLING DIAGRAM

Add more content. Describe how oversampling is used in qdrant.

### Asychronous I/O interface

Going forward, we will support Linux-based systems with the io_uring asychnronous interface for storage devices. io_uring seeks to overcome the limitations of traditional I/O mechanisms like select, poll, and epoll. Since its introduction, io_uring has been proven to speed up slow-disk deployments wherever the OS syscall overhead gets too high and the software becomes IO bound (mostly waiting on disk).

IO URING DIAGRAM

io_uring uses a ring buffer data structure to queue and manage I/O operations asynchronously, minimizing the need for context switches and reducing overhead. It supports features like submission and completion queues, event-driven I/O, and batch processing, allowing for efficient handling of I/O events and reducing the CPU overhead associated with traditional I/O.

So far, Qdrant's use of mmap has been steadily growing in efficiency, in particular via scalar and product-based quantization. However, applying such optimization methods requires that a requantization occurs afterwards. This operation generates a lot of disk IO, so it is a prime candidate for possible improvements.

If you run Qdrant on Linux, you can enable the io_uring based storage backend within the storage configuration file:

```python
storage:
	# enable the async scorer which uses io_uring
	async_scorer: true
```
You can return to the mmap based backend by either deleting the `async_scorer` entry or setting the value to `false`.

### Grouping API lookup

In our last version, we introduced a mechanism for grouping requests. Our new feature gives you the option to look for points in another collection using group ids. We felt it was necessary to add this because Hhaving multiple points for parts of the same item puts strain on the storage space if the payload is large.

However, you may optimizing storage when using groups by storing the information shared by the points with the same group id in a single point in another collection. Then, when using the [**groups** API](#grouping-api), add the `with_lookup` parameter to bring the information from those points into each group.

This has the extra benefit of having a single point to update when the information shared by the points in a group changes. For example, if you have a collection of documents, you may want to chunk them and store the points for the chunks in a separate collection, making sure that you store the point id from the document it belongs in the payload of the chunk point.

INSERT GROUPING API DIAGRAM

### Temporary directory for Snapshots

Currently, temporary snapshot files are created inside the /storage directory. Oftentimes /storage is usually a network-mounted disk. Therefore, we found this method suboptimal because /storage is limited in disk size and also because writing data to it may affect disk performance as it consumes bandwidth. This new feature allows you to specify a different directory on another disk, that is potentially faster. We expect this feature to significantly optimize cloud performance.

To change it, access `config.yaml` and set `storage.temp_path` to another directory location.

## Important changes

The latest release focuses not only on the new features but also introduces some changes making 
Qdrant even more reliable.

### Optimizing value checks

`is_empty` was not using the index when it was called, so it had to deserialize the whole payload to see if the key had values or not. Our new update makes sure to check the index first, before confirming with the payload if it is actually `empty`/`null`, so these changes improve performance only when the negated condition is true (e.g. it improves when the field is not empty).

Show where to change this. SMALL CODE BIT.

### Faster Read Access with mmap

If you used mmap, you most likely found that segments were always created with cold caches. The first request to the database needed to request the disk, which made startup slower despite plenty of RAM being available. We have implemeneted a way to ask the kernel to "heat up" the disk cache and make initialization much master.

The function is expected to be used on startup and after segment optimization and reloading of newly indexed segment. So far this is only implemented for "immutable" memmaps.

## Release notes

As usual, [our release notes](https://github.com/qdrant/qdrant/releases/tag/v1.3.0) describe all the changes 
introduced in the latest version.
