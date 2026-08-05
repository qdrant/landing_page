---
title: Text Filtering
short_description: "Filter Qdrant search results on keyword and text strings, including exact string, multi-value, full-text, and phrase filters."
description: "Apply keyword and text filters in Qdrant to narrow down search results by exact string values, multiple authors, or full-text terms — including progressive filtering via the batch search API."
weight: 1
---

# Text Filtering

Qdrant supports [filtering](/documentation/search/filtering/) on a wide range of datatypes: numbers, dates, booleans, geolocations, and strings. In Qdrant, a filter is typically combined with a vector query. The vector query is used to score and rank the results, while the filter is used to narrow down the results based on specific criteria.

## Text and Keyword Strings

When it comes to filtering on strings, it is important to understand the difference between the two types of strings in Qdrant: text and keyword. These two string types are designed for different use cases: filtering on exact string values or filtering on individual search terms. To filter on exact string values, Qdrant uses **keyword** strings. Keyword strings are ideal for filtering on strings like IDs, categories, or tags. To filter on individual terms or phrases within a larger body of text, Qdrant uses **text** strings.

For example, take a string like "United States". If you want to filter on all points with this exact string in the payload, use a keyword filter. On the other hand, if you want to filter on all points that contain the word "united" (matching "United States" as well as "United Kingdom"), use a text filter.

