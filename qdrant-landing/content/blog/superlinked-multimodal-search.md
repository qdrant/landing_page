---
title: "Building a Hotel Search App with Superlinked's Multimodal Vector Embeddings"
draft: false
short_description: "Transform hotel search with multi-modal vector embeddings, combining text, price, ratings, and amenities for intelligent results."
description: "Discover how multimodal vector search revolutionizes hotel discovery by understanding complex queries with text, numerical, and categorical data."
preview_image: /blog/superlinked-multimodal-search/social_preview.png
social_preview_image: /blog/superlinked-multimodal-search/social_preview.png
date: 2025-04-03T00:00:00-08:00
author: Filip Makraduli, David Myriel
featured: true
tags:
  - vector search
  - vector database
  - multi-modal search
  - semantic search
  - hybrid search
  - machine learning
  - AI
  - search engine
  - technology
  - innovation
---

The proliferation of AI has changed how people use search for products, services or education. The general public is getting used to expressing their desires in **natural language**, and they are still expecting to receive precise and tailored results. 

Let's say you are trying to book a hotel in Paris, and you have some very basic criteria:

![superlinked-search](/blog/superlinked-multimodal-search/superlinked-search.png)

*"Affordable luxury hotels near Eiffel Tower with lots of good reviews and free parking."* isn't just a search query. Behind the scenes - it is a complex set of interrelated preferences spanning multiple data types.

> In this blog, we'll show you how we built [**The Hotel Search Demo**](https://hotel-search-recipe.superlinked.io/). 

**Figure 1:** Vectors for this app are generated via Superlinked and stored in Qdrant.
![superlinked-hotel-search](/blog/superlinked-multimodal-search/superlinked-hotel-search.png)

What's really cool is that this demo breaks down your natural language query into very precise parameters. As you type in your question at the top, you can observe the query parameters change in the left sidebar.

In this blog, we'll show you how Qdrant and Superlinked can be used to combine **textual understanding**, **numerical reasoning**, and **categorical filtering** into a seamless search experience that modern users expect. 


## Core Components

FILIP PLEASE EXPLAIN THE APP ARCHITECTURE
- vectorization
- embedding model
- storing in a Qdrant collection
- structuring retrieval

![superlinked-architecture](/blog/superlinked-multimodal-search/superlinked-architecture.png)

### 1. Vector Spaces: The Building Blocks of Intelligent Search

At the heart of Superlinked's innovation are [**Spaces**](https://docs.superlinked.com/concepts/overview) - specialized vector embedding environments designed for different data types. Unlike conventional approaches that force all data into a single embedding format, these spaces respect the inherent characteristics of different data types.

In our demo, four distinct spaces work together: **Description**, **Rating**, **Price** and **Rating Count**. Here is how they are defined:

```python
# Text data is embedded using a specialized language model
description_space = sl.TextSimilaritySpace(
    text=hotel_schema.description,
    model=settings.text_embedder_name  # all-mpnet-base-v2
)

# Numerical data uses dedicated numerical embeddings with appropriate scaling
rating_space = sl.NumberSpace(
    hotel_schema.rating,
    min_value=0,
    max_value=10,
    mode=sl.Mode.MAXIMUM  # Linear scale for bounded ratings
)

price_space = sl.NumberSpace(
    hotel_schema.price,
    min_value=0,
    max_value=1000,
    mode=sl.Mode.MAXIMUM,
    scale=sl.LogarithmicScale()  # Log scale for prices that vary widely
)

rating_count_space = sl.NumberSpace(
    hotel_schema.rating_count,
    min_value=0,
    max_value=22500,
    mode=sl.Mode.MAXIMUM,
    scale=sl.LogarithmicScale()  # Log scale for wide-ranging review counts
)
```

What makes this powerful is that each space properly preserves the semantic relationships within its domain - all while allowing these different spaces to be combined into a cohesive search experience.

**Prices** are embedded to maintain their proportional relationships, **Text** embeddings capture semantic meanings, **Ratings** preserve their relative quality indicators, and the **Ratings Count** uses logarithmic scaling to properly weight the significance of review volume.

### 2. Multimodal Vector Search: The Full Picture

Traditional users see vector search as typically just text-based. Both Qdrant and Superlinked transcends this limitation by supporting a rich multimodal search environment where different data types collaborate rather than compete.

In our hotel demo, this means:

- **Text descriptions** are embedded using state-of-the-art language models that understand semantics
- **Prices use** logarithmic scaling to properly handle wide ranges of values
- **Ratings** are embedded linearly to preserve their quality indicators
- **Review counts** use logarithmic scaling to account for the diminishing returns of additional reviews

Unlike approaches that stringify all data into text before embedding (resulting in unpredictable non-monotonic relationships between numbers), or systems that maintain separate indices for different attributes, Superlinked creates a unified search space where multiple attributes can be considered simultaneously with appropriate semantic relationships preserved.

