---
title: "Beyond Multimodal Vectors: Hotel Search With Superlinked and Qdrant"
draft: false
short_description: "Combine Superlinked's multimodal embeddings with Qdrant's high-performance vector database for intelligent hotel search."
description: "Build a scalable & smart search experience with quality embeddings and fast retrieval."
preview_image: /blog/superlinked-multimodal-search/social_preview.png
social_preview_image: /blog/superlinked-multimodal-search/social_preview.png
date: 2025-04-24T00:00:00-08:00
author: Filip Makraduli, David Myriel
featured: false
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

## More Than Just Multimodal Search? 
AI has transformed how we find products, services, and content. Now users express needs in **natural language** and expect precise, tailored results.

For example, you might search for hotels in Paris with specific criteria:

![superlinked-search](/blog/superlinked-multimodal-search/superlinked-search.png)

*"Affordable luxury hotels near Eiffel Tower with lots of good reviews and free parking."* This isn't just a search query—it's a complex set of interrelated preferences spanning multiple data types.

> In this blog, we'll show you how we built [**The Hotel Search Demo**](https://hotel-search-recipe.superlinked.io/). 

**Figure 1:** Superlinked generates vectors of different modalities which are indexed and served by Qdrant for fast, accurate hotel search.
![superlinked-hotel-search](/blog/superlinked-multimodal-search/frontend.gif)

What makes this app particularly powerful is how it breaks down your natural language query into precise parameters. As you type your question at the top, you can observe the query parameters dynamically update in the left sidebar.

In this blog, we'll show you how Qdrant and Superlinked combine **textual understanding**, **numerical reasoning**, and **categorical filtering** to create a seamless search experience that meets modern user expectations.


## Core Components

**Figure 2:** In a typical search or RAG app, the embedding framework (Superlinked) combines your data and its metadata into vectors. They are ingested into a Qdrant collection and indexed. 

![superlinked-architecture](/blog/superlinked-multimodal-search/superlinked-architecture.png)

Superlinked makes search smarter by embedding data into specialized "spaces" designed for each type of attribute, rather than using a single embedding method for everything.

When a user queries **"Affordable luxury hotels near Eiffel Tower with lots of good reviews and free parking"**, Superlinked uses an LLM to do natural query understanding and set weights. These weights determine:
- Preference direction (negative for lower values, positive for higher values).
- Preference strength (higher numbers have stronger influence).
- Balance between different attributes (e.g., price_weight: -1.0 and rating_weight: 1.0 are balanced).

This flexibility with weights allows users to rapidly iterate, experiment, and implement business logic or context much faster than rebuilding entire search systems from scratch. Superlinked then applies mandatory hard filters to narrow results, then ranks them using weighted nearest neighbors search, providing nuanced, accurate results tailored to user preferences. All vectors are stored in Qdrant.

