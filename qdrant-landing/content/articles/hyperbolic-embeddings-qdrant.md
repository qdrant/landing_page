---
title: "Hyperbolic Embeddings in Qdrant"
short_description: "Why hierarchical data suits a curved space, and what that buys you."
description: "Why hierarchical data suits hyperbolic embeddings, and how to search them with Qdrant."
preview_dir: /articles_data/hyperbolic-embeddings-qdrant/preview
social_preview_image: /articles_data/hyperbolic-embeddings-qdrant/preview/social_preview.jpg
weight: -220
author: Matin Mahmood
author_link: https://github.com/mnm-matin
date: 2026-09-08T00:00:00+00:00
draft: true
keywords:
  - hyperbolic embeddings
  - poincare ball
  - hierarchical data
category: embedding-research
---

We choose embedding models, dimensions, and indexes. The geometry usually comes with the package. But why use a flat space, and what else could we choose?

This article covers:

- What is a manifold?
- Why use hyperbolic embeddings for hierarchical data?
- How can we search hyperbolic embeddings with Qdrant?
- A practical example with WordNet and Qdrant.

## What is a manifold, and where do our vectors live?

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

## Hierarchical data meets hyperbolic embeddings

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

The same branching structure appears in biological taxonomies, document hierarchies, and part–whole relationships. Hyperbolic embeddings give these hierarchies room to grow.

## Superpowers of hyperbolic embeddings

Matching the geometry to the data can make an embedding more compact and give its coordinates more meaning. Two useful examples are dimensional efficiency and radius as a measure of specificity.

### Dimensional efficiency

When the geometry matches the data, you can often represent the same structure with fewer dimensions.

WordNet gives a concrete example. Its noun hierarchy contains relationships such as `poodle → dog → animal`. We can compare how well Euclidean and hyperbolic embeddings reconstruct those relationships at different dimensions. [[1]](#references)

![WordNet reconstruction quality for Euclidean and Poincaré embeddings across six embedding dimensions](/articles_data/hyperbolic-embeddings-qdrant/wordnet-dimensions.png)

*WordNet reconstruction, measured by mean average precision (higher is better). Results from Table 1. [[1]](#references)*

Five-dimensional Poincaré embeddings achieved **0.823**, compared with **0.168** for 200-dimensional Euclidean embeddings. That is 40 times fewer coordinates and better reconstruction on this task.

Fewer coordinates mean fewer values to store and move through a retrieval system. Before reaching for a larger vector, it is worth asking whether a different geometry would fit the data better.

### Radius can encode specificity

One of the nicest properties of a hierarchy-aware hyperbolic embedding is that radius can start to mean something.

Closer to the center, you can place broad concepts. Farther out, you can place more specific descendants. Direction separates branches; radius helps organize depth.

For a catalog, “footwear” covers many possible items. “Boots” narrows that set. “Red leather ankle boots” narrows it further. A representation that captures this structure has room for both semantic similarity and different levels of detail.

Hyper3-CLIP, a hyperbolic image and text embedding model from hyper³labs, brings this idea to visual retrieval. It is trained to capture general-to-specific relationships alongside similarity. This gives radius a role in organizing broad descriptions and specific visual content. [[2]](#references)

Consider the black Chelsea boot below. A traversal toward the origin illustrates a move from the specific product to broader concepts: black Chelsea boots, Chelsea boots, boots, and footwear.

![Conceptual inward traversal with progressively broader product examples beside each level](/articles_data/hyperbolic-embeddings-qdrant/radius-traversal-products.png)

*Conceptual traversal inspired by a catalog product from Amazon Berkeley Objects. Product imagery is AI-illustrated; descriptions and positions are illustrative, not model retrieval results. [[6]](#references)*

We can also look at how the model organizes product images. Below are conventional CLIP and Hyper3-CLIP embeddings of the same catalog subset.

![Conventional and hyperbolic CLIP scatter plots of the same 165 product images](/articles_data/hyperbolic-embeddings-qdrant/clip-hyper3-scatter.png)

*The same 165 Amazon Berkeley Objects product images in six categories, shown through Euclidean and Poincaré UMAP projections. Colors identify product types. These projections illustrate neighborhoods; they do not measure specificity or establish retrieval quality.*

*John: a few suggested sections based on your Discord update. Feel free to rename, combine, or structure them however you think works best.*

## Testing hyperbolic embeddings

- Your WordNet reproduction and move to a real product taxonomy.
- Flat and hyperbolic embeddings across dimensions, with fair tuning and a production text embedding baseline.
- What the results show about where hyperbolic embeddings help and where they fall short.

## Serving them with Qdrant

- The exact dot-product transform and the difficulties you encountered when indexing it.
- The fixes you tried and why `acosh` rescoring worked best in your tests.

## Exploring the results

- Your [live Qdrant viewer](https://qdrant-geometry-viewer.vercel.app/), embedded in the article.
- A short example showing the results and actual distances coming from Qdrant.

## References

1. Nickel, M. and Kiela, D. (2017). [Poincaré Embeddings for Learning Hierarchical Representations](https://arxiv.org/abs/1705.08039). WordNet reconstruction results: Table 1.
2. Mahmood, M. et al. (2026). [Hyper3-CLIP: Hierarchy-Conditioned Hyperbolic Vision-Language Training](https://arxiv.org/abs/2608.29313).
3. Desai, K. et al. (2023). [Hyperbolic Image-Text Representations (MERU)](https://arxiv.org/abs/2304.09172).
4. Qdrant. [Add `acosh` expression to Formula Query](https://github.com/qdrant/qdrant/pull/10231).
5. Qdrant. [Hybrid Queries and Formula Query](https://qdrant.tech/documentation/search/hybrid-queries/).

6. Amazon Berkeley Objects. [Product image](https://amazon-berkeley-objects.s3.amazonaws.com/images/small/ff/ffb123bf.jpg), item `B06XCPVVPS`, image `71KwV3JHT9L`.
