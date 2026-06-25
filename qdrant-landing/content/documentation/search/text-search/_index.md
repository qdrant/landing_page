---
title: Text Search
short_description: "Combine semantic vector search with lexical text features in Qdrant, including BM25 and full-text payload filters."
description: "Run text search in Qdrant by mixing semantic vector retrieval with BM25 lexical search and full-text payload filters for robust hybrid search experiences."
weight: 25
aliases:
  - ../text-search
  - /documentation/guides/text-search/
---

# Text Search

Qdrant is a vector search engine, making it a great tool for [semantic search](#semantic-search). However, Qdrant's capabilities go beyond just vector search. It also supports a range of lexical search features, including filtering on text fields and full-text search using popular algorithms like BM25.

## Semantic Search

Semantic search is a search technique that focuses on the meaning of the text rather than just matching on keywords. This is achieved by converting text into [vectors](/documentation/manage-data/vectors/) (embeddings) using machine learning models. These vectors capture the semantic meaning of the text, enabling you to find similar text even if it doesn't share exact keywords.

<aside role="status">
The examples in this guide use <a href="/documentation/inference/">inference</a> to let Qdrant generate the vectors. Inference is only available on <a href="/documentation/inference/cloud-inference/">Qdrant Cloud</a>, with the exception of the BM25 model. If you are not running on Qdrant Cloud, you can use a library like <a href="/documentation/fastembed/">FastEmbed</a> to generate vectors on the client side. When using FastEmbed, refer to the documentation, as its API may differ from that of server-side inference.
</aside>

For example, to search through a collection of books, you could use a model like the `all-MiniLM-L6-v2` sentence transformer model. First, create a collection and configure a dense vector for the book descriptions:

{{< code-snippet path="/documentation/headless/snippets/text-search/create-description-dense-collection/" >}}

Next, you can ingest data:

{{< code-snippet path="/documentation/headless/snippets/text-search/ingest-description-dense-point/" >}}

To find books related to "time travel", use the following query:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-description-dense/" >}}

In these examples, Qdrant uses [inference](/documentation/inference/) to generate vectors from the `text` provided in the request using the specified `model`. Alternatively, you can generate explicit vectors on the client side with a library like [FastEmbed](/documentation/fastembed/).

## Lexical Search

Lexical search, also known as keyword-based search, is a traditional search technique that relies on matching words or phrases in the text. Many applications require a combination of semantic and traditional lexical search. A good example is in e-commerce, where users may want to search for products using a product ID. ID values don't lend themselves well to vectorization, but being able to search for them is essential for a good search experience. To facilitate these use cases, Qdrant supports [text filtering](/documentation/search/text-search/text-filtering/) and [full-text search](/documentation/search/text-search/full-text-search/).

## Filtering Versus Querying

When it comes to lexical search in Qdrant, it's important to distinguish between filtering and querying. Filtering is used to narrow down results based on exact matches or specific criteria, while querying involves finding relevant documents based on the content of the text. In other words, filtering is about precision, while querying is about recall. A filter does not contribute to the ranking of search results, as no score is calculated for filters. A query calculates a relevance score for each matching document and that score is used to rank search results.

| Filter | Query |
|---|---|
| Does not contribute to ranking | Contributes to ranking |
| Improves precision by narrowing down results | Improves recall by finding relevant data |

## Combining Semantic and Lexical Search

Semantic and lexical search are complementary techniques. When you don't know in advance whether a user is looking for a concept or an exact keyword, you can run both in a single query and merge the results. Qdrant supports this through [hybrid search](/documentation/search/text-search/hybrid-search/).

