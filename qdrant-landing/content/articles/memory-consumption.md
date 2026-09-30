---
title: "Minimal RAM to Serve 1M Vectors"
short_description: How to properly measure RAM usage and optimize Qdrant for memory consumption.
description: How to properly measure RAM usage and optimize Qdrant for memory consumption.
social_preview_image: /articles_data/memory-consumption/preview/social_preview.jpg
preview_dir: /articles_data/memory-consumption/preview
small_preview_image: /articles_data/memory-consumption/icon.svg
weight: 100
author: Andrei Vasnetsov
author_link: https://blog.vasnetsov.com/
date: 2022-12-07T10:18:00.000Z
category: production-ops
# aliases: [ /articles/memory-consumption/ ]
---

When it comes to measuring the memory consumption of our processes, we often rely on tools such as `htop` to give us an indication of how much RAM is being used. However, this method can be misleading and doesn't always accurately reflect the true memory usage of a process.

There are many different ways in which `htop` may not be a reliable indicator of memory usage. 
For instance, a process may allocate memory in advance but not use it, or it may not free deallocated memory, leading to overstated memory consumption. 
A process may be forked, which means that it will have a separate memory space, but it will share the same code and data with the parent process.
This means that the memory consumption of the child process will be counted twice.
Additionally, a process may utilize disk cache, which is also accounted as resident memory in the `htop` measurements.

As a result, even if `htop` shows that a process is using 10GB of memory, it doesn't necessarily mean that the process actually requires 10GB of RAM to operate efficiently.
In this article, we will explore how to properly measure RAM usage and optimize [Qdrant](/) for optimal memory consumption.

## How to Measure Actual RAM Requirements

We need to know memory consumption in order to estimate how much RAM is required to run the program.
So in order to determine that, we can conduct a simple experiment.
Let's limit the allowed memory of the process and observe at which point it stops functioning. 
In this way we can determine the minimum amount of RAM the program needs to operate.

One way to do this is by conducting a grid search, but a more efficient method is to use binary search to quickly find the minimum required amount of RAM.
We can use docker to limit the memory usage of the process. 

Before running each benchmark, it is important to clear the page cache with the following command:

```bash
sudo bash -c 'sync; echo 1 > /proc/sys/vm/drop_caches'
```

This ensures that the process doesn't utilize any data from previous runs, providing more accurate and consistent results.

We can use the following command to run Qdrant with a memory limit of 1GB:

```bash
docker run -it --rm \
    --memory 1024mb \
    --network=host \
    -v "$(pwd)/data/storage:/qdrant/storage" \
    qdrant/qdrant:latest
```

## Let's Run Some Benchmarks

<aside role="status">
The measurements in this article are historical. They were taken in December 2022 with Qdrant v0.11.x (v0.11.5 was the latest release when the article was published), using <code>glove-100-angular</code> (about 1.18M vectors with 100 dimensions), the vector-db-benchmark project, Docker memory limits, and the disks described in each section. The numbers are a record of that setup, not current performance.
</aside>

Since v1.19, Qdrant places each data structure with the `memory` parameter, which replaces the `on_disk` flags this article was written with. By default, dense vectors and the HNSW index are `cached`, payloads are `cold`, and payload indexes are `pinned`. See [Memory Tiers](/documentation/ops-configuration/memory-tiers/) for the full list of defaults.

Let's run some benchmarks to see how much RAM Qdrant needs to serve 1 million vectors.

