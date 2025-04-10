---
title: Hybrid Queries #required
weight: 57 # This is the order of the page in the sidebar. The lower the number, the higher the page will be in the sidebar.
aliases:
  - ../hybrid-queries
hideInSidebar: false # Optional. If true, the page will not be shown in the sidebar. It can be used in regular documentation pages and in documentation section pages (_index.md).
---

# Hybrid and Multi-Stage Queries

*Available as of v1.10.0*

With the introduction of [many named vectors per point](/documentation/concepts/vectors/#named-vectors), there are use-cases when the best search is obtained by combining multiple queries,
or by performing the search in more than one stage.

Qdrant has a flexible and universal interface to make this possible, called `Query API` ([API reference](https://api.qdrant.tech/api-reference/search/query-points)).

The main component for making the combinations of queries possible is the `prefetch` parameter, which enables making sub-requests.

Specifically, whenever a query has at least one prefetch, Qdrant will:
1. Perform the prefetch query (or queries),
2. Apply the main query over the results of its prefetch(es).

Additionally, prefetches can have prefetches themselves, so you can have nested prefetches.

## Hybrid Search

One of the most common problems when you have different representations of the same data is to combine the queried points for each representation into a single result.

{{< figure  src="/docs/fusion-idea.png" caption="Fusing results from multiple queries" width="80%" >}}

For example, in text search, it is often useful to combine dense and sparse vectors get the best of semantics,
plus the best of matching specific words.

Qdrant currently has two ways of combining the results from different queries:

- `rrf` -
<a href=https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf target="_blank">
Reciprocal Rank Fusion
</a>

  Considers the positions of results within each query, and boosts the ones that appear closer to the top in multiple of them.

- `dbsf` -
<a href=https://medium.com/plain-simple-software/distribution-based-score-fusion-dbsf-a-new-approach-to-vector-search-ranking-f87c37488b18 target="_blank">
Distribution-Based Score Fusion
</a> *(available as of v1.11.0)*

  Normalizes the scores of the points in each query, using the mean +/- the 3rd standard deviation as limits, and then sums the scores of the same point across different queries.

  <aside role="status"><code>dbsf</code> is stateless and calculates the normalization limits only based on the results of each query, not on all the scores that it has seen.</aside>

Here is an example of Reciprocal Rank Fusion for a query containing two prefetches against different named vectors configured to respectively hold sparse and dense vectors.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-basic/" >}}

## Multi-stage queries

In many cases, the usage of a larger vector representation gives more accurate search results, but it is also more expensive to compute.

Splitting the search into two stages is a known technique:

* First, use a smaller and cheaper representation to get a large list of candidates.
* Then, re-score the candidates using the larger and more accurate representation.

There are a few ways to build search architectures around this idea:

* The quantized vectors as a first stage, and the full-precision vectors as a second stage.
* Leverage Matryoshka Representation Learning (<a href=https://arxiv.org/abs/2205.13147 target="_blank">MRL</a>) to generate candidate vectors with a shorter vector, and then refine them with a longer one.
* Use regular dense vectors to pre-fetch the candidates, and then re-score them with a multi-vector model like <a href=https://arxiv.org/abs/2112.01488 target="_blank">ColBERT</a>.

To get the best of all worlds, Qdrant has a convenient interface to perform the queries in stages,
such that the coarse results are fetched first, and then they are refined later with larger vectors.

### Re-scoring examples

Fetch 1000 results using a shorter MRL byte vector, then re-score them using the full vector and get the top 10.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring/" >}}

Fetch 100 results using the default vector, then re-score them using a multi-vector to get the top 10.

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring-multivector/" >}}

It is possible to combine all the above techniques in a single query:

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-rescoring-multistage/" >}}

## Score boosting

_Available as of v1.14.0_

When introducing vector search to specific applications, sometimes business logic needs to be considered for ranking the final list of results.

A quick example is [our own documentation search bar](https://github.com/qdrant/page-search).
It has vectors for every part of the documentation site. If one were to perform a search by "just" using the vectors, all kinds of elements would be equally considered good results.
However, when searching for documentation, we can establish a hierarchy of importance:

`title > content > snippets`

One way to solve this is to weight the results based on the kind of element.
For example, we can assign a higher weight to titles and content, and keep snippets unboosted.

Pseudocode would be something like:

`score = score + (is_title * 0.5) + (is_content * 0.25)`

Query API can rescore points with custom formulas. They can be based on:
- Dynamic payload values
- Conditions
- Scores of prefetches

To express the formula, the syntax uses objects to identify each element.
Taking the documentation example, the request would look like this:

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [0.2, 0.8, ...],  // <-- dense vector
        "limit": 50
    }
    "query": {
        "formula": {
            "sum": [
                "$score,
                { "mult": [ 0.5, { "key": "tag", "match": { "any": ["h1", "h2", "h3", "h4"] } } ] },
                { "mult": [ 0.25, { "key": "tag", "match": { "any": ["p", "li"] } } ] }
            ]
        }
    }
}
```

TODO: add all clients

There are multiple expressions available, check the [API docs for specific details](https://api.qdrant.tech/v-1-13-x/api-reference/search/query-points#request.body.query.Query%20Interface.Query.Formula%20Query.formula).
- **constant** - A floating point number. e.g. `0.5`.
- `"$score"` - Reference to the score of the point in the prefetch. This is the same as `"$score[0]"`.
- `"$score[0]"`, `"$score[1]"`, `"$score[2]"`, ... - When using multiple prefetches, you can reference specific prefetch with the index within the array of prefetches.
- **payload key** - Any plain string will refer to a payload key. This uses the jsonpath format used in every other place, e.g. `key` or `key.subkey`. It will try to extract a number from the given key.
- **condition** - A filtering condition. If the condition is met, it becomes `1.0`, otherwise `0.0`.
- **mult** - Multiply an array of expressions.
- **sum** - Sum an array of expressions.
- **div** - Divide an expression by another expression.
- **abs** - Absolute value of an expression.
- **pow** - Raise an expression to the power of another expression.
- **sqrt** - Square root of an expression.
- **log10** - Base 10 logarithm of an expression.
- **ln** - Natural logarithm of an expression.
- **exp** - Exponential function of an expression (`e^x`).
- **geo distance** - Haversine distance between two geographic points. Values need to be `{ "lat": 0.0, "lon": 0.0 }` objects.
- **decay** - Apply a decay function to an expression, which clamps the output between 0 and 1. Available decay functions are **linear**, **exponential**, and **gaussian**. [See more](#boost-points-closer-to-user).

It is possible to define a default for when the variable (either from payload or prefetch score) is not found. This is given in the form of a mapping from variable to value.
If there is no variable, and no defined default, a default value of `0.0` is used.

<aside role="status">
    
**Considerations when using formula queries:**

- Formula queries can only be used as a rescoring step.
- Formula results are always sorted in descending order (bigger is better). **For euclidean scores, make sure to negate them** to sort closest to farthest.
- If a score or variable is not available, and there is no default value, it will be evaluated as 0.
- Multiplication and division are lazily evaluated, meaning that if a 0 is encountered, the rest of operations don't execute (e.g. `0.0 * condition` won't check the condition).
</aside>

### Boost points closer to user
Another example. Combine the score with how close the result is to a user. 

Considering each point has an associated geo location, we can calculate the distance between the point and the request's location.

Assuming we have cosine scores in the prefetch, we can use a helper function to clamp the geographical distance between 0 and 1, by using a decay function. Once clamped, we can sum the score and the distance together. Pseudocode:

`score = score + gauss_decay(distance)`

In this case we use a **gauss_decay** function.

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": { "query": [0.2, 0.8, ...], "limit": 50 },
    "query": {
        "formula": {
            "sum": [
                "$score",
                { 
                    "gauss_decay": {
                        "scale": 5000, // 5km
                        "x": {
                            "geo_distance": {
                                "origin": { "lat": 52.504043, "lon": 13.393236 } // Berlin
                                "to": "geo.location"
                            }
                        }
                    }
                }
            ]
        },
        "defaults": { "geo.location": {"lat": 48.137154, "lon": 11.576124} } // Munich
    }
}
```

For all decay functions, there are these parameters available

| Parameter | Default | Description |
| --- | --- | --- |
| `x` | N/A | The value to decay |
| `target` | 0.0 | The value at which the decay will be at its peak. For distances it is usually set at 0.0, but can be set to any value. |
| `scale` | 1.0 | The value at which the decay function will be equal to `midpoint`. This is in terms of `x` units, for example, if `x` is in meters, `scale` of 5000 means 5km. Must be a non-zero positive number |
| `midpoint` | 0.5 | Output is `midpoint` when `x` equals `scale`. Must be in the range (0.0, 1.0), exclusive |

The formulas for each decay function are as follows:
<iframe src="https://www.desmos.com/calculator/idv5hknwb1?embed" width="600" height="400" style="border: 1px solid #ccc" frameborder=0></iframe>

| Decay Function | Formula | Range |
| --- | --- | --- | 
| Linear (green) | $ \max\left(0,\ -\frac{\left(1-m_{idpoint}\right)}{s_{cale}}\cdot {abs}\left(x-t_{arget}\right)+1\right) $ | $[0, 1]$ |
| Exponential (red) | $ \exp\left(\frac{\ln\left(m_{idpoint}\right)}{s_{cale}}\cdot {abs}\left(x-t_{arget}\right)\right) $ | $(0, 1]$ |
| Gaussian (purple) | $ \exp\left(\frac{\ln\left(m_{idpoint}\right)}{s_{cale}^{2}}\cdot {abs}\left(x-t_{arget}\right)^{2}\right) $ | $(0, 1]$ |

## Grouping

*Available as of v1.11.0*

It is possible to group results by a certain field. This is useful when you have multiple points for the same item, and you want to avoid redundancy of the same item in the results.

REST API ([Schema](https://api.qdrant.tech/master/api-reference/search/query-points-groups)):

```http
POST /collections/{collection_name}/points/query/groups
{
    "query": [0.01, 0.45, 0.67],
    group_by="document_id",  # Path of the field to group by
    limit=4,  # Max amount of groups
    group_size=2,  # Max amount of points per group
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points_groups(
    collection_name="{collection_name}",
    query=[0.01, 0.45, 0.67],
    group_by="document_id",
    limit=4,
    group_size=2,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.queryGroups("{collection_name}", {
    query: [0.01, 0.45, 0.67],
    group_by: "document_id",
    limit: 4,
    group_size: 2,
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query_groups(
    QueryPointGroupsBuilder::new("{collection_name}", "document_id")
        .query(Query::from(vec![0.01, 0.45, 0.67]))
        .limit(4u64)
        .group_size(2u64)
).await?;
```

```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPointGroups;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryGroupsAsync(
        QueryPointGroups.newBuilder()
            .setCollectionName("{collection_name}")
            .setGroupBy("document_id")
            .setQuery(nearest(0.01f, 0.45f, 0.67f))
            .setLimit(4)
            .setGroupSize(2)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryGroupsAsync(
  collectionName: "{collection_name}",
  groupBy: "document_id",
  query: new float[] {
    0.01f, 0.45f, 0.67f
  },
  limit: 4,
  groupSize: 2
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.QueryGroups(context.Background(), &qdrant.QueryPointGroups{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.01, 0.45, 0.67),
	GroupBy:        "document_id",
	GroupSize:      qdrant.PtrOf(uint64(2)),
})
```

For more information on the `grouping` capabilities refer to the reference documentation for search with [grouping](/documentation/concepts/search/#search-groups) and [lookup](/documentation/concepts/search/#lookup-in-groups).
