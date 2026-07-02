<img width="300" height="136" alt="filterable-vector-index" src="https://github.com/user-attachments/assets/5728746a-8d0c-4c82-96aa-e5f029a983fc" />---
title: "A Complete Guide to Filtering in Vector Search"
short_description: "How Qdrant combines semantic search with payload-level constraints to deliver precise, efficient results"
description: "Learn how filtering works in Qdrant: the filterable HNSW index, payload indexing, filter cardinality, and the conditions and clauses you need to build high-precision vector search."
preview_dir: /articles_data/vector-search-filtering/preview
social_preview_image: /articles_data/vector-search-filtering/social-preview.png
weight: 70
author: Sabrina Aquino, David Myriel
author_link:
date: 2026-07-02T00:00:00.000Z
category: mastering-search
---
Vector search is a ranking system, not a filter system. Every point in your collection is a candidate, which based on the semantic similarity to the query would get surfaced. That works well when you want "what's most relevant." It becomes insufficient when the result must also satisfy hard constraints: exact values, ranges, categorical membership, or payload-level conditions that similarity alone cannot enforce.

Filtering is Qdrant's mechanism for combining semantic retrieval with predicate-based constraints. This guide covers how it works, when to use it, and how to configure indexing to keep filtered queries fast and accurate.

Take an e-commerce scenario where a customer searches for a budget computer. Vector search alone surfaces the most semantically similar results, but similarity has no concept of price. Without a payload filter, a $1,299 laptop ranks second simply because its embedding is close to the query. Add a `price ≤ $1,000` filter and Qdrant evaluates the constraint before scoring: over-budget candidates are excluded entirely, never ranked, never returned. The result set is both relevant and correct.

<img width="1600" height="946" alt="53dd43b7-1854-491b-8463-a8f702300756" src="https://github.com/user-attachments/assets/0c3317e8-5a4d-47dd-9f6c-6fe12544e7e8" />


## Data model: points, vectors, and payloads

When storing data in Qdrant, each product is a point, consisting of an id, a vector and payload:

```json
{
  "id": 1,
  "vector": [0.1, 0.2, 0.3, 0.4],
  "payload": {
    "price": 899.99,
    "category": "laptop"
  }
}
```

- `id`: a unique identifier within the collection.
- `vector`: a dense embedding representing the point's semantic position in the vector space.
- `payload`: arbitrary metadata attached to the point, queryable via filter conditions.

Though we may not be able to decipher the vector, we are able to derive additional information about the item from its metadata, In this specific case, we are looking at a data point for a laptop that costs $899.99.

## What is filtering?

