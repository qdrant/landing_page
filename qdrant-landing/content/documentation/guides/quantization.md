---
title: Quantization
weight: 120
aliases:
  - ../quantization
  - /articles/dedicated-service/documentation/guides/quantization/
  - /guides/quantization/
---

# Quantization

Quantization is an optional feature in Qdrant that enables efficient storage and search of high-dimensional vectors.
By transforming original vectors into a new representations, quantization compresses data while preserving close to original relative distances between vectors.
Different quantization methods have different mechanics and tradeoffs. We will cover them in this section.

Quantization is primarily used to reduce the memory footprint and accelerate the search process in high-dimensional vector spaces.
In the context of the Qdrant, quantization allows you to optimize the search engine for specific use cases, striking a balance between accuracy, storage efficiency, and search speed.

There are tradeoffs associated with quantization.
On the one hand, quantization allows for significant reductions in storage requirements and faster search times.
This can be particularly beneficial in large-scale applications where minimizing the use of resources is a top priority.
On the other hand, quantization introduces an approximation error, which can lead to a slight decrease in search quality.
The level of this tradeoff depends on the quantization method and its parameters, as well as the characteristics of the data.

## Scalar Quantization

*Available as of v1.1.0*

Scalar quantization, in the context of vector search engines, is a compression technique that compresses vectors by reducing the number of bits used to represent each vector component.

For instance, Qdrant uses 32-bit floating numbers to represent the original vector components. Scalar quantization allows you to reduce the number of bits used to 8.
In other words, Qdrant performs `float32 -> uint8` conversion for each vector component.
Effectively, this means that the amount of memory required to store a vector is reduced by a factor of 4.

In addition to reducing the memory footprint, scalar quantization also speeds up the search process.
Qdrant uses a special SIMD CPU instruction to perform fast vector comparison.
This instruction works with 8-bit integers, so the conversion to `uint8` allows Qdrant to perform the comparison faster.

The main drawback of scalar quantization is the loss of accuracy. The `float32 -> uint8` conversion introduces an error that can lead to a slight decrease in search quality.
However, this error is usually negligible, and tends to be less significant for high-dimensional vectors.
In our experiments, we found that the error introduced by scalar quantization is usually less than 1%.

