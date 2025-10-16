---
title: Using Cloud Inference to Build Hybrid Search
weight: 35
---
# Using Cloud Inference with Qdrant for Vector Search
In this tutorial, we'll walkthrough building a **hybrid semantic search engine** using Qdrant Cloud's built-in [inference](/documentation/cloud/inference/) capabilities. You'll learn how to:
- Automatically embed your data using [cloud Inference](/documentation/cloud/inference/) without needing to run local models,
- Combine dense semantic embeddings with [sparse BM25 keywords](https://qdrant.tech/documentation/advanced-tutorials/reranking-hybrid-search/),  and
- Perform hybrid search using  [Reciprocal Rank Fusion (RRF)](https://qdrant.tech/documentation/concepts/hybrid-queries/) to retrieve the most relevant results.

## Initialize the Client
Initialize the Qdrant client after creating a [Qdrant Cloud account](/documentation/cloud/) and a [dedicated paid cluster](/documentation/cloud/create-cluster/). Set `cloud_inference` to `True` to enable [cloud inference](/documentation/cloud/inference/). 

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/initialize-client/" >}}

## Create a Collection
Qdrant stores vectors and associated metadata in collections. A collection requires vector parameters to be set during creation. In this case, let's set up a collection using `BM25` for sparse vectors and `all-minilm-l6-v2` for dense vectors. BM25 uses the Inverse Document Frequency to reduce the weight of common terms that appear in many documents while boosting the importance of rare terms that are more discriminative for retrieval. Qdrant will handle the calculations of the IDF term if we enable that in the configuration of the `bm25_sparse_vector` named sparse vector.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/create-collection/" >}}

## Add Data
Now you can add sample documents, their associated metadata, and a point id for each. Here's a sample of the [miriad/miriad-4.4M](https://huggingface.co/datasets/miriad/miriad-4.4M) dataset:

| qa_id              | paper_id | question                                              | year | venue                                | specialty    | passage_text                                          |
|--------------------|----------|-------------------------------------------------------|------|--------------------------------------|--------------|--------------------------------------------------------|
| 38_77498699_0_1    | 77498699 | What are the clinical features of relapsing polychondritis? | 2006 | Internet Journal of Otorhinolaryngology | Rheumatology | A 45-year-old man presented with painful swelling...  |
| 38_77498699_0_2    | 77498699 | What treatments are available for relapsing polychondritis? | 2006 | Internet Journal of Otorhinolaryngology | Rheumatology | Patient showed improvement after treatment with...     |
| 38_88124321_0_3    | 88124321 | How is Takayasu arteritis diagnosed?                  | 2015 | Journal of Autoimmune Diseases        | Rheumatology | A 32-year-old woman with fatigue and limb pain...      |

We won't ingest all the entries from the dataset, but for demo purposes, just take the first hundred ones:

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/upload-data/" >}}
## Set Up Input Query
Create a sample query:

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/create-sample-query/" >}}

## Run Vector Search
Here, you will ask a question that will allow you to retrieve semantically relevant results. The final results are obtained by reranking using [Reciprocal Rank Fusion](https://qdrant.tech/documentation/concepts/hybrid-queries/#hybrid-search).

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/vector-search/run-vector-search/" >}}

The semantic search engine will retrieve the most similar result in order of relevance.
```markdown
[ScoredPoint(id='9968a760-fbb5-4d91-8549-ffbaeb3ebdba', 
version=0, score=14.545895, 
payload={'text': "Relapsing Polychondritis is a rare..."}, 
vector=None, shard_key=None, order_value=None)]
```