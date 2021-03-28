
Qdrant is an open-source vector search engine. Qdrant deploys as an API service for searching for the nearest high-dimensional vectors.
With Qdrant, embeddings or neural network encoders can be turned into full-fledged applications for matching, searching, recommending, and much more! 


## Easy to Use API

Qdrant provides the OpenAPI v3 specification,
which allows you to generate a client library in almost any programming language.
Or you can use ready-made clients for popular programming languages with additional functionality.


## Fast and Accurate

https://github.com/erikbern/ann-benchmarks
https://blog.vasnetsov.com/posts/categorical-hnsw/

Qdrant implements a unique custom modification of the HNSW algorithm for Approximate Nearest Neighbor Search. (TBD)
This algorithm allows Qdrant to search with a State-of-the-Art speed and apply search filters without losing the results.


## Filtrable

Qdrant supports additional payload associated with vectors.
Qdrant not only stores payload but also allows filter results based on payload values.
Unlike Elasticsearch k-NN search, Qdrant does not perform post-filtering, so it guarantees that all relevant vectors will be retrieved.


## Rich data types

Vector payload supports a large variety of data types and query conditions, including string matching, numerical ranges, geo-locations, and more.
Payload filtering conditions allow you to build almost any custom business logic that should work on top of similarity matching.    

## Distributed

Qdrant is cloud-native and scales horizontally. No matter how much data you need to serve - Qdrant can always be used with just the right amount of computational resources. (For now - enterprise only)

## Optimized

We made certain Qdrant makes the most of the resources provided. Among the optimizations used:

* Engine built entirely in Rust language
* Dynamic query planning
* Payload data indexing
* Hardware-aware builds (Enterprise only)