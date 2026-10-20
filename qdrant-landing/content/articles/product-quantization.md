---
title: "Product Quantization for Vector Search"
short_description: "Vector search with low memory? Try out our brand-new Product Quantization!"
description: "Discover product quantization in vector search technology. Learn how it optimizes storage and accelerates search processes for high-dimensional data."
social_preview_image: /articles_data/product-quantization/preview/social_preview.jpg
small_preview_image: /articles_data/product-quantization/product-quantization-icon.svg
preview_dir: /articles_data/product-quantization/preview
weight: 80
author: Kacper Łukawski
author_link: https://medium.com/@lukawskikacper
date: 2023-05-30T09:45:00+02:00
draft: false
keywords:
  - vector search
  - product quantization
  - memory optimization
category: production-ops
aliases: [ /articles/product_quantization/ ]
---

# Product Quantization Demystified: Streamlining Efficiency in Data Management

Qdrant 1.1.0 brought the support of [Scalar Quantization](/articles/scalar-quantization/),
a technique of reducing the memory footprint by even four times, by using `int8` to represent
the values that would be normally represented by `float32`.

The memory usage in [vector search](https://qdrant.tech/solutions/) can be reduced even further with **Product
Quantization**, available since Qdrant 1.2.0.

<aside role="status">
Since Qdrant 1.18, <a href="/articles/turboquant-quantization/">TurboQuant</a> is the recommended method for most compression levels up to 32x. Product Quantization remains the option for compression beyond 32x, up to 64x. See <a href="#choosing-a-quantization-method">Choosing a quantization method</a>.
</aside>

## What is Product Quantization?

Product Quantization converts floating-point numbers into integers like every other quantization 
method. However, the process is slightly more complicated than [Scalar Quantization](https://qdrant.tech/articles/scalar-quantization/) and is more customizable, so you can find the sweet spot between memory usage and search precision. This article 
covers all the steps required to perform Product Quantization and the way it's implemented in Qdrant.

## How Does Product Quantization Work?

Let’s assume we have a few vectors being added to the collection and that our optimizer decided 
to start creating a new segment.

### Cutting the vector into pieces

First of all, our vectors are going to be divided into **chunks** aka **subvectors**. The number
of chunks is configurable, but as a rule of thumb - the lower it is, the higher the compression rate.
That also comes with reduced search precision, but in some cases, you may prefer to keep the memory
usage as low as possible.

{{< island path="content/articles/headless/product-quantization/chunks"
    ratio="76 / 37"
    title="Four example vectors cut into chunks. Pick a chunk size to see how many chunks each vector gets and how much smaller it becomes. The values are illustrative." >}}
![A list of chunked vectors](/articles_data/product-quantization/chunked-vectors.png)
{{< /island >}}

Qdrant API allows choosing the compression ratio from 4x up to 64x. In our example, we selected 16x, 
so each subvector will consist of 4 floats (16 bytes), and it will eventually be represented by 
a single byte.

### Clustering

The chunks of our vectors are then used as input for clustering. Qdrant uses the K-means algorithm, 
with $ K = 256 $. It was selected a priori, as this is the maximum number of values a single byte 
represents. As a result, we receive a list of 256 centroids for each chunk and assign each of them 
a unique id. **The clustering is done separately for each group of chunks.**

{{< island path="content/articles/headless/product-quantization/clustering"
    ratio="76 / 43"
    title="Each group of chunks is clustered separately, and a chunk is stored as the id of its closest centroid. Click a panel to move a chunk." >}}
![Clustered chunks of vectors](/articles_data/product-quantization/chunks-clustering.png)
{{< /island >}}

Each chunk of a vector might now be mapped to the closest centroid. That’s where we lose the precision, 
as a single point will only represent a whole subspace. Instead of using a subvector, we can store 
the id of the closest centroid. If we repeat that for each chunk, we can approximate the original 
embedding as a vector of subsequent ids of the centroids. The dimensionality of the created vector 
is equal to the number of chunks, in our case 2.

### Full process

All those steps build the following pipeline of Product Quantization:

{{< island path="content/articles/headless/product-quantization/pipeline"
    ratio="76 / 43"
    title="The full process of Product Quantization for one vector, step by step." >}}
![Full process of Product Quantization](/articles_data/product-quantization/full-process.png)
{{< /island >}}

## Measuring the distance

Vector search relies on the distances between the points. Enabling Product Quantization slightly changes 
the way it has to be calculated. The query vector is divided into chunks, and then we figure the overall 
distance as a sum of distances between the subvectors and the centroids assigned to the specific id of 
the vector we compare to. We know the coordinates of the centroids, so that's easy.

{{< island path="content/articles/headless/product-quantization/distance"
    ratio="76 / 44"
    title="Measuring the distance between a query and a stored vector with a lookup table. Pick the stored ids to see which entries are summed. The values are illustrative." >}}
![Calculating the distance between the query and the stored vector](/articles_data/product-quantization/distance-calculation.png)
{{< /island >}}

#### Qdrant implementation

Search operation requires calculating the distance to multiple points. Since we calculate the 
distance to a finite set of centroids, those might be precomputed and reused. Qdrant creates
a lookup table for each query, so it can then simply sum up several terms to measure the
distance between a query and all the centroids.

|             | Centroid 0 | Centroid 1 | ... |
|-------------|------------|------------|-----|
| **Chunk 0** | 0.14213    | 0.51242    |     |
| **Chunk 1** | 0.08421    | 0.00142    |     |
| **...**     | ...        | ...        | ... |

## Product Quantization Benchmarks

<aside role="status">
These measurements are from 2023, taken around the Qdrant 1.2.0 release, and have not been repeated on current versions. They show how the compression level affects precision, search time, and indexing time. They are not a comparison with today's methods.
</aside>

Product Quantization comes with a cost - there are some additional operations to perform so 
that the performance might be reduced. However, memory usage might be reduced drastically as 
well. As usual, we did some benchmarks to give you a brief understanding of what you may expect.

Again, we reused the same pipeline as in [the other benchmarks we published](/benchmarks/). We
selected [Arxiv-titles-384-angular-no-filters](https://github.com/qdrant/ann-filtering-benchmark-datasets)
and [Glove-100](https://github.com/erikbern/ann-benchmarks/) datasets to measure the impact
of Product Quantization on precision and time. Both experiments were launched with $ EF = 128 $. 
The results are summarized in the tables:

#### Glove-100

<table>
   <thead>
      <tr>
         <th></th>
         <th>Original</th>
         <th>1D clusters</th>
         <th>2D clusters</th>
         <th>3D clusters</th>
      </tr>
   </thead>
   <tbody>
      <tr>
         <th>Mean precision</th>
         <td>0.7158</td>
         <td>0.7143</td>
         <td>0.6731</td>
         <td>0.5854</td>
      </tr>
      <tr>
         <th>Mean search time</th>
         <td>2336 µs</td>
         <td>2750 µs</td>
         <td>2597 µs</td>
         <td>2534 µs</td>
      </tr>
      <tr>
         <th>Compression</th>
         <td>x1</td>
         <td>x4</td>
         <td>x8</td>
         <td>x12</td>
      </tr>
      <tr>
         <th>Upload & indexing time</th>
         <td>147 s</td>
         <td>339 s</td>
         <td>217 s</td>
         <td>178 s</td>
      </tr>
   </tbody>
</table>

Product Quantization increases both indexing and searching time. The higher the compression ratio, 
the lower the search precision. The main benefit is undoubtedly the reduced usage of memory.

#### Arxiv-titles-384-angular-no-filters

<table>
   <thead>
      <tr>
         <th></th>
         <th>Original</th>
         <th>1D clusters</th>
         <th>2D clusters</th>
         <th>4D clusters</th>
         <th>8D clusters</th>
      </tr>
   </thead>
   <tbody>
      <tr>
         <th>Mean precision</th>
         <td>0.9837</td>
         <td>0.9677</td>
         <td>0.9143</td>
         <td>0.8068</td>
         <td>0.6618</td>
      </tr>
      <tr>
         <th>Mean search time</th>
         <td>2719 µs</td>
         <td>4134 µs</td>
         <td>2947 µs</td>
         <td>2175 µs</td>
         <td>2053 µs</td>
      </tr>
      <tr>
         <th>Compression</th>
         <td>x1</td>
         <td>x4</td>
         <td>x8</td>
         <td>x16</td>
         <td>x32</td>
      </tr>
      <tr>
         <th>Upload & indexing time</th>
         <td>332 s</td>
         <td>921 s</td>
         <td>597 s</td>
         <td>481 s</td>
         <td>474 s</td>
      </tr>
   </tbody>
</table>

It turns out that in some cases, Product Quantization may not only reduce the memory usage, 
but also the search time.

## Choosing a quantization method

Qdrant now offers four quantization methods. The [quantization documentation](/documentation/manage-data/quantization/#how-to-choose-the-right-quantization-method) maps a target compression to a method:

| Compression | Method |
|---|---|
| 4x | [Scalar Quantization](/articles/scalar-quantization/). 4-bit TurboQuant offers comparable recall at 8x. |
| 8x | 4-bit TurboQuant. |
| 16x to 32x | TurboQuant or [binary quantization](/articles/binary-quantization/) at the same bit depth. Binary quantization is faster, and TurboQuant has better recall. |
| Up to 64x | Product Quantization. |

Product Quantization has the highest compression, but it pays for it in accuracy and speed. Its distance calculations are not SIMD-friendly, so it is slower than Scalar Quantization, and it loses more accuracy, so it suits high-dimensional vectors. Indexing is slower too: in the benchmarks in this article, uploading and indexing took 1.2 to 2.8 times longer than without quantization.

Choose Product Quantization when:

- You need more than 32x compression, which no other method offers.
- Memory is the top priority, and accuracy and speed are not critical.
- The vectors have many dimensions, and indexing speed does not matter.

In other cases, use the method that matches your compression target in the table.

## Using Qdrant for Product Quantization


If you’re already a Qdrant user, our documentation on [Product Quantization](/documentation/manage-data/quantization/#setting-up-product-quantization) will help you set and configure the new quantization for your data and achieve even 
up to 64x memory reduction.

Ready to experience the power of Product Quantization? [Sign up now](https://cloud.qdrant.io/signup) for a free Qdrant demo and optimize your data management today!