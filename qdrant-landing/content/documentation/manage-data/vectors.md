---
title: Vectors
short_description: "Configure dense, sparse, and multivector representations in Qdrant to model text, images, and multimodal data."
description: "Define dense, sparse, and multivector configurations in Qdrant collections to support text, image, multimodal, and late-interaction retrieval like ColBERT."
weight: 10
cta: "Try dense and sparse vectors with your own data in Cloud."
aliases:
  - /vectors
---

# Vectors

Vectors (or embeddings) are the core concept of the Qdrant Vector Search engine. 
Vectors define the similarity between objects in the vector space.

If a pair of vectors are similar in vector space, it means that the objects they represent are similar in some way.

For example, if you have a collection of images, you can represent each image as a vector.
If two images are similar, their vectors will be close to each other in the vector space.

In order to obtain a vector representation of an object, you need to apply a vectorization algorithm to the object.
Usually, this algorithm is a neural network that converts the object into a fixed-size vector.

The neural network is usually [trained](/articles/metric-learning-tips/) on a pairs or [triplets](/articles/triplet-loss/) of similar and dissimilar objects, so it learns to recognize a specific type of similarity.

By using this property of vectors, you can explore your data in a number of ways; for example, by searching for similar objects, clustering objects, and more.

## Vector Types

Modern neural networks can output vectors in different shapes and sizes, and Qdrant supports most of them.
Let's take a look at the most common types of vectors supported by Qdrant.

### Dense Vectors

This is the most common type of vector. It is a simple list of numbers, it has a fixed length and each element of the list is a floating-point number.

It looks like this:

```json

// A piece of a real-world dense vector
[
    -0.013052909,
    0.020387933,
    -0.007869,
    -0.11111383,
    -0.030188112,
    -0.0053388323,
    0.0010654867,
    0.072027855,
    -0.04167721,
    0.014839341,
    -0.032948174,
    -0.062975034,
    -0.024837125,
    ....
]
```

A dense vector can have between 1 and 65,536 dimensions.

The majority of neural networks create dense vectors, so you can use them with Qdrant without any additional processing.
Although compatible with most embedding models out there, Qdrant has been tested with the following [verified embedding providers](/documentation/embeddings/).

### Sparse Vectors

Sparse vectors are a special type of vectors. 
Mathematically, they are the same as dense vectors, but they contain many zeros so they are stored in a special format.

Sparse vectors in Qdrant don't have a fixed length, as it is dynamically allocated during vector insertion.
The amount of non-zero values in sparse vectors is currently limited to u32 datatype range (4294967295). 

In order to define a sparse vector, you need to provide a list of non-zero elements and their indexes.

```json
// A sparse vector with 4 non-zero elements
{
    "indexes": [1, 3, 5, 7],
    "values": [0.1, 0.2, 0.3, 0.4]
}
```

Sparse vectors in Qdrant are kept in special storage and indexed in a separate index, so their configuration is different from dense vectors.

To create a collection with sparse vectors:

{{< code-snippet path="/documentation/headless/snippets/create-collection/sparse-vector/" >}}

Insert a point with a sparse vector into the created collection:

{{< code-snippet path="/documentation/headless/snippets/insert-points/sparse-vectors-single/" >}}

Now you can run a search with sparse vectors:

{{< code-snippet path="/documentation/headless/snippets/query-points/sparse-vectors/" >}}

### Multivectors

**Available as of v1.10.0**

Qdrant supports the storing of a variable amount of same-shaped dense vectors in a single point. 
This means that instead of a single dense vector, you can upload a matrix of dense vectors.

The length of the matrix is fixed, but the number of vectors in the matrix can be different for each point.

Multivectors look like this:

```json
// A multivector of size 4
"vector": [
    [-0.013,  0.020, -0.007, -0.111],
    [-0.030, -0.055,  0.001,  0.072],
    [-0.041,  0.014, -0.032, -0.062],
    ....
]

```

There are two scenarios where multivectors are useful:

* **Multiple representation of the same object** - For example, you can store multiple embeddings for pictures of the same object, taken from different angles. This approach assumes that the payload is same for all vectors.
* **Late interaction embeddings** - Some text embedding models can output multiple vectors for a single text. 
For example, a family of models such as ColBERT output a relatively small vector for each token in the text. 

