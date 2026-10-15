---
title: Hybrid Search
short_description: "Step-by-step tutorial: build hybrid search in Qdrant combining dense semantic retrieval and BM25 keyword retrieval with reciprocal rank fusion."
description: "Build a hybrid search engine on Qdrant Cloud that fuses dense embeddings with BM25 full-text search using reciprocal rank fusion for higher-precision retrieval."
weight: 40
aliases:
  - /documentation/tutorials-and-examples/cloud-inference-hybrid-search/
goal: Get Started
stack:
  - Python
  - TypeScript
  - Rust
  - Java
  - C#
  - Go
  - Cloud Inference
---
# Hybrid Search Using Qdrant Cloud Inference

| Time: 15 min | Level: Beginner |
| --- | ----------- |

In this tutorial, we'll walk through building a **hybrid semantic search engine** using Qdrant Cloud's built-in [inference](/documentation/cloud/inference/) capabilities. You'll learn how to:
- Automatically embed your data using [cloud Inference](/documentation/cloud/inference/) without needing to run local models,
- Combine dense semantic embeddings with [BM25 keyword search](/documentation/search/text-search/full-text-search/#bm25),  and
- Perform hybrid search using  [Reciprocal Rank Fusion (RRF)](/documentation/search/hybrid-queries/) to retrieve the most relevant results.

Hybrid search combines two retrieval methods. Lexical retrieval (here with [BM25](/documentation/search/text-search/full-text-search/#bm25)) matches the words of the query, which helps with names, abbreviations, and rare terms. Semantic retrieval (here with the `all-minilm-l6-v2` embedding model) matches meaning, so it also finds passages that use different words. Each method can find results the other misses, so hybrid search runs both and merges their result lists.

## Initialize the Client
For Python, install the Qdrant client and the Hugging Face `datasets` library:

```bash
pip install qdrant-client datasets
```

For the other languages, install a client from the [API & SDKs](/documentation/interfaces/) page.

Initialize the Qdrant client after creating a [Qdrant Cloud account](/documentation/cloud/) and a [cluster](/documentation/cloud/create-cluster/). In Python, set `cloud_inference` to `True` to use [Cloud Inference](/documentation/cloud/inference/).

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/initialize-client/" >}}

## Create a Collection
Qdrant stores vectors and associated metadata in collections. A collection requires vector parameters to be set during creation. In this case, let's set up a collection with a dense vector for `all-minilm-l6-v2` embeddings. For keyword search, create a [full-text index](/documentation/manage-data/indexing/#full-text-index) with [BM25 scoring](/documentation/manage-data/indexing/#bm25-scoring) enabled on the `passage_text` payload field. BM25 uses the Inverse Document Frequency to reduce the weight of common terms that appear in many documents while boosting the importance of rare terms that are more discriminative for retrieval. Qdrant computes these statistics from the indexed text, so you don't need to generate embeddings for BM25.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/create-collection/" >}}

## Add Data
Now you can add sample documents, their associated metadata, and a point ID for each. Here's a sample of the [miriad/miriad-4.4M](https://huggingface.co/datasets/miriad/miriad-4.4M) dataset:

| qa_id | paper_id | question | year | venue | specialty | passage_text |
|---|---|---|---|---|---|---|
| 87_18093431_2_1 | 18093431 | What are the leading reasons for the failure of stoma closure after laparoscopic low anterior resection? | 2017 | Annals of surgical treatment and research | General Surgery | Other studies have also disclosed that the rate of stoma rev... |
| 87_19380024_5_1 | 19380024 | What are some considerations when deciding whether to perform salvage surgery for aggressive tumors in critical neurovascular structures? | 2016 | Head & neck | Neurology | However, salvage surgery should not be routinely performed i... |
| 87_80622582_1_1 | 80622582 | How does the pedicled anterolateral thigh (ALT) flap compare to other flaps in terms of advantages and donor site morbidity? | 2017 | International Microsurgery Journal | General Surgery | When the ALT flap was tunnelled through the muscular compart... |

We won't ingest all the entries from the dataset, but for demo purposes, just take a random sample of 100 distinct passages:

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/upload-data/" >}}

## Set Up Input Query
Create a sample query:

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/create-sample-query/" >}}

## Run Hybrid Search
The query runs a dense prefetch and a BM25 prefetch, then fuses both result lists with [Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#hybrid-search).

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/run-vector-search/" >}}

The search returns the five results with the highest RRF scores. Each line shows the score and the dataset question paired with the passage. Only the first result is about stoma closure:

```text
1.000  What are the leading reasons for the failure of stoma closure after laparoscopic low anterior resection?
0.500  What are some considerations when deciding whether to perform salvage surgery for aggressive tumors in critical neurovascular structures?
0.450  How does the pedicled anterolateral thigh (ALT) flap compare to other flaps in terms of advantages and donor site morbidity?
0.333  What are the potential reasons for the elevated risks of second ovarian and kidney cancers found after follow-up within one year of endometrial cancer diagnosis?
0.250  What are the benefits of a multidisciplinary team approach in the management of patients with endometriosis?
```

RRF ignores the raw scores and looks only at where each result lands in the two lists. A result in position n of a list earns 1/(n + 1) from that list, and the earnings from both lists add up:

| Result | Dense position | BM25 position | RRF score |
|---|---|---|---|
| Stoma closure failure | 1 | 1 | 1/2 + 1/2 = 1.000 |
| Salvage surgery | 5 | 2 | 1/6 + 1/3 = 0.500 |
| ALT flap | 4 | 3 | 1/5 + 1/4 = 0.450 |
| Second ovarian and kidney cancers | 2 | not in top 5 | 1/3 = 0.333 |
| Endometriosis team approach | 3 | not in top 5 | 1/4 = 0.250 |

The salvage surgery passage is only fifth for the dense model, but BM25 ranks it second, so it beats passages that only the dense model found.

## Clean Up

Delete the collection when you no longer need it:

{{< code-snippet path="/documentation/headless/snippets/delete-collection/simple/" order="python typescript rust java csharp go" >}}

## Next Steps

Hybrid search result quality can be improved by reranking the results using a more expensive but higher quality model. Learn more in the [hybrid search with reranking tutorial](/documentation/tutorials-basics/reranking-hybrid-search/).