**SuperLinked Framework Setup:** Once you [**setup the Superlinked server**](https://github.com/superlinked/superlinked-recipes/tree/main/projects/hotel-search), most of the prototype work is done right out of the [**sample notebook**](https://github.com/superlinked/superlinked-recipes/blob/main/projects/hotel-search/notebooks/superlinked-queries.ipynb). Once ready, you can host from a GitHub repository and deploy via Actions. 

**Qdrant Vector Database:** The easiest way to store vectors is to [**create a free Qdrant Cloud cluster**](https://cloud.qdrant.io/login). We have simple docs that show you how to [**grab the API key**](/documentation/quickstart-cloud/) and upsert your new vectors and run some basic searches. For this demo, we have deployed a live Qdrant Cloud cluster.

**OpenAI API Key:** For natural language queries and generating the weights you will need an OpenAI API key

### 1. Vector Spaces: The Building Blocks of Intelligent Search
![superlinked-hotel-1](/blog/superlinked-multimodal-search/superlinked-hotel-1.jpg)

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

### 2. Beyond Multimodal Vector Search: The Full Picture

Both **Qdrant and Superlinked** support a rich multimodal search environment where different data types collaborate rather than compete. For our hotel demo, this means:

- **Text descriptions** are embedded using state-of-the-art language models that understand semantics.
- **Prices use** logarithmic scaling to properly handle a wide ranges of values.
- **Ratings** are embedded linearly to preserve their quality indicators.
- **Review counts** use logarithmic scaling to account for the diminishing returns of additional reviews.

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
If you want to have a deeper understanding of the algorithm and how multi vector embeddings work, you can have a read in-depth in our [article.](https://links.superlinked.com/multi_attribute_search_qd)

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

The hotel search demo showcases this vision in action, a glimpse into a future where search understands not just the words we use, but the complex, nuanced preferences they represent.

## How to Build the App

For more details, [check out the repository](https://github.com/superlinked/hotel-search-recipe-qdrant).

Otherwise, you can clone the app:

```shell
git clone https://github.com/superlinked/hotel-search-recipe-qdrant.git
```

The backend is located under `superlinked_app`, while the frontend has to be built from `frontend_app`.

### Deploy the Backend

Use `superlinked_app/.env-example` as a template, create `superlinked_app/.env` and set `OPENAI_API_KEY` required for Natural Query Interface, `QDRANT_URL` and `QDRANT_API_KEY` required for Qdrant Vector Database.

```shell
python3.11 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
APP_MODULE_PATH=superlinked_app python -m superlinked.server
```

It will take some time (depending on the network) to download the sentence-transformers model for the very first time.

API docs will be available at [localhost:8080/docs](http://localhost:8080/docs).

To ingest the dataset, run this command in your terminal:
```shell
curl -X 'POST' \
  'http://localhost:8080/data-loader/hotel/run' \
  -H 'accept: application/json' \
  -d ''
```
Please wait until the ingestion is finished. You will see the message.

#### Inspecting Collections in Qdrant Cloud Dashboard

Once your Superlinked vectors are ingested, log in to the Qdrant Cloud dashboard to navigate to **Collections** and select your `default` hotel collection.

![default-collection](/blog/superlinked-multimodal-search/default-collection.png)

You can browse individual points under the **Data** tab to view payload metadata (price, rating, amenities) alongside their raw vector embeddings.

![collection-information](/blog/superlinked-multimodal-search/collection-information.png)

In the **Collection Information** section, you can use the **Search** tab to apply metadata filters or search by vector. In the **Search Quality** section, you can also monitor performance metrics (throughput, latency).

When scaling up your app, go back to **Qdrant Cloud Dashboard** to configure autoscaling, backups, and snapshots. These options will keep your service reliable and cost-efficient.

### Build the Frontend

```shell
cd frontend_app
python3.11 -m venv .venv-frontend
. .venv-frontend/bin/activate
pip install -e .
python -m streamlit run app/frontend/main.py
```

The Frontend UI will be available at [localhost:8501](http://localhost:8501).

![superlinked-hotel-search](/blog/superlinked-multimodal-search/superlinked-hotel-search.png)

#### Superlinked CLI 

> **Note:** If you need Superlinked for larger scale projects, you can use **Superlinked Cloud**.

With 'superlinked cli', you will be able to run a Superlinked application at scale with components such as batch processing engine, logging and more. For more details contact the Superlinked team at: [superlinked.com](https://superlinked.typeform.com/to/LXMRzHWk?typeform-source=hotel-search-recipe).

## Materials

- [Superlinked GitHub Repository](https://github.com/superlinked/superlinked)
- [Superlinked Documentation](https://docs.superlinked.com)
- [Qdrant Vector Database](https://qdrant.tech)
- [Qdrant Documentation](https://qdrant.tech/documentation)
- [Qdrant Cloud](https://cloud.qdrant.io)
- [Qdrant Discord Community](https://discord.gg/qdrant)

