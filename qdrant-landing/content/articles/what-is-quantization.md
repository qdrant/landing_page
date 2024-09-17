---
title: "What is Vector Quantization?"
draft: false
slug: what-is-vector-quantization? 
short_description:  What is Vector Quantization? Methods & Examples | Qdrant
description: Learn what vector quantization is and explore how methods like Scalar, Product, and Binary Quantization work. Plus, find out how to choose the best method for your specific application.
preview_dir: /articles_data/what-is-vector-quantization/preview
weight: -210
social_preview_image: /articles_data/what-is-vector-quantization/preview/social-preview.jpg
date: 2024-09-16T09:29:33-03:00
author: Sabrina Aquino 
featured: true 
tags: 
  - vector-search
  - vector-quantization
  - binary quantization
  - product quantization
  - scalar quantization
  - vector compression

---

> Vector quantization is a technique used to compress high-dimensional data by mapping vectors to a set of reference points. Instead of storing the original vectors, the data is approximated by these reference points, which reduces memory usage while maintaining most of the essential information. This compression allows for more efficient storage and faster search operations, especially in large datasets.

When working with high-dimensional vectors, such as embeddings from AI models like OpenAI, one single 1536-dimensional vector requires **6KB of memory**.

![1536 dimentional vector size is 6KB](/articles_data/what-is-vector-quantization/vector-size.png)

If your dataset has **millions of vectors**, the memory and processing demands are very significant.

To understand why this process is so computational demanding, let's take a look at the nature of the [HNSW index.](https://qdrant.tech/documentation/concepts/indexing/#vector-index)

The HNSW (Hierarchical Navigable Small World) index organizes vectors in a layered graph, connecting each vector to its nearest neighbors. At each layer, the algorithm narrows down the search area until it reaches the lower layers, where it efficiently finds the closest matches to the query.

<img src="/articles_data/what-is-vector-quantization/hnsw-search.png" alt="HNSW Search visualization" width="300">

So each time a new vector is added, the system must determine its position in the existing graph, a process similar to searching. This makes both inserting and searching for vectors complex operations.

One of the key challenges with the HNSW index is that it requires a lot of **random reads** and **sequential traversals** through the graph. This makes the process computationally expensive, especially when you're dealing with millions of high-dimensional vectors. 

The system has to jump between various points in the graph in an unpredictable way. This unpredictability makes it hard to optimize, and as the dataset grows, the memory and processing requirements increase significantly.


<img src="/articles_data/what-is-vector-quantization/hnsw-search.png" alt="HNSW Search visualization" width="300">

[to add gif]

And because vectors need to be stored in **fast storage** like **RAM** or **SSD** for low-latency searches, as the size of the data grows, so does the cost of storing and processing it efficiently.

**Quantization** offers a solution by compressing vectors to smaller memory sizes, making the process more efficient. 

There are several methods to achieve this, and here we will focus on three main ones:


![Types of Quantization: 1. Scalar Quantization, 2. Product Quantization, 3. Binary Quantization](/articles_data/what-is-vector-quantization/types-of-quantization.png)


## 1. What is Scalar Quantization?

![](/articles_data/what-is-vector-quantization/astronaut-mars.jpg)

