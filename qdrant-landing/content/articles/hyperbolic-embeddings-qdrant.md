---
title: "Hyperbolic Embeddings in Qdrant"
short_description: "Why hierarchical data suits a curved space, and what that buys you."
description: "Why hierarchical data suits hyperbolic embeddings, and how to search them with Qdrant."
preview_dir: /articles_data/hyperbolic-embeddings-qdrant/preview
social_preview_image: /articles_data/hyperbolic-embeddings-qdrant/preview/social_preview.jpg
weight: -220
author: Matin Mahmood and John Kupchanko
author_link: https://github.com/mnm-matin
date: 2026-09-08T00:00:00+00:00
draft: false
keywords:
  - hyperbolic embeddings
  - poincare ball
  - hierarchical data
category: embedding-research
---

We choose embedding models, dimensions, and indexes. The geometry usually comes with the package. But why use a flat space, and what else could we choose?

## What Is a Manifold, and Where Do Our Vectors Live?

A manifold is the space our embeddings live in. For embeddings, we care about the geometry we give that space. It determines how we measure distance, what the shortest path looks like, and how much room there is as we move outward.

![Euclidean plane, sphere, and Lorentz hyperboloid](/articles_data/hyperbolic-embeddings-qdrant/manifolds.png)

*Euclidean, spherical, and hyperbolic spaces. The hyperbolic space is shown using the Lorentz model.*

The embedding is still a vector. The geometry determines how we measure distance between vectors.

| Space | Geometry | A natural example |
| --- | --- | --- |
| Euclidean | Flat | Continuous positions and attributes |
| Spherical | Positively curved | Angular or periodic data |
| Hyperbolic | Negatively curved | Branching hierarchies |

Many familiar embedding models normalize their vectors onto a sphere and use cosine similarity. Hyperbolic embeddings use a different geometry, one that is particularly well suited to branching relationships.

## Hierarchical Data Meets Hyperbolic Embeddings

Imagine a product catalog. Footwear splits into boots, trainers, and sandals. Boots split into ankle boots, hiking boots, and work boots. Each type contains products, and each product can have several variants.

![A branching product catalog beside an exponential growth curve](/articles_data/hyperbolic-embeddings-qdrant/catalog-branching.png)

*A catalog with three children per node grows as $3^\ell$ at depth $\ell$.*

A tree multiplies. A flat disk only squares.

In $d$-dimensional Euclidean space, the volume within radius $r$ grows polynomially:

$$
V_E(r) \propto r^d.
$$

In two-dimensional hyperbolic space with curvature $-1$, the area is

$$
A_H(r)=2\pi(\cosh r-1),
$$

which grows exponentially for large $r$.

That is a much closer match to the growth of a branching tree. As a hierarchy gets deeper, hyperbolic space keeps creating room for its descendants. In a flat space, branches increasingly crowd together.

The same branching structure appears in biological taxonomies, document hierarchies, and part and whole relationships. Hyperbolic embeddings give these hierarchies room to grow.

## Superpowers of Hyperbolic Embeddings

Matching the geometry to the data can make an embedding more compact and give its coordinates more meaning. Two useful examples are dimensional efficiency and radius as a measure of specificity.

### Dimensional Efficiency

When the geometry matches the data, you can often represent the same structure with fewer dimensions.

