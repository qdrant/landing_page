---
title: Qdrant Fundamentals
short_description: "FAQ covering Qdrant fundamentals: vector dimensions, payload metadata, real-time updates, multivectors, and search behavior."
description: "Common questions about Qdrant fundamentals — vector dimensions, payload limits, multivectors, real-time updates, and how similarity search behaves at scale."
weight: 1
aliases:
  - ../faq
---

# Frequently Asked Questions: General Topics
|||||||
|-|-|-|-|-|-|
|[Vectors](/documentation/faq/qdrant-fundamentals/#vectors)|[Search](/documentation/faq/qdrant-fundamentals/#search)|[Collections](/documentation/faq/qdrant-fundamentals/#collections)|[Compatibility](/documentation/faq/qdrant-fundamentals/#compatibility)|[Security](/documentation/faq/qdrant-fundamentals/#security)|[Cloud](/documentation/faq/qdrant-fundamentals/#cloud)|

## Vectors

### What is the maximum vector dimension supported by Qdrant?

In dense vectors, Qdrant supports up to 65,535 dimensions.

### What is the maximum size of vector metadata that can be stored?

There is no inherent limitation on metadata size, but it should be [optimized for performance and resource usage](/documentation/ops-optimization/optimize/). Users can set upper limits in the configuration.

### Can the same similarity search query yield different results on different machines?

Yes, due to differences in hardware configurations and parallel processing, results may vary slightly.

### How do I choose the right vector embeddings for my use case?

This depends on the nature of your data and the specific application. Consider factors like dimensionality, domain-specific models, and the performance characteristics of different embeddings.

### How does Qdrant handle different vector embeddings from various providers in the same collection?

Qdrant natively [supports multiple vectors per data point](/documentation/manage-data/vectors/#multivectors), allowing different embeddings from various providers to coexist within the same collection.

### Can I migrate my embeddings from another vector store to Qdrant?

Yes, Qdrant supports migration of embeddings from other vector stores, facilitating easy transitions and adoption of Qdrant’s features.

### Why the amount of indexed vectors doesn't match the amount of vectors in the collection?

Qdrant doesn't always need to index all vectors in the collection.
It stores data is segments, and if the segment is small enough, it is more efficient to perform a full-scan search on it.

Make sure to check that the collection status is `green` and that the number of unindexed vectors smaller than indexing threshold.

### Why collection info shows inaccurate number of points?

Collection info API in Qdrant returns an approximate number of points in the collection.
If you need an exact number, you can use the [count](/documentation/manage-data/points/#counting-points) API.

### Vectors in the collection don't match what I uploaded.

There are two possible reasons for this:

- You used the `Cosine` distance metric in the [collection settings](/documentation/manage-data/collections/#collections). In this case, Qdrant pre-normalizes your vectors for faster distance computation. If you strictly need the original vectors to be preserved, consider using the `Dot` distance metric instead.
- You used the `uint8` [datatype](/documentation/manage-data/vectors/#datatypes) to store vectors. `uint8` requires a special format for input values, which might not be compatible with the typical output of embedding models.

### How many vectors can I store in a point? Can a point have no vector at all?

A point can hold any number of dense, sparse, and multi vectors, though each has to be configured in the collection's schema. There's no hard limit imposed by Qdrant, though practical limits apply: each additional vector increases memory usage, so the realistic ceiling is determined by available RAM and storage. You can attach a single vector, or multiple vectors with different names (for example, a dense vector for semantic search alongside a sparse vector for keyword matching). This lets you run [hybrid queries](/documentation/search/hybrid-queries/) over several representations of the same data within one collection. Each vector must be defined in the collection's schema.

A point can also have zero vectors. If you don't provide any vectors at upsert time, Qdrant stores the point with its ID and payload only. This is useful when you want to use Qdrant as a document store with filtering, or when you plan to add vectors to a point later. A vector-less point won't appear in nearest-neighbor search results, but it's fully accessible via [scroll](/documentation/manage-data/points/#scroll-points) and payload filtering.

### Can Qdrant generate vector embeddings?

Yes, if you're using Qdrant Cloud, you can generate embeddings with [**Qdrant Cloud Inference**](/documentation/inference/). It lets you embed, store, and index your data in a single API call, so you don't need a separate inference service or embedding pipeline.

Cloud Inference supports dense models for semantic search, sparse models for keyword recall, and multimodal models for image and text search. Since embeddings are generated inside your cluster's network, you avoid external API overhead — which means lower latency, no egress costs, and fewer moving parts.

Several models are available at no cost, available on all cluster tiers, including the free tier. You can review available models and current usage in the **Inference** tab of the Cluster Detail page in the [Qdrant Cloud Console](https://cloud.qdrant.io/).

If you're running Qdrant open-source or self-hosted, Cloud Inference isn't available. You can use [FastEmbed](/documentation/fastembed/), Qdrant's lightweight, local inference library, or bring your own embedding model or service. See the [Embeddings documentation](/documentation/embeddings/) for supported models and providers.

### Should each chunk of my document be a separate point in Qdrant?

Yes, in most Retrieval-Augmented Generation (RAG) setups, each chunk is stored as a separate point. The chunk text (or a reference to it) goes in the payload, and the embedding of that chunk is the vector. Points can share a `document_id` payload field so you can trace results back to the source document.

How you chunk matters significantly and is domain-dependent. As a starting point: paragraph-level chunking works well for books and prose; sentence-level chunking tends to work better for technical articles and Q\&A content. Plan to experiment — chunking strategy is one of the highest-leverage variables in retrieval quality.

See also: [Text Chunking Strategies](/course/essentials/day-1/chunking-strategies/)

### How does point deletion work internally? Does Qdrant rebuild the index on every delete?

Qdrant implements deletions as soft deletes using a bitmask, so the index is not rebuilt after each deletion. The bitmask is a lightweight data structure, enabling Qdrant to quickly determine whether a point should be excluded from an operation without accessing the deleted point's data. The Vacuum Optimizer handles physical cleanup in the background.

After a delete operation, the point is immediately inaccessible via the API. The soft-delete mechanism is an internal implementation detail.

### Does upserting a point with no changes still trigger a delete and re-insert?

Yes. Qdrant performs no similarity check before an upsert. If you upsert a point that already exists with identical data, the system still marks the old version as deleted and inserts a new copy.

### What does the `version` field on a point represent?

The version field in the Query API response represents the internal shard-level operation number of the last modification to that point. It is incremented by internal processes, so it is not a reliable proxy for application-level write counts and cannot be compared across replicas. Use a user-managed payload counter if you need application-level write tracking.

## Search 

### How does Qdrant handle real-time data updates and search?

Qdrant supports live updates for vector data, with newly inserted, updated and deleted vectors available for immediate search. The system uses full-scan search on unindexed segments during background index updates.

### My search results contain vectors with null values. Why?

By default, Qdrant tries to minimize network traffic and doesn't return vectors in search results.
But you can force Qdrant to do so by setting the `with_vector` parameter of the Search/Scroll to `true`.

If you're still seeing `"vector": null` in your results, it might be that the vector you're passing is not in the correct format, or there's an issue with how you're calling the upsert method.

### How can I search without a vector?

You are likely looking for the [scroll](/documentation/manage-data/points/#scroll-points) method. It allows you to retrieve the records based on filters or even iterate over all the records in the collection.

### My filtered vector search is slow. What should I check first?

Add a [payload index](/documentation/manage-data/indexing/#payload-index) on all the fields you're filtering by. Payload indexing often produces larger speedups for filtered queries than other optimizations such as changes to Hierarchical Navigable Small World (HNSW) parameters.

For best results, create payload indexes **before** uploading data. When uploading data later, rebuild the HNSW index by [making a minimal change](/documentation/manage-data/indexing/#rebuild-the-hnsw-index) to `m` or `ef_construct` (for example, from 100 to 101). Queries continue to be served by the old index until the new index is complete, so there is no downtime. Don't immediately change the value of `ef_construct` back to its original value, but keep it set to the new value.

To prevent clients from filtering on payload fields that don't have a payload index, enable strict mode and [set unindexed\_filtering\_retrieve to false](/documentation/ops-configuration/administration/#disable-retrieving-via-non-indexed-payload).

See also: [Indexing](/documentation/manage-data/indexing/), [Low-Latency Search](/documentation/search/low-latency-search/)

### Does Qdrant support a full-text search or a hybrid search?

Qdrant is a vector search engine in the first place, and we only implement full-text support as long as it doesn't compromise the vector search use case.
That includes both the interface and the performance.

What Qdrant can do:

- Search with full-text filters
- Apply full-text filters to the vector search (i.e., perform vector search among the records with specific words or phrases)
- Do prefix search and semantic [search-as-you-type](/articles/search-as-you-type/)
- Sparse vectors, as used in [SPLADE](https://github.com/naver/splade) or similar models
- [Multi-vectors](/documentation/manage-data/vectors/#multivectors), for example ColBERT and other late-interaction models
- Combination of the [multiple searches](/documentation/search/hybrid-queries/)

What Qdrant doesn't plan to support:

- Non-vector-based retrieval or ranking functions
- Built-in ontologies or knowledge graphs
- Query analyzers and other NLP tools

Of course, you can always combine Qdrant with any specialized tool you need, including full-text search engines.
Read more about [our approach](/articles/hybrid-search/) to hybrid search.

### When should I use Reciprocal Rank Fusion (RRF) vs. Distribution-Based Score Fusion (DBSF) for hybrid search?

Both methods combine scores from multiple retrieval legs (for example, dense and sparse), but they work differently:

* **RRF (Reciprocal Rank Fusion)** combines ranked lists based on position, not score magnitude. It works well when scores from different retrieval methods are on incompatible scales (common with dense vs. sparse). Start here by default. [Tune weights and k](/documentation/search/hybrid-queries/#setting-rrf-constant-k) as needed.  
* **DBSF (Distribution-Based Score Fusion)** normalizes scores based on their statistical distribution per prefetch before combining them. It can produce better results when score distributions are well-behaved and you want absolute score values to influence the final ranking.

For custom fusion, use the [Formula Query](/documentation/search/search-relevance/#score-boosting). For example, you can use decay functions to normalize both scores to a 0-1 range and then fuse them. This approach requires you to determine the approximate score distribution for each corpus, since you can't set decay function parameters dynamically. The Formula Query doesn't support custom rank-based fusion because it doesn't have access to prefetch ranks; only to the raw scores.

To evaluate which works better for your use case, create a small golden query set and compare [retrieval quality metrics](/documentation/improve-search/retrieval-relevance/) (for example, NDCG@10) under each method.

See also: the [Choosing a Fusion Method](/documentation/search/hybrid-queries/#choosing-a-fusion-method) decision table in the Hybrid Queries reference, and the [Choosing a Fusion Method notebook](https://github.com/qdrant/examples/blob/master/fusion-methods/Choosing_a_Fusion_Method.ipynb) for a runnable RRF vs weighted RRF vs DBSF eval on BEIR/SciFact with a reusable weight-tuning helper.

### My hybrid search results aren't relevant. Where do I start debugging?

Work through these in order:

1. **Check sparse preprocessing.** Poor sparse results are often a tokenization issue. For non-English text, configure language-specific stemming and stop-word lists in the [text search settings](/documentation/search/text-search/full-text-search/#bm25-text-processing).  
2. **Isolate the legs.** Run your dense-only and sparse-only queries separately. If one leg is producing bad results in isolation, fix it before tuning fusion.  
3. **Tune fusion weights.** If both legs look reasonable individually but fusion degrades quality, try adjusting the per-prefetch weights in your RRF configuration. There is no universal default. Evaluate against a small labeled query set.  
4. **Add a reranking stage.** If precision matters more than latency, [reranking](/documentation/search/hybrid-queries/#multi-stage-queries) as a final stage can recover from imperfect retrieval.

### What are the three approaches to filtering in Qdrant, and when should I use each?

There are three strategies:

1. **Payload index only** — purely logical separation via filtering. Works for any cardinality.  
2. **Payload index with `is_tenant=true`** — logical separation plus physical co-location on shared shards with per-tenant sub-indexes. Still works for any cardinality; only one field per collection can use this setting.  
3. **Custom sharding (`shard_key_selector`)** — hard physical boundaries with distinct shards. Eliminates noisy-neighbor problems. Recommended only for low cardinality (< ~1,000 unique values) and only when you *always* filter on that field.

### If I run the same query with `limit=20` and `limit=100`, are the first 20 results guaranteed to match?

Results are generally expected to be consistent for the overlapping portion. However, HNSW is an approximate algorithm. A larger limit increases the search scope and may find points that are a better match than those returned for a smaller limit. If `limit=100` manages to find points that are a better match, it will reorder the first 20 points.

### What does the `time` field in the Query API response represent? Does it include network latency?

The time value is in seconds and represents the total duration the Qdrant server spent processing the request. It does not include network round-trip time between the client and the server.

### Why do I get duplicate results when paginating through search results?

Because HNSW is an approximate algorithm, the ranking of results can shift slightly between requests. As a result, paginating with `offset` can return the same point on multiple pages or skip points entirely. This is expected behavior, not a bug.

There are three ways to work around this:

- **Client-side pagination** — retrieve a large batch in a single request (for example, the top 100 results) and paginate through it on the client. This avoids multiple round-trips and guarantees no duplicates, at the cost of returning more data than the user sees at once.
- **Exact search** — use exact searches to bypass HNSW and scan all vectors, returning results in a stable, deterministic order. This ensures offset-based pagination works correctly. This is practical only for small collections due to higher latency.
- **Exclude seen IDs** — on each subsequent page, pass a `must_not: has_id` filter containing all point IDs from previous pages. The exclusion list grows by `limit` entries per page, so this works well for sequential, forward-only pagination but isn't practical for jumping to an arbitrary page.

See also: [Stable Ordering](/documentation/search/search/#stable-ordering)

### If `limit` is higher than `hnsw_ef`, does Qdrant automatically adjust `hnsw_ef`?

Yes. Qdrant internally sets `ef = max(ef, limit)` so that the candidate list is always at least as large as the requested result count.

### What is the default value of `hnsw_ef` during search?

By default, `hnsw_ef` equals `ef_construct` (default: 100). `ef_construct` is a collection-level configuration that controls the number of neighbors considered during graph construction. `hnsw_ef` is the per-query parameter controlling the size of the dynamic candidate list during search.

### What are the default `rescore` values for different quantization methods?

Only binary quantization uses rescoring by default. All other quantization methods do not rescore by default. The default behavior can be overridden with the query-time `rescore` parameter.

### What does `ignore=true` do in quantization search params?

When `ignore` is `true`, Qdrant still traverses the HNSW graph that was built from quantized vectors, but uses exact (full-precision) distances to score candidates during traversal rather than quantized distances. This can improve recall at some cost, since different neighbors may be selected compared to a fully quantized search.

## Collections

### How many collections can I create?

As many as you want, but be aware that each collection requires additional resources.
It is _highly_ recommended not to create many small collections, as it will lead to significant resource consumption overhead.

We consider creating a collection for each user/dialog/document as an antipattern.

Read more about collections, isolation, and multiple users in our [Multitenancy](/documentation/manage-data/multitenancy/) documentation.

### Should I use named vectors or separate collections for different embedding models?

Use **named vectors** when the data you're embedding shares the same payload structure and you want to query across vector spaces in a single request (for example, combining a dense text vector with a CLIP image vector for the same product). Use **separate collections** when the payload schemas differ significantly, when you need independent scaling, when you only set and query one of the configured vectors on a point, to test new embeddings, or when one set of vectors is queried in isolation far more often.

As a general guideline: named vectors share a point (and its payload). If different embeddings represent fundamentally different entities, they belong in different collections.

See also: [Named Vectors](/documentation/manage-data/vectors/#named-vectors)

### Can I switch to a different embedding model without recreating my collection?

Yes, if you're using named vectors:

1. [Add a new named vector](/documentation/manage-data/collections/#update-vector-schema) for the new model
2. Re-embed points in the background
3. Remove the old named vector when you're ready.

If you don't use named vectors, you need to create a new collection. Use an alias-based swap for a zero-downtime migration:

1. Create a new collection and ingest your data re-embedded with the new model.  
2. Once indexed, atomically update the [collection alias](/documentation/manage-data/collections/#collection-aliases) to point to the new collection.  
3. Delete the old collection when you're confident the migration is stable.

See also: [Migrate to a New Embedding Model](/documentation/tutorials-operations/embedding-model-migration/)

### Why is my collection in "grey" status?

A collection in grey status means the optimizer has stalled. This can happen if a Qdrant instance is restarted while optimizations are ongoing. During this state, the amount of unindexed data can grow. Because Qdrant falls back to full-scan search on unindexed segments, this degrades query latency. If [`indexed_only` or `prevent_unoptimized` are enabled](/documentation/search/low-latency-search/#query-indexed-data-only), Qdrant doesn't return unindexed data, and search results may be incomplete.

Common recovery steps:

1. Use the **Trigger Optimizers** button in the Qdrant Web UI. It is shown next to the grey collection status on the collection info page.  
2. Send any [update collection operation](/documentation/manage-data/collections/#grey-collection-status) to trigger and start the optimizations again.

See also: [Grey collection status](/documentation/manage-data/collections/#grey-collection-status)

### How do I upload a large number of vectors into a Qdrant collection?

Read about our recommendations in the [Bulk Upload](/documentation/manage-data/bulk-upload/) guide.

### What's the recommended batch size for uploading vectors?

There is no universal recommended batch size. The optimum depends on your vector dimensionality, payload size, cluster configuration, and available memory. You should benchmark different batch sizes against your own setup to find what works best.

A good starting point is 64 to 256 points per batch. However, if operations within a batch are inherently expensive, such as updates impacting many points or updates by filter, it is more efficient to send individual requests.

See also: [Bulk Upload](/documentation/manage-data/bulk-upload/)

### Can I only store quantized vectors and discard full precision vectors?

No, Qdrant requires full precision vectors for operations like reindexing, rescoring, etc.

### Can I delete the original full-precision vectors after enabling quantization?

No. Qdrant requires the original full-precision vectors to recompute quantized representations whenever the Vacuum Optimizer rebuilds a segment. Qdrant derives quantization statistics (offset and alpha) from the full-precision vectors in each segment, so removing them would make reindexing impossible.

## Compatibility

### Is Qdrant compatible with CPUs or GPUs for vector computation?

Qdrant primarily relies on CPU acceleration for scalability and efficiency. However, we also support GPU-accelerated indexing on all major vendors.

### Do you guarantee compatibility across versions?

In case your version is older, we only guarantee compatibility between two consecutive minor versions. This also applies to client versions. Ensure your client version is never more than one minor version away from your cluster version.
While we will assist with break/fix troubleshooting of issues and errors specific to our products, Qdrant is not accountable for reviewing, writing (or rewriting), or debugging custom code.

### Do you support downgrades?

We do not support downgrading a cluster on any of our products. If you deploy a newer version of Qdrant, your
data is automatically migrated to the newer storage format. This migration is not reversible.

### How do I avoid issues when updating to the latest version?

We only guarantee compatibility if you update between consecutive versions. You would need to upgrade versions one at a time: `1.1 -> 1.2`, then `1.2 -> 1.3`, then `1.3 -> 1.4`.

### Should I create payload indexes before or after uploading? 

Create payload indexes before uploading to avoid index rebuilding. However, there are scenarios where defining idexes after uploading is okay. For example, you can configure a new filter logic after launch. 

You should always index first if you know your filters upfront. If you need to index another payload later, you can still do it, but be aware of the performance hit.

### If I need to add a payload index after the HNSW index has already been built, how do I trigger a full reindex?

Changing `m` or `ef_construct` automatically triggers a full background HNSW rebuild. For cases where only a payload index is being added, make a minimal change to `ef_construct` (for example, from 100 to 101). Queries continue to be served by the old index until the new index is complete, so there is no downtime. Don't immediately change the value of `ef_construct` back to its original value, but keep it set to the new value.

### Should I create one Qdrant collection per user? 
No. Creating one collection per user is more resource intensive. 

Instead of creating separate collections for each user, we recommend creating a [single collection](/documentation/manage-data/multitenancy/) and separate access using payloads. Each Qdrant point can have a payload as metadata. For multitenancy, you can include a `user_id` or `tenant_id` for each point. To optimize storage further, you can enable [tenant indexing](/documentation/manage-data/indexing/#tenant-index) for payload fields.

## Security

### Is my Qdrant cluster secure by default?

It depends on your deployment. Qdrant Cloud clusters are always secure by default. Self-hosted deployments are not: they're open to all network interfaces and have no authentication configured until you set it up. See [Security](/documentation/security/) for a full configuration guide.

### Does Qdrant support read-only access?

Yes. You can configure a read-only API key that permits queries but blocks all write operations. Both keys can be active at the same time, so you can issue a read-only key to consumers without rotating your primary key. See [Read-Only API Key](/documentation/security/#read-only-api-key).

### Can I restrict access to specific collections?

Yes. Qdrant supports JWT-based access control that lets you issue signed tokens scoped to individual collections with read or write permissions. This is useful for multi-tenant deployments where each user or service should only access their own data. See [Granular Access API Keys](/documentation/security/#granular-access-api-keys).

## Cloud

### Is it possible to scale down a Qdrant Cloud cluster?

Yes, it is possible to both vertically and horizontally scale down a Qdrant Cloud cluster.
Note, that during the vertical scaling down, the disk size cannot be reduced.
