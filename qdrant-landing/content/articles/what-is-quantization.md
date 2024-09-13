---
title: "What is Vector Quantization?"
draft: false
slug: what-is-vector-quantization? 
short_description:  What is Vector Quantization? Methods & Examples | Qdrant
description: Learn what vector quantization is and explore how methods like Scalar, Product, and Binary Quantization work. Plus, find out how to choose the best method for your specific application.
preview_dir: /articles_data/what-is-vector-quantization/preview
weight: -210
social_preview_image: /articles_data/what-is-vector-quantization/preview/social-preview.jpg
date: 2024-09-09T09:29:33-03:00
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

Quantization offers a solution by compressing vectors to smaller memory sizes, making the process more efficient. 

There are several methods to achieve this, and here we will focus on three main ones:


![Types of Quantization: 1. Scalar Quantization, 2. Product Quantization, 3. Binary Quantization](/articles_data/what-is-vector-quantization/types-of-quantization.png)


## 1. What is Scalar Quantization?

![](/articles_data/what-is-vector-quantization/astronaut-mars.jpg)

In Qdrant, each dimension is represented by a float32 value, which uses **4 bytes** of memory. When using [Scalar Quantization](https://qdrant.tech/documentation/guides/quantization/#scalar-quantization), we are mapping our vectors to a range that the smaller int8 type can represent. An int8 can store 256 values (from -128 to 127, or 0 to 255) which uses only **1 byte.** This results in a **75% reduction** in memory size.

For example, if our data lies in the identified range of -1.0 to 1.0, Scalar Quantization will transform these values to a range that int8 can represent, that is, within -128 to 127. So, the system **maps** the float32 values into this range.

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

The **quantile** is used to calculate the quantization bounds. For example, if you specify 0.99 as the quantile, 1% of extreme values will be excluded from the quantization bounds. 

This parameter only affects the resulting precision, not the memory footprint. You can tune it if you experience a significant decrease in search quality.

The primary benefit of Scalar Quantization is **memory reduction.** It is especially useful for large-scale datasets, where memory and processing power become limiting factors. It also slighly improves performance, as distance calculations (such as dot product or cosine similarity) using int8 values are computationally simpler than using float32 values. 

However, these performance gains are significantly lower compared to Binary Quantization, which we'll discuss later.

# 2. What is Product Quantization?

![](/articles_data/what-is-vector-quantization/astronaut-centroids.jpg)

[Product Quantization](https://qdrant.tech/documentation/guides/quantization/#product-quantization) is a method used to compress high-dimensional vectors by representing them with a smaller set of representative points. 

The process begins by setting up a **codebook,** which represents regions in the data space where common patterns occur. 

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

Each region in the codebook is defined by a **centroid**, which serves as a representative point that summarizes the characteristics of that region. So, instead of treating every single data point as equally important, we can group similar points together and represent them with a single centroid that is more representative of the general characteristics of that group.

The centroids used in Product Quantization are determined using the **[K-means clustering algorithm](https://en.wikipedia.org/wiki/K-means_clustering)**, which Qdrant applies to a representative sample of the dataset you want to quantize.


![Codebook and Centroids example](/articles_data/what-is-vector-quantization/codebook.png)


Qdrant always selects **K = 256** for the number of centroids in its implementation based on the fact that 256 is the maximum number of unique values that can be represented by a single byte.

This makes the compression process efficient because each centroid index can be stored in a single byte.

After the codebook is created, the original high-dimensional vectors are split into smaller **sub-vectors.** 

Each sub-vector is then compared to every centroid in the codebook and mapped to the nearest centroid.

![Vectors being mapped to their correspondent centroids example](/articles_data/what-is-vector-quantization/centroids-mapping.png)

The compressed vector stores the index of the closest centroid for each subvector.

Here’s how a 1024-dimensional vector originally taking up 4096 bytes is reduced to just 128 bytes by representing it as 128 indexes, each pointing to the centroid of a subvector:


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

Product Quantization is generally more memory efficient than **Scalar Quantization**, being able to reduce the memory footprint by up to **64x** while still retaining much of the essential information. However, the computational overhead of mapping sub-vectors to centroids results in the **slowest performance** compared to the other methods.

If your application requires high precision or real-time performance, this slower computation might be a significant factor to consider.

# 3. What is Binary Quantization?

![](/articles_data/what-is-vector-quantization/astronaut-white-surreal.jpg)

[Binary Quantization](https://qdrant.tech/documentation/guides/quantization/#binary-quantization) is an excellent option if you're looking to **reduce memory** usage while also achieving a significant **boost in speed**. It works by converting high-dimensional vectors into simple binary (0 or 1) representations.

* Values greater than zero are converted to 1 
* Values less than or equal to zero are converted to 0

Let's take our initial example of a 1536-dimensional vector that requires **6KB** of memory, 4 bytes for each float32 value.

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

Binary Quantization is by far the quantization method that will give you the most processing **speed gains **when compared to Scalar and Product Quantizations. This is because the binary representation allows the system to use highly optimized CPU instructions, such as [XOR](https://en.wikipedia.org/wiki/XOR_gate#:~:text=XOR%20represents%20the%20inequality%20function,the%20other%20but%20not%20both%22.) and [Popcount](https://en.wikipedia.org/wiki/Hamming_weight), for fast distance computations.

It can speed up search operations by **up to 40x**, depending on the dataset and hardware. Here's the speed comparison of all three methods:

<img src="/articles_data/what-is-vector-quantization/speed-methods.png" alt="Speed by Quantization Method" width="700">


But it’s important to note that not all models are equally compatible with Binary Quantization. Some models may suffer a larger loss in accuracy when quantized, so it's recommended to use it on models of **at least 1024 dimensions.** 

The models that have shown the best compatibility with this method include:

* **OpenAI text-embedding-ada-002** (1536 dimensions)
* **Cohere AI embed-english-v2.0** (4096 dimensions)

They demonstrate minimal accuracy loss while still benefiting from the substantial speed and memory gains.

Even though Binary Quantization is incredibly fast and memory-efficient, the trade-offs are in **precision** and **model compatibility**, and you may need **rescoring** to ensure search quality.

# What is Rescoring?

The quantization strips away some detail from the original vector. However, Qdrant mitigates this with **oversampling**, which retrieves extra vectors during the search and then uses the original values to rescore them, improving the accuracy of the final results.

Here’s how you can enable rescoring to maintain higher accuracy:

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

When you enable rescoring in Qdrant, it refines the top search results by recalculating their similarity with the original floating-point vectors.


# Wrapping Up

![](/articles_data/what-is-vector-quantization/astronaut-running.jpg)

If you want to learn more about improving accuracy, memory efficiency, and speed when using quantization in Qdrant, we have a dedicated [Quantization tips](https://qdrant.tech/documentation/guides/quantization/#quantization-tips) section in our docs that explains all the quantization tips you can use to enhance your results.