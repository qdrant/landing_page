---
title: Text Search
weight: 180
aliases:
  - ../text-search
---

## Text Search

Qdrant is a vector search engine, making it a great tool for [semantic search](#semantic-search). However, Qdrant's capabilities go beyond just vector search. It also supports a range of lexical search features, including filtering on text fields and full-text search using popular algorithms like BM25.

### Semantic Search

Semantic search is a search technique that focuses on the meaning of the text rather than just matching on keywords. This is achieved by converting text into [vectors](/documentation/concepts/vectors/) (embeddings) using machine learning models. These vectors capture the semantic meaning of the text, enabling you to find similar text even if it doesn't share exact keywords.

For example, to search through a collection of books, you could use a model like the `all-MiniLM-L6-v2` sentence transformer model. First, create a collection and configure a dense vector for the book descriptions:

```json
PUT /collections/books
{
  "vectors": {
    "description-dense": {
      "size": 384,
      "distance": "Cosine"
    }
  }
}
```

Next, you can ingest data:

```json
PUT /collections/books/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "description-dense": {
          "text": "A Victorian scientist builds a device to travel far into the future and observes the dim trajectories of humanity. He discovers evolutionary divergence and the consequences of class division. Wells's novella established time travel as a vehicle for social commentary.",
          "model": "sentence-transformers/all-minilm-l6-v2"
        }
      },
      "payload": {
        "title": "The Time Machine",
        "author": "H.G. Wells",
        "isbn": "9780553213515"
      }
    }
  ]
}
```

To find books related to "time travel", use the following query:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "time travel",
    "model": "sentence-transformers/all-minilm-l6-v2"
  },
  "using": "description-dense",
  "with_payload": true
}
```

Note that these examples do not provide explicit vectors. Instead, the requests use [inference](/documentation/concepts/inference) to let Qdrant generate vectors from the `text` provided in the request using the specified `model`. Alternatively, you can generate explicit vectors on the client side using a library like [FastEmbed](/documentation/fastembed/).

### Lexical Search

Lexical search, also known as keyword-based search, is a traditional search technique that relies on matching words or phrases in the text. Many applications require a combination of semantic and traditional lexical search. A good example is in e-commerce, where users may want to search for products using a product ID. ID values don't lend themselves well to vectorization, but being able to search for them is essential for a good search experience. To facilitate these use cases, Qdrant enables you to use lexical search alongside semantic search.

### Filtering Versus Querying

When it comes to lexical search in Qdrant, it's important to distinguish between filtering and querying. Filtering is used to narrow down results based on exact matches or specific criteria, while querying involves finding relevant documents based on the content of the text. In other words, filtering is about precision, while querying is about recall. A filter does not contribute to the ranking of search results, as no score is calculated for filters. A query calculates a relevance score for each matching document and that score is used to rank search results.

| Filter | Query |
|---|---|
| Does not contribute to ranking | Contributes to ranking |
| Improves precision by narrowing down results | Improves recall by finding relevant data |

## Filtering

Qdrant supports [filtering](/documentation/concepts/filtering) on a wide range of datatypes: numbers, dates, booleans, geolocations, and strings. In Qdrant, a filter is typically combined with a vector query. The vector query is used to score and rank the results, while the filter is used to narrow down the results based on specific criteria.

### Text and Keyword Strings

When it comes to filtering on strings, it is important to understand the difference between the two types of strings in Qdrant: text and keyword. These two string types are designed for different use cases: filtering on exact string values or filtering on individual search terms. To filter on exact string values, Qdrant uses **keyword** strings. Keyword strings are ideal for filtering on strings like IDs, categories, or tags. To filter on individual terms or phrases within a larger body of text, Qdrant uses **text** strings.

For example, take a string like "United States". If you want to filter on all points with this exact string in the payload, use a keyword filter. On the other hand, if you want to filter on all points that contain the word "united" (matching "United States" as well as "United Kingdom"), use a text filter.

| Keyword | Text |
|---|---|
| Used for exact string matches | Used for filtering on individual terms |
| Ideal for IDs, categories, tags | Ideal for larger text fields |
| Not tokenized | [Tokenized](/documentation/concepts/text-search/#tokenization) into individual terms |
| Case-sensitive | Case-insensitive by default |

### Filtering on an Exact String

To filter on exact strings, first create a [payload index](/documentation/concepts/indexing/#payload-index) of type `keyword`for the field you want to filter on. A payload index makes filtering faster and reduces the load on the system.

<aside role="status">
Filtering on a field without an index is not possible on collections that run in <a href="/documentation/guides/administration/#strict-mode">strict mode</a>. Strict mode is enabled by default on Qdrant Cloud.
</aside>

For example, to filter books by author name, create a keyword index on the "author" field:

```json
PUT /collections/books/index?wait=true
{
    "field_name": "author",
    "field_schema": "keyword"
}
```

Next, when querying the data, you also add a filter clause to the request. The following example searches for books related to "time travel" but only returns books written by H.G. Wells:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "time travel",
    "model": "sentence-transformers/all-minilm-l6-v2"
  },
  "using": "description-dense",
  "with_payload": true,
  "filter": {
    "must": [
      {
        "key": "author",
        "match": {
          "value": "H.G. Wells"
        }
      }
    ]
  }
}
```

