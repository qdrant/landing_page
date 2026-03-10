---
title: "Optimize Throughput" 
weight: 30
---

# Optimize FastEmbed Throughput

By default, FastEmbed processes documents sequentially in the main processing thread. To optimize throughput, FastEmbed supports processing documents in parallel. 

When parallel processing is enabled, FastEmbed splits a dataset across multiple workers, each running an independent copy of the embedding model. Internally, documents are split into batches and put on a shared input queue. Each batch is then processed by one of the workers, put on a shared output queue, and then collected and reordered to match the original input order.

To configure FastEmbed for parallel processing, use the following parameters:

- `parallel`: the number of workers.
  - When set to `None` (default), the embedding model runs in the main process.
  - When set to `0`, FastEmbed detects the number of available CPU cores and parallelizes across that many workers.
  - When set to `1` or higher, FastEmbed uses the specified number of workers.
- Batch size: the number of documents that each worker processes in each batch. Adjusting this to balance memory usage and processing speed. Lower it if you're running out of memory during local inference. Raise it to improve throughput if you have plenty of memory and are processing large document sets.

  To configure the batch size, use:
  - `batch_size`: stand-alone FastEmbed parameter for batch processing. Defaults to `256` for text and `16` for images.
  - `local_inference_batch_size`: Qdrant Client parameter for batch processing. Defaults to `8`.
- `lazy_load`: set to `True` to avoid loading the embedding model until it's needed for inference. Enabling lazy loading prevents loading the model in the main process when using multiple workers, which saves memory and reduces startup time.

Furthermore, when [using GPUs](https://qdrant.github.io/fastembed/examples/FastEmbed_GPU/), configure `device_ids` with a list of GPU device IDs to assign workers to. For example, `device_ids=[0, 1]` assigns workers to GPUs 0 and 1. If not specified, FastEmbed will assign all workers to the default GPU device.

## Parallelize FastEmbed with the Qdrant Client

When using FastEmbed with Qdrant Client, specify the `local_inference_batch_size` parameter when initializing the client to configure the batch size. For example:

{{< code-snippet path="/documentation/headless/snippets/fastembed/optimize/qdrant-client/" block="client-connection" >}}

Next, enable lazy loading of the embedding model to avoid loading it in the main process:

{{< code-snippet path="/documentation/headless/snippets/fastembed/optimize/qdrant-client/" block="lazy-load" >}}

When using GPUs, also specify the `device_ids` parameter to assign workers to specific GPU devices:

{{< code-snippet path="/documentation/headless/snippets/fastembed/optimize/qdrant-client/" block="lazy-load-gpu" >}}

Finally, when uploading points, set the `parallel` parameter to the desired number of workers:

{{< code-snippet path="/documentation/headless/snippets/fastembed/optimize/qdrant-client/" block="upload-data" >}}

## Parallelize Standalone FastEmbed

When using FastEmbed as a standalone library, first enable lazy loading of the embedding model:

{{< code-snippet path="/documentation/headless/snippets/fastembed/optimize/standalone/" block="lazy-load" >}}

If you're using GPUs, also specify the `device_ids` parameter to assign workers to specific GPU devices:

{{< code-snippet path="/documentation/headless/snippets/fastembed/optimize/standalone/" block="lazy-load-gpu" >}}

When generating embeddings, set the batch size with `batch_size` and the number of workers with `parallel`:

{{< code-snippet path="/documentation/headless/snippets/fastembed/optimize/standalone/" block="embed" >}}