However, this value depends on the data and the quantization parameters.
Please refer to the [Quantization Tips](#quantization-tips) section for more information on how to optimize the quantization parameters for your use case.

## Binary Quantization

*Available as of v1.5.0*

Binary quantization is an extreme case of scalar quantization.
This feature lets you represent each vector component as a single bit, effectively reducing the memory footprint by a **factor of 32**.

This is the fastest quantization method, since it lets you perform a vector comparison with a few CPU instructions.

Binary quantization can achieve up to a **40x** speedup compared to the original vectors.

However, binary quantization is only efficient for high-dimensional vectors and require a centered distribution of vector components.

At the moment, binary quantization shows good accuracy results with the following models:

- OpenAI `text-embedding-ada-002` - 1536d tested with [dbpedia dataset](https://huggingface.co/datasets/KShivendu/dbpedia-entities-openai-1M) achieving 0.98 recall@100 with 4x oversampling
- Cohere AI `embed-english-v2.0` - 4096d tested on Wikipedia embeddings - 0.98 recall@50 with 2x oversampling

Models with a lower dimensionality or a different distribution of vector components may require additional experiments to find the optimal quantization parameters.

We recommend using binary quantization only with rescoring enabled, as it can significantly improve the search quality
with just a minor performance impact.
Additionally, oversampling can be used to tune the tradeoff between search speed and search quality in the query time.

### Binary Quantization as Hamming Distance

The additional benefit of this method is that you can efficiently emulate Hamming distance with dot product.

Specifically, if original vectors contain `{-1, 1}` as possible values, then the dot product of two vectors is equal to the Hamming distance by simply replacing `-1` with `0` and `1` with `1`.

<!-- hidden section -->

<details>
  <summary><b>Sample truth table</b></summary>

| Vector 1 | Vector 2 | Dot product |
|----------|----------|-------------|
| 1        | 1        | 1           |
| 1        | -1       | -1          |
| -1       | 1        | -1          |
| -1       | -1       | 1           |

| Vector 1 | Vector 2 | Hamming distance |
|----------|----------|------------------|
| 1        | 1        | 0                |
| 1        | 0        | 1                |
| 0        | 1        | 1                |
| 0        | 0        | 0                |

</details>

As you can see, both functions are equal up to a constant factor, which makes similarity search equivalent.
Binary quantization makes it efficient to compare vectors using this representation.

## Product Quantization

*Available as of v1.2.0*

Product quantization is a method of compressing vectors to minimize their memory usage by dividing them into
chunks and quantizing each segment individually.
Each chunk is approximated by a centroid index that represents the original vector component.
The positions of the centroids are determined through the utilization of a clustering algorithm such as k-means.
For now, Qdrant uses only 256 centroids, so each centroid index can be represented by a single byte.

Product quantization can compress by a more prominent factor than a scalar one.
But there are some tradeoffs. Product quantization distance calculations are not SIMD-friendly, so it is slower than scalar quantization.
Also, product quantization has a loss of accuracy, so it is recommended to use it only for high-dimensional vectors.

Please refer to the [Quantization Tips](#quantization-tips) section for more information on how to optimize the quantization parameters for your use case.

## How to choose the right quantization method

Here is a brief table of the pros and cons of each quantization method:

| Quantization method | Accuracy | Speed        | Compression |
|---------------------|----------|--------------|-------------|
| Scalar              | 0.99     | up to x2     | 4           |
| Product             | 0.7      | 0.5          | up to 64    |
| Binary              | 0.95*    | up to x40    | 32          |

`*` - for compatible models

- **Binary Quantization** is the fastest method and the most memory-efficient, but it requires a centered distribution of vector components. It is recommended to use with tested models only.
- **Scalar Quantization** is the most universal method, as it provides a good balance between accuracy, speed, and compression. It is recommended as default quantization if binary quantization is not applicable.
- **Product Quantization** may provide a better compression ratio, but it has a significant loss of accuracy and is slower than scalar quantization. It is recommended if the memory footprint is the top priority and the search speed is not critical.

## Setting up Quantization in Qdrant

You can configure quantization for a collection by specifying the quantization parameters in the `quantization_config` section of the collection configuration.

Quantization will be automatically applied to all vectors during the indexation process.
Quantized vectors are stored alongside the original vectors in the collection, so you will still have access to the original vectors if you need them.

*Available as of v1.1.1*

The `quantization_config` can also be set on a per vector basis by specifying it in a named vector.

### Setting up Scalar Quantization

To enable scalar quantization, you need to specify the quantization parameters in the `quantization_config` section of the collection configuration.

When enabling scalar quantization on an existing collection, use a PATCH request or the corresponding `update_collection` method and omit the vector configuration, as it's already defined.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-scalar-quantization-params/" >}}

There are 3 parameters that you can specify in the `quantization_config` section:

`type` - the type of the quantized vector components. Currently, Qdrant supports only `int8`.

`quantile` - the quantile of the quantized vector components.
The quantile is used to calculate the quantization bounds.
For instance, if you specify `0.99` as the quantile, 1% of extreme values will be excluded from the quantization bounds.

Using quantiles lower than `1.0` might be useful if there are outliers in your vector components.
This parameter only affects the resulting precision and not the memory footprint.
It might be worth tuning this parameter if you experience a significant decrease in search quality.

`always_ram` - whether to keep quantized vectors always cached in RAM or not. By default, quantized vectors are loaded in the same way as the original vectors.
However, in some setups you might want to keep quantized vectors in RAM to speed up the search process.

In this case, you can set `always_ram` to `true` to store quantized vectors in RAM.

### Setting up Binary Quantization

To enable binary quantization, you need to specify the quantization parameters in the `quantization_config` section of the collection configuration.

When enabling binary quantization on an existing collection, use a PATCH request or the corresponding `update_collection` method and omit the vector configuration, as it's already defined.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-binary-quantization/" >}}

`always_ram` - whether to keep quantized vectors always cached in RAM or not. By default, quantized vectors are loaded in the same way as the original vectors.
However, in some setups you might want to keep quantized vectors in RAM to speed up the search process.

In this case, you can set `always_ram` to `true` to store quantized vectors in RAM.

### Setting up Product Quantization

To enable product quantization, you need to specify the quantization parameters in the `quantization_config` section of the collection configuration.

When enabling product quantization on an existing collection, use a PATCH request or the corresponding `update_collection` method and omit the vector configuration, as it's already defined.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-product-quantization/" >}}

There are two parameters that you can specify in the `quantization_config` section:

`compression` - compression ratio.
Compression ratio represents the size of the quantized vector in bytes divided by the size of the original vector in bytes.
In this case, the quantized vector will be 16 times smaller than the original vector.

`always_ram` - whether to keep quantized vectors always cached in RAM or not. By default, quantized vectors are loaded in the same way as the original vectors.
However, in some setups you might want to keep quantized vectors in RAM to speed up the search process. Then set `always_ram` to `true`.

### Searching with Quantization

Once you have configured quantization for a collection, you don't need to do anything extra to search with quantization.
Qdrant will automatically use quantized vectors if they are available.

However, there are a few options that you can use to control the search process:

{{< code-snippet path="/documentation/headless/snippets/query-points/with-quantization-oversampling/" >}}

`ignore` - Toggle whether to ignore quantized vectors during the search process. By default, Qdrant will use quantized vectors if they are available.

`rescore` - Having the original vectors available, Qdrant can re-evaluate top-k search results using the original vectors.
This can improve the search quality, but may slightly decrease the search speed, compared to the search without rescore.
It is recommended to disable rescore only if the original vectors are stored on a slow storage (e.g. HDD or network storage).
By default, rescore is enabled.

**Available as of v1.3.0**

`oversampling` - Defines how many extra vectors should be pre-selected using quantized index, and then re-scored using original vectors.
For example, if oversampling is 2.4 and limit is 100, then 240 vectors will be pre-selected using quantized index, and then top-100 will be returned after re-scoring.
Oversampling is useful if you want to tune the tradeoff between search speed and search quality in the query time.

## Quantization tips

#### Accuracy tuning

In this section, we will discuss how to tune the search precision.
The fastest way to understand the impact of quantization on the search quality is to compare the search results with and without quantization.

In order to disable quantization, you can set `ignore` to `true` in the search request:

{{< code-snippet path="/documentation/headless/snippets/query-points/with-ignored-quantization/" >}}

- **Adjust the quantile parameter**: The quantile parameter in scalar quantization determines the quantization bounds.
By setting it to a value lower than 1.0, you can exclude extreme values (outliers) from the quantization bounds.
For example, if you set the quantile to 0.99, 1% of the extreme values will be excluded.
By adjusting the quantile, you find an optimal value that will provide the best search quality for your collection.

- **Enable rescore**: Having the original vectors available, Qdrant can re-evaluate top-k search results using the original vectors. On large collections, this can improve the search quality, with just minor performance impact.

#### Memory and speed tuning

In this section, we will discuss how to tune the memory and speed of the search process with quantization.

There are 3 possible modes to place storage of vectors within the qdrant collection:

- **All in RAM** - all vector, original and quantized, are loaded and kept in RAM. This is the fastest mode, but requires a lot of RAM. Enabled by default.

- **Original on Disk, quantized in RAM** - this is a hybrid mode, allows to obtain a good balance between speed and memory usage. Recommended scenario if you are aiming to shrink the memory footprint while keeping the search speed.

This mode is enabled by setting `always_ram` to `true` in the quantization config while using memmap storage:

{{< code-snippet path="/documentation/headless/snippets/create-collection/scalar-quantization-in-ram/" >}}

In this scenario, the number of disk reads may play a significant role in the search speed.
In a system with high disk latency, the re-scoring step may become a bottleneck.

Consider disabling `rescore` to improve the search speed:

{{< code-snippet path="/documentation/headless/snippets/query-points/with-disabled-rescoring/" >}}

- **All on Disk** - all vectors, original and quantized, are stored on disk. This mode allows to achieve the smallest memory footprint, but at the cost of the search speed.

It is recommended to use this mode if you have a large collection and fast storage (e.g. SSD or NVMe).

This mode is enabled by setting `always_ram` to `false` in the quantization config while using mmap storage:

{{< code-snippet path="/documentation/headless/snippets/create-collection/quantization-on-disk/" >}}