The ranking of the results of this request is based on the vector similarity of the query. The filter only narrows down the results to those points where the `author` field exactly matches `H.G. Wells`. Furthermore, the filter is case-sensitive. Filtering for the lowercase value `h.g. wells` would not return any results.

The previous example only returns points that match the filter value. If you want the opposite: exclude points with a specific value, use a `must_not` clause instead of `must`. The following example only returns books *not* written by H.G. Wells:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "time travel",
    "model": "sentence-transformers/all-minilm-l6-v2"
  },
  "using": "description-dense",
  "with_payload": true,
  "filter": {
    "must_not": [
      {
        "key": "author",
        "match": {
          "value": "H.G. Wells"
        }
      }
    ]
  }
}
```

### Filtering on Multiple Exact Strings

You can provide multiple filter clauses. For example, to find all books co-authored by Larry Niven and Jerry Pournelle, use the following filter:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "space opera",
    "model": "sentence-transformers/all-minilm-l6-v2"
  },
  "using": "description-dense",
  "with_payload": true,
  "filter": {
    "must": [
      {
        "key": "author",
        "match": {
          "value": "Larry Niven"
        }
      },
      {
        "key": "author",
        "match": {
          "value": "Jerry Pournelle"
        }
      }
    ]
  }
}
```

Note that both filter clauses must be true for a point to be included in the results, because a `must` clause operates like a logical `AND`. If you want to find books written by either author (as well as both), use a `should` clause, which operates like a logical `OR`:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "space opera",
    "model": "sentence-transformers/all-minilm-l6-v2"
  },
  "using": "description-dense",
  "with_payload": true,
  "filter": {
    "should": [
      {
        "key": "author",
        "match": {
          "value": "Larry Niven"
        }
      },
      {
        "key": "author",
        "match": {
          "value": "Jerry Pournelle"
        }
      }
    ]
  }
}
```

Alternatively, when you want to filter on one or more values of a single key, you can use the `any` condition:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "space opera",
    "model": "sentence-transformers/all-minilm-l6-v2"
  },
  "using": "description-dense",
  "with_payload": true,
  "filter": {
    "must": [
      {
        "key": "author",
        "match": {
          "any": ["Larry Niven", "Jerry Pournelle"]
        }
      }
    ]
  }
}
```

### Full-Text Filtering

In contrast to keyword filtering, filtering on text strings enables you to filter on individual words within a larger text field in a case-insensitive manner. To understand how this works, it's important to understand how text strings are processed at index time and query time.

#### Text Processing

To enable efficient full-text filtering, Qdrant processes text strings by breaking them down into individual tokens (words) and applying several normalization steps. This process ensures that searches are more flexible and can match variations of words. At query time, Qdrant applies the same processing steps to the filter string, ensuring that the filter matches the indexed tokens correctly.

