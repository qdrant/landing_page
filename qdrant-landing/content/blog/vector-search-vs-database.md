---
title: "Vector Databases Are Holding You Back"
draft: false
slug: vector-search-vs-database
short_description: "Why vector search is an engineering primitive, not a storage problem. Trade-offs, hybrid search, and tunable retrieval explained."
description: "Vector databases store vectors. Vector search engines retrieve them. Learn why treating retrieval as a primitive changes how you build RAG, search, and agents."
preview_image: /blog/vector-search-vs-database/hero.png
social_preview_image: /blog/vector-search-vs-database/hero.png
date: 2026-07-08
author: Neil Kanungo and Manuel Meyer
featured: true
---

Vector databases sound simple. You take the data you already have, run it through an embedding model, and push the results into a store. Now you can find unstructured data by semantic meaning; problem solved. The mental model is comfortable: vectors are data, and data needs somewhere to live.

That model is wrong, and it is wrong in a way that costs you at query time.

"Vector search" and "vector database" describe two different jobs. A database answers the question "which rows exactly satisfy this predicate." A search engine answers "which items are most relevant to this query, ranked, within a latency budget." Conflating the two is the most expensive misunderstanding in this space, because the job that matters is not storing vectors. It is searching them well, for a workload that looks nothing like the next one.

## Optimize for the Right Task

When you hear "database," you picture something like Postgres: a source of truth. Transactions, snapshot isolation, every committed write immediately and exactly visible. Everything in that architecture flows from the exactness contract. Concurrency control, write-ahead logging, vacuum, and lock management all exist to guarantee that a query returns precisely the rows that match, no more and no less, and the system pays for that guarantee on every write.

A vector is not that kind of data. A vector is a lossy transformation of data you already own, built for one purpose: packing in as much meaning as possible so you can find the right item in a haystack of billions. It is not a fact you store. It is an index into the facts you have, and the operation it exists to serve is approximate nearest neighbor search, which is approximate by definition. There is no exact answer to "what is most relevant" the way there is an exact answer to `WHERE id = 42`.

This is why the database framing fails at the architectural level, not the vocabulary level. In a relational database, the row storage is the product and indexes are auxiliary structures bolted alongside it. In a vector search engine, *the index is the product*. The core data structure is an HNSW graph, and the storage layer exists to serve graph traversal efficiently: immutable segments, memory-mapped vector storage, and quantized representations that keep traversal fast. The engine reorganizes itself in the background, merging and rebuilding segments through an optimizer, because it is allowed to trade snapshot-perfect visibility for relevance at a latency budget. A source-of-truth database cannot make that trade without breaking its own contract. A search engine cannot refuse it without missing its latency targets. A system that calls itself a database has already chosen, and it did not choose retrieval.

## Every Workload Wants Something Different

Here is why this is not a naming nitpick: there is no single "vector workload" to build a database around.

A vector search workload is a point in a 6-dimensional trade-off space:

* reliable accuracy  
* predictable low latency  
* high throughput  
* low cost  
* data freshness  
* small hardware footprint

![Vector Workload](/blog/vector-search-vs-database/image1.png)

Across the real customer production deployments we work with, no two workloads sit at the same point in that space:

![Workload Comparison](/blog/vector-search-vs-database/image2.png)

* A RAG assistant leans hard on accuracy, because a wrong passage becomes a wrong answer  
* A product search leans on latency and throughput, because every 100ms shows up in conversion  
* A large-scale archive cares about cost and footprint most, because billions of vectors in RAM is a budget line  
* Agent memory cares about freshness, because a memory that appears 10 minutes late is not a memory  
* A recommendation engine balances throughput against relevance across millions of daily queries

These are not preferences. They are opposing engineering decisions. Accuracy wants a denser HNSW graph and higher search depth, which costs latency. Cost wants aggressive quantization and vectors on disk, which costs accuracy unless you rescore. Freshness wants fast indexing of new points, which competes with the optimizer maintaining graph quality. A "vector database" tuned for one point in this space is mistuned for the rest. So you either run a different system per workload, or you find one engine flexible enough to take whatever shape the workload demands. That flexibility is the whole point, and it is exactly what the database framing trains you not to ask for.

## Retrieval Is a Primitive

Look at what those workloads have in common. Recommendations, RAG, agent memory, and multimodal search look like completely different products on the surface. Underneath, they all execute the same operation: score candidates, keep the top k. They are all retrieving.

Retrieval is the primitive every one of them is built on. And once you see that, the design follows. You do not ship retrieval as one fixed pipeline that already decided the trade-offs for you. You break it into its smallest pieces and let engineers compose them.

Here are 5:

![Vector Primitives](/blog/vector-search-vs-database/image3.png)

