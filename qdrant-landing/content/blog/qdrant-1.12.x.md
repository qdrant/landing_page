---
title: "Qdrant 1.12 - Enter the Matrix: Clustering and Data Visualization Options"
draft: false
short_description: "On-Disk Text & Geo Index. Distance Matrix API. Facet API for Cardinality."
description: "Uncover insights with the Distance Matrix API, dynamically filter via Facet API, and offload additional payload to disk." 
preview_image: /blog/qdrant-1.12.x/social_preview.png
social_preview_image: /blog/qdrant-1.12.x/social_preview.png
date: 2024-10-03T00:00:00-08:00
author: David Myriel
featured: true
tags:
  - vector search
  - distance matrix 
  - dimensionality reduction
  - data exploration
  - data visualization
  - faceting
  - facet api
---

## Distance Matrix API for Data Exploration

In data exploration, tasks like clustering, dimensionality reduction, and visualizing relationships rely on calculating distances between data points. **The Distance Matrix API** simplifies this by providing a *sparse matrix of distances*, filtered and optimized for large datasets.

Imagine a large retail company with 10,000 customers, aiming to segment them based on purchasing behavior. Each customer is stored as a vector in Qdrant, and the company wants to identify customer segments and visualize their relationships based on purchase similarities.

Without a dedicated API, clustering these customers would require 10,000 separate batch search requests, applying filters for each. This process is inefficient, costly, and time-consuming.

With the Distance Matrix API, the company can apply filters (e.g., by region or purchase history) and make a single request that returns a sparse matrix of distances between the closest customers. This matrix enables efficient clustering and visual relationship mapping, with customers as nodes and their nearest neighbors as edges.

This reduces API calls, cutting costs and improving efficiency, while unlocking deeper insights into customer behavior through segmentation and visualization.

## Facet API for Payload Field Cardinality

In modern applications like e-commerce, users often rely on filters, such as brand or location, to refine search results. 

Qdrant’s Facet API simplifies this by generating dynamic filter options directly from its stored data, improving speed and efficiency without needing external queries. This streamlined solution ensures a smoother user experience with real-time filtering.

Retrieving filter options like categories, price ranges, or brands requires querying external systems or third-party databases. For example, an e-commerce site searching for laptops may need to fetch brand names like Apple, Dell, and HP, along with product counts, from separate systems. This extra step can slow down the search process and add unnecessary complexity to the system.

Qdrant’s Facet API allows applications to retrieve unique values from indexed data fields directly, along with the count of associated records, bypassing the need for external queries. For example, in an e-commerce scenario, a user searching for laptops can instantly see filter options like:

- Apple (500 products)
- Dell (300 products)
- HP (200 products)

The same principle applies to other industries—whether it’s showing property types in real estate or filtering research papers by author. By pulling these filter values directly from the indexed data, Qdrant ensures faster and more efficient search performance.

Speed: Filters are generated in real-time from existing data, delivering instant results.
Efficiency: No need for external databases—filter options come from the data already stored.
Scalability: Even with large datasets, Qdrant’s Facet API handles requests efficiently.

## Additional on_disk Support for Payload Indexes

**Text Index:** Qdrant text indexing involves tokenizing text into smaller units (tokens) based on user-defined settings (e.g., tokenizer type, token length). These tokens are stored in an inverted index for fast text searches. With on-disk text indexing, the inverted index is stored on disk, reducing memory usage.

To configure an on-disk text index, simply add "on_disk": true when creating the index:

```http
PUT /collections/{collection_name}/index
{
    "field_name": "review_text",
    "field_schema": {
        "type": "text",
        "tokenizer": "word",
        "min_token_len": 2,
        "max_token_len": 20,
        "lowercase": true,
        "on_disk": true
    }
}
```

**Geo Index:** Gor large-scale geographic datasets where storing all indexes in memory is impractical, geo indexing in Qdrant allows efficient filtering of points based on geographic coordinates. 

With on-disk geo indexing, the index is written to disk instead of residing in memory, making it possible to handle large datasets without exhausting system memory. This can be crucial when dealing with millions of geo points that don’t require real-time access.

To enable an on-disk geo index, you modify the index schema for the geographic field by setting the "on_disk": true flag. Here’s an example configuration:

```http
PUT /collections/{collection_name}/index
{
    "field_name": "location",
    "field_schema": {
        "type": "geo",
        "on_disk": true
    }
}
```

### Performance Considerations

- Cold Query Latency: On-disk indexes require I/O to load index segments, introducing slight latency on first access. Subsequent queries benefit from disk caching.
- Hot vs. Cold Indexes: Fields frequently queried should stay in memory for faster performance, while on-disk indexes are better for large, infrequently queried fields.
- Memory vs. Disk Trade-offs: Users can manage memory by deciding which fields to store on disk.