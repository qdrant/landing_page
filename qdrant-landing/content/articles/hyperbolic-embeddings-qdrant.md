---
title: "Hyperbolic Embeddings in Qdrant"
short_description: "Hierarchies branch exponentially and flat space does not. Matching the geometry cut 384 dimensions to 5, and then broke the index."
description: "Why hierarchical data suits hyperbolic embeddings, and how to serve the exact geodesic in Qdrant with acosh."
preview_dir: /articles_data/hyperbolic-embeddings-qdrant/preview
social_preview_image: /articles_data/hyperbolic-embeddings-qdrant/preview/social_preview.jpg
weight: -220
author: Matin Mahmood, John Kupchanko
author_link: https://hyper3labs.com
date: 2026-09-08T00:00:00+00:00
draft: true
keywords:
  - hyperbolic embeddings
  - poincare ball
  - hierarchical data
  - formula query
  - geodesic distance
category: embedding-research
---

We choose embedding models, dimensions, and indexes. The geometry usually comes with the package. But why use a flat space, and what else could we choose?

This article covers:

- What is a manifold?
- Why use hyperbolic embeddings for hierarchical data?
- How can we search hyperbolic embeddings with Qdrant?
- A practical example with WordNet and Qdrant.

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

The same branching structure appears in biological taxonomies, document hierarchies, and part to whole relationships. Hyperbolic embeddings give these hierarchies room to grow.

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

For a catalog, "footwear" covers many possible items. "Boots" narrows that set. "Red leather ankle boots" narrows it further. A representation that captures this structure has room for both semantic similarity and different levels of detail.

