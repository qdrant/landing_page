---
title: "Qdrant under the hood: Product Quantization"
short_description: "TBD"
description: "TBD"
social_preview_image: /articles_data/product-quantization/social_preview.png
small_preview_image: /articles_data/product-quantization/product-quantization-icon.svg
preview_dir: /articles_data/product-quantization/preview
weight: 1
author: Kacper Łukawski
author_link: https://medium.com/@lukawskikacper
date: 2023-03-27T10:45:00+01:00
draft: false
keywords:
  - vector search
  - product quantization
  - memory optimization
---

Qdrant 1.1.0 brought the support of [Scalar Quantization](/articles/scalar-quantization/),
a technique of reducing the memory footprint by even four times, by using `int8` to represent
the values that would be normally represented by `float32`.

It turns out the memory usage in vector search might be reduced even further! Please welcome
**Product Quantization**, a brand-new feature of Qdrant 1.2.0! 

## Product Quantization

Product Quantization converts floating-point numbers into integers like every other quantization 
method. However, the process is slightly more complicated than Scalar Quantization and is more 
customizable, so you can find the sweet spot between memory usage and search precision. This article 
covers all the steps required to perform Product Quantization and the way it's implemented in Qdrant.

Let's assume we have a few vectors being added to the collection, and that our optimizer decided
to start the process of creating a new segment.

![A list of raw vectors](/articles_data/product-quantization/raw-vectors.png)

### Dividing the vector

First of all, our vectors are going to be divided into **chunks** aka **subvectors**. The number
of chunks is configurable, but as a rule of thumb - the lower it is, the higher the compression rate.
That also comes with reduced search precision, but in some cases you may prefer to keep the memory
usage as low as possible.

![A list of chunked vectors](/articles_data/product-quantization/chunked-vectors.png)

Qdrant API allows to choose the compression ratio, varying from 4x up to 64x. In our example, we 
selected 16x, so each subvector will consist of 4 floats (16 bytes), and those floats will eventually
be represented by a single byte.

### Clustering

The chunks of our vectors are then used as an input for clustering. Qdrant uses K-means algorithm, 
with $ K = 256 $. It was selected a priori, as this is the maximum number of different values 
represented by a single byte. As a result, we receive a list of 256 centroids for each chunk and
assign each of them a unique id. **The clustering is done separately for each group of chunks.**

![Clustered chunks of vectors](/articles_data/product-quantization/chunks-clustering.png)

Each chunk of a vector might be now mapped to the closest centroid. That's where we loose the precision,
as every subspace is going to be represented by a single point only. Instead of using a subvector,
we can simply store the id of the closest centroid. If we repeat that for each chunk, then we can 
approximate the original embedding as a vector of subsequent ids. The dimensionality of the created
vector is equal to the number of chunks. 

![A new vector built from the ids of the centroids](/articles_data/product-quantization/vector-of-ids.png)

### Full process

All those steps build the following pipeline of the Product Quantization:

![Full process of Product Quantization](/articles_data/product-quantization/full-process.png)

## Measuring the distance

Vector search relies on the distances between the points. Enabling Product Quantization slightly
changes the way it has to be calculated. The query vector is divided into chunks, and then we 
calculate it the overall distance as a sum of distances between the subvectors and the centroids 
assigned to the specific id of the vector we compare to.

TODO: image - calculating the distance

#### Qdrant implementation

Search operation requires calculating the distance to multiple points. Since we calculate the 
distance of a finite set of centroids, those might be precomputed and reused. Qdrant creates
a lookup table for each query, so it can then simply sum up several terms.

|             | Centroid 0 | Centroid 1 | ... |
|-------------|------------|------------|-----|
| **Chunk 0** | 0.14213    | 0.51242    |     |
| **Chunk 1** | 0.08421    | 0.00142    |     |
| **...**     | ...        | ...        | ... |

## Benchmarks

Product Quantization comes with a cost - there are some additional operations, so the performance
might be reduced, however the memory usage might be reduced drastically. As usual, we did some 
benchmarks to give you a brief understanding of what you may expect.

Again, we reused the same pipeline as in [the other benchmarks we publish](/benchmarks). We
selected [Arxiv-titles-384-angular-no-filters](https://github.com/qdrant/ann-filtering-benchmark-datasets)
and [Glove-100](https://github.com/erikbern/ann-benchmarks/) datasets to measure the impact
of the Product Quantization on both precision and time. Both experiments were launched with
$ EF = 128 $. The results are summarized in the tables:

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

Product Quantization increases both indexing and searching time. The higher the compression
ratio, the lower the search precision. The main benefit is of course the reduced usage of the
memory.

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

It turns out that in some cases Product Quantization may not only reduce the memory usage,
but also the search time.
