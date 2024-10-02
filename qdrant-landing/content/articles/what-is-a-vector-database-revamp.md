---
title: "What is a Vector Database? Revamped"
draft: false
slug: what-is-a-vector-database-revamped
short_description:  What is a Vector Database? Use Cases & Examples | Qdrant
description: Discover what a vector database is, its core functionalities, and real-world applications.
preview_dir: /articles_data/what-is-a-vector-database-revamp/preview
weight: -211
social_preview_image: /articles_data/what-is-a-vector-database-revamp/preview/social-preview.jpg
small_preview_image: /articles_data/what-is-a-vector-database-revamp/icon.svg
date: 2024-09-30T09:29:33-03:00
author: Sabrina Aquino 
featured: true 
tags: 
  - vector-search
  - vector-database
  - embeddings

---

> A [Vector Database](https://qdrant.tech/qdrant-vector-database/) is a specialized database system designed for efficiently indexing, querying, and retrieving high-dimensional vector data. Those systems enable advanced data analysis and similarity-search operations that extend well beyond the traditional, structured query approach of conventional databases.

We can no longer fit our data into rows and columns. 

Most of the millions of terabytes of data that we're generating each day is unstructured.

Unstructured data is data that doesn’t follow a predefined format or schema. It includes images, videos, audio files, social media posts, emails, documents, code, and almost everything else that we create online.

### The Challenge With Traditional Databases

Traditional [OLTP](https://www.ibm.com/topics/oltp) and [OLAP](https://www.ibm.com/topics/olap) databases have been the backbone of data storage for decades. They are great at managing structured data with well-defined schemas, like `name`, `address`, `phone number`, and `purchase history`.


<img src="/articles_data/what-is-a-vector-database-revamp/oltp-and-olap.png" alt="Structure of OLTP and OLAP databases" width="500">

But when data can't be easily categorized, like the content inside a PDF file, things start to get complicated. 

Sure, you could store the PDF file as raw data perhaps with some metadata attached to it. But the database still wouldn’t be able to understand what's inside the document, categorize it or even search for the information it may have.

And it's not just PDFs. Think about the vast amounts of text, audio, and image data we generate every day. If a database can’t grasp the **meaning** of this data, how do we search or find relationships inside my dataset?

<img src="/articles_data/what-is-a-vector-database-revamp/vector-db-structure.png" alt="Structure of a Vector Database" width="400">

Vector databases allow you to understand the **context** or **conceptual similarity** of unstructured data by representing them as vectors, enabling advanced analysis and retrieval based on data similarity.

### When To Use a Vector Database?

Not sure if you should use a vector database or a traditional database? etc -also we can mention about things like elastic search (comment)

| **Feature**         | **OLTP Database**       | **OLAP Database**             | **Vector Database**                        |
|---------------------|--------------------------------------|--------------------------------------------|--------------------------------------------|
| **Data Structure**   | Rows and columns                    | Rows and columns                           | Vectors                                    |
| **Type of Data**     | Structured                          | Structured/Partially Unstructured          | Unstructured                               |
| **Query Method**     | SQL-based (Transactional Queries)   | SQL-based (Aggregations, Analytical Queries) | Vector Search (Similarity-Based)           |
| **Storage Focus**    | Schema-based, optimized for updates | Schema-based, optimized for reads          | Context and Semantics                      |
| **Performance**      | Optimized for high-volume transactions | Optimized for complex analytical queries   | Optimized for unstructured data retrieval  |
| **Use Cases**        | Inventory, order processing, CRM    | Business intelligence, data warehousing    | Similarity search, recommendations, RAG, anomaly detection, etc. |


### What Is A Vector?

So let’s start at the basics. When a machine needs to process unstructured data—whether it’s an image, a piece of text, or an audio file, it first has to translate that data into a format it can work with: **vectors**.

A **vector** is a numerical representations of data that can capture the **context** and **semantics** of data. 

Imagine you’ve got a photo of a dog. It’s not enough for a machine to just store it like we would in a folder on your desktop. The machine needs to understand it somehow. 

The dog photo gets translated into a vector, which is basically a bunch of numbers describing different aspects of that image: the shape, the colors, the patterns, and so on. 

And just like that, the machine isn’t dealing with a random pile of pixels anymore. Now it can compare this dog photo to other images—finding similarities, differences, and maybe even telling you which other photos are close to it.

<img src="/articles_data/what-is-a-vector-database-revamp/vector.png" alt="Structure of OLTP and OLAP databases" width="700">

Now that we’ve got a handle on what vectors are, let’s talk about the building blocks that make them work inside a vector database. There are three main parts you’ll want to understand: the **ID**, the **dimensions**, and the **payload**. Each part plays a critical role in how vectors are stored, retrieved, and interpreted.

#### 1. The ID: Your Vector’s Unique Identifier

Just like in a relational database, each vector in a vector database gets a unique `ID`. Think of it as your vector’s name tag, a **primary key** that ensures the vector can be easily found later. When a vector is added to the database, the ID is created automatically.

While the ID itself doesn't play a part in the similarity search (which operates on the vector's numerical data), it is essential for associating the vector with its corresponding "real-world" data, whether that’s a document, an image, or a sound file. 

After a search is performed and similar vectors are found, their IDs are returned. These can then be used to **fetch additional details or metadata** tied to the result. 

#### 2. The Dimentions: The Core Representation of the Data

At the core of every vector is a set of numbers, which together form a representation of the data in a **multi-dimensional** space.

#### From Text to Vectors: How Does It Work?

These numbers are generated by **embedding models**, such as deep learning algorithms, and capture the essential patterns or relationships within the data. That's why the term **embedding** is often used interchangeably with vector when referring to the output of these models.

To represent textual data, for example, an embedding will encapsulate the nuances of language, such as semantics and context within its dimentions. 

<img src="/articles_data/what-is-a-vector-database-revamp/embedding-model.png" alt="Creation of a vector based on a sentence with an embedding model" width="500">

For that reason, when comparing two similar sentences, for example, their embeddings will turn out to be very similar, because they have similar **linguistic elements.**

<img src="/articles_data/what-is-a-vector-database-revamp/two-similar-vectors.png" alt="Comparisson of the embeddings of 2 similar sentences" width="500">

That’s the beauty of embeddings. It distills the complexity of the data into something that can be compared across a multi-dimensional space.

#### 3. The Payload: Adding Context with Metadata

Sometimes you're gonna need more than just numbers to fully understand or refine a search. While the dimensions capture the essence of the data, the payload holds **metadata** for structured information.

It could be textual data like descriptions, tags, categories, or it could be numerical values like dates or prices. This extra info is vital when you want to filter or rank search results based on criteria that aren’t directly encoded in the vector.

This metadata is invaluable when you need to apply additional **filters** or **sorting** criteria. 

For example, if you’re searching for a picture of a dog, the vector helps the database find images that are visually similar. But let's say you want results showing only images taken within the last year, or those tagged with “vacation.”

<img src="/articles_data/what-is-a-vector-database-revamp/filtering-example.png" alt="Filtering Example" width="500">

The payload can help you narrow down those results by ignoring vectors that doesn't match your query vector filtering criteria. If you want the full picture of how filtering works in Qdrant, check out our [Complete Guide to Filtering.](https://qdrant.tech/articles/vector-search-filtering/)

### Dense vs. Sparse Vectors

Now that we understand what vectors are how they are created, let's learn more about the two possible types of vectors we can have: **dense** or **sparse**. The main difference between the two are: 

#### 1. Dense Vectors

Dense vectors are, quite literally, dense with information. Every element in the vector contributes to the **semantic meaning**, **relationships** and **nuances** of the data. A dense vector representation of this sentence might look like this:

<img src="/articles_data/what-is-a-vector-database-revamp/dense-1.png" alt="Representation of a Dense Vector" width="500">

Each number holds weight. Together, they convey the overall meaning of the sentence, and are better for identifying contextually similar items, even if the words don’t match exactly.

#### 2. Sparse Vectors

Sparse vectors  operate differently. They focus only on the essentials. In most sparse vectors, a large number of elements are zeros. When a feature or token is present, it’s marked—otherwise, zero. 

In the image, we see a sentence, *“I love Vector Similarity,”* broken down into tokens like *“i,” “love,” “vector”* through tokenization. Each token is assigned a unique `ID` from a large vocabulary. For example, *“i”* becomes `193`, and *“vector”* becomes `15012`.

<img src="/articles_data/what-is-a-vector-database-revamp/sparse.png" alt="How Sparse Vectors are Created" width="700">

Sparse vectors, are used for **exact matching** and specific token-based identification. The values on the right, such as `193: 0.04` and `9182: 0.12`, are the scores or weights for each token, showing how relevant or important each token is in the context. The final result is a sparse vector:

```yaml
{
   193: 0.04,
   9182: 0.12,
   15012: 0.73,
   6731: 0.69,
   454: 0.21
}
```

Everything else in the vector space is assumed to be zero.

Sparse vectors are ideal for tasks like **keyword search** or **metadata filtering**, where you need to check for the presence of specific tokens without needing to capture the full meaning or context. They suited for exact matches within the **data itself**, rather than relying on external metadata, which is handled by payload filtering.

### Hybrid Search: Combining Dense and Sparse Vectors for Better Results

Sometimes context alone isn’t always enough. Sometimes you need precision, too. Dense vectors are fantastic when you need to retrieve results based on the concept or meaning behind the data. Sparse vectors step in when you need exactness.

The beauty of hybrid search is that you don’t have to choose one over the other. You can take the semantic power of dense vectors and combine it with the sharp focus of sparse vectors. Together, they deliver results that are both **relevant** and **filtered**.

Qdrant combines dense and sparse vector results through a process of **normalization** and **fusion**. To learn more about what is happening behind the scenes, check out our [dedicated article on Hybrid Search.](https://qdrant.tech/articles/hybrid-search/)

<img src="/articles_data/what-is-a-vector-database-revamp/hybrid-search-2.png" alt="Hybrid Search API - How it works" width="500">

#### How to Use Hybrid Search in Qdrant
Qdrant makes it easy to implement hybrid search through its Query API. Here’s how you can make it happen in your own project:

<img src="/articles_data/what-is-a-vector-database-revamp/hybrid-query-1.png" alt="Hybrid Query Example" width="700">

**Example Hybrid Query:** Let’s say a researcher is looking for papers on NLP, but the paper must specifically mention "transformers" in the content:

```python
search_query = {
    "vector": query_vector,  # Dense vector for semantic search
    "filter": {  # Sparse vector filtering for specific terms
        "must": [
            {"key": "text", "match": "transformers"}  # Exact keyword match in the paper
        ]
    }
}
```
In this query the dense vector search finds papers related to the broad topic of NLP and the sparse vector filtering ensures that the papers specifically mention “transformers”.

### Architecture of a Vector Database

A vector database is made of multiple different entities and relations. Here’s a high-level overview of Qdrant’s terminologies and how they fit into the larger picture:

<img src="/articles_data/what-is-a-vector-database-revamp/architecture-vector-db.png" alt="Architecture Diagram of a Vector Database" width="900">

**Collections:** A [collection](https://qdrant.tech/documentation/concepts/collections/) is essentially a group of **vectors** (or “[points](https://qdrant.tech/documentation/concepts/points/)”) that are logically grouped together based on similarity or a specific task. Every vector within a collection shares the same dimensionality and can be compared using a single metric. 

**Distance Metrics:** These metrics defines how similarity between vectors is calculated. The choice of distance metric is made when creating a collection and the right choice depends on the type of data you’re working with and how the vectors were created. Here we have the three most common distance metrics:

- **Euclidean Distance:** The straight-line path. It’s like measuring the physical distance between two points in space. Pick this one when the actual distance (like spatial data) matters.

- **Cosine Similarity:** This one is about the angle, not the length. It measures how two vectors point in the same direction, so it works well for text or documents when you care more about meaning than magnitude. For example, if two things are *similar*, *opposite*, or *unrelated*:

<img src="/articles_data/what-is-a-vector-database-revamp/cosine-similarity.png" alt="Cosine Similarity Example" width="700">

- **Dot Product:** This looks at how much two vectors align. It’s popular in recommendation systems where you're interested in how much two things “agree” with each other.

#### RAM-Based and Memmap Storage

By default, Qdrant stores vectors in RAM, delivering incredibly fast access for datasets that fit comfortably in memory. But when your dataset exceeds RAM capacity, Qdrant offers Memmap as an alternative.

Memmap allows you to store vectors **on disk**, yet still access them efficiently by mapping the data directly into memory if you have enough RAM. While not as fast as pure RAM access. To enable it, you only need to set `"on_disk": true` when you are **creating a collection:**

```python
client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=768, distance=models.Distance.COSINE, on_disk=True
    ),
)
```

For other configurations like `hnsw_config.on_disk` or `memmap_threshold_kb`, see the Qdrant documentation for [Storage.](https://qdrant.tech/documentation/concepts/storage/)

#### SDKs

Qdrant offers a range of SDKs, so you can interact with it using the programming language you're most comfortable with. Whether you're coding in [Python](https://github.com/qdrant/qdrant-client), [Go](https://github.com/qdrant/go-client), [Rust](https://github.com/qdrant/rust-client), or [Javascript/Typescript](https://github.com/qdrant/qdrant-js).

### The Core Functionalities of Vector Databases

When you think of a traditional database, the operations are familiar: you **create,** **search,** **update,** and **delete** records. These are the fundamentals. And guess what? In many ways, vector databases work the same way, but the operations are built for the complexity of vectors.

#### 1. Indexing: HNSW Index and Sending Data To Qdrant

When it comes to vector search, you want speed without sacrificing accuracy. **HNSW** (Hierarchical Navigable Small World) is an indexing algorithm that helps you find similar vectors efficiently.

HNSW works by creating a multi-layered graph. Each vector is a node, and connections between nodes represent similarity. The higher layers are more general, connecting vectors that are broadly similar. As you move down the layers, the connections become more specific, linking vectors that are closely related.

<img src="/articles_data/what-is-a-vector-database-revamp/hnsw.png" alt="Indexing Data with the HNSW algorithm" width="500">

When you run a search, HNSW starts at the top, quickly narrowing down the search by hopping between layers. It focuses only on relevant vectors as it goes deeper, refining the search with each step.

#### 1.1 Payload Indexing

In Qdrant, indexing is modular. You can configure indexes for **both vectors and payloads independently**. The payload index is responsible for optimizing filtering based on metadata. Each payload index is built for a specific field and allows you to quickly filter vectors based on specific conditions.

<img src="/articles_data/what-is-a-vector-database-revamp/hnsw-search.png" alt="Searching Data with the HNSW algorithm" width="300">

You need to build the payload index for **each field** you'd like to search. The magic here is in the combination: HNSW finds similar vectors, and the payload index makes sure only the ones that fit your criteria come through. Learn more about Qdrant's [Filtrable HNSW](https://qdrant.tech/articles/filtrable-hnsw/) and why it was build like this.

Combining [full-text search](https://qdrant.tech/documentation/concepts/indexing/#full-text-index) with vector-based search gives you even more versatility. You can simultaneously search for conceptually similar documents while ensuring specific keywords are present, all within the same query.

#### 2. Searching: Approximate Nearest Neighbors (ANN) Search

Similarity search allows you to search by **meaning.** This way you can do searches such as similar songs that evoke the same mood, finding images that match your artistic vision, or even exploring emotional patterns in text.

<img src="/articles_data/what-is-a-vector-database-revamp/similarity.png" alt="Similar words grouped together" width="800">

The way it works is, when the user queries the database, this query is also converted into a vector. The algorithm quickly identifies the area of the graph likely to contain vectors closest to the **query vector.**

<img src="/articles_data/what-is-a-vector-database-revamp/ann-search.png" alt="Approximate Nearest Neighbors (ANN) Search Graph" width="500">

The search then moves down progressively narrowing down to more closely related and relevant vectors. Once the closest vectors are identified at the bottom layer, these points translate back to actual data, representing your **top scored documents.** 

Here's a high-level overview of this process:

<img src="/articles_data/what-is-a-vector-database-revamp/simple-arquitecture.png" alt="Vector Database Seaching Funcionality" width="600">

#### 3. Updating Vectors: Real-Time and Bulk Adjustments

Data isn't static, and neither are vectors. Keeping your vectors up to date is crucial for maintaining relevance in your searches.

Vector updates don’t always need to happen instantly, but when they do, Qdrant handles real-time modifications efficiently with a simple API call:

```python
qdrant_client.upsert(
    collection_name='product_collection',
    points=[PointStruct(id=product_id, vector=new_vector, payload=new_payload)]
)
```

For large-scale changes, like re-indexing vectors after a model update, batch updating allows you to update multiple vectors in one operation without impacting search performance:

```python
batch_of_updates = [
    PointStruct(id=product_id_1, vector=updated_vector_1, payload=new_payload_1),
    PointStruct(id=product_id_2, vector=updated_vector_2, payload=new_payload_2),
    # Add more points...
]

qdrant_client.upsert(
    collection_name='product_collection',
    points=batch_of_updates
)
```

#### 4. Deleting Vectors: Managing Outdated and Duplicate Data

Efficient vector management is key to keeping your searches accurate and your database lean. Deleting vectors that represent outdated or irrelevant data, such as expired products, old news articles, or archived profiles, helps maintain both performance and relevance.

In Qdrant, removing vectors is straightforward, requiring only the vector IDs to be specified:

```python
qdrant_client.delete(
    collection_name='data_collection',
    points_selector=PointIdsList([vector_id_1, vector_id_2])
)
```
You can use deletion to remove outdated data, clean up duplicates, and manage the lifecycle of vectors by automatically deleting them after a set period to keep your dataset relevant and focused.

#### Distributed Deployment and Sharding

#### Replication Snappshoting

#### Quantization

#### Multitenancy: Scalable Isolation Without Overhead

#### Efficient Query Processing

#### Data Security and Access Control

#### Vector Databases Comparison

#### Vector Database Use Cases
