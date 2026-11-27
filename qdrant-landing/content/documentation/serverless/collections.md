---
title: Manage Collections
short_description: "Create, inspect, and delete Qdrant Serverless collections, with one precision tier per vector instead of index and quantization settings."
description: "Create Qdrant Serverless collections in the console or with the API, configure dense and sparse vectors, precision tiers, and payload indexes, and list, inspect, and delete collections."
weight: 30
---

# Manage Collections

You create collections in the Qdrant Cloud console or through the [API](/documentation/serverless/connect/). You declare what you want to store and how you want to filter it. The platform decides how to index it.

That means no HNSW parameters, no quantization settings, no segment or storage options. Qdrant Serverless just asks for one precision tier per vector. See [About Qdrant Serverless](/documentation/serverless/#precision-tiers) for the tiers.

<aside role="status">You can't change a collection after you create it. That means no adding or removing a named vector, no adding a payload index, and no changing vector parameters. Declare the full schema up front. To change a schema, create a new collection, upload your points again, then delete the old one.</aside>

For multitenant applications, create one collection per tenant. See [Multitenancy on Serverless](/documentation/manage-data/multitenancy/#multitenancy-on-serverless).

## Create a Collection

You can create a collection in the console or with the API. Both take the same configuration options, described under [Collection Configuration](#collection-configuration) below.

### Create a Collection in the Console

The **Create New Collection** form in the console builds the collection configuration for you:

1. Open the space, go to the **Collections** tab, and select **Create Collection**.
2. Enter a **Collection name**.
3. Under **What to use for search?**, pick a starting configuration: **Simple Single Embedding** for one dense vector, **Simple Hybrid Search** for one dense and one sparse vector, or **Custom** to define your own.
4. Set the vector options, such as **Dimensions** and **Metric** for a dense vector. More options are under **Advanced configuration**.
5. Optionally, select **Add payload index** for each field you filter by.
6. Select **Create Collection**.

While you fill in the form, the **Equivalent Request** panel shows the matching API request, which you can copy into your own code, and an estimate of the storage size per point.

### Create a Collection with the API

This example creates a collection for hybrid search, with a dense vector at the `Medium` precision tier, a sparse vector with the IDF modifier, and two payload indexes. It assumes a connected `client`, as described in [Connect to a Space](/documentation/serverless/connect/).

{{< code-snippet path="/documentation/headless/snippets/serverless/create-collection/" >}}

To create a single unnamed vector instead of named ones, pass one vector configuration instead of a dictionary in Python, or use `dense_vector` or `sparse_vector` instead of the `named_` methods in Rust. In Go, Java, and .NET, use an empty string as the vector name. For a single dense vector, you can also use `serverless.NewDenseVectors` in Go, or pass a `DenseVectorConfig` instead of a collection configuration in Java and .NET.

### Load a Sample Dataset

To get started with ready-made data instead of an empty collection, open the space's **Datasets** tab and import one of the [sample datasets](/documentation/datasets/). Each dataset loads into a new collection, with pre-computed vectors and payload indexes.

## Collection Configuration

A collection needs at least one dense or sparse vector. Everything else is optional. For limits on vector size, the number of vectors, and the number of payload indexes, see [Quotas and Limits](/documentation/serverless/quotas-and-limits/).

### Dense Vectors

Each dense vector is named and configured with:

- **Size**, the dimensionality of your embedding, such as 1536
- **Distance**, one of `Cosine`, `Dot`, `Euclid`, or `Manhattan`
- **Multivector**, which stores several sub-vectors per point and compares them with max-sim. Enable it for late-interaction models such as ColBERT and ColPali.
- **Precision tier**, which defaults to `High`

A collection uses either a single unnamed vector or a set of named ones. An unnamed vector uses an empty string as its name.

### Sparse Vectors

Each sparse vector is named and configured with:

- **IDF modifier**, which applies inverse-document-frequency weighting at query time. Enable it for BM25-style models that expect it.
- **Precision tier**, which defaults to `High`

### Payload Indexes

Payload indexes are configured per field. You choose the kind of filtering each field supports:

- **Keyword** for exact matches on strings, with optional prefix matching
- **Integer** for exact matches, range filters, or both. Turning one off makes the index smaller.
- **Float** for range filters on numbers
- **UUID** for exact matches on UUID strings, stored more compactly than keyword
- **Datetime** for range filters on RFC 3339 timestamps
- **Text** for full-text filtering
- **Geo** for radius, bounding box, and polygon filters
- **Bool** for exact matches on booleans

A text index takes further options: the tokenizer (`Prefix`, `Whitespace`, `Word`, or `Multilingual`), lowercasing, phrase matching, minimum and maximum token length, accent folding, stopwords by language or custom list, and Snowball stemming.

## List and Inspect Collections

### In the Console

Open the space and go to the **Collections** tab. The list shows each collection's name and approximate number of points, and you can search it by name. A dash instead of a point count is normal for a new collection; see the note on point counts below.

Select a collection to open it. The collection page has three tabs:

- **Points** lists the points in the collection with their payload and vectors. Use **Filter by** to narrow the list by payload, and **Similar to** or a vector's **Find Similar** button to find points similar to one you choose. You can also copy a point or its payload, edit a payload, or delete a point.
- **Info** shows the collection's configuration as JSON, along with its name and point count. You can copy it or refresh it.
- **Metrics** shows the same metrics as the space's **Metrics** tab, for this collection only: search and write requests, search latency, points, and storage used. See [Monitor a Space](/documentation/serverless/monitoring/).

You can also open a collection's configuration or metrics directly from the list: open the collection's actions menu (**…**) and select **View configuration** or **View metrics**.

### With the API

Listing returns a page of collections with their point counts and sizes. The default page size is 20 and the maximum is 100. Larger accounts page through the results with an opaque token, which you pass back to get the next page.

{{< code-snippet path="/documentation/headless/snippets/serverless/list-collections/" >}}

Fetching a single collection returns the configuration it was created with, along with:

- Its **status**: `green` when all segments are optimized, or `yellow` when optimization is pending or running. The collection stays searchable in both states.
- Its **size**, an estimate that the storage limit per collection is checked against, not the exact number of stored bytes
- Its **point count**
- Its **indexed vector count**, the approximate number of vectors in indexed segments. The rest are searched exhaustively until an optimization indexes them.
- Its **updates status**: `applied` when every acknowledged write is applied and visible to search, or `pending` when some writes are still queued and not yet visible to search

The point count reflects the last applied write, and it's absent on a new collection until the updater has written statistics. A missing or slightly stale count is normal and doesn't mean a write failed.

## Delete a Collection

Deleting a collection removes it and all of its points.

To delete a collection in the console, open the space, go to the **Collections** tab, open the collection's actions menu (**…**), and select **Delete**.

When you delete a collection with the API, the response reports whether the collection existed and was deleted.

{{< code-snippet path="/documentation/headless/snippets/serverless/delete-collection/" >}}

Deletion is permanent. If you might need the data again, take a backup of the collection first. See [Back Up and Restore](/documentation/serverless/backups/).