We can use the `glove-100-angular` and scripts from the [vector-db-benchmark](https://github.com/qdrant/vector-db-benchmark) project to upload and query the vectors.
With the first run we will use the default configuration of Qdrant with all data stored in RAM.

```bash
# Upload vectors
python run.py --engines qdrant-all-in-ram --datasets glove-100-angular
```

After uploading vectors, we will repeat the same experiment with different RAM limits to see how they affect the memory consumption and search speed.

```bash
# Search vectors
python run.py --engines qdrant-all-in-ram --datasets glove-100-angular --skip-upload
```

### All in Memory

In the first experiment, we tested how well our system performs when all vectors are stored in memory.
We tried using different amounts of memory, ranging from 1512MB to 1024MB, and measured the number of requests per second (rps) that our system was able to handle.

| Memory | Requests/s    |
|--------|---------------|
| 1512MB | 774.38        |
| 1256MB | 760.63        |
| 1200MB | 794.72        |
| 1152MB | out of memory |
| 1024MB | out of memory |


We found that 1152MB memory limit resulted in our system running out of memory, but using 1512MB, 1256MB, and 1200MB of memory resulted in our system being able to handle around 780 RPS.
This suggests that about 1.2GB of memory is needed to serve around 1 million vectors, and there is no speed degradation when limiting memory usage above 1.2GB.

### Vectors Stored Using MMAP

Let's go a bit further!
In the second experiment, we tested how well our system performs when **vectors are stored using the memory-mapped file** (mmap).
Create collection with:

```http
PUT /collections/benchmark
{
  "vectors": {
    ...
    "memory": "cold"
  }
}

```

Qdrant always stores vectors in memory-mapped files. The memory tier decides whether they are pre-loaded into RAM (`cached`) or left on disk until first accessed (`cold`). See [Storage](/documentation/manage-data/storage/) and [Memory Tiers](/documentation/ops-configuration/memory-tiers/) for details.

The measurements in this article used the legacy setting `"on_disk": true`, which `"memory": "cold"` replaces.

Now the out-of-memory happens when we allow using **600MB** RAM only

<details>
  <summary>Experiments details</summary>

| Memory | Requests/s    |
|--------|---------------|
| 1200MB | 759.94 |
| 1100MB | 687.00 |
| 1000MB | 10     |

--- use a bit faster disk ---

| Memory | Requests/s    |
|--------|---------------|
| 1000MB | 25 rps        |
| 750MB  | 5 rps         |
| 625MB  | 2.5 rps       |
| 600MB  | out of memory |


</details>

At this point we have to switch from network-mounted storage to a faster disk, as the network-based storage is too slow to handle the amount of sequential reads that our system needs to serve the queries.

But let's first see how much RAM we need to serve 1 million vectors and then we will discuss the speed optimization as well.


### Vectors and HNSW Graph Stored Using MMAP

In the third experiment, we tested how well our system performs when vectors and [HNSW](/articles/filterable-hnsw/) graph are stored using the memory-mapped files.
Create collection with:

```http
PUT /collections/benchmark 
{
  "vectors": {
    ...
    "memory": "cold"
  },
  "hnsw_config": {
    "memory": "cold"
  },
  ...
}
```

The legacy equivalents, `"on_disk": true` in both `vectors` and `hnsw_config`, are what these measurements used.

With this configuration we are able to serve 1 million vectors with **only 135MB of RAM**!


<details>
  <summary>Experiments details</summary>


| Memory | Requests/s    |
|--------|---------------|
| 600MB | 5 rps          |
| 300MB | 0.9 rps / 1.1 sec per query |
| 150MB | 0.4 rps / 2.5 sec per query |
| 135MB | 0.33 rps / 3 sec per query |
| 125MB | out of memory |

</details>

At this point the importance of the disk speed becomes critical.
We can serve the search requests with 135MB of RAM, but the speed of the requests makes it impossible to use the system in production.

Let's see how we can improve the speed.


## How to Speed Up the Search

To measure the impact of disk parameters on search speed, we used the `fio` tool to test the speed of different types of disks.

```bash
# Install fio
sudo apt-get install fio

# Run fio to check the random reads speed
fio --randrepeat=1 \
    --ioengine=libaio \
    --direct=1 \
    --gtod_reduce=1 \
    --name=fiotest \
    --filename=testfio \
    --bs=4k \
    --iodepth=64 \
    --size=8G \
    --readwrite=randread
```


Initially, we tested on a network-mounted disk, but its performance was too slow, with a read IOPS of 6366 and a bandwidth of 24.9 MiB/s:

```text
read: IOPS=6366, BW=24.9MiB/s (26.1MB/s)(8192MiB/329424msec)
```

To improve performance, we switched to a local disk, which showed much faster results, with a read IOPS of 63.2k and a bandwidth of 247 MiB/s:

```text
read: IOPS=63.2k, BW=247MiB/s (259MB/s)(8192MiB/33207msec)
```

That gave us a significant speed boost, but we wanted to see if we could improve performance even further.
To do that, we switched to a machine with a local SSD, which showed even better results, with a read IOPS of 183k and a bandwidth of 716 MiB/s:

```text
read: IOPS=183k, BW=716MiB/s (751MB/s)(8192MiB/11438msec)
```

Let's see how these results translate into search speed:

| Memory | RPS with IOPS=63.2k | RPS with IOPS=183k |
|--------|---------------------|--------------------|
| 600MB  | 5                   | 50                 |
| 300MB  | 0.9                 | 13                 |
| 200MB  | 0.5                 | 8                  |
| 150MB  | 0.4                 | 7                  |


As you can see, the speed of the disk has a significant impact on the search speed.
With a local SSD, we were able to increase the search speed by 10x!

With the production-grade disk, the search speed could be even higher. 
Some configurations of the SSDs can reach 1M IOPS and more.

Which might be an interesting option to serve large datasets with low search latency in Qdrant.


## What's New Since 2022

Quantization and the other disk-based retrieval options did not exist when this article was written. To see how they change the trade-off between RAM and search speed, read [When Your Collection Outgrows RAM](/documentation/search-tuning/when-your-collection-outgrows-ram/) and the section on [optimizing for disk-based retrieval](/documentation/ops-configuration/memory-tiers/#optimizing-for-disk-based-retrieval).


## Conclusion

In this article, we showed that Qdrant has flexibility in terms of RAM usage and can be used to serve large datasets. It provides configurable trade-offs between RAM usage and search speed. To learn more, see the [Qdrant documentation](/documentation/).

We are eager to learn more about how you use Qdrant in your projects, what challenges you face, and how we can help you solve them.
Please feel free to join our [Discord](https://qdrant.to/discord) and share your experience with us!
