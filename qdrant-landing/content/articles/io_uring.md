---
title: "Qdrant under the hood: io_uring"
short_description: "The linux io_uring API offers great performance in certain cases. Here's how Qdrant uses it!"
description: "Slow disk decelerating your Qdrant deployment? Get on top of IO overhead with this one trick!"
social_preview_image: /articles_data/io_uring/social_preview.png
small_preview_image: /articles_data/io_uring/io_uring-icon.svg
preview_dir: /articles_data/io_uring/preview
weight: 1
author: Andre Bogus
author_link: https://llogiq.github.io
date: 2023-06-21T09:45:00+02:00
draft: false
keywords:
  - vector search
  - linux
  - optimization
aliases: [ /articles/io-uring/ ]
---

With Qdrant [1.3.0](https://github.com/qdrant/qdrant/releases/tag/v1.3.0) we
introduce the alternative io\_uring based *async uring* storage backend on
Linux-based systems. Since its introduction, io\_uring has promised to improve
async throughput wherever the OS syscall overhead gets too high, which will
often occur in situations where software becomes *IO bound* (that is, mostly
waiting on disk).

## Storage and IO

Qdrant can store everything in memory, but it's often advisable to store data
to disk, so that it can survive a reboot and memory requirements can be reduced
(at the cost of some performance and disk requirements). Before io\_uring,
Qdrant used mmap to do its IO. This leads to some modest overhead (because the
kernel needs to continuously write back changes from memory to disk), but works
quite well with the asynchronous nature of Qdrant's core.

One of the great optimization tricks Qdrant pulls is quantization (either
scalar or [product](https://qdrant.tech/articles/product-quantization/)-based).
However, to apply this optimization after the fact, a *requantization* is
required. This operation generates a lot of disk IO (unless the collection
resides fully in memory, of course), so it is a prime candidate for possible
improvements.

If you run Qdrant on linux, you can enable the io\_uring based storage backend
with the following in your configuration:

```yaml
# within the storage config
storage:
	# enable the async scorer which uses io_uring
	async_scorer: true
```

You can return to the mmap based backend by either deleting the `async_scorer`
entry or setting the value to `false`.

## Benchmarks

To run the benchmark, use a test instance of Qdrant; if necessary spin up a
docker container and load a snapshot of the collection you want to benchmark
with. You can copy and edit the following bash script to run the benchmark.

```bash
export QDRANT_URL="<qdrant url>"
export COLLECTION="<collection name>"
# disable quantization to prepare for the test
time seq 1000 | xargs -P 4 -I {} curl -L -X POST \
	"http://${QDRANT_URL}/collections/${COLLECTION}/points/recommend" \
	-H 'Content-Type: application/json' --data-raw \
	'{ "limit": 10, "positive": [{}], "params": { "quantization": { "rescore": true  } } }' \
	-s | jq .status | wc -l

time seq 1000 2000 | xargs -P 4 -I {} curl -L -X POST \
	"${QDRANT_URL}/collections/${COLLECTION}/points/recommend" \
	-H 'Content-Type: application/json' --data-raw \
	'{ "limit": 10, "positive": [{}], "params": { "quantization": { "rescore": true  } } }' \
	-s | jq .status | wc -l

time seq 2000 3000 | xargs -P 4 -I {} curl -L -X POST \
	"${QDRANT_URL}/collections/${COLLECTION}/points/recommend" \
	-H 'Content-Type: application/json' --data-raw \
	'{ "limit": 10, "positive": [{}], "params": { "quantization": { "rescore": true  } } }' \
	-s | jq .status | wc -l
```

Run this script twice, once without enabling `storage.async_scorer` and once
with it enabled. You can measure IO usage with `iostat` from another console.

TODO: Insert Andreys benchmark results here.

## Discussion

The use of io\_uring is not without drawbacks. Notably, the API is quite young,
and recently google rolled back its deployment in Android, ChromeOS and their
servers. [Money quote](https://security.googleblog.com/2023/06/learnings-from-kctf-vrps-42-linux.html):
io\_uring "[...] is still affected by severe vulnerabilities and also provides
strong exploitation primitives. For these reasons, we currently consider it
safe only for use by trusted components."

With that said, the CVEs concerning io\_uring can by and large only be
triggered by local users, so if you set up your system tightly, there is
quite probably little reason to worry. Of course, as with performance, the
right answer is usually "it depends", so please review your personal risk
profile and act accordingly.

## Best Practices

Before you roll out io\_uring, perform a simple benchmark (do a requantization
of one of your collections with both mmap and io\_uring and measure both wall
time and IOps). Benchmarks are always highly use-case dependent, so your
mileage may vary. Still, doing that benchmark once is a small price for the
possible performance wins. Also please [tell us](https://discord.com/channels/907569970500743200/907569971079569410)
about your benchmark results!