* **Dense vectors** match on meaning, using approximate nearest neighbor search over an HNSW graph  
* **Sparse vectors** match on exact terms, with BM25-style scoring over an inverted index  
* **Filters** cut by payload conditions such as price, date, or category, and this is harder than it sounds. Pre-filtering can starve a graph traversal and return fewer than k results; post-filtering silently drops relevant matches. Filterable HNSW builds the conditions into the traversal itself, which is an architectural commitment, not a query hint  
* **Multiple vectors per point** let one item carry several representations. Named vectors attach independent embeddings, such as dense, sparse, and image, each with its own index. Multivectors go further: many vectors compared as a set with MaxSim, the late-interaction pattern behind ColBERT and ColPali  
* **Scoring** is the dial on top: fusion of ranked lists, custom formulas over scores and payload fields, and oversampling with rescoring against original vectors

Every workload has a different mix of these 5\. E-commerce might be sparse \+ filter \+ dense. RAG might be dense \+ sparse \+ rescoring. You architect the trade-offs per query instead of inheriting whatever a pipeline picked for you, and it all composes in a single request. This is vector search as a primitive, not a product feature.

## Compose It, Control It, Configure It

If workloads diverge and retrieval is a primitive, then the engine's real value is what it hands back to the developer: control. It comes in 3 layers, and a workload that is serious about retrieval needs all 3\.

![Three C's](/blog/vector-search-vs-database/image4.png)

**Composability is which operations run in a single query.** Dense, sparse, filters, multivector comparison, scoring, fusion, and rerank, combined however the workload needs. Mechanically, this is the prefetch tree: any query can nest sub-queries, and each stage operates on its children's results. A product search composes filters and dense vectors. Agent memory composes dense vectors, filters, and a freshness decay. Same primitive, different composition, one round trip.

**Controllability is how results get scored at query time.** Fusion method, formula-based scoring, oversampling and rescoring, and the accuracy-versus-latency dial, which is literally a per-request HNSW search depth parameter. This is where two workloads using the exact same operators still behave differently. The RAG assistant raises the search depth and rescores against full-precision vectors. The product search lowers it and takes the latency win. You set that per query, not per cluster.

**Configurability is how the engine runs underneath.** Quantization (scalar, binary, product, or turbo) trades precision for a memory footprint that can shrink by an order of magnitude, with rescoring against original vectors to buy the accuracy back. Memory tiering decides what lives in RAM, what is memory-mapped, and what stays on SSD; you can hold the graph in RAM while the vectors live on disk. Index parameters like the HNSW graph's connectivity and build depth set the baseline recall-versus-resource curve. The large-scale archive quantizes aggressively and tiers to disk. The low-latency service keeps everything in RAM. Same engine, different configuration.

The payoff: when the workload changes, you do not re-architect. You re-tune. Most systems make these decisions for you and call it “simplicity.” The better design hands all 3 layers to you and calls it “control.”

## Example: Tunable Hybrid Search

Hybrid search is the clearest case. Instead of choosing between keyword and semantic search, you run both and fuse the results. You set the depth of each prefetch and choose the fusion method, all in a single API call:

```py
from qdrant_client import models

client.query_points(
    collection_name="docs",
    prefetch=[
        models.Prefetch(query=dense, using="dense", limit=50),
        models.Prefetch(query=sparse, using="sparse", limit=50),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=10,
)
```

That is composability (dense and sparse in one query) and controllability (the fusion choice, the prefetch depths) in a handful of lines. And the fusion method is a choice with real engineering behind it, because dense and sparse scores are not comparable. Cosine similarity is bounded; BM25 is unbounded, and both distributions shift per query. A naive weighted sum of raw scores gets dominated by whichever retriever produced larger magnitudes that day.

- **Reciprocal Rank Fusion (RRF)** sidesteps the problem entirely by combining ranks instead of scores. Use it when you do not trust the raw scores, which is most of the time.  
- **Distribution-Based Score Fusion (DBSF)** normalizes each retriever's score distribution before summing, preserving score magnitude information that ranks throw away.

When you need explicit weighting or business logic on top, a formula query wraps the fused prefetch and composes the final score from prefetch scores and payload fields: recency decay for agent memory, popularity boosts for product search, category-conditional multipliers for e-commerce. Same endpoint, layered behaviors. A "database" would pick one and hide the rest.

## The Shift in Thinking

The takeaway is small to say and large to act on. Stop shopping for a vector database, a place to put vectors and forget about them. Start treating vector search as the primitive your product is actually built on, and judge engines by the engineering questions that follow from it. How does filtering interact with graph traversal? What does the accuracy dial cost, and can you turn it per request? What happens to memory when the corpus grows 10x?

Every workload is different, so the ability to compose, control, and configure is not a luxury feature. *It’s the whole job.* 