| Keyword | Text |
|---|---|
| Used for exact string matches | Used for filtering on individual terms |
| Ideal for IDs, categories, tags | Ideal for larger text fields |
| Not tokenized | [Tokenized](/documentation/manage-data/indexing/#tokenizers) into individual terms |
| Case-sensitive | Case-insensitive by default |

## Filtering on an Exact String

To filter on exact strings, first create a [payload index](/documentation/manage-data/indexing/#payload-index) of type `keyword`for the field you want to filter on. A payload index makes filtering faster and reduces the load on the system.

<aside role="status">
Filtering on a field without an index is not possible on collections that run in <a href="/documentation/ops-configuration/administration/#strict-mode">strict mode</a>. Strict mode is enabled by default on Qdrant Cloud.
</aside>

For example, to filter books by author name, create a keyword index on the "author" field:

{{< code-snippet path="/documentation/headless/snippets/text-search/create-author-keyword-index/" >}}

Next, when querying the data, you also add a filter clause to the request. The following example searches for books related to "time travel" but only returns books written by H.G. Wells:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-filter-author/" >}}

The ranking of the results of this request is based on the vector similarity of the query. The filter only narrows down the results to those points where the `author` field exactly matches `H.G. Wells`. Furthermore, the filter is case-sensitive. Filtering for the lowercase value `h.g. wells` would not return any results.

The previous example only returns points that match the filter value. If you want the opposite: exclude points with a specific value, use a `must_not` clause instead of `must`. The following example only returns books *not* written by H.G. Wells:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-filter-author-exclude/" >}}

## Filtering on Multiple Exact Strings

You can provide multiple filter clauses. For example, to find all books co-authored by Larry Niven and Jerry Pournelle, use the following filter:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-filter-authors-and/" >}}

Note that both filter clauses must be true for a point to be included in the results, because a `must` clause operates like a logical `AND`. If you want to find books written by either author (as well as both), use a `should` clause, which operates like a logical `OR`:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-filter-authors-or/" >}}

Alternatively, when you want to filter on one or more values of a single key, you can use the `any` condition:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-filter-author-any/" >}}

## Full-Text Filtering

In contrast to keyword filtering, filtering on text strings enables you to filter on individual words within a larger text field in a case-insensitive manner. To understand how this works, it's important to understand how text strings are processed at index time and query time.

### Text Processing

To enable efficient full-text filtering, Qdrant processes text strings by breaking them down into individual tokens (words) and applying several normalization steps. This process ensures that searches are more flexible and can match variations of words. At query time, Qdrant applies the same processing steps to the filter string, ensuring that the filter matches the indexed tokens correctly.

![Text processing can break down a sentence like"The quick brown fox" into the tokens "quick", "brown", and "fox".](/docs/text-processing.png)

The following text processing steps are applied to text strings:

- The string is broken down into individual tokens (words) using a process called [tokenization](/documentation/manage-data/indexing/#tokenizers). By default, Qdrant uses the `word` tokenizer, which splits the string using word boundaries, discarding spaces, punctuation marks, and special characters.
- By default, each word is then [converted to lowercase](/documentation/manage-data/indexing/#lowercasing). Lowercasing the tokens allows Qdrant to ignore capitalization, making full-text filters case-insensitive.
- Optionally, Qdrant can remove diacritics (accents) from characters using a process called [ASCII folding](/documentation/manage-data/indexing/#ascii-folding). This ensures that diacritics are ignored. As a result, filtering for the word "cafe" matches "café".
- Optionally, tokens can be reduced to their root form using a [stemmer](/documentation/manage-data/indexing/#stemmer). This ensures that filtering for "running" also matches "run" and "ran". Stemming is disabled by default. Because it's language-specific, it must be configured for a specific language when enabled.
- Certain words like "the", "is", and "and" are very common in text and don't contribute much to the meaning of text. These words are called [stopwords](/documentation/manage-data/indexing/#stopwords) and can optionally be removed during indexing. Stopword removal is disabled by default. Like stemming, it's language-specific: you can configure specific languages for stopword removal and/or provide a custom list of stopwords to remove.
- Optionally, you can enable [phrase matching](/documentation/manage-data/indexing/#phrase-search) to allow filtering for multiple words in the exact same order as they appear in the original text.

These text processing steps can be configured when creating a [full-text index](/documentation/manage-data/indexing/#full-text-index). For example, to create a text index on the `title` field with ASCII folding enabled:

{{< code-snippet path="/documentation/headless/snippets/text-search/create-title-text-index/" >}}

When filtering using this index, Qdrant automatically applies the same text processing steps to the filter string before matching it against the indexed tokens.

<aside role="status">
A full-text index does not affect BM25 queries. To configure text processing for BM25, see <a href="/documentation/search/text-search/full-text-search/#bm25-text-processing">BM25 Text Processing</a>.
</aside>

## Filter on Text Strings

To filter on text values in a payload field, first create a [full-text index](/documentation/manage-data/indexing/#full-text-index) for that field. Next, you can use a `text` condition to query the collection with a filter for titles that contain the word "space":

{{< code-snippet path="/documentation/headless/snippets/text-search/filter-title-text/" >}}

When filtering on more than one term, a `text` filter only matches fields that contain *all* the specified terms (logical `AND`). To match fields that contain *any* of the specified terms (logical `OR`), use the `text_any` condition:

{{< code-snippet path="/documentation/headless/snippets/text-search/filter-title-text-any/" >}}

Qdrant also supports phrase filtering, enabling you to search for multiple words in the exact order they appear in the original text, with no other words in between. For example, a phrase filter for "time machine" matches against the title "The Time Machine" but would not match "The Time Travel Machine" (there's a word between "time" and "machine") nor "Machine Time" (the word order is incorrect).

The difference between phrase filtering and keyword filtering is that phrase filtering applies text processing and, as a result, is case-insensitive, while keyword filtering is case-sensitive and only matches the exact string. Additionally, keyword filtering has to match the entire string, whereas phrase filtering can match part of a larger string. So a keyword filter for "Space War" would not match "The Space War" because it doesn't match "The," but a phrase filter for "Space War" would.

Summarizing the differences between the four filtering methods for a multi-term filter on "Space War":

| Method | Actual⠀query⠀⠀⠀ | Matches `Space War`? | Matches `The Space War`? | Matches `War in Space`? | Matches `War of the Worlds`? |
|---|---|---|---|---|---|
| text_any | `space` OR `war`  | Yes               | Yes                     | Yes                   | Yes                          |
| text     | `space` AND `war` | Yes               | Yes                     | Yes                   | No                          |
| phrase   | `"space war"`     | Yes               | Yes                      | No                    | No                          |
| keyword  | `"Space War"`     | Yes               | No                      | No                    | No                          |


To filter on phrases, use a `phrase` condition. This requires enabling [phrase searching](/documentation/manage-data/indexing/#phrase-search) when creating the full-text index:

{{< code-snippet path="/documentation/headless/snippets/text-search/create-title-phrase-index/" >}}

Next, you can use a `phrase` condition to filter for titles that contain the exact phrase "time machine":

{{< code-snippet path="/documentation/headless/snippets/text-search/filter-title-phrase/" >}}

## Progressive Filtering with the Batch Search API

Even though filters are not used to rank results, you can use the [batch search API](/documentation/search/search/#batch-search-api) to progressively relax filters. This is useful when you have strict filtering criteria that may not return results. Batching multiple search requests with progressively relaxed filters enables you to get results even when the strictest filter returns no results.

For example, the following batch search request first tries to find books that match all search terms in the title. The second search request relaxes the filter to match any of the search terms. The third search request removes the filter altogether:

{{< code-snippet path="/documentation/headless/snippets/text-search/batch-progressive-filter/" >}}

The response contains three separate result sets. You can return the first non-empty result set to the user, or you can use the three sets to assemble a single ranked list.