In Qdrant, each dimension is represented by a `float32` value, which uses **4 bytes** of memory. When using [Scalar Quantization](https://qdrant.tech/documentation/guides/quantization/#scalar-quantization), we are mapping our vectors to a range that the smaller `int8` type can represent. An `int8` can store 256 values (from -128 to 127, or 0 to 255) which uses only **1 byte.** This results in a **75% reduction** in memory size.

For example, if our data lies in the identified range of -1.0 to 1.0, Scalar Quantization will transform these values to a range that `int8` can represent, that is, within -128 to 127. So, the system **maps** the `float32` values into this range.

Here's a simple linear example of what this process looks like:

![Scalar Quantization example](/articles_data/what-is-vector-quantization/scalar-quantization.png)

To set up Scalar Quantization in Qdrant, you need to include the `quantization_config` section when creating or updating a collection:

```python 
collection_config = {
    "vectors": {
        "size": 128,
        "distance": "Cosine"
    },
    "quantization_config": {
        "scalar": {
            "type": "int8",
            "quantile": 0.99,  # Ignoring extreme outliers
            "always_ram": True
        }
    }
}
```

The `quantile` is used to calculate the quantization bounds. For example, if you specify `0.99` as the quantile, 1% of extreme values will be excluded from the quantization bounds. 

This parameter only affects the resulting precision, not the memory footprint. You can tune it if you experience a significant decrease in search quality.

The primary benefit of Scalar Quantization is **memory reduction.** It is especially useful for large-scale datasets, where memory and processing power become limiting factors. It also slighly improves performance, as distance calculations (such as dot product or cosine similarity) using `int8` values are computationally simpler than using `float32` values. 

Scalar Quantization is a great choice if you're looking to boost search speed and compression without losing much accuracy.

These performance gains are significantly lower compared to Binary Quantization, which we'll discuss later. However, it's a good default choice when binary quantization isn’t the right fit for your use case.

# 2. What is Product Quantization?

![](/articles_data/what-is-vector-quantization/astronaut-centroids.jpg)

[Product Quantization](https://qdrant.tech/documentation/guides/quantization/#product-quantization) is a method used to compress high-dimensional vectors by representing them with a smaller set of representative points. 

The process begins by splitting the original high-dimensional vectors into smaller **sub-vectors.** Each sub-vector represents a segment of the original vector, which can capture different characteristics of the data.

![](/articles_data/what-is-vector-quantization/subvectors.png)

For each sub-vector, a separate **codebook** is created, representing regions in the data space where common patterns occur.

The codebook in Qdrant is trained automatically during the indexation process. As vectors are added to the collection, Qdrant uses your specified quantization settings in the `quantization_config` to build the codebook and quantize the vectors. Here’s how you might set it up:

```python 
collection_config = {
    "vectors": {
        "size": 1024,
        "distance": "Cosine"
    },
    "quantization_config": {
        "product": {
            "compression": "x32",
            "always_ram": True
        }
    }
}
```

Each region in the codebook is defined by a **centroid**, which serves as a representative point that summarizes the characteristics of that region. So, instead of treating every single data point as equally important, we can group similar sub-vectors together and represent them with a single centroid that captures the general characteristics of that group.

The centroids used in Product Quantization are determined using the **[K-means clustering algorithm](https://en.wikipedia.org/wiki/K-means_clustering)**.


![Codebook and Centroids example](/articles_data/what-is-vector-quantization/codebook.png)


Qdrant always selects **K = 256** for the number of centroids in its implementation based on the fact that 256 is the maximum number of unique values that can be represented by a single byte.

This makes the compression process efficient because each centroid index can be stored in a single byte.

After the codebooks are created, the original high-dimensional vectors are quantized by mapping each sub-vector to the nearest centroid in its respective codebook.

![Vectors being mapped to their correspondent centroids example](/articles_data/what-is-vector-quantization/centroids-mapping.png)

The compressed vector stores the index of the closest centroid for each sub-vector.

Here’s how a 1024-dimensional vector originally taking up 4096 bytes is reduced to just 128 bytes by representing it as 128 indexes, each pointing to the centroid of a sub-vector:


![Product Quantization example](/articles_data/what-is-vector-quantization/product-quantization.png)

After setting up quantization and adding your vectors, you can perform searches as usual. Qdrant will automatically use the quantized vectors, optimizing both speed and memory usage. Optionally, you can enable rescoring for better accuracy.

```python 
search_payload = {
    "query": [0.22, -0.01, -0.98, 0.37, ...],
    "params": {
        "quantization": {
            "rescore": True
        }
    },
    "limit": 10
}
```

Product Quantization can significantly reduce memory usage, potentially offering up to **64x** compression in certain configurations. However, it's important to note that this level of compression can lead to a noticeable drop in quality.

If your application needs high precision or real-time performance, Product Quantization may not be the best choice. But if **memory savings** are critical and some accuracy loss is acceptable, it could still be the ideal solution.

For a more in-depth understanting of the benchmarks you can expect, check out our dedicated article on [Product Quantization in Vector Search](https://qdrant.tech/articles/product-quantization/).

# 3. What is Binary Quantization?

![](/articles_data/what-is-vector-quantization/astronaut-white-surreal.jpg)

[Binary Quantization](https://qdrant.tech/documentation/guides/quantization/#binary-quantization) is an excellent option if you're looking to **reduce memory** usage while also achieving a significant **boost in speed**. It works by converting high-dimensional vectors into simple binary (0 or 1) representations.

* Values greater than zero are converted to 1 
* Values less than or equal to zero are converted to 0

Let's take our initial example of a 1536-dimensional vector that requires **6KB** of memory (4 bytes for each `float32` value).

After Binary Quantization, each dimension is reduced to 1 bit (1/8 byte), so the memory required is: 

$$
\frac{1536 \text{ dimensions}}{8 \text{ bits per byte}} = 192 \text{ bytes}
$$


This leads to a **32x** memory saving.


![Binary Quantization example](/articles_data/what-is-vector-quantization/binary-quantization.png)


Qdrant automates the Binary Quantization process during indexing. As vectors are added to your collection, each 32-bit floating-point component is converted into a binary value according to the configuration you define. 

Here’s how you can set it up:

```python 
collection_config = {
    "vectors": {
        "size": 1536,
        "distance": "Cosine"
    },
    "quantization_config": {
        "binary": {
            "always_ram": True
        }
    }
}
```

Binary Quantization is by far the quantization method that will give you the most processing **speed gains** when compared to Scalar and Product Quantizations. This is because the binary representation allows the system to use highly optimized CPU instructions, such as [XOR](https://en.wikipedia.org/wiki/XOR_gate#:~:text=XOR%20represents%20the%20inequality%20function,the%20other%20but%20not%20both%22.) and [Popcount](https://en.wikipedia.org/wiki/Hamming_weight), for fast distance computations.

It can speed up search operations by **up to 40x**, depending on the dataset and hardware. Here's the speed comparison of all three methods:

<img src="/articles_data/what-is-vector-quantization/speed-methods.png" alt="Speed by Quantization Method" width="700">


But it’s important to note that not all models are equally compatible with Binary Quantization. Some models may suffer a larger loss in accuracy when quantized, so it's recommended to use it on models of **at least 1024 dimensions.** 

The models that have shown the best compatibility with this method include:

* **OpenAI text-embedding-ada-002** (1536 dimensions)
* **Cohere AI embed-english-v2.0** (4096 dimensions)

They demonstrate minimal accuracy loss while still benefiting from the substantial speed and memory gains.

Even though Binary Quantization is incredibly fast and memory-efficient, the trade-offs are in **precision** and **model compatibility**, and you may need to ensure search quality using techniques like oversampling and rescoring. 

If you're interested in exploring Binary Quantization in more detail—including implementation examples, benchmark results, and usage recommendations—check out our dedicated article on [Binary Quantization - Vector Search, 40x Faster](https://qdrant.tech/articles/binary-quantization/).

# Understanding Rescoring, Oversampling, and Reranking

When we use quantization methods like Scalar, Product, or Binary Quantization, we're compressing our vectors to save memory and improve performance. However, this compression strips away some detail from the original vectors. This can slightly reduce the accuracy of our similarity searches because the quantized vectors are approximations of the original data.

To mitigate this loss of accuracy, you can use **oversampling** and **rescoring**, which help improve the accuracy of the final search results.

Here's how the process works, step by step:

### 1. Initial Quantized Search

When you perform a search, Qdrant retrieves the top candidates using the quantized vectors based on their similarity to the query vector, as determined by the quantized data. This step is fast because we're using the quantized vectors.

![ANN Search with Quantization](/articles_data/what-is-vector-quantization/ann-search-quantized.png)

### 2. Oversampling

Oversampling is a technique that helps make up for any precision lost due to quantization. Since quantization simplifies vectors, some relevant matches could be missed in the initial search. To avoid this, you can **retrieve more candidates**, increasing the chances that the most relevant vectors make it into the final results. 

You can control the number of extra candidates by setting an `oversampling` parameter. For example, if your desired number of results (`limit`) is 4 and you set an `oversampling` factor of 2, Qdrant will retrieve 8 candidates (4 × 2).

![ANN Search with Quantization and Oversampling](/articles_data/what-is-vector-quantization/ann-search-quantized-oversampling.png)

You can adjust the oversampling factor to control how many extra vectors Qdrant includes in the initial pool. More candidates mean a better chance of getting high-quality top-K results, especially after rescoring with original vectors.

### 3. Rescoring with Original Vectors

After oversampling to gather more potential matches, each candidate is re-evaluated based on additional criteria to ensure higher accuracy and relevance to the query. 

The rescoring process **maps** the quantized vectors to the corresponding original vectors and allows you to consider factors like context, metadata, or additional relevance that wasn't included in the initial search, leading to more accurate results.

![Rescoring with Original Vectors](/articles_data/what-is-vector-quantization/rescoring.png)

During rescoring, one of the lower-ranked candidates from oversampling might turn out to be a better match than some of the original top-K candidates. 

### 4. Reranking

With the new similarity scores from rescoring, **reranking** is where the final top-K candidates are determined based on the updated similarity scores. 

For example, in our case with a limit of 4, one candidate that ranked 6th in the quantized search might improve its score after rescoring because the original vectors capture more context or metadata. As a result, this candidate could move into the final top 4 after reranking, replacing a less relevant option from the initial search.

![Reranking with Original Vectors](/articles_data/what-is-vector-quantization/reranking.png)

Here's how you can set it up:

```python
 search_payload = {
    "query": [0.22, -0.01, -0.98, 0.37, ...],
    "params": {
        "quantization": {
            "rescore": True,        # Enables rescoring with original vectors
            "oversampling": 2       # Retrieves extra candidates for rescoring
        }
    },
    "limit": 4                      # Desired number of final results
}
```
You can adjust the `oversampling` factor to find the right balance between search speed and result accuracy. 

If quantization is affecting performance in an application that needs high accuracy, combining oversampling with rescoring is a great choice. But if you need faster searches and can tolerate some loss in accuracy, you might choose to use oversampling without rescoring, or adjust the oversampling factor to a lower value.


# Wrapping Up

![](/articles_data/what-is-vector-quantization/astronaut-running.jpg)

Quantization methods like Scalar, Product, and Binary Quantization offer powerful ways to optimize memory usage and improve search performance when dealing with large datasets of high-dimensional vectors. Each method comes with its own trade-offs between memory savings, computational speed, and accuracy.

Here are some final thoughts to help you choose the right quantization method for your needs:

| **Quantization Method**  | **Key Features**                                            | **When to Use**                                                                            |
|--------------------------|-------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| **Binary Quantization**  | • **Fastest method and most memory-efficient**<br>•  Up to **40x** faster search and **32x** reduced memory footprint | • Use with tested models like OpenAI's `text-embedding-ada-002` and Cohere's `embed-english-v2.0`<br>• When speed and memory efficiency are critical |
| **Scalar Quantization**  | • **Minimal loss of accuracy**<br>•  Up to **4x** reduced memory footprint | • Safe default choice for most applications.<br>• Offers a good balance between accuracy, speed, and compression.  |
| **Product Quantization** | • **Highest compression ratio**<br>• Up to **64x** reduced memory footprint | • When minimizing memory usage is the top priority<br>• Acceptable if some loss of accuracy and slower search speed are tolerable |


If you want to learn more about improving accuracy, memory efficiency, and speed when using quantization in Qdrant, we have a dedicated [Quantization tips](https://qdrant.tech/documentation/guides/quantization/#quantization-tips) section in our docs that explains all the quantization tips you can use to enhance your results.

Learn more about optimizing real-time precision with oversampling in Binary Quantization by watching this interview with Qdrant’s CTO, Andrey Vasnetsov:

Continue learning about how to **optimize precision in real-time using oversampling in Binary Quantization** by watching this insightful video from Qdrant's CTO, Andrey Vasnetsov:

<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  <iframe src="https://www.youtube.com/embed/4aUq5VnR_VI" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 90%;">
  </iframe>
</div>


Stay up-to-date on the latest in vector search and quantization, share your projects, ask questions, [join our vector search community](https://discord.com/invite/qdrant)!