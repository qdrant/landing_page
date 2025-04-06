## Query API

*Available as of v1.10.0*

Qdrant provides a single interface for all kinds of search and exploration requests - the `Query API`.
Here is a reference list of what kind of queries you can perform with the `Query API` in Qdrant:

Depending on the `query` parameter, Qdrant might prefer different strategies for the search.

|  | |
| --- | --- |
| Nearest Neighbors Search | Vector Similarity Search, also known as k-NN |
| Search By Id | Search by an already stored vector - skip embedding model inference |
| [Recommendations](/documentation/concepts/explore/#recommendation-api) | Provide positive and negative examples |
| [Discovery Search](/documentation/concepts/explore/#discovery-api) | Guide the search using context as a one-shot training set |
| [Scroll](/documentation/concepts/points/#scroll-points) | Get all points with optional filtering |
| [Grouping](/documentation/concepts/search/#grouping-api) | Group results by a certain field |
| [Order By](/documentation/concepts/hybrid-queries/#re-ranking-with-stored-values) | Order points by payload key |
| [Hybrid Search](/documentation/concepts/hybrid-queries/#hybrid-search) | Combine multiple queries to get better results |
| [Multi-Stage Search](/documentation/concepts/hybrid-queries/#multi-stage-queries) | Optimize performance for large embeddings |
| [Random Sampling](#random-sampling) | Get random points from the collection |

**Nearest Neighbors Search**