![Text processing can break down a sentence like"The quick brown fox" into the tokens "quick", "brown", and "fox".](/docs/text-processing.png)

The following text processing steps are applied to text strings:

- The string is broken down into individual tokens (words) using a process called [tokenization](/documentation/concepts/indexing/#tokenizers). By default, Qdrant uses the `word` tokenizer, which splits the string using word boundaries, discarding spaces, punctuation marks, and special characters.
- By default, each word is then [converted to lowercase](/documentation/concepts/indexing/#lowercasing). Lowercasing the tokens allows Qdrant to ignore capitalization, making full-text filters case-insensitive.
- Optionally, Qdrant can remove diacritics (accents) from characters using a process called [ASCII folding](/documentation/concepts/indexing/#ascii-folding). This ensures that diacritics are ignored. As a result, filtering for the word "cafe" matches "café".
- Optionally, tokens can be reduced to their root form using a [stemmer](/documentation/concepts/indexing/#stemmer). This ensures that filtering for "running" also matches "run" and "ran". Because stemming is language-specific, if enabled, it must be configured for a specific language.
- Certain words like "the", "is", and "and" are very common in text and do not contribute much to the meaning of text. These words are called [stopwords](/documentation/concepts/indexing/#stopwords) and can optionally be removed during indexing.
- Optionally, you can enable [phrase matching](/documentation/concepts/indexing/#phrase-search) to allow filtering for multiple words in the exact same order as they appear in the original text.

These text processing steps can be configured when creating a [full-text index](documentation/concepts/indexing/#full-text-index). For example, to create a text index on the `title` field with ASCII folding enabled:

```json
PUT /collections/books/index?wait=true
{
  "field_name": "title",
  "field_schema": {
    "type": "text",
    "ascii_folding": true
  }
}
```

### Filter on Text Strings

To filter on text values in a payload field, first create a [full-text index](/documentation/concepts/indexing/#full-text-index) for that field. Next, you can use a `text` condition to query the collection with a filter for titles that contain the word "space":

```json
POST /collections/books/points/query
{
  "query": {
    "text": "space opera",
    "model": "sentence-transformers/all-minilm-l6-v2"
  },
  "using": "description-dense",
  "with_payload": true,
  "filter": {
    "must": [
      {
        "key": "title",
        "match": {
          "text": "space"
        }
      }
    ]
  }
}
```

When filtering on more than one term, a `text` filter only matches fields that contain *all* the specified terms (logical `AND`). To match fields that contain *any* of the specified terms (logical `OR`), use the `text_any` condition:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "space opera",
    "model": "sentence-transformers/all-minilm-l6-v2"
  },
  "using": "description-dense",
  "with_payload": true,
  "filter": {
    "must": [
      {
        "key": "title",
        "match": {
          "text_any": "space war"
        }
      }
    ]
  }
}
```

To filter on phrases, use a `phrase` condition. This requires enabling [phrase searching](/documentation/concepts/indexing/#phrase-search) when creating the full-text index.

### Progressive Filtering with the Batch Search API

Even though filters are not used to rank results, you can use the [batch search API](/documentation/concepts/search/#batch-search-api) to progressively relax filters. This is useful when you have strict filtering criteria that may not return results. Batching multiple search requests with progressively relaxed filters enables you to get results even when the strictest filter returns no results.

For example, the following batch search request first tries to find books that match all search terms in the title. The second search request relaxes the filter to match any of the search terms. The third search request removes the filter altogether:

```json
POST /collections/books/points/query/batch
{
  "searches": [
    {
      "query": {
        "text": "time travel",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "using": "description-dense",
      "with_payload": true,
      "filter": {
        "must": [
          {
            "key": "title",
            "match": {
              "text": "time travel"
            }
          }
        ]
      }
    },
    {
      "query": {
        "text": "time travel",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "using": "description-dense",
      "with_payload": true,
      "filter": {
        "must": [
          {
            "key": "title",
            "match": {
              "text_any": "time travel"
            }
          }
        ]
      }
    },
    {
      "query": {
        "text": "time travel",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "using": "description-dense",
      "with_payload": true
    }
  ]
}
```

The response contains three separate result sets. You can return the first non-empty result set to the user, or you can use the three sets to assemble a single ranked list.

## Full-Text Search

Full-text search is similar to full-text filtering, with the key difference being that full-text queries are used for ranking. For each document that matches the search terms, Qdrant calculates a relevance score based on how well the document matches the search terms. That score is used to rank the results. Qdrant supports several full-text search scoring algorithms.

Full-text search in Qdrant is powered by [sparse vectors](/articles/sparse-vectors/). Why sparse vectors? Because they are a flexible way to represent data for search purposes, from classic BM25-based search, to semantic search, and [collaborative filtering](/documentation/advanced-tutorials/collaborative-filtering/). Each term in the vocabulary corresponds to one or more dimension of the sparse vector, and the values in those dimensions represent the weight of that term in the document. Weights can be calculated using document statistics for use with the [BM25](#bm25) ranking algorithm, or you can use transformer-based models that can capture semantic meaning, like [SPLADE++](#splade), and [miniCOIL](#minicoil).

### BM25

BM25 (Best Matching 25) is a popular ranking algorithm that takes a probabilistic approach to score calculation. For each search term, BM25 considers several statistics about the term and the document to calculate a relevance score:
- Term frequency (TF): the more often a term appears in a document, the more relevant that document is likely to be.
- Inverse document frequency (IDF): the rarer a term is across all documents, the higher the weight of that term.
- Document length: a term appearing in a shorter document is more relevant than the same term appearing in a longer document.

Qdrant provides native support for BM25 through an [inference model](/documentation/concepts/inference/#server-side-inference-bm25) that generates sparse vectors, or you can generate vectors on the client side using the [FastEmbed](/documentation/fastembed/) library.

The BM25 model supports the same [text processing](#text-processing) options as text indices, including tokenization, lowercasing, ASCII folding, stemming, and stopword removal. A notable difference with text indices is that BM25 defaults to English stemming and stopword removal. If you are using a language other than English, ensure that you [configure](#language-specific-settings) the model accordingly.

To use BM25, configure a sparse vector when creating a collection:

```json
PUT /collections/books?wait=true
{
  "sparse_vectors": {
    "title-bm25": {
      "modifier": "idf"
    }
  }
}
```

Note the [IDF modifier](/documentation/concepts/indexing/#idf-modifier), which configures the sparse vector for queries that use the inverse document frequency (IDF).

Now you can ingest data. The following example ingests a book with its title represented as a sparse vector generated by the BM25 model:

```json
PUT /collections/books/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "title-bm25": {
          "text": "The Time Machine",
          "model": "qdrant/bm25"
        }
      },
      "payload": {
        "title": "The Time Machine",
        "author": "H.G. Wells",
        "isbn": "9780553213515"
      }
    }
  ]
}
```

After ingesting data, you can query the sparse vector. The following example searches for books with "time travel" in the title using the BM25 model:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "time travel",
    "model": "qdrant/bm25"
  },
  "using": "title-bm25",
  "limit": 10,
  "with_payload": true
}
```

#### Language-specific Settings

By default, BM25 uses English-specific settings for tokenization, stemming, and stopword removal. Words are reduced to their English root form, and common English stopwords are removed. If your data is not in English, this leads to suboptimal search results. To achieve optimal results for other languages, configure language-specific BM25 settings.

<aside role="status">
If you set any of the options discussed in this section, ensure that you apply the same settings at ingest and query time. 
</aside>

**Stemming and Stopwords**

To configure stemming and stopword removal, use the following options:

- `language`: sets the language for stemming and stopword removal. Defaults to `english`. To disable stemming and stopword removal, set `language` to `none`.
- `stemmer`: defaults to the [Snowball stemmer](https://github.com/qdrant/rust-stemmers) for `language` (if set), but can be configured independently.
- `stopwords`: defaults to a set of stopwords for `language` (if set) but can be configured independently. You can configure a specific `language` and/or configure an explicit set of stopwords that will be merged with the stopword set of the configured language.

For example, to use Spanish stemming and stopwords during data ingestion, use:

```json
PUT /collections/books/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "title-bm25": {
          "text": "La Máquina del Tiempo",
          "model": "qdrant/bm25",
          "options": {
            "language": "spanish"
          }
        }
      },
      "payload": {
        "title": "La Máquina del Tiempo",
        "author": "H.G. Wells",
        "isbn": "9788411486880"
      }
    }
  ]
}
```

At query time, use the exact same parameters to ensure consistent text processing:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "tiempo",
    "model": "qdrant/bm25",
    "options": {
      "language": "spanish"
    }
  },
  "using": "title-bm25",
  "limit": 10,
  "with_payload": true
}
```

To configure only a stemmer or a stopword set, rather than both, set `language` to `none` and specify the configuration for the desired stemmer or stopwords.

**ASCII Folding**

ASCII folding is the process of removing diacritics (accents) from characters. By removing diacritics, ASCII folding enables you to ignore accents when searching. For instance, with ASCII folding enabled, searching for "cafe" matches both "cafe" and "café".

To enable ASCII folding, set the `ascii_folding` option to `true` at both ingest and query time:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "Mieville",
    "model": "qdrant/bm25",
    "options": {
      "ascii_folding": true
    }
  },
  "using": "author-bm25",
  "limit": 10,
  "with_payload": true
}
```

**Tokenizer**

The tokenizer breaks down text into individual tokens (words). By default, the BM25 model uses the `word` tokenizer, which splits text based on word boundaries like whitespace and punctuation. This method is effective for Latin-based languages but may not work well for languages with non-Latin alphabets or languages that do not use spaces to separate words. For those languages, use the `multilingual` tokenizer. This tokenizer supports multiple languages, including those with non-Latin alphabets and non-space delimiters.

```json
POST /collections/books/points/query
{
  "query": {
    "text": "村上春樹",
    "model": "qdrant/bm25",
    "options": {
      "tokenizer": "multilingual"
    }
  },
  "using": "author-bm25",
  "limit": 10,
  "with_payload": true
}
```

**Language-neutral Text Processing**

In some situations, you may want to disable language-specific processing altogether. For example, when searching for author names, that don't necessarily conform to the rules of a specific language.

To disable language-specific processing, set the following options:
- `language`: set to `none` to disable language-specific stemming and stopword removal.
- `tokenizer`: set to `multilingual` for multilingual tokenization and lemmatization.
- Optionally, set `ascii_folding` to `true` to enable ASCII folding and ignore diacritics.

```json
POST /collections/books/points/query
{
  "query": {
    "text": "Mieville",
    "model": "qdrant/bm25",
    "options": {
      "language": "none",
      "tokenizer": "multilingual",
      "ascii_folding": true
    }
  },
  "using": "author-bm25",
  "limit": 10,
  "with_payload": true
}
```

#### Configuring BM25 Parameters

The BM25 [ranking function](https://en.wikipedia.org/wiki/Okapi_BM25#The_ranking_function) includes three adjustable parameters that you can set to optimize search results for your specific use case:

- `k`. Controls term frequency saturation. Higher values increase the influence of term frequency. Defaults to 1.2.
- `b`. Controls document length normalization. Ranges from 0 (no normalization) to 1 (full normalization). A higher value means longer documents have less impact. Defaults to 0.75.
- `avg_len`. Average number of words in the field being queried. Defaults to 256.

For instance, book titles are generally shorter than 256 words. To achieve more accurate scoring when searching for book titles, you could calculate or estimate the average title length and set the `avg_len` parameter accordingly:

```json
POST /collections/books/points/query
{
  "query": {
    "text": "time travel",
    "model": "qdrant/bm25",
    "options": {
      "avg_len": 5.0
    }
  },
  "using": "title-bm25",
  "limit": 10,
  "with_payload": true
}
```

### SPLADE++

The SPLADE (Sparse Lexical and Dense) family of models are transformer-based models that generate sparse vectors out of text. These models combine the benefits of traditional lexical search with the power of transformer-based models by generating homonyms and synonyms.

The advantage of using SPLADE models is that they [perform better](/articles/sparse-vectors/#splade) than traditional BM25. They also have several downsides though. First, because they use a fixed vocabulary, you can't use SPLADE models to find terms that are not in the vocabulary, such as product IDs and out-of-domain language (words not seen in training). Secondly, because they are transformer-based models, SPLADE models are slower and require more computational resources than the traditional BM25 model.

On [Qdrant Cloud](/documentation/concepts/inference/#qdrant-cloud-inference), you can use the SPLADE++ model with inference. Alternatively, you can generate vectors on the client side using the [FastEmbed](/documentation/fastembed/) library.

```json
POST /collections/books/points/query
{
  "query": {
    "text": "time travel",
    "model": "prithivida/splade_pp_en_v1"
  },
  "using": "title-splade",
  "limit": 10,
  "with_payload": true
}
```

For a tutorial on using SPLADE++ with FastEmbed, refer to [How to Generate Sparse Vectors with SPLADE](/documentation/fastembed/fastembed-splade/).

### miniCOIL

[miniCOIL](/articles/minicoil/) strikes a balance between the flexibility of BM25 and the performance of SPLADE++. Like SPLADE++, miniCOIL is a transformer-based model that generates sparse vectors for text. However, unlike SPLADE++, miniCOIL does not use a fixed vocabulary, making it an effective model for lexical search that ranks results based on the contextual meaning of keywords.

miniCOIL can be [used with the FastEmbed library](/documentation/fastembed/fastembed-minicoil/).

## Combining Semantic and Lexical Search with Hybrid Search

[Hybrid search](/documentation/concepts/hybrid-queries/#hybrid-search) enables you to combine semantic and lexical search in a single query, returning results that match the semantic meaning, the exact keywords, or both. This is useful when you don't know whether the user is looking for a specific keyword or a semantically similar document. For example, when searching for books, a user may enter "time travel" to find books related to the concept of time travel, but they may also enter a book's ISBN to find a specific book. Hybrid queries enable you to return results for both cases in a single query.

Hybrid queries make use of Qdrant's ability to store [multiple named vectors](/documentation/concepts/vectors/#named-vectors) in a single point. For example, you can store a dense vector for semantic search and a sparse vector for lexical search in the same point. To do so, first create a collection with both a dense vector and a sparse vector:

```json
PUT /collections/books?wait=true
{
  "vectors": {
    "description-dense": {
      "size": 384,
      "distance": "Cosine"
    }
  },
  "sparse_vectors": {
    "isbn-bm25": {
      "modifier": "idf"
    }
  }
}
```

After ingesting data with both vectors, you can use the prefetch feature to run both semantic and lexical queries in a single request. The results of both queries are then combined using a fusion method like Reciprocal Rank Fusion (RRF).

```json
POST /collections/books/points/query
{
  "prefetch": [
    {
      "query": {
        "text": "9780553213515",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "using": "description-dense",
      "score_threshold": 0.5
    },
    {
      "query": {
        "text": "9780553213515",
        "model": "Qdrant/bm25"
      },
      "using": "isbn-bm25",
      "with_payload": true
    }
  ],
  "query": {
    "fusion": "rrf"
  },
  "limit": 10,
  "with_payload": true
}
```

This specific query searches for an ISBN, for which only the lexical search returns a result, which is then returned to the user. If a user had searched for "time travel", only the semantic search would return results, and those would be returned to the user. If a user would search for a term that matched both the semantic and lexical vectors, the results from both searches would be combined to provide a more comprehensive set of results. 

You're not limited to prefetching two queries. For example, you could run multiple lexical queries across the `title`, `author`, and `isbn` fields alongside a semantic query to achieve a comprehensive search across all data.

## Conclusion

Qdrant's text search capabilities enable you to build powerful search applications that combine the best of semantic and lexical search. By leveraging dense and sparse vectors, along with Qdrant's flexible querying capabilities, you can create search experiences that meet a wide range of user needs.