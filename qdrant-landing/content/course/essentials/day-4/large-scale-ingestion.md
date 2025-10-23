---
title: Large-Scale Data Ingestion
weight: 4
---

{{< date >}} Day 4 {{< /date >}}

# Large-Scale Data Ingestion

<div class="video">
<iframe 
  src="https://www.youtube.com/embed/Rawvm7TP1XI"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

<br/>

In vector search applications inserting a few thousand data points is straightforward but the dynamics change completely when dealing with millions or billions of records. Tiny inefficiencies in the ingestion process compound into significant time losses, increased memory pressure, and degraded search performance.

Every individual upsert call initiates a transaction that consumes memory and disk I/O to build parts of the index. At scale, this naive approach can overwhelm your system, causing upload times to spike and search quality to decrease. Efficiently preparing and loading your data into Qdrant is paramount for building a robust and scalable AI application.

## Choosing Your Ingestion Strategy

Qdrant provides several methods for data ingestion, each tailored to different scales and use cases. It should be noted that only the Python client supports the upload_points and upload_collection methods. If you're using Qdrant on a different client then we reccomend using upsert with batch upload for large scale ingestion. [Learn more about bulk operations](/documentation/guides/bulk-operations/).

- **upsert (Individual or Batched)**: This is the fundamental operation for adding or updating points. Individual upserts are best suited for real-time updates while batching works best for larger workloads. 

- **upload_points**: This method is optimized for uploading an entire batch of points that can comfortably fit into your client's memory. It leverages features like lazy batching, retries, and parallelism, making it a strong choice for medium-sized datasets.

- **upload_collection**: For truly large-scale datasets, upload_collection is the most powerful tool. It streams data directly from an iterator, meaning the entire dataset doesn't need to be loaded into memory at once. This memory-efficient approach is ideal for ingesting millions or billions of points.

> **<font color='red'>Note:</font>** For clients in other languages like **TypeScript**, **Rust**, and **Go**, batched upsert calls are the recommended method for efficient data loading.

## Heuristics for Scale

Deciding which method to use can be guided by a few simple rules of thumb. While every use case is different, these heuristics provide a solid starting point:

- **Less than 100,000 points**: A single-threaded, batched upsert operation will generally perform well.
- **100,000 to 1 million points**: `upload_points` is recommended, using batch sizes between 1,000 and 10,000 to balance network overhead and memory usage.
- **More than 1 million points**: `upload_collection` is the ideal choice for streaming data from disk. To maximize throughput, you should enable parallelism by setting the `parallel` parameter to the number of available CPU cores (e.g., 4 or 8).

> **<font color='red'>Best Practice:</font>** Start small and test. Before attempting to upload your entire dataset, ingest a smaller chunk to validate your configuration and process.

## A Real-World Example: Ingesting LAION-400M

To illustrate these principles, let's examine the process of ingesting the LAION-400M dataset, which contains approximately 400 million image-text pairs with 512-dimensional CLIP embeddings. This massive dataset, with 400 GB of vectors and 200 GB of payload, requires a carefully optimized strategy.

### The Optimal Collection Configuration

The foundation of scalable ingestion is a well-designed collection configuration. For a dataset of this magnitude, the goal is to intelligently balance memory usage, disk I/O, and search performance.

```python
from qdrant_client import QdrantClient, models
import os
from dotenv import load_dotenv

load_dotenv()
client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

client.recreate_collection(
    collection_name="laion400m_collection",
    vectors_config=models.VectorParams(
        size=512,  # CLIP embedding dimensions
        distance=models.Distance.COSINE,
        on_disk=True,  # Store original vectors on disk
    ),
    quantization_config=models.BinaryQuantization(
        binary=models.BinaryQuantizationConfig(
            always_ram=True,  # Keep quantized vectors in RAM
        )
    ),
    optimizers_config=models.OptimizersConfigDiff(
        max_segment_size=5_000_000, # Create larger segments for faster search
    ),
    hnsw_config=models.HnswConfigDiff(
        m=6,  # Lower M to reduce memory usage
        on_disk=False  # Keep the HNSW index graph in RAM
    ),
)
```

This configuration employs several key optimizations:

- **`on_disk=True`**: This is the most critical setting for large datasets. It instructs Qdrant to store the full-precision original vectors on disk ([memmap storage](/documentation/guides/storage/#on-disk-storage)) instead of in RAM, dramatically reducing memory requirements.

- **Binary Quantization with `always_ram=True`**: While the original vectors are on disk, we enable [binary quantization](/documentation/guides/quantization/#binary-quantization) and force the compressed vectors to remain in RAM. This provides a lightweight in-memory representation for fast initial candidate searches.

- **Large Segment Size**: The `max_segment_size` is increased to create fewer, larger segments. This can improve search performance at the cost of slightly slower indexing.

- **In-Memory HNSW Index**: By setting `on_disk=False` for the [HNSW config](/documentation/guides/quantization/#hnsw-config), we keep the graph index in RAM. This ensures that navigating vector relationships during a search is extremely fast, avoiding disk latency. The `m` value is lowered to 6 to further conserve memory.

### The Upload Process

With the collection configured, the upload can proceed using a memory-efficient streaming approach. The LAION dataset is split into 409 parts, each containing about 1 million records. The script processes one part at a time, downloading the data, preparing the points, and streaming them to Qdrant.

```python
def upload_data_to_qdrant(client, embeddings, metadata, parallel=4):
    """
    Uploads data to Qdrant using the upload_collection method.
    """
    client.upload_collection(
        collection_name="laion400m_collection",
        points=zip(range(len(metadata)), embeddings, metadata),
        batch_size=256,
        parallel=parallel,
        show_progress=True,
    )

# --- Simplified logic for processing chunks ---
# for part in dataset_parts:
#     embeddings, metadata = download_and_process_part(part)
#     upload_data_to_qdrant(client, embeddings, metadata)
#     cleanup_local_files(part)
```

This method processes the dataset in manageable chunks without ever loading the entire 400 million points into memory. Using `parallel=4` allows the client to upload multiple batches concurrently, saturating the network connection and maximizing ingestion speed.

## The Payoff: An Efficient Architecture at Scale

This combined strategy of a hybrid storage configuration and streaming ingestion creates a highly efficient system. By keeping only the most essential components in RAM: the quantized vectors and the HNSW index, Qdrant can index and serve a 400 million vector dataset on a machine with just 64GB of RAM. The original vectors, which would consume hundreds of gigabytes, are efficiently accessed from disk only when needed for rescoring top candidates.

This architecture strikes a balance by keeping infrastructure costs low by minimizing RAM usage while maintaining fast and accurate search performance. By understanding and applying these ingestion strategies, you can confidently scale your Qdrant-powered applications to handle real-world data volumes.

> Learn more in a complete hands-on guide in our **[Large-Scale Search tutorial](https://qdrant.tech/documentation/database-tutorials/large-scale-search/)**.

> **Check out the reference implementation:**  
> [qdrant/laion-400m-benchmark on GitHub](https://github.com/qdrant/laion-400m-benchmark)  
> This open-source repository includes full scripts for downloading, processing, and uploading the LAION-400M dataset to Qdrant using efficient, production-ready patterns.

> **Want to try this workflow hands-on?**  
> Run the [Google Colab notebook](https://colab.research.google.com/drive/1X4EW-nymqcsyhwFYS2ZrmE8MPSnKKj62?usp=sharing) to see large-scale vector ingestion, quantized search, and efficient RAM/disk optimization in action!