The declaration of this unified index is remarkably straightforward:

```python
index = sl.Index(
    spaces=[
        description_space,
        price_space,
        rating_space,
        rating_count_space,
    ],
    # Additional fields for hard filtering
    fields=[hotel_schema.city, hotel_schema.amenities, ...]
)
```

### 3. Intelligent Query Processing: From Natural Language to Results

The query processing system in Superlinked simplifies the way search queries are built and executed. This system allows users to interact using natural language, which is then converted into multi-dimensional vector operations, thereby moving away from rigid query structures.

The query construction in the hotel demo demonstrates this power:

```python
query = (
    sl.Query(
        index,
        weights={
            price_space: sl.Param("price_weight", description=price_description),
            rating_space: sl.Param("rating_weight", description=rating_description),
            # Additional space weights...
        },
    )
    .find(hotel_schema)
    .similar(description_space.text, sl.Param("description"))
    .filter(hotel_schema.city.in_(sl.Param("city")))
    # Additional filters...
    .with_natural_query(natural_query=sl.Param("natural_query"))
)
```
#### Breaking Down the Query

![superlinked-query](/blog/superlinked-multimodal-search/superlinked-query.svg)

This setup enables queries like *"Affordable luxury hotels near Eiffel Tower with lots of good reviews and free parking."* to be automatically translated into:

- A text similarity search for **"luxury"** and **"Eiffel Tower"** concepts
- Appropriate weighting for **"affordable" price** (lower range)
- Hard filtering for **"free parking"** as an amenity
- Search for **"lots" (rating count) + good reviews (rating)**

Unlike systems that rely on reranking after retrieval (which can miss relevant results if the initial retrieval is too restrictive) or metadata filters (which convert fuzzy preferences like "affordable" to rigid boundaries), this approach maintains the nuance of the search throughout the entire process.

### 4. Hybrid Search Reimagined: Solving the Modern Search Problem

Today's search landscape is dominated by discussions of hybrid search - the combination of keyword matching for precision with vector search for semantic understanding. The hotel search demo takes this concept further by implementing a multimodal hybrid search method that spans not just text retrieval methods but entire data domains.

In the hotel search demo, we see hybrid search reimagined across multiple dimensions:
- Text hybrid search: Combining exact matching (for city names, amenity keywords) with semantic similarity (for concepts like "luxury" or "family-friendly")
- Numerical hybrid search: Blending exact range filters (minimum/maximum price) with preference-based vector similarity (for concepts like "affordable" or "high-rated")
- Categorical hybrid search: Integrating hard categorical constraints (must be in Paris) with soft preferences (prefer hotels with specific amenities)

This multi-dimensional hybrid approach solves challenges facing conventional search systems:

1. Single-modal vector search fails when queries span multiple data types
2. Traditional hybrid search still separates keyword and vector components, which means they have to be weighed appropriately
3. Separate storage per attribute forces complex result reconciliation that loses semantic nuance
4. Pure filtering approaches convert preferences into binary decisions, missing the "strength" of preference
5. Re-ranking strategies may lead to weaker initial retrieval, especially with broad queries

This unified approach maintains the semantic relationships of all attributes in a multi-dimensional search space, where preferences become weights rather than filters, and where hard constraints and soft preferences seamlessly coexist in the same query.

The result is a search experience that feels intuitive and "just works" - whether users are looking for "pet-friendly boutique hotels with good reviews near the city center" or "affordable family suites with pool access in resort areas" - because the system understands both the semantics and the relationships between different attributes of what users are asking for.

> As search expectations continue to evolve, this multimodal and multidimensional hybrid search approach represents not just an incremental improvement but a fundamental rethinking of how search should work. 

The hotel search demo showcases this vision in action, a glimpse into a future where search understands not just the words we use, but the complex, nuanced preferences they represent.

## Hosting the Demo

FILIP - WE NEED TO SHOW PEOPLE HOW TO HOST IN YOUR REPO

![superlinked-localhost](/blog/superlinked-multimodal-search/superlinked-localhost.png)

## Watch the Video

As usual, we prepared a video recording of the talk, so you can watch it at your convenience:

<iframe width="560" height="315" src="https://www.youtube.com/embed/WIBtZa7mcCs?si=7PrL0B74kRZK_BFC" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Materials

- [Superlinked GitHub Repository](https://github.com/superlinked/superlinked)
- [Superlinked Documentation](https://docs.superlinked.com)
- [Qdrant Vector Database](https://qdrant.tech)
- [Qdrant Documentation](https://qdrant.tech/documentation)
- [Qdrant Cloud](https://cloud.qdrant.io)
- [Qdrant Discord Community](https://discord.gg/qdrant)