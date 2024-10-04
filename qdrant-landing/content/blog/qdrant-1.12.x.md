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

In data exploration, tasks like clustering and dimensionality reduction rely on calculating distances between data points. 
With the **Distance Matrix API**, you can compute a *sparse matrix of distances* that is optimized for large datasets.

Imagine a large retail company with 10,000 customers, aiming to segment them based on purchasing behavior. 
Each customer is stored as a vector in Qdrant, and the company wants to identify customer segments and visualize their relationships based on purchase similarities.

Without a dedicated API, clustering these customers would require 10,000 separate batch search requests (plus filter). 
This process is inefficient, costly, and time-consuming.

Here is how you can structure a request to retrieve a sparse matrix that comparing 10 random points:

```http
POST /collections/{collection_name}/points/search/matrix/pairs
{
    "sample": 10,
    "limit": 2
}
- `sample` will retrieve a random sample of 10 points to compare 
- `limit` is the number of connections between points to consider 

This single request will list a sparse matrix of distances between the closest points. 

```http
{
    "result": {
        "pairs": [
            {"a": 1, "b": 3, "score": 1.4063001},
            {"a": 1, "b": 4, "score": 1.2531},
            {"a": 2, "b": 1, "score": 1.1550001},
            {"a": 2, "b": 8, "score": 1.1359},
            {"a": 3, "b": 1, "score": 1.4063001},
            {"a": 3, "b": 4, "score": 1.2218001},
            {"a": 4, "b": 1, "score": 1.2531},
            {"a": 4, "b": 3, "score": 1.2218001},
            {"a": 5, "b": 3, "score": 0.70239997},
            {"a": 5, "b": 1, "score": 0.6146},
            {"a": 6, "b": 3, "score": 0.6353},
            {"a": 6, "b": 4, "score": 0.5093},
            {"a": 7, "b": 3, "score": 1.0990001},
            {"a": 7, "b": 1, "score": 1.0349001},
            {"a": 8, "b": 2, "score": 1.1359},
            {"a": 8, "b": 3, "score": 1.0553}
        ]
    }
}
```
The `offsets` endpoint shows the distances in 

```http
POST /collections/{collection_name}/points/search/matrix/offsets
{
    "sample": 10,
    "limit": 2
}
- `sample` will retrieve a random sample of 10 points to compare 
- `limit` is the number of connections between points to consider 

```http
{
    "result": {
        "offsets_row": [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7],
        "offsets_col": [2, 3, 0, 7, 0, 3, 0, 2, 2, 0, 2, 3, 2, 0, 1, 2],
        "scores": [
            1.4063001, 1.2531, 1.1550001, 1.1359, 1.4063001, 
            1.2218001, 1.2531, 1.2218001, 0.70239997, 0.6146, 0.6353, 
            0.5093, 1.0990001, 1.0349001, 1.1359, 1.0553
            ],
        "ids": [1, 2, 3, 4, 5, 6, 7, 8]
    }
}
```


## Distance Matrix API in the Graph UI

INSERT YOUTUBE VIDEO

## Facet API for Payload Field Cardinality

In modern applications like e-commerce, users often rely on filters, such as brand or location, to refine search results. 

Facet API can efficiently count and aggregate values for a specific payload field in your data. 
You can use it to retrieve unique values for a field, along with the number of points that contain each value.
This functionality is similar to `GROUP BY` with `COUNT(*)` in SQL databases.

Facet counting can only be applied to fields that support `match` conditions, such as fields with a keyword index. 

The feature is designed to help with understanding the distribution of values in a dataset. 
For example, in an e-commerce setting, you can easily retrieve the number of products by size or brand.
Here’s a sample query using the REST API to facet on the `size` field, filtered by products where the `color` is red:

```http
POST /collections/{collection_name}/facet
{
    "key": "size",
    "filter": {
      "must": {
        "key": "color",
        "match": { "value": "red" }
      }
    }
}
```
This returns counts for each unique value in the `size` field, filtered by `color` = `red`. For example:

```json
{
  "response": {
    "hits": [
      {"value": "L", "count": 19},
      {"value": "S", "count": 10},
      {"value": "M", "count": 5},
      {"value": "XL", "count": 1},
      {"value": "XXL", "count": 1}
    ]
  },
  "time": 0.0001
}
```
The results are sorted by count in descending order and only values with non-zero counts are returned.

By default, facet counting runs an approximate filter. 
If you need a precise count, you can enable the `exact` parameter:

```http
POST /collections/{collection_name}/facet
{
    "key": "size",
    "exact": true
}
```
This feature provides flexibility between performance and precision, depending on the needs of your application.

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

With on-disk geo indexing, the index is written to disk instead of residing in memory, making it possible to handle large datasets without exhausting system memory. 

This can be crucial when dealing with millions of geo points that don’t require real-time access.

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