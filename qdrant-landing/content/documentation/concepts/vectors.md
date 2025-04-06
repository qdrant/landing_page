---
title: Vectors
weight: 41
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

By using this property of vectors, you can explore your data in a number of ways; e.g. by searching for similar objects, clustering objects, and more.


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

In order to use multivectors, we need to specify a function that will be used to compare between matrices of vectors

Currently, Qdrant supports `max_sim` function, which is defined as a sum of maximum similarities between each pair of vectors in the matrices.

$$
score = \sum_{i=1}^{N} \max_{j=1}^{M} \text{Sim}(\text{vectorA}_i, \text{vectorB}_j)
$$

Where $N$ is the number of vectors in the first matrix, $M$ is the number of vectors in the second matrix, and $\text{Sim}$ is a similarity function, for example, cosine similarity.

To use multivectors, create a collection with the following configuration:

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-multivector/" >}}

To insert a point with multivector:

{{< code-snippet path="/documentation/headless/snippets/insert-points/with-multivector/" >}}

To search with multivector (available in `query` API): 

{{< code-snippet path="/documentation/headless/snippets/query-points/multivector/" >}}


## Named Vectors

In Qdrant, you can store multiple vectors of different sizes and [types](#vector-types) in the same data [point](/documentation/concepts/points/). This is useful when you need to define your data with multiple embeddings to represent different features or modalities (e.g., image, text or video). 

To store different vectors for each point, you need to create separate named vector spaces in the [collection](/documentation/concepts/collections/). You can define these vector spaces during collection creation and manage them independently.

<aside role="status">
Each vector should have a unique name. Vectors can represent different modalities and you can use different embedding models to generate them.
</aside>

To create a collection with named vectors, you need to specify a configuration for each vector:

{{< code-snippet path="/documentation/headless/snippets/create-collection/named-vectors/" >}}

To insert a point with named vectors:

{{< code-snippet path="/documentation/headless/snippets/insert-points/named-vectors/" >}}

To search with named vectors (available in `query` API):

{{< code-snippet path="/documentation/headless/snippets/query-points/named-vector/" >}}

## Datatypes

Newest versions of embeddings models generate vectors with very large dimentionalities.
With OpenAI's `text-embedding-3-large` embedding model, the dimensionality can go up to 3072.

The amount of memory required to store such vectors grows linearly with the dimensionality,
so it is important to choose the right datatype for the vectors.

The choice between datatypes is a trade-off between memory consumption and precision of vectors.

Qdrant supports a number of datatypes for both dense and sparse vectors:

**Float32**

This is the default datatype for vectors in Qdrant. It is a 32-bit (4 bytes) floating-point number. 
The standard OpenAI embedding of 1536 dimensionality will require 6KB of memory to store in Float32.

You don't need to specify the datatype for vectors in Qdrant, as it is set to Float32 by default.

**Float16**

This is a 16-bit (2 bytes) floating-point number. It is also known as half-precision float.
Intuitively, it looks like this:

```text
float32 -> float16 delta (float32 - float16).abs

0.79701585 -> 0.796875   delta 0.00014084578
0.7850789  -> 0.78515625 delta 0.00007736683
0.7775044  -> 0.77734375 delta 0.00016063452
0.85776305 -> 0.85791016 delta 0.00014710426
0.6616839  -> 0.6616211  delta 0.000062823296
```

The main advantage of Float16 is that it requires half the memory of Float32, while having virtually no impact on the quality of vector search.

To use Float16, you need to specify the datatype for vectors in the collection configuration:

{{< code-snippet path="/documentation/headless/snippets/create-collection/datatype-float16-sparse-and-dense/" >}}

**Uint8**

Another step towards memory optimization is to use the Uint8 datatype for vectors.
Unlike Float16, Uint8 is not a floating-point number, but an integer number in the range from 0 to 255.

Not all embeddings models generate vectors in the range from 0 to 255, so you need to be careful when using Uint8 datatype.

In order to convert a number from float range to Uint8 range, you need to apply a process called quantization.

Some embedding providers may provide embeddings in a pre-quantized format.
One of the most notable examples is the [Cohere int8 & binary embeddings](https://cohere.com/blog/int8-binary-embeddings).

For other embeddings, you will need to apply quantization yourself.


<aside role="alert">
There is a difference in how Uint8 vectors are handled for dense and sparse vectors.
Dense vectors are required to be in the range from 0 to 255, while sparse vectors can be quantized in-flight.
</aside>


{{< code-snippet path="/documentation/headless/snippets/create-collection/datatype-uint8-sparse-and-dense/" >}}

## Quantization

Apart from changing the datatype of the original vectors, Qdrant can create quantized representations of vectors alongside the original ones.
This quantized representation can be used to quickly select candidates for rescoring with the original vectors or even used directly for search.

Quantization is applied in the background, during the optimization process.

More information about the quantization process can be found in the [Quantization](/documentation/guides/quantization/) section.


## Vector Storage

Depending on the requirements of the application, Qdrant can use one of the data storage options.
Keep in mind that you will have to tradeoff between search speed and the size of RAM used.

More information about the storage options can be found in the [Storage](/documentation/concepts/storage/#vector-storage) section.