WordNet gives a concrete example. Its noun hierarchy contains relationships such as `poodle → dog → animal`. We can compare how well Euclidean and hyperbolic embeddings reconstruct those relationships at different dimensions. [[1]](#references)

![WordNet reconstruction quality for Euclidean and Poincaré embeddings across six embedding dimensions](/articles_data/hyperbolic-embeddings-qdrant/wordnet-dimensions.png)

*WordNet reconstruction, measured by mean average precision (higher is better). Results from Table 1. [[1]](#references)*

Five-dimensional Poincaré embeddings achieved **0.823**, compared with **0.168** for 200-dimensional Euclidean embeddings. That is 40 times fewer coordinates and better reconstruction on this task.

Fewer coordinates mean fewer values to store and move through a retrieval system. Before reaching for a larger vector, it is worth asking whether a different geometry would fit the data better.

### Radius Can Encode Specificity

One of the nicest properties of a hierarchy-aware hyperbolic embedding is that radius can start to mean something.

Closer to the center, you can place broad concepts. Farther out, you can place more specific descendants. Direction separates branches; radius helps organize depth.

For a catalog, “footwear” covers many possible items. “Boots” narrows that set. “Red leather ankle boots” narrows it further. A representation that captures this structure has room for both semantic similarity and different levels of detail.

Hyper3-CLIP, a hyperbolic image and text embedding model from hyper³labs, brings this idea to visual retrieval. It is trained to capture general-to-specific relationships alongside similarity. This gives radius a role in organizing broad descriptions and specific visual content. [[2]](#references)

Consider the black Chelsea boot below. A traversal toward the origin illustrates a move from the specific product to broader concepts: black Chelsea boots, Chelsea boots, boots, and footwear.

![Conceptual inward traversal with progressively broader product examples beside each level](/articles_data/hyperbolic-embeddings-qdrant/radius-traversal-products.png)

*Conceptual traversal inspired by a catalog product from Amazon Berkeley Objects. Product imagery is AI-illustrated; descriptions and positions are illustrative, not model retrieval results. [[6]](#references)*

We can also look at how the model organizes product images. Below are conventional CLIP and Hyper3-CLIP embeddings of the same catalog subset.

![Conventional and hyperbolic CLIP scatter plots of the same 165 product images](/articles_data/hyperbolic-embeddings-qdrant/clip-hyper3-scatter.png)

*The same 165 Amazon Berkeley Objects product images in six categories, shown through UMAP projections of conventional CLIP and Hyper3-CLIP embeddings. Colors identify product types. These projections illustrate neighborhoods; they do not measure specificity or establish retrieval quality.*

## Testing Hyperbolic Embeddings

WordNet is useful for showing why hyperbolic embeddings work, but we also wanted to see what happens on something closer to a real application. So we tested the same idea on the Google Product Taxonomy: 5,595 categories, seven levels, and 17,312 relationships.

Both embeddings used the same data and optimizer. The main difference was the geometry.

We scored them with mean average precision (MAP), which asks how close each category's true parents land to the top of its results. Higher is better, and `1.000` would mean every parent came back first.

| Dimensions | Euclidean MAP | Poincaré MAP |
| ---------- | ------------: | -----------: |
| 2 | 0.140 | 0.501 |
| 5 | 0.239 | 0.905 |
| 10 | 0.354 | 0.925 |
| 20 | 0.551 | 0.932 |
| 50 | 0.658 | 0.934 |

At just 5 dimensions, the Poincaré embedding reaches `0.905 MAP`. The Euclidean version only reaches `0.658` at 50 dimensions, using ten times as many coordinates.

That is the part that matters. When the data really does branch like a tree, hyperbolic geometry can represent that structure much more efficiently.

There is one limitation. These numbers measure relationships the embedding already saw during training. When we asked it to find each category's direct parent instead, the score dropped to `0.539`.

So we would not treat this as a universal win. We would treat it as a strong reason to test hyperbolic embeddings when the data itself is hierarchical.

## Serving Them with Qdrant

Getting a good embedding was only half the problem. The next question was how to search it.

Hyperbolic distance can be converted into an inner product by adding two extra dimensions. Under brute force search in Faiss, that worked well. Across 82,115 WordNet nouns it found `0.986` of the correct nearest neighbors in its top 10, which we write as recall@10.

Then we put the same vectors behind HNSW. Recall dropped to `0.020`, even with `ef=1024`.

The conversion was still mathematically correct, but the resulting vectors had norms spread across roughly a 600x range. That made HNSW a poor fit for the ranking we actually wanted.

Grouping vectors by norm helped, but recall only reached `0.410`.

So instead of forcing the converted vectors into HNSW, we changed the search strategy.

The collection stores the Poincaré coordinates as an ordinary Euclidean vector, and keeps each point's squared norm in its payload:

```python
client.create_collection(
    "taxonomy_geometry",
    vectors_config={
        "hyperbolic": models.VectorParams(size=5, distance=models.Distance.EUCLID),
    },
)

client.create_payload_index(
    "taxonomy_geometry", "sq_norm",
    field_schema=models.PayloadSchemaType.FLOAT,
)
```

Without that payload index the rescore turns into a full scan.

Qdrant first uses Euclidean HNSW to pull a candidate set from the original Poincaré coordinates. Then a [Formula Query](/documentation/search/search-relevance/) rescores those candidates with the real hyperbolic distance in the same request.

The geodesic needs `acosh`, and Formula Query works with `ln` and `sqrt`. Since `acosh(x)` is `ln(x + sqrt(x^2 - 1))`, the distance is expressible as it stands. The inner term is:

```json
{
  "sum": [1.0, {"div": {
    "left":  {"mult": [2.0, {"pow": {"base": "$score", "exponent": 2.0}}]},
    "right": {"mult": [0.982, {"sum": [1.0, {"neg": "sq_norm"}]}]}
  }}]
}
```

`$score` is the Euclidean distance the prefetch already computed. `sq_norm` comes from the payload. `0.982` is one minus the squared norm of the query, which you calculate before sending. Call that term `x`, and the query is:

```json
{
  "prefetch": [{"query": [0.31, -0.72, 0.44, 0.09, -0.51],
                "using": "hyperbolic", "limit": 1000}],
  "query": {"formula": {"neg": {"ln": {"sum": [
    x, {"sqrt": {"sum": [{"pow": {"base": x, "exponent": 2.0}}, -1.0]}}
  ]}}}},
  "limit": 10
}
```

We tested this against a live Qdrant collection with all 5,595 taxonomy points.

| Prefetch | Euclidean Only | With Rescore |
| -------- | -------------: | -----------: |
| 10 | 0.266 | 0.257 |
| 50 | 0.266 | 0.472 |
| 100 | 0.266 | 0.598 |
| 300 | 0.266 | 0.783 |
| 1000 | 0.266 | 0.920 |

Euclidean HNSW alone finds about a quarter of the correct hyperbolic neighbors. With a prefetch of 1,000 and Formula Query rescoring, recall@10 reaches `0.920`. And the whole search stays inside Qdrant in one server side request.

The prefetch size matters. If the right neighbors never make it into the candidate set, rescoring cannot recover them.

There is one more tradeoff. As the embedding gets better, the prefetch usually needs to get wider.

Comparing two embeddings offline, the stronger one at `0.905 MAP` recovered `0.498` of the true neighbors from a prefetch of 50, while a weaker one at `0.724 MAP` recovered `0.789`. Those offline numbers sit a little above what the live index returns, because HNSW is approximate.

Better hyperbolic embeddings push more points toward the edge of the Poincaré ball, where Euclidean distance becomes a weaker shortcut. So if you improve the embedding, retest the retrieval settings too.

## Exploring the Results

To make the difference easier to see, we built a [live viewer](https://qdrant-geometry-viewer.vercel.app) against the same Qdrant collection.

![The Wheelbarrows category and its parent chain drawn in three panels: a hyperbolic Poincaré disk where the chain runs straight out from the center, a flat Euclidean layout where it collapses into one cluster, and a text embedding where it scatters](/articles_data/hyperbolic-embeddings-qdrant/viewer-three-panels.jpg)

*The same category and its parents, left to right: the hyperbolic Poincaré disk, the flat Euclidean embedding, and the text embedding. In the Poincaré disk the chain runs cleanly from the center to the rim. The other two have run out of room to keep the levels apart.*

Pick a category and it runs three searches, one per panel: the exact hyperbolic distance, Euclidean distance over the flat trained coordinates, and cosine similarity over a text embedding.

The distances shown in the viewer come directly from Qdrant. Nothing is recalculated in the browser.

We checked the same calculations outside Qdrant, and they matched within `4.7e-07`. So the viewer is showing the actual search behavior, not an approximation.

<!-- TODO: worked example, one live query with real distances -->

## Takeaways

If your data naturally forms a hierarchy, we would test a small hyperbolic embedding before automatically reaching for a much larger Euclidean one. On the product taxonomy, a 5 dimensional Poincaré embedding reached `0.905 MAP`. A 50 dimensional Euclidean embedding reached `0.658`.

The harder part is serving it. We would not convert the vectors and index them directly with HNSW. That worked under brute force search, but recall@10 dropped to `0.020` once HNSW was involved.

Instead, use HNSW to find candidates and let Qdrant rescore them with the real hyperbolic distance. On this collection, that moved recall@10 from `0.266` to `0.920` with a prefetch of 1,000.

You may also need to widen the prefetch as the embedding improves because Euclidean distance becomes less reliable near the edge of the Poincaré ball.

The main point is simple. If the data is hierarchical, Qdrant gives you a practical way to store the coordinates, use HNSW for candidate retrieval, and apply the real geometry during rescoring without adding a separate search system.

## References

1. Nickel, M. and Kiela, D. (2017). [Poincaré Embeddings for Learning Hierarchical Representations](https://arxiv.org/abs/1705.08039). WordNet reconstruction results: Table 1.
2. Mahmood, M. et al. (2026). [Hyper3-CLIP: Hierarchy-Conditioned Hyperbolic Vision-Language Training](https://arxiv.org/abs/2608.29313).
3. Desai, K. et al. (2023). [Hyperbolic Image-Text Representations (MERU)](https://arxiv.org/abs/2304.09172).
4. Qdrant. [Add `acosh` expression to Formula Query](https://github.com/qdrant/qdrant/pull/10231).
5. Qdrant. [Hybrid Queries and Formula Query](https://qdrant.tech/documentation/search/hybrid-queries/).

6. Amazon Berkeley Objects. [Product image](https://amazon-berkeley-objects.s3.amazonaws.com/images/small/ff/ffb123bf.jpg), item `B06XCPVVPS`, image `71KwV3JHT9L`.