When searching for the perfect computer, your customers may end up with results that are mathematically similar to the search entry, but not exact. For example, if they are searching for laptops under $1000, a simple [vector search](https://qdrant.tech/advanced-search/) without constraints might still show other laptops over $1000.

This is why semantic search alone may not be enough. In order to get the exact result, you would need to enforce a payload filter on the price. Only then can you be sure that the search results abide by the chosen characteristic.

> This is called **filtering** and it is one of the key features of [vector databases](https://qdrant.tech). 

Here is how a filtered vector search looks behind the scenes. We’ll cover its mechanics in the following section.

```http
POST /collections/online_store/points/search
{
  "vector": [ 0.2, 0.1, 0.9, 0.7 ],
  "filter": {
    "must": [
      {
        "key": "category",
        "match": { "value": "laptop" }
      },
      {
        "key": "price",
        "range": {
          "gt": null,
          "gte": null,
          "lt": null,
          "lte": 1000
        }
      }
    ]
  },
  "limit": 3,
  "with_payload": true,
  "with_vector": false
}
```

The filtered result will be a combination of the semantic search and the filtering conditions imposed upon the query. In the following pages, we will show that filtering is a key practice in vector search for two reasons:

1. With filtering in Qdrant, you can dramatically increase search precision. More on this in the next section.
2. Filtering helps control resources and reduce compute use. More on this in [Payload Indexing](https://qdrant.tech/articles/vector-search-filtering/#filtering-with-the-payload-index).

## When to filter vs. when not to

Not every query benefits from filtering. Applying a filter has coordination cost: the query planner must resolve the filter against the index, estimate cardinality, and select an execution strategy. For very broad filters (high cardinality, matching most of the dataset), the overhead may outweigh the gain.

Use this decision tree to determine whether filtering is appropriate for a given query:

```mermaid
quadrantChart
    title How Qdrant picks a filter strategy
    x-axis "LOW cardinality (small leftover pile)" --> "HIGH cardinality (big leftover pile)"
    y-axis "Field NOT indexed" --> "Field is indexed"
    quadrant-1 "Filterable HNSW: fast vector search"
    quadrant-2 "Payload index scan: grab the few matches"
    quadrant-3 "Add a payload index first"
    quadrant-4 "Add a payload index first"
    "Exact SKU lookup": [0.15, 0.85]
    "in_stock = true": [0.85, 0.85]
    "Unindexed price filter": [0.3, 0.2]
```

## How Qdrant handles filtered vector search

### The filterable HNSW index

Qdrant's default vector index is HNSW (Hierarchical Navigable Small World), a graph-based approximate nearest neighbor structure. Each point is a node; edges connect points that are geometrically close.

When a filter is applied, some nodes become ineligible. In a naive implementation, this disconnects the graph: the HNSW traversal cannot cross excluded nodes to reach a valid nearest neighbor.

Qdrant solves this by building **additional edges** between eligible nodes that would otherwise be separated. This produces a filterable HNSW graph that remains traversable after any subset of nodes is excluded.

**Figure 1:** Qdrant's filterable vector index maintains additional links between eligible points so the traversal can still reach valid nearest neighbors after filtering.

![Upload<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1980 900" width="100%" font-family="Inter,Arial,sans-serif">
<rect width="1980" height="900" fill="#ffffff"/>
<defs>
<marker id="ao" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#f5911e"/></marker>
<marker id="aou" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0,9 L9,4.5 L0,0 z" fill="#f5911e"/></marker>
<marker id="ab" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#7d9be0"/></marker>
</defs>
<g transform="translate(0,0)">
<text x="300" y="60" font-family="Inter,Helvetica,Arial,sans-serif" font-size="34" font-weight="800" fill="#d6336c" text-anchor="middle">Default Vector Index</text>
<circle cx="90" cy="820" r="34" fill="none" stroke="#d6336c" stroke-width="3" stroke-dasharray="4 6"/><text x="90" y="833" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="800" fill="#d6336c" text-anchor="middle">1</text>
<line x1="300" y1="150" x2="475" y2="195" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="150" x2="355" y2="250" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="150" x2="245" y2="250" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="150" x2="165" y2="255" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="475" y1="195" x2="355" y2="250" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="475" y1="195" x2="520" y2="355" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="475" y1="195" x2="405" y2="325" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="165" y1="255" x2="245" y2="250" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="165" y1="255" x2="150" y2="365" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="355" y1="250" x2="245" y2="250" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="355" y1="250" x2="360" y2="345" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="245" y1="250" x2="300" y2="300" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="245" y1="250" x2="150" y2="365" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="300" x2="360" y2="345" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="300" x2="405" y2="325" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="405" y1="325" x2="360" y2="345" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="405" y1="325" x2="520" y2="355" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="405" y1="325" x2="435" y2="460" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="360" y1="345" x2="330" y2="385" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="150" y1="365" x2="240" y2="470" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="150" y1="365" x2="170" y2="595" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="240" y1="470" x2="300" y2="505" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="240" y1="470" x2="170" y2="595" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="435" y1="460" x2="520" y2="355" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="435" y1="460" x2="470" y2="560" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="435" y1="460" x2="400" y2="600" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="505" x2="400" y2="600" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="505" x2="240" y2="470" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="170" y1="595" x2="300" y2="665" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="470" y1="560" x2="300" y2="665" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="470" y1="560" x2="400" y2="600" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="665" x2="400" y2="600" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="520" y1="355" x2="470" y2="560" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<circle cx="300" cy="150" r="12" fill="#2b2d42"/>
<circle cx="475" cy="195" r="12" fill="#2b2d42"/>
<circle cx="165" cy="255" r="12" fill="#2b2d42"/>
<circle cx="355" cy="250" r="12" fill="#2b2d42"/>
<circle cx="245" cy="250" r="12" fill="#2b2d42"/>
<circle cx="405" cy="325" r="12" fill="#2b2d42"/>
<circle cx="360" cy="345" r="12" fill="#2b2d42"/>
<circle cx="150" cy="365" r="12" fill="#2b2d42"/>
<circle cx="520" cy="355" r="12" fill="#2b2d42"/>
<circle cx="240" cy="470" r="12" fill="#2b2d42"/>
<circle cx="435" cy="460" r="12" fill="#2b2d42"/>
<circle cx="300" cy="505" r="12" fill="#2b2d42"/>
<circle cx="170" cy="595" r="12" fill="#2b2d42"/>
<circle cx="470" cy="560" r="12" fill="#2b2d42"/>
<circle cx="400" cy="600" r="12" fill="#2b2d42"/>
<circle cx="330" cy="385" r="12" fill="#22c55e"/>
<circle cx="300" cy="300" r="46" fill="#b6f0c8" opacity="0.55"/><circle cx="300" cy="300" r="20" fill="none" stroke="#16a34a" stroke-width="3"/><circle cx="300" cy="300" r="12" fill="#1b1c33"/>
<circle cx="300" cy="665" r="20" fill="none" stroke="#f5911e" stroke-width="3"/><circle cx="300" cy="665" r="12" fill="#1b1c33"/>
<line x1="300" y1="647" x2="300" y2="529" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<line x1="304" y1="488" x2="324" y2="408" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<line x1="324" y1="368" x2="308" y2="323" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<path d="M 330 300 H 470 V 150" fill="none" stroke="#16a34a" stroke-width="2.5"/>
<text x="360" y="120" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#16a34a" text-anchor="start">Query</text>
<text x="360" y="144" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#16a34a" text-anchor="start">Vector</text>
<path d="M 300 687 V 720" fill="none" stroke="#f5911e" stroke-width="2.5" marker-end="url(#aou)"/>
<text x="345" y="745" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#f5911e" text-anchor="start">Entry</text>
<text x="345" y="769" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#f5911e" text-anchor="start">point</text>
</g>
<g transform="translate(660,0)">
<text x="300" y="60" font-family="Inter,Helvetica,Arial,sans-serif" font-size="34" font-weight="800" fill="#d6336c" text-anchor="middle">Introducing Filters</text>
<circle cx="90" cy="820" r="34" fill="none" stroke="#d6336c" stroke-width="3" stroke-dasharray="4 6"/><text x="90" y="833" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="800" fill="#d6336c" text-anchor="middle">2</text>
<line x1="300" y1="150" x2="475" y2="195" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="150" x2="355" y2="250" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="150" x2="245" y2="250" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="150" x2="165" y2="255" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="475" y1="195" x2="355" y2="250" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="475" y1="195" x2="520" y2="355" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="475" y1="195" x2="405" y2="325" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="165" y1="255" x2="245" y2="250" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="165" y1="255" x2="150" y2="365" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="355" y1="250" x2="245" y2="250" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="355" y1="250" x2="360" y2="345" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="245" y1="250" x2="300" y2="300" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="245" y1="250" x2="150" y2="365" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="300" x2="360" y2="345" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="300" x2="405" y2="325" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="405" y1="325" x2="360" y2="345" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="405" y1="325" x2="520" y2="355" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="405" y1="325" x2="435" y2="460" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="360" y1="345" x2="330" y2="385" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="150" y1="365" x2="240" y2="470" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="150" y1="365" x2="170" y2="595" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="240" y1="470" x2="300" y2="505" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="240" y1="470" x2="170" y2="595" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="435" y1="460" x2="520" y2="355" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="435" y1="460" x2="470" y2="560" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="435" y1="460" x2="400" y2="600" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="505" x2="400" y2="600" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="505" x2="240" y2="470" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="170" y1="595" x2="300" y2="665" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="470" y1="560" x2="300" y2="665" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="470" y1="560" x2="400" y2="600" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="665" x2="400" y2="600" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="520" y1="355" x2="470" y2="560" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<circle cx="300" cy="150" r="12" fill="#2b2d42"/>
<circle cx="475" cy="195" r="12" fill="#2b2d42"/>
<circle cx="165" cy="255" r="12" fill="#b9c6ec"/>
<circle cx="355" cy="250" r="12" fill="#2b2d42"/>
<circle cx="245" cy="250" r="12" fill="#b9c6ec"/>
<circle cx="405" cy="325" r="12" fill="#2b2d42"/>
<circle cx="150" cy="365" r="12" fill="#b9c6ec"/>
<circle cx="520" cy="355" r="12" fill="#2b2d42"/>
<circle cx="240" cy="470" r="12" fill="#b9c6ec"/>
<circle cx="435" cy="460" r="12" fill="#b9c6ec"/>
<circle cx="170" cy="595" r="12" fill="#2b2d42"/>
<circle cx="470" cy="560" r="12" fill="#2b2d42"/>
<circle cx="400" cy="600" r="12" fill="#b9c6ec"/>
<circle cx="300" cy="505" r="12" fill="#f5911e"/>
<circle cx="330" cy="385" r="12" fill="#ef4444"/>
<circle cx="360" cy="345" r="12" fill="#ef4444"/>
<circle cx="300" cy="300" r="46" fill="#b6f0c8" opacity="0.55"/><circle cx="300" cy="300" r="20" fill="none" stroke="#16a34a" stroke-width="3"/><circle cx="300" cy="300" r="12" fill="#1b1c33"/>
<circle cx="300" cy="665" r="20" fill="none" stroke="#f5911e" stroke-width="3"/><circle cx="300" cy="665" r="12" fill="#1b1c33"/>
<line x1="300" y1="647" x2="300" y2="529" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<line x1="304" y1="488" x2="324" y2="408" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<line x1="306" y1="488" x2="352" y2="367" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<path d="M 126 365 H 60 V 150" fill="none" stroke="#7d9be0" stroke-width="2.5"/>
<text x="80" y="120" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#7d9be0" text-anchor="start">Filtered out</text>
<text x="80" y="144" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#7d9be0" text-anchor="start">vector</text>
<path d="M 300 687 V 720" fill="none" stroke="#f5911e" stroke-width="2.5" marker-end="url(#aou)"/>
<text x="345" y="745" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#f5911e" text-anchor="start">Entry</text>
<text x="345" y="769" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#f5911e" text-anchor="start">point</text>
</g>
<g transform="translate(1320,0)">
<text x="300" y="60" font-family="Inter,Helvetica,Arial,sans-serif" font-size="34" font-weight="800" fill="#d6336c" text-anchor="middle">Filterable Vector Index</text>
<circle cx="90" cy="820" r="34" fill="none" stroke="#d6336c" stroke-width="3" stroke-dasharray="4 6"/><text x="90" y="833" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="800" fill="#d6336c" text-anchor="middle">3</text>
<line x1="300" y1="150" x2="475" y2="195" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="150" x2="355" y2="250" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="150" x2="245" y2="250" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="150" x2="165" y2="255" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="475" y1="195" x2="355" y2="250" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="475" y1="195" x2="520" y2="355" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="475" y1="195" x2="405" y2="325" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="165" y1="255" x2="245" y2="250" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="165" y1="255" x2="150" y2="365" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="355" y1="250" x2="245" y2="250" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="355" y1="250" x2="360" y2="345" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="245" y1="250" x2="300" y2="300" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="245" y1="250" x2="150" y2="365" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="300" x2="360" y2="345" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="300" y1="300" x2="405" y2="325" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="405" y1="325" x2="360" y2="345" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="405" y1="325" x2="520" y2="355" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="405" y1="325" x2="435" y2="460" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="360" y1="345" x2="330" y2="385" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="150" y1="365" x2="240" y2="470" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="150" y1="365" x2="170" y2="595" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="240" y1="470" x2="300" y2="505" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="240" y1="470" x2="170" y2="595" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="435" y1="460" x2="520" y2="355" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="435" y1="460" x2="470" y2="560" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="435" y1="460" x2="400" y2="600" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="505" x2="400" y2="600" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="505" x2="240" y2="470" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="170" y1="595" x2="300" y2="665" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="470" y1="560" x2="300" y2="665" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<line x1="470" y1="560" x2="400" y2="600" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="300" y1="665" x2="400" y2="600" stroke="#b9c6ec" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
<line x1="520" y1="355" x2="470" y2="560" stroke="#2b2d42" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.9"/>
<circle cx="300" cy="150" r="12" fill="#2b2d42"/>
<circle cx="475" cy="195" r="12" fill="#2b2d42"/>
<circle cx="165" cy="255" r="12" fill="#b9c6ec"/>
<circle cx="245" cy="250" r="12" fill="#b9c6ec"/>
<circle cx="405" cy="325" r="12" fill="#2b2d42"/>
<circle cx="360" cy="345" r="12" fill="#2b2d42"/>
<circle cx="330" cy="385" r="12" fill="#2b2d42"/>
<circle cx="150" cy="365" r="12" fill="#b9c6ec"/>
<circle cx="240" cy="470" r="12" fill="#b9c6ec"/>
<circle cx="435" cy="460" r="12" fill="#b9c6ec"/>
<circle cx="300" cy="505" r="12" fill="#2b2d42"/>
<circle cx="170" cy="595" r="12" fill="#2b2d42"/>
<circle cx="400" cy="600" r="12" fill="#b9c6ec"/>
<circle cx="470" cy="560" r="12" fill="#f5911e"/>
<circle cx="520" cy="355" r="12" fill="#f5911e"/>
<circle cx="355" cy="250" r="12" fill="#22c55e"/>
<circle cx="300" cy="300" r="46" fill="#b6f0c8" opacity="0.55"/><circle cx="300" cy="300" r="20" fill="none" stroke="#16a34a" stroke-width="3"/><circle cx="300" cy="300" r="12" fill="#1b1c33"/>
<circle cx="300" cy="665" r="20" fill="none" stroke="#f5911e" stroke-width="3"/><circle cx="300" cy="665" r="12" fill="#1b1c33"/>
<path d="M 318 665 C 640 640, 660 300, 534 355" fill="none" stroke="#7d9be0" stroke-width="2.5" stroke-dasharray="7 6" marker-end="url(#ab)"/>
<line x1="315" y1="656" x2="450" y2="573" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<line x1="474" y1="543" x2="514" y2="378" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<line x1="505" y1="345" x2="375" y2="263" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<line x1="342" y1="262" x2="318" y2="284" stroke="#f5911e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#ao)"/>
<path d="M 470 150 H 560 V 300" fill="none" stroke="#7d9be0" stroke-width="2.5"/>
<text x="350" y="120" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#7d9be0" text-anchor="start">Additional</text>
<text x="350" y="144" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#7d9be0" text-anchor="start">Link</text>
<path d="M 300 687 V 720" fill="none" stroke="#f5911e" stroke-width="2.5" marker-end="url(#aou)"/>
<text x="345" y="745" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#f5911e" text-anchor="start">Entry</text>
<text x="345" y="769" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="20" font-weight="700" fill="#f5911e" text-anchor="start">point</text>
</g>
</svg>ing filterable-vector-index.svg…]()


### Pre-filtering and post-filtering: why neither works alone

Two simpler approaches exist, both with structural problems at scale:

**Pre-filtering** narrows the dataset by payload predicate first, then runs vector search over the filtered subset. This is efficient when the filter is highly selective (few results survive). When the filter is broad (many results survive), the HNSW graph over the filtered subset is fragmented—too many links have been removed—and search accuracy degrades.

**Figure 2:** Pre-filtering narrows candidates by payload before similarity ranking.

![pre-filtering-vector-search](/articles_data/vector-search-filtering/pre-filtering.png)

**Post-filtering** runs vector search first, retrieves a large candidate set, then applies the filter. This is accurate when the filter is broad (most candidates pass). When the filter is selective, most retrieved candidates are discarded, wasting computation—and if the qualifying points were not in the initial candidate set, they will never appear in results at all.

**Figure 3:** Post-filtering applies payload constraints after similarity ranking, which discards candidates that don't meet the filter.

![post-filtering-vector-search](/articles_data/vector-search-filtering/post-filtering.png)

Qdrant's filterable HNSW avoids this trade-off by building graph links that remain valid under any filter. The query planner also switches dynamically between HNSW traversal and payload-index-based retrieval depending on estimated filter cardinality—see [Payload indexing](#filtering-with-the-payload-index) below.

## Filtering mechanics: conditions and clauses

### Clauses

Clauses determine how multiple conditions are combined:

| Clause | Behaviour | SQL analogue |
|---|---|---|
| `must` | All conditions must match | `AND` |
| `should` | At least one condition must match | `OR` |
| `must_not` | No conditions may match | `NOT` |
| Clause combination | Combines multiple clauses | `AND` between clause groups |

### Conditions

| Condition | Description |
|---|---|
| `match` | Exact value match on a keyword or integer field |
| `match_any` | Matches any value in a provided list |
| `match_except` | Excludes specific values |
| `range` | Numeric or datetime range |
| `datetime_range` | Explicit datetime range with timezone support |
| `geo_bounding_box` / `geo_radius` / `geo_polygon` | Geospatial conditions |
| `full_text` | Tokenised text search within a field |
| `nested` | Evaluates conditions per element of an object array |
| `is_empty` | Matches points where a field is absent or an empty array |
| `is_null` | Matches points where a field is `null` |
| `has_id` | Matches specific point IDs |
| `values_count` | Matches on the number of elements in an array field |

For the complete reference, see the [filtering documentation](/documentation/search/filtering/).

## Basic filtering example

Five laptops with price and category payloads:

```python
laptops = [
    (1, [0.1, 0.2, 0.3, 0.4], {"price": 899.99, "category": "laptop"}),
    (2, [0.2, 0.3, 0.4, 0.5], {"price": 1299.99, "category": "laptop"}),
    (3, [0.3, 0.4, 0.5, 0.6], {"price": 799.99, "category": "laptop"}),
    (4, [0.4, 0.5, 0.6, 0.7], {"price": 1099.99, "category": "laptop"}),
    (5, [0.5, 0.6, 0.7, 0.8], {"price": 949.99, "category": "laptop"})
]
```

Applying a `price <= 1000` filter returns only points 1, 3, and 5, ranked by similarity to the query vector:

```json
[
  { "id": 3, "score": 0.9978, "payload": { "price": 799.99, "category": "laptop" } },
  { "id": 1, "score": 0.9938, "payload": { "price": 899.99, "category": "laptop" } },
  { "id": 5, "score": 0.9903, "payload": { "price": 949.99, "category": "laptop" } }
]
```

Points 2 and 4 are excluded by the predicate before similarity ranking; they never appear in results regardless of their vector proximity to the query.

> **Note on float filters:** Filtering on float fields with exact `match` conditions is unreliable due to floating-point representation. Use `range` with equal `gte` and `lte` bounds to match a specific value, which tolerates minor representation differences.

## Nested object filtering

Payload fields can contain arrays of objects. Consider two points representing dinosaurs with dietary preferences:

```json
[
  {
    "id": 1,
    "dinosaur": "t-rex",
    "diet": [
      { "food": "leaves", "likes": false },
      { "food": "meat",   "likes": true  }
    ]
  },
  {
    "id": 2,
    "dinosaur": "diplodocus",
    "diet": [
      { "food": "leaves", "likes": true  },
      { "food": "meat",   "likes": false }
    ]
  }
]
```

### Flat array conditions

Using `diet[].food` and `diet[].likes` as top-level conditions evaluates each condition independently across all elements:

```http
POST /collections/dinosaurs/points/scroll
{
  "filter": {
    "must": [
      { "key": "diet[].food",  "match": { "value": "meat" } },
      { "key": "diet[].likes", "match": { "value": true   } }
    ]
  }
}
```

Both points match: `t-rex` satisfies `food=meat` on element 1 and `likes=true` on element 1. `diplodocus` satisfies `food=meat` on element 1 and `likes=true` on element 0. The conditions are not scoped to the same array element.

### Nested object filter

To evaluate both conditions against the same array element, use the `nested` condition type:

```http
POST /collections/dinosaurs/points/scroll
{
  "filter": {
    "must": [{
      "nested": {
        "key": "diet",
        "filter": {
          "must": [
            { "key": "food",  "match": { "value": "meat" } },
            { "key": "likes", "match": { "value": true   } }
          ]
        }
      }
    }]
  }
}
```

```python
client.scroll(
    collection_name="dinosaurs",
    scroll_filter=models.Filter(
        must=[
            models.NestedCondition(
                nested=models.Nested(
                    key="diet",
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(key="food",  match=models.MatchValue(value="meat")),
                            models.FieldCondition(key="likes", match=models.MatchValue(value=True)),
                        ]
                    ),
                )
            )
        ],
    ),
)
```

This returns only `t-rex` (id: 1), because `diplodocus` has no single `diet` element where both `food=meat` and `likes=true` hold simultaneously.

The nested filter evaluates conditions at the element level. A document matches if at least one array element satisfies all nested conditions.

## Scrolling vs. searching

`search` and `query` return points ranked by similarity to a query vector. `scroll` returns points matching a filter without ranking—useful when you need a list of qualifying points rather than a similarity-ordered result.

To retrieve all laptops ordered by price ascending:

```http
POST /collections/online_store/points/scroll
{
  "filter": {
    "must": [
      { "key": "category", "match": { "value": "laptop" } }
    ]
  },
  "limit": 10,
  "with_payload": true,
  "with_vector": false,
  "order_by": [{ "key": "price" }]
}
```

`scroll` returns a batch of results and a cursor for the next page, keeping memory consumption bounded for large collections.

Filter conditions apply identically in `scroll` and `search`—the same clauses, conditions, and nested structures work in both endpoints.

## Filtering with the payload index

### Why the payload index matters

By default, Qdrant stores payloads alongside vector data. Without an index, filtered queries require a full scan of payload values to evaluate conditions—expensive at scale and incompatible with accurate cardinality estimation.

A payload index is a secondary data structure that maps field values to the point IDs that carry them:

```
Payload index on "category" (keyword):
+-----------+----------+
| category  | ids      |
+-----------+----------+
| laptop    | 1, 4, 7  |
| desktop   | 2, 5, 9  |
| speakers  | 3, 6, 8  |
+-----------+----------+
```

With this structure, the query planner can resolve a `category = "laptop"` filter in O(1) lookups rather than a full scan.

**Figure 4:** The payload index (green) allows the query planner to resolve filter predicates efficiently before or during HNSW traversal (red).

![payload-index-vector-search](/articles_data/vector-search-filtering/payload-index-vector-search.png)

### Creating a payload index

```http
PUT /collections/computers/index
{
  "field_name": "category",
  "field_schema": "keyword"
}
```

```python
client.create_payload_index(
    collection_name="computers",
    field_name="category",
    field_schema="keyword",
)
```

Index every field you filter by. There is no meaningful cost to creating additional indexes; the benefit is consistent.

### How the query planner uses cardinality

Filter cardinality is the number of points that satisfy a given predicate. The query planner estimates cardinality using the payload index before selecting an execution strategy:

- **High cardinality** (filter matches a large fraction of points) → HNSW traversal with filterable links.
- **Low cardinality** (filter is highly selective) → payload index scan, bypassing HNSW entirely. This is cheaper and faster when the qualifying set is small.

The default full-scan threshold is 10 kilobytes. Without a payload index, cardinality estimation is unavailable and the planner may select a suboptimal strategy, producing slow queries or degraded accuracy.

### Available index types

| Index type | Use case |
|---|---|
| Keyword / Integer / Float | Exact match and range conditions on scalar fields |
| [Full-text index](/documentation/manage-data/indexing/#full-text-index) | Tokenised search within text fields |
| [Tenant index](/documentation/manage-data/indexing/#tenant-index) | Data locality in multitenant collections |
| [Principal index](/documentation/manage-data/indexing/#principal-index) | Primary entity isolation (users, accounts) |
| [On-disk index](/documentation/manage-data/indexing/#on-disk-payload-index) | Large indexes that exceed available RAM |
| [Parameterized index](/documentation/manage-data/indexing/#parameterized-index) | Dynamic queries on numeric fields with varying parameters |

### Multitenant deployments

A common mistake is creating one Qdrant collection per tenant. Each collection maintains its own HNSW graph and index structures; at scale, this exhausts memory and degrades cluster performance.

The correct approach is a single collection with a tenant index:

```http
PUT /collections/{collection_name}/index
{
  "field_name": "user_id",
  "field_schema": {
    "type": "keyword",
    "is_tenant": true
  }
}
```

The `is_tenant` flag tells Qdrant to physically co-locate points from the same tenant in storage, reducing the I/O cost of tenant-scoped queries. All standard filter conditions work as expected within a tenant-filtered query.

For a full guide, see [tenant defragmentation](/documentation/manage-data/indexing/?q=tenant#tenant-index).

## Filters beyond search

Filter conditions are not limited to `search` and `scroll`. They apply to any point-level operation:

| Operation | Effect |
|---|---|
| [Delete points](/documentation/manage-data/points/#delete-points) | Deletes all points matching the filter |
| [Count points](/documentation/manage-data/points/#counting-points) | Returns the count of matching points |
| [Set payload](/documentation/manage-data/payload/#set-payload) | Adds payload fields to all matching points |
| [Update payload](/documentation/manage-data/payload/#overwrite-payload) | Overwrites payload fields on all matching points |
| [Delete payload](/documentation/manage-data/payload/#delete-payload-keys) | Removes payload keys from all matching points |
| [Order points](/documentation/manage-data/points/#order-points-by-payload-key) | Lists matching points sorted by a payload field |

This allows bulk operations on subsets of a collection without enumerating individual point IDs.

## Pagination considerations

When paginating filtered results, a single point can appear multiple times if it carries multiple values for the same indexed field (e.g. a product available in multiple colours). This is expected behaviour: each (point, value) pair is a separate index entry.

To implement offset-based pagination, track the last-seen point ID and use it as an exclusion filter on the next page. Alternatively, use the `scroll` API's cursor-based pagination, which handles this consistently.

A payload index on the field used for pagination is mandatory for acceptable performance at scale—without it, each page requires a full scan.

## Key practices

- Index every payload field you filter by. Do this at collection setup, before data ingestion at scale.
- Prefer `range` over `match` for float fields.
- Do not create one collection per tenant. Use a tenant index within a single collection.
- Use `scroll` when you need a list of qualifying points without a query vector. Use `search` or `query` when similarity ranking matters.
- For nested object arrays, use the `nested` condition type when all sub-conditions must apply to the same array element.

For the full reference on filtering conditions and clauses, see the [filtering documentation](/documentation/search/filtering/).

## Real-world use cases

| Use case | Vector search role | Filtering role |
|---|---|---|
| [E-commerce product search](/advanced-search/) | Semantic similarity to query | Price, brand, size, colour, rating |
| [Recommendation systems](/recommendations/) | Similarity to user history | Release date, genre, content rating |
| [Geospatial search](/articles/geo-polygon-filter-gsoc/) | Similarity to driver or partner profile | Distance radius, vehicle type, rating |
| [Fraud detection](/data-analysis-anomaly-detection/) | Similarity to known fraud patterns | Transaction amount, time window, location |

Filtering is most powerful when it narrows the qualifying set to a semantically coherent subset. The vector search then ranks within that subset by similarity—producing results that satisfy both the predicate and the query intent.

---

**Try filtering in a live cluster.** Qdrant's interactive [cloud quickstart](/documentation/cloud-quickstart/) includes a step-by-step tutorial covering cluster creation, data insertion, and filtered queries. All code samples in this guide run directly in the Qdrant dashboard.

[![qdrant-hybrid-cloud](/docs/homepage/cloud-cta.png)](https://qdrant.to/cloud)
