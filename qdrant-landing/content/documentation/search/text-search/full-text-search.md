---
title: Full-Text Search
short_description: "Rank points in Qdrant by BM25 relevance to a text query, using a full-text index on a payload field."
description: "Run BM25 full-text search in Qdrant on a full-text payload index: enable scoring, query text fields, tune k and b, and configure language-specific text processing."
weight: 2
---

# Full-Text Search

Full-text search is similar to full-text filtering, with the key difference being that full-text queries are used for ranking. For each document that matches the search terms, Qdrant calculates a relevance score based on how well the document matches the search terms. That score is used to rank the results. To rank text with learned sparse models like SPLADE++ and miniCOIL instead, see [Sparse Vector Search](/documentation/search/text-search/sparse-vector-search/).

## BM25

[BM25](https://en.wikipedia.org/wiki/Okapi_BM25) (Best Matching 25) is a popular ranking algorithm that takes a probabilistic approach to score calculation. For each search term, BM25 considers several statistics about the term and the document to calculate a relevance score:
- Term frequency (TF): the more often a term appears in a document, the more relevant that document is likely to be.
- Inverse document frequency (IDF): the rarer a term is across all documents, the higher the weight of that term.
- Document length: a term appearing in a shorter document is more relevant than the same term appearing in a longer document.

Qdrant computes BM25 scores from a [full-text index](/documentation/manage-data/indexing/#full-text-index) on a payload field. The index holds everything BM25 needs, including the length of each document, so Qdrant derives all statistics from your data.

### Create a Full-Text Index with Scoring

To rank points with BM25, create a full-text index on the field you want to search and set [`scoring`](/documentation/manage-data/indexing/#bm25-scoring) to `true`. For example, to search the titles of books:

{{< code-snippet path="/documentation/headless/snippets/text-search/create-title-bm25-index/" >}}

If the collection already contains data, Qdrant builds the index from the text stored in the payload, so you don't need to upload your data again.

### Query a Text Field

To run a BM25 query, use a `text` query and set `using` to the name of the indexed payload field. The following example searches for books with "time travel" in the title:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-title-bm25/" >}}

A point matches the query if its text contains at least one of the query terms. Points that contain none of the terms are not returned. To require or exclude specific terms, add a [full-text filter](/documentation/search/filtering/#full-text-match) to the query. Query terms that appear more than once count only once.

A `text` query can also be used as a [prefetch](/documentation/search/hybrid-queries/), for example, to combine BM25 with dense vector search in [hybrid search](/documentation/search/text-search/hybrid-search/).

### Configuring BM25 Parameters

The BM25 [ranking function](https://en.wikipedia.org/wiki/Okapi_BM25#The_ranking_function) has two parameters that you can set per query:

- `k`. Controls term frequency saturation. Higher values increase the influence of term frequency. Must be 0 or greater. Defaults to 1.2.
- `b`. Controls document length normalization. Ranges from 0 (no normalization) to 1 (full normalization). A higher value means longer documents have less impact. Defaults to 0.75.

Because these parameters are set per query, you can change them without rebuilding the index:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-title-bm25-params/" >}}

<aside role="status">
The term frequency parameter is named <code>k</code>, not <code>k1</code>.
</aside>

### Text Processing

Before scoring, Qdrant processes both the indexed text and the query text with the [text processing](/documentation/search/text-search/text-filtering/#text-processing) settings of the full-text index, such as the [tokenizer](/documentation/manage-data/indexing/#tokenizers), [lowercasing](/documentation/manage-data/indexing/#lowercasing), [ASCII folding](/documentation/manage-data/indexing/#ascii-folding), [stemming](/documentation/manage-data/indexing/#stemmer), and [stopword removal](/documentation/manage-data/indexing/#stopwords). This ensures that query terms match the indexed terms.

{{< island
    path="content/documentation/headless/text-filtering/text-processing"
    width="90%" ratio="12 / 5"
    title="Text processing turns a sentence into tokens. Toggle the steps to see how each one changes the tokens."
>}}
![Text processing can break down a sentence like "The quick brown fox" into the tokens "quick", "brown", and "fox".](/docs/text-processing.png)
{{< /island >}}

By default, a full-text index uses the `word` tokenizer and lowercasing, without stemming or stopword removal. For better BM25 results, configure stemming and stopwords for the language of your data. For example, to index Spanish book titles:

{{< code-snippet path="/documentation/headless/snippets/text-search/create-title-bm25-index-spanish/" >}}

### Corpus Statistics

Qdrant computes the BM25 statistics, such as the number of documents, the number of documents containing each term, and the average document length, over all points in the shard being queried. In a collection with multiple shards, each shard uses its own statistics, so the same document can score slightly differently depending on the shard it's stored in. To compute statistics over a subset of the data, such as a single tenant, see [Per-Tenant Scoring Statistics](/documentation/manage-data/multitenancy/#per-tenant-scoring-statistics).

After points are deleted or updated, the statistics can include outdated data until the optimizer rebuilds the affected segments. As a result, scores can shift slightly until optimization. Deleted points never appear in the results.

### Migrate from Sparse Vector BM25

If you use the sparse vector [BM25 model](/documentation/search/text-search/sparse-vector-search/#bm25), you can switch to BM25 on a full-text index without uploading your data again, as long as the text is stored in the payload:

1. Create a full-text index with scoring enabled on the payload field that holds the text.
2. Configure the same text processing as the sparse vector BM25 model. The model uses English stemming and stopword removal by default, while a full-text index doesn't. If you use the default BM25 sparse vector model settings, set the `english` Snowball stemmer and `english` stopwords on the index. If you don't use the default settings, make sure the index uses the same tokenizer, stemmer, stopwords, and ASCII folding settings as your sparse vector BM25 model.
3. Replace queries on the sparse vector with [`text` queries](#query-a-text-field), setting `using` to the payload field instead of the sparse vector name.

The full-text index computes the average document length from your data, so you no longer need to set `avg_len`. Scores can differ from the sparse vector BM25 model, especially if `avg_len` didn't match your data.