Hyper3-CLIP, a hyperbolic image and text embedding model from hyper³labs, brings this idea to visual retrieval. It is trained to capture general-to-specific relationships alongside similarity. This gives radius a role in organizing broad descriptions and specific visual content. [[2]](#references)

Consider the black Chelsea boot below. A traversal toward the origin illustrates a move from the specific product to broader concepts: black Chelsea boots, Chelsea boots, boots, and footwear.

![Conceptual inward traversal with progressively broader product examples beside each level](/articles_data/hyperbolic-embeddings-qdrant/radius-traversal-products.png)

*Conceptual traversal inspired by a catalog product from Amazon Berkeley Objects. Product imagery is AI-illustrated; descriptions and positions are illustrative, not model retrieval results. [[6]](#references)*

We can also look at how the model organizes product images. Below are conventional CLIP and Hyper3-CLIP embeddings of the same catalog subset.

![Conventional and hyperbolic CLIP scatter plots of the same 165 product images](/articles_data/hyperbolic-embeddings-qdrant/clip-hyper3-scatter.png)

*The same 165 Amazon Berkeley Objects product images in six categories, shown through Euclidean and Poincaré UMAP projections. Colors identify product types. These projections illustrate neighborhoods; they do not measure specificity or establish retrieval quality.*

## Testing Hyperbolic Embeddings

The WordNet result above is the published one, so we started by reproducing it. Our mammal-subtree run reached 0.949 mean average precision at 5 dimensions against 0.231 for a Euclidean embedding trained the same way, which lines up with the paper. That told us the setup was sound.

Then we stopped using WordNet. It is a lexical database built by linguists, so semantic similarity and hierarchical position already agree with each other. That flatters a geometry whose whole claim is about hierarchy.

We rebuilt everything on the [Google Product Taxonomy](https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt) instead: 5,595 real e-commerce categories, 7 levels deep, averaging 6.4 children per node, with 27% of the tree branching 8 or wider. Nothing about it was designed to suit hyperbolic space.

We measured that shape before training anything, because the geometry argument only predicts a gain where the tree actually fans out. This one does.

### Keeping the Comparison Fair

Both geometries train on the same edges, with the same loss, sampler, epoch budget, batch size and seed. Three things differ: the distance function, the gradient rule, and the projection back inside the ball.

We swept the learning rate over `{0.3, 1, 3, 10, 30, 100}` separately for each geometry, on this dataset. Both peaked at 10. That step mattered more than we expected: our first run reused the value tuned on WordNet, which understated hyperbolic by 0.18 MAP. A hyperparameter that travels between datasets is worth re-checking.

### Dimensions Needed to Hold the Hierarchy

| Dimensions | Flat | Hyperbolic |
| --- | --- | --- |
| 2 | 0.140 | 0.501 |
| 5 | 0.239 | 0.905 |
| 10 | 0.354 | 0.925 |
| 20 | 0.551 | 0.932 |
| 50 | 0.658 | 0.934 |

Hyperbolic stops improving at 5 dimensions. Ten times more buys it 0.03. Flat is still climbing at 50 and never arrives, so hyperbolic at 5 dimensions beats flat at 50 on the same tree.

### Against an Embedding You Would Actually Ship

Our own flat baseline could be accused of being handicapped, so we added a third opponent that nobody tuned: `BAAI/bge-small-en-v1.5` through [FastEmbed](/documentation/fastembed/), at 384 dimensions.

We ran it twice. Once on the category name alone, which is what you have in production. Once with the full path written into the string, which hands the model the hierarchy in plain English.

| Representation | Dimensions | MAP |
| --- | --- | --- |
| Hyperbolic | 5 | 0.905 |
| BGE-small, full path in the text | 384 | 0.308 |
| BGE-small, name only | 384 | 0.115 |

Seventy-seven times fewer numbers, and eight times the score. The middle row is the more interesting one: writing the hierarchy into the text still only reaches 0.308. A text encoder does not pick up hierarchy even when you tell it what the hierarchy is.

### Why It Wins

Splitting ancestor recall by how many siblings a category has explains the rest of the table.

| Siblings per node | 1 to 2 | 3 to 7 | 8 to 20 | 21+ |
| --- | --- | --- | --- | --- |
| Hyperbolic 5d | 0.932 | 0.909 | 0.901 | 0.944 |
| Flat 5d | 0.494 | 0.440 | 0.368 | 0.195 |
| Flat 50d | 0.593 | 0.543 | 0.458 | 0.464 |
| Text 384d | 0.320 | 0.247 | 0.182 | 0.134 |

Everything else degrades as the tree widens. Flat at 5 dimensions loses more than half, and the text embedding falls from 0.32 to 0.13. Hyperbolic holds the same score whether a category has two siblings or fifty. Branching is what breaks flat space, and branching is the one thing hyperbolic ignores.

### Where It Loses

Ask for the single direct parent rather than the whole ancestor set, and flat wins from 10 dimensions up.

| Dimensions | Flat | Hyperbolic |
| --- | --- | --- |
| 5 | 0.457 | 0.539 |
| 10 | 0.627 | 0.532 |
| 20 | 0.806 | 0.540 |
| 50 | 0.855 | 0.541 |

Hyperbolic keeps the whole family line close together, so the true parent sits in the top ten 96% to 99% of the time but rarely first. The same thing happened on WordNet, so this is a property of the representation rather than of this dataset. Hyperbolic answers "what kind of thing is this". Flat answers "what sits directly above this". Pick the geometry that matches the query you actually run.

## Serving Them With Qdrant

Qdrant supports cosine, dot product, Euclidean and Manhattan. None of those is a geodesic, so the first question was whether hyperbolic ranking can be expressed in terms of something an index already understands.

It can, exactly. For a fixed query, ranking by geodesic distance means ranking by $\|u-v\|^2 / (1-\|v\|^2)$, and with $a = 1/(1-\|v\|^2)$ that expands into an inner product:

$$
\frac{\|u-v\|^2}{1-\|v\|^2} = \big\langle (\|u\|^2,\; u,\; 1),\; (a,\; -2a v,\; a\|v\|^2) \big\rangle .
$$

So hyperbolic nearest-neighbor search is maximum-inner-product search in $d+2$ dimensions. We checked it numerically across 2, 5, 10 and 50 dimensions with points out to $\|v\| = 0.99999$: rank correlation 1.000000, perfect top-50 agreement. No new distance function required.

### The Transform Is Exact and You Should Not Ship It

Brute force over the lifted vectors scored 0.984 recall@10 against exact geodesic ground truth on our 82,115-node WordNet run. The same vectors behind HNSW scored **0.020**.

The reason is in the transform. As $\|v\| \to 1$, the factor $a = 1/(1-\|v\|^2)$ grows without bound, so deep nodes end up with enormous lifted vectors. On that embedding the norms spanned 604 times; on the product taxonomy at the learning rate that maximized MAP, 14,400 times. Under inner product a high-norm vector beats its neighbors from anywhere in the space, which is what a proximity graph relies on not happening. Inner product is not a metric, and HNSW navigation assumes one.

We tried two repairs.

Partitioning the vectors into 16 buckets by norm and searching one graph per bucket recovered recall to 0.767. A control with random buckets of identical size reached only 0.145 at the same settings, which confirmed the norm ordering was doing the work rather than the smaller graphs.

Clipping the norms reached 0.638, and clipped brute force showed why it cannot do better: clip hard enough to help the index and you have already discarded the ranking.

Both worked. Both lost to the boring option.

### What Actually Works

An ordinary Euclidean index over the untransformed Poincaré vectors, fetching a shallow candidate set and rescoring it with the exact geodesic, reached 0.868 recall@10 at a fetch depth of 10. One index, no new machinery, and it is the pattern the `acosh` request was filed to support. [[4]](#references)

Because the Euclidean prefetch already computes $\|u-v\|$, the formula needs only that score and one payload field:

```json
{
  "prefetch": { "query": [...], "using": "hyperbolic", "limit": 100 },
  "query": {
    "formula": {
      "neg": {
        "acosh": {
          "sum": [
            1.0,
            { "div": {
                "left":  { "mult": [2.0, { "pow": { "base": "$score", "exponent": 2.0 } }] },
                "right": { "mult": [ONE_MINUS_QUERY_SQNORM,
                                    { "sum": [1.0, { "neg": "sq_norm" }] }] }
            }}
          ]
        }
      }
    }
  }
}
```

Store $\|v\|^2$ as `sq_norm` on each point and Qdrant returns the true geodesic, server side, in one request.

Two things we got wrong on the way there are worth passing on.

We first tried to avoid the prefetch score entirely by keeping the 5 coordinates in the payload and expanding $\|u-v\|^2 = \|u\|^2 - 2\sum u_i h_i + \|v\|^2$ inside the formula. It is algebraically correct and it does not survive contact with real data. Near the ball boundary all three terms sit around 0.9999, the cancellation destroys the result, and our first live query returned `sqrt(-0.364)`. Using `$score` avoids the subtraction altogether.

And `acosh` is merged but not yet in Qdrant Cloud, so today the working path is the hand-expansion `ln(x + sqrt(x^2 - 1))`. That expansion is exactly what loses precision as the argument approaches 1, which is the near-neighbor case, and it is the reason a native operator is worth having.

### Two Vectors, One Query

Neither geometry wins outright on a real catalog, because a real query is partly semantic and partly structural. Qdrant stores multiple named vectors per point, so you can keep both: the 384-dimension text embedding and a 5-dimension hyperbolic one.

Prefetch on meaning, rescore on structure.

| Pipeline | Mean hops | Within 3 hops | Semantic retained |
| --- | --- | --- | --- |
| Text only | 44.0 | 0.347 | 0.795 |
| Hybrid | 15.2 | 0.599 | 0.752 |
| Hyperbolic only | 6.5 | 0.713 | 0.655 |

The hybrid picks up 69% of the available structural gain for about 5% of the semantic relevance. Hyperbolic alone is structurally better and gives up 17%, so the blend is the one worth shipping. Prefetch depth is the dial, and 100 was the knee in our tests: deeper doubled the latency while mean hops stopped improving.

The structural vector costs 20 bytes per point.

### The Setting That Wins the Benchmark Is the Worst One to Serve

One result surprised us enough to state on its own.

| Learning rate | MAP | Norm spread | Recall at prefetch 50 |
| --- | --- | --- | --- |
| 1 | 0.301 | 139x | 0.965 |
| 3 | 0.724 | 2,010x | 0.789 |
| 10 | 0.905 | 14,400x | 0.498 |
| 30 | 0.762 | 6,700x | 0.383 |

A higher learning rate pushes points harder toward the ball boundary. That is what makes the hierarchy reconstruct well, and it is also where $1/(1-\|v\|^2)$ explodes, which is what wrecks prefetch. Dropping from 10 to 3 costs 20% of embedding quality and buys roughly three times cheaper retrieval.

We only noticed because we trained the embedding and then had to serve it. A geometry paper tunes for MAP and stops; a database benchmark starts from vectors someone else produced. If you are building on hyperbolic embeddings, tune for retrieval rather than for reconstruction.

## Exploring the Results

The viewer below runs against a live Qdrant collection holding all 5,595 categories with both named vectors. Pick a category and its chain of parent categories is drawn in all three panels. Every distance in the table is the engine's own answer, computed with the formula above.

<p align="center"><iframe src="https://qdrant-geometry-viewer.vercel.app" width="100%" height="1180" style="border:0" loading="lazy" title="Three geometries, one taxonomy"></iframe></p>

Try `Wheelbarrows`. The hyperbolic panel walks up the tree to Gardening Tools, Gardening, and Lawn & Garden. The text embedding returns Wheelbarrow Parts, then Bicycle Wheel Rims and Basketball Rims, because "wheel" and "rim" are the words it has to go on. Both answers are reasonable given what each space encodes, and only one of them is the category you were looking for.

### What This Does Not Prove

Reconstruction trains and scores on the same edges, so it measures whether 5 dimensions can hold this structure. It says nothing about predicting an edge the model never saw, and we have not run held-out link prediction yet.

The comparison between an ordinary index and a graph that navigates by geodesic distance used our own implementation of HNSW at Qdrant's defaults, because no vector search engine exposes a custom comparator. It is not a measurement of Qdrant's own index.

Semantic relevance in the hybrid table is the mean text-embedding similarity of the returned set, not a human judgment.

And every number here comes from one taxonomy. The branch-width table is the part we would expect to generalize, because it explains the mechanism rather than reporting an outcome.

Which also says where this stops working. On a shallow or narrow hierarchy, flat space is fine: at a branching factor of two our synthetic trees put flat within 0.08 MAP of hyperbolic, so the geometry buys almost nothing and costs you a training pipeline. Measure your branching factor before changing anything. If most of your tree sits at two or three children per node, spend the effort somewhere else.

## References

1. Nickel, M. and Kiela, D. (2017). [Poincaré Embeddings for Learning Hierarchical Representations](https://arxiv.org/abs/1705.08039). WordNet reconstruction results: Table 1.
2. Mahmood, M. et al. (2026). [Hyper3-CLIP: Hierarchy-Conditioned Hyperbolic Vision-Language Training](https://arxiv.org/abs/2608.29313).
3. Desai, K. et al. (2023). [Hyperbolic Image-Text Representations (MERU)](https://arxiv.org/abs/2304.09172).
4. Qdrant. [Add `acosh` expression to Formula Query](https://github.com/qdrant/qdrant/pull/10231).
5. Qdrant. [Hybrid Queries and Formula Query](/documentation/search/hybrid-queries/).
6. Google. [Product Taxonomy](https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt), version 2021-09-21. 5,595 categories.
7. Malkov, Y. and Yashunin, D. (2018). [Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs](https://arxiv.org/abs/1603.09320).

8. Amazon Berkeley Objects. [Product image](https://amazon-berkeley-objects.s3.amazonaws.com/images/small/ff/ffb123bf.jpg), item `B06XCPVVPS`, image `71KwV3JHT9L`.
