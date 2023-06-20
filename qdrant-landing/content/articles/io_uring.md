---
title: "Qdrant under the hood: io_uring"
short_description: "The Linux io_uring API offers great performance in certain cases. Here's how Qdrant uses it!"
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

## Input+Output

Around the mid-90s, the internet took off. The first servers used a
process-per-request setup, which was good for serving hundreds if not thousands
of concurrent request. POSIX (and thus Linux) IO (Input+Output) was modeled in
a strictly synchronous way. The overhead of starting a new process for each
request made this model unsustainable. So servers started forgoing the process
separation, opting for the thread-per-request model. But even that ran into
limitations.

I distinctly remember when someone asked the question whether a server could
serve 10k concurrent connections, which at the time exhausted the memory of
most systems (because every thread had to have its own stack and some other
metadata, which quickly filled up available memory). So the synchronous IO
was replaced by asynchronous IO during the 2.5 kernel update, either via 
`select` or `epoll` (the latter being a small bit more efficient, so most
servers of the time used it).

But even this crude form of asynchronous IO carries the overhead of at least
one system call per operation, which incurs a context switch - an operation
which is in itself not that slow (basically registers are stored and loaded
from a known good location), but the memory accesses required led to longer
and longer wait times for the CPU.

### Memory-mapped IO

Another way of dealing at least with file IO (which unlike network IO doesn't
usually have a hard time requirement) is to map parts of files into memory -
basically the system fakes having that chunk of the file in memory, so when
you read from a location there, the kernel interrupts you to load the needed
data from disk, and then sends you on your merry way, whereas writing to the
memory will also notify the kernel. Also the kernel can prefetch stuff while
the program is running, thus reducing the likelyhood of interrupts.

Thus there is still some overhead, but (especially in asynchronous
applications) it's far less than with `epoll`. The reason this API is rarely
used in web servers is that these usually have a large variety of files to
access (unlike a database, which can map its own backing store into memory
once). Qdrant has used mmap from the beginning, of course.

### Combating the Poll-ution

There were multiple experiments (open source or proprietary) to improve
matters, some even going so far as moving a HTTP server into the kernel
(which of course brought its own share of problems). Others like intel added
their own APIs that ignored the kernel and worked directly on the hardware
(on intel hardware, that is).

Finally Jens Axboe took matters into his own hands and proposed a ring buffer
based interface called *io\_uring*. The buffers are not directly for data, but
for operations. User processes can setup a Submission Queue (SQ) and a
Completion Queue (CQ), both of which are shared between the process and the
kernel, so there's no copying overhead.

Apart from avoiding copying overhead, the queue-based architecture lends
itself to multithreading (as item insertion/extraction can be made lockless),
and once the queues are set up, there is no further syscall that would stop
any user thread.

Servers that use this can easily get to over 100k concurrent requests. Today
Linux allows asynchronous IO via io\_uring for network, disk and accessing
other ports (e.g. for printing or recording video).

## And what about Qdrant?

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

If you run Qdrant on Linux, you can enable the io\_uring based storage backend
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

Run this script with and without enabling `storage.async_scorer` and once. You
can measure IO usage with `iostat` from another console.

TODO: Insert Andreys benchmark results here.

## Discussion

Looking back, disk IO used to be very serialized; re-positioning read-write
heads on moving platter was a slow and messy business. So the system overhead
didn't matter as much, but nowadays with SSDs that can often even parallelize
operations while offering near-perfect random access, the overhead starts to
become quite visible. While memory-mapped IO gives us a fairly good deal in
terms of programmer-friendlyness and performance, we can make a killing on the
latter for some modest complexity increase.

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