MaxSim returns a single combined score per point, not per subvector. For per-representation control across title, summary, and chunk embeddings, see [Named Vectors](#named-vectors) and the [Multi-Representation Search tutorial](/documentation/tutorials-search-engineering/multi-representation-search/). The [multivectors course](/course/multi-vector-search/) covers limitations at scale.

In order to use multivectors, we need to specify a function that will be used to compare between matrices of vectors

Currently, Qdrant supports `max_sim` function, which is defined as a sum of maximum similarities between each pair of vectors in the matrices.

$$
score = \sum_{i=1}^{N} \max_{j=1}^{M} \text{Sim}(\text{vectorA}_i, \text{vectorB}_j)
$$

Where $N$ is the number of vectors in the first matrix, $M$ is the number of vectors in the second matrix, and $\text{Sim}$ is a similarity function, for example, cosine similarity.

To use multivectors, create a dense vector with a multivector comparator:

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-multivector/" >}}

To insert a point with multivector:

{{< code-snippet path="/documentation/headless/snippets/insert-points/with-multivector/" >}}

To search with multivector (available in `query` API): 

{{< code-snippet path="/documentation/headless/snippets/query-points/multivector/" >}}

The maximum number of sub-vectors has a hard limit and is determined by the formula `number_of_sub_vectors * vector_size < 1,048,576`. For a 4096-dimensional model this allows up to 255 sub-vectors per point. The limit is not configurable. If a late-interaction model produces more sub-vectors than the limit allows, pool the token vectors before storing, or split the document into multiple points and aggregate scores at query time.

## Named Vectors

In Qdrant, you can store multiple vectors of different sizes and [types](#vector-types) in the same data [point](/documentation/manage-data/points/). This is useful when you need to define your data with multiple embeddings to represent different features or modalities (for example, image, text, or video).

To store different vectors for each point, you need to create separate named vector spaces in the [collection](/documentation/manage-data/collections/). You can define these vector spaces during collection creation or [add them later](#adding-and-removing-named-vectors) and manage them independently.

<aside role="status">
Each vector should have a unique name. Vectors can represent different modalities and you can use different embedding models to generate them.
</aside>

To create a collection with named vectors, you need to specify a configuration for each vector:

{{< code-snippet path="/documentation/headless/snippets/create-collection/named-vectors/" >}}

To insert a point with named vectors:

{{< code-snippet path="/documentation/headless/snippets/insert-points/named-vectors/" >}}

To search with named vectors (available in `query` API):

{{< code-snippet path="/documentation/headless/snippets/query-points/named-vector/" >}}

### Adding and Removing Named Vectors

*Available as of v1.18.0*

Named vectors can be added to or removed from an existing collection without having to recreate the collection.

For example:

{{< code-snippet path="/documentation/headless/snippets/create-named-vector/dense/" >}}

Refer to [Update Vector Schema](/documentation/manage-data/collections/#update-vector-schema) for more details.


## Inference

Instead of providing vectors explicitly when ingesting or querying data, Qdrant can also generate vectors using a process called [inference](/documentation/inference/). Inference is the process of creating vector embeddings from text, images, or other data types using a machine learning model.

You can use inference in the API wherever you can use regular vectors. For example, while upserting points, you can provide the text or image and the embedding model:

{{< code-snippet path="/documentation/headless/snippets/inference/ingest/" >}}

Qdrant uses the model to generate the embeddings and store the point with the resulting vector.

Similarly, you can use inference at query time by providing the text or image to query with and the embedding model:

{{< code-snippet path="/documentation/headless/snippets/inference/query/" >}}

## Datatypes

*Available as of v1.9.0*

By default, Qdrant stores each vector dimension as a 32-bit floating-point number. This isn't always necessary: you may not need that level of precision for your use case, or the embedding model you're using may already produce lower-precision vectors, for example 8-bit integers.

Storing vectors as 32-bit floats has a cost: memory and storage grow linearly with dimensionality. For example, with OpenAI's `text-embedding-3-large` model, vectors can reach 3072 dimensions, which adds up fast.

To reduce vector size or efficiently store vectors that are already lower precision, you can configure a per-vector datatype: [Float32](#float32) (default), one of the [TurboQuant datatypes](#turboquant-datatypes) ([Turbo16](#turbo16), [Turbo8](#turbo8), or [Turbo4](#turbo4)), [Float16](#float16), or [Uint8](#uint8).

Note that datatypes are distinct from the [quantization feature](/documentation/manage-data/quantization/). Quantization creates a separate quantized representation of vectors alongside the original ones, while datatypes determine the representation of the original vectors themselves.

### Float32

This is the default datatype for vectors in Qdrant. It is a 32-bit (4 bytes) floating-point number. 
The standard OpenAI embedding of 1536 dimensionality will require 6KB of memory to store in `float32`.

You don't need to explicitly specify this datatype for vectors in Qdrant, as it is set to `float32` by default.

### TurboQuant Datatypes

TurboQuant datatypes store each vector in a compressed form, using fewer bits per dimension than a 32-bit float. They're built on [TurboQuant](/articles/turboquant-quantization/). Each vector is first rotated mathematically, spreading each dimension's information evenly across the whole vector so no single dimension loses a disproportionate share of detail during compression. Each rotated value is then stored with fewer bits.

TurboQuant datatypes accept regular floating-point vectors and compress them when they're stored. They're supported for dense vectors and [multivectors](#multivectors), but can't be used to configure sparse vectors.

<aside role="status">
Don't confuse TurboQuant datatypes with <a href="/documentation/manage-data/quantization/#turboquant-quantization">TurboQuant quantization</a>. Quantization keeps the original vectors and adds a compressed copy alongside them. A TurboQuant datatype replaces the original vectors with their compressed form, so no full-precision copy is kept.
</aside>

#### Turbo16

*Available as of v1.20.0*

The `turbo16` datatype stores each vector as a 16-bit representation per dimension instead of a 32-bit floating-point number. This shrinks vector storage to about half of its original size.

To use `turbo16`, specify the `turbo16` datatype for the vector when creating a collection or when adding a new vector to an existing collection's schema:

{{< code-snippet path="/documentation/headless/snippets/create-collection/datatype-turbo16/" >}}

Compared to [`float16`](#float16), `turbo16` is nearly the same size but stays about 7.5x closer to your original `float32` vectors. `float16` keeps the same relative error for every value, so in embeddings where a few very large values dominate the score, their rounding errors don't cancel out. This happens with models like OpenAI's `text-embedding-ada-002`, CLIP, and Cohere. Because each vector is rotated first, its values have a similar spread, so a 16-bit grid with one scale per vector covers them well.

#### Turbo8

*Available as of v1.20.0*

The `turbo8` datatype stores each vector as an 8-bit representation per dimension instead of a 32-bit floating-point number. This shrinks vector storage to about one-quarter of its original size.

To use `turbo8`, specify the `turbo8` datatype for the vector when creating a collection or when adding a new vector to an existing collection's schema:

{{< code-snippet path="/documentation/headless/snippets/create-collection/datatype-turbo8/" >}}

#### Turbo4

*Available as of v1.19.0*

The `turbo4` datatype stores each vector as a compact 4-bit representation per dimension instead of a 32-bit floating-point number. This shrinks vector storage to about one-eighth of its original size. Each rotated value is stored as one of 16 levels (the maximum 4 bits can represent).

To use `turbo4`, specify the `turbo4` datatype for the vector when creating a collection or when adding a new vector to an existing collection's schema:

{{< code-snippet path="/documentation/headless/snippets/create-collection/datatype-turbo4/" >}}

#### Choosing a TurboQuant Datatype

The TurboQuant datatypes trade vector size for recall:

| Datatype | Bytes per dimension | Use it when |
|---|---|---|
| `turbo16` | 2 | You want the recall of `float32` at half the size. |
| `turbo8` | 1 | You want recall close to `float32` at one-quarter of the size. |
| `turbo4` | 0.5 | Storage is the main constraint, and you can accept lower recall at one-eighth of the size. |

You can combine any TurboQuant datatype with the [quantization feature](/documentation/manage-data/quantization/#turboquant-quantization) for memory-efficient rescoring. For example, adding 1-bit TurboQuant on top of `turbo4` uses a compact index for the initial search, then rescores against the 4-bit `turbo4` vectors. This is more storage-efficient than pairing 1-bit quantization with full-precision vectors, at the cost of rescoring precision.

### Float16

The `float16` datatype stores each dimension as a 16-bit (2-byte) floating-point number, also known as a half-precision float. This shrinks vector storage to half of its original size, with a small loss of precision per value:

```text
float32 -> float16 delta (float32 - float16).abs

0.79701585 -> 0.796875   delta 0.00014084578
0.7850789  -> 0.78515625 delta 0.00007736683
0.7775044  -> 0.77734375 delta 0.00016063452
0.85776305 -> 0.85791016 delta 0.00014710426
0.6616839  -> 0.6616211  delta 0.000062823296
```

The main advantage of `float16` is that it requires half the memory of `float32`, while having virtually no impact on the quality of vector search.

To use `float16`, you need to specify the datatype for vectors in the collection configuration when creating a collection or when adding a new vector to an existing collection's schema:

{{< code-snippet path="/documentation/headless/snippets/create-collection/datatype-float16-sparse-and-dense/" >}}

### Uint8

The `uint8` datatype stores each dimension as an unsigned 8-bit integer (1 byte), with values from 0 to 255. This shrinks vector storage to one-quarter of its original size. The impact of this range depends on whether you use dense or sparse vectors:

- Dense vectors are required to be in the range from 0 to 255. Not all embeddings models generate vectors in the range from 0 to 255, so you need to be careful when using the `uint8` datatype. 
- Sparse vectors can be quantized in-flight.

For dense vectors, `uint8` is only useful if they have already been quantized to this range. Some embedding providers offer embeddings in this format, such as [Cohere's 8-bit integer embeddings](https://cohere.com/blog/int8-binary-embeddings). To reduce the size of regular floating-point vectors, use a [TurboQuant datatype](#turboquant-datatypes) instead.

{{< code-snippet path="/documentation/headless/snippets/create-collection/datatype-uint8-sparse-and-dense/" >}}

## Quantization

Apart from changing the datatype of the original vectors, Qdrant can create quantized representations of vectors alongside the original ones.
This quantized representation can be used to quickly select candidates for rescoring with the original vectors or even used directly for search.

Quantization is applied in the background, during the optimization process.

More information about the quantization process can be found in the [Quantization](/documentation/manage-data/quantization/) section.

## Vector Storage

Qdrant always [stores vectors on disk](/documentation/manage-data/storage/#vector-storage). To improve query latency, you can also load a copy of the vectors into memory for faster access by configuring [a memory tier](/documentation/ops-configuration/memory-tiers/).