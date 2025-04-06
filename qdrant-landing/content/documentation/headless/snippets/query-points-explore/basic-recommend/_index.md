## Recommendation API

In addition to the regular search, Qdrant also allows you to search based on multiple positive and negative examples. The API is called ***recommend***, and the examples can be point IDs, so that you can leverage the already encoded objects; and, as of v1.6, you can also use raw vectors as input, so that you can create your vectors on the fly without uploading them as points.

REST API - API Schema definition is available [here](https://api.qdrant.tech/api-reference/search/recommend-points)

