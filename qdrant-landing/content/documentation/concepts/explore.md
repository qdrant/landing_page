---
title: Explore
weight: 55
aliases:
  - ../explore
---

# Explore the data

After mastering the concepts in [search](../search), you can start exploring your data in other ways. Qdrant provides a stack of APIs that allow you to find similar vectors in a different fashion, as well as to find the most dissimilar ones. These are useful tools for recommendation systems, data exploration, and data cleaning.

## Recommendation API

In addition to the regular search, Qdrant also allows you to search based on multiple positive and negative examples. The API is called ***recommend***, and the examples can be point IDs, so that you can leverage the already encoded objects; and, as of v1.6, you can also use raw vectors as input, so that you can create your vectors on the fly without uploading them as points.

REST API - API Schema definition is available [here](https://qdrant.github.io/qdrant/redoc/index.html#operation/recommend_points)

```http
POST /collections/{collection_name}/points/recommend
{
  "positive": [100, 231],
  "negative": [718, [0.2, 0.3, 0.4, 0.5]],
  "filter": {
        "must": [
            {
                "key": "city",
                "match": {
                    "value": "London"
                }
            }
        ]
  },
  "strategy": "average_vector",
  "limit": 3
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.recommend(
    collection_name="{collection_name}",
    positive=[100, 231],
    negative=[718, [0.2, 0.3, 0.4, 0.5]],
    strategy=models.RecommendStrategy.AVERAGE_VECTOR,
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="city",
                match=models.MatchValue(
                    value="London",
                ),
            )
        ]
    ),
    limit=3,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.recommend("{collection_name}", {
  positive: [100, 231],
  negative: [718, [0.2, 0.3, 0.4, 0.5]],
  strategy: "average_vector",
  filter: {
    must: [
      {
        key: "city",
        match: {
          value: "London",
        },
      },
    ],
  },
  limit: 3,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{Condition, Filter, RecommendPoints, RecommendStrategy},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .recommend(&RecommendPoints {
        collection_name: "{collection_name}".to_string(),
        positive: vec![100.into(), 200.into()],
        positive_vectors: vec![vec![100.0, 231.0].into()],
        negative: vec![718.into()],
        negative_vectors: vec![vec![0.2, 0.3, 0.4, 0.5].into()],
        strategy: Some(RecommendStrategy::AverageVector.into()),
        filter: Some(Filter::must([Condition::matches(
            "city",
            "London".to_string(),
        )])),
        limit: 3,
        ..Default::default()
    })
    .await?;
```

Example result of this API would be

```json
{
  "result": [
    { "id": 10, "score": 0.81 },
    { "id": 14, "score": 0.75 },
    { "id": 11, "score": 0.73 }
  ],
  "status": "ok",
  "time": 0.001
}
```

The algorithm used to get the recommendations is selected from the available `strategy` options. Each of them has its own strengths and weaknesses, so experiment and choose the one that works best for your case.

### Average vector strategy

The default and first strategy added to Qdrant is called `average_vector`. It preprocesses the input examples to create a single vector that is used for the search. Since the preprocessing step happens very fast, the performance of this strategy is on-par with regular search. The intuition behind this kind of recommendation is that each vector component represents an independent feature of the data, so, by averaging the examples, we should get a good recommendation.

The way to produce the searching vector is by first averaging all the positive and negative examples separately, and then combining them into a single vector using the following formula:

```rust
avg_positive + avg_positive - avg_negative
```

In the case of not having any negative examples, the search vector will simply be equal to `avg_positive`.

This is the default strategy that's going to be set implicitly, but you can explicitly define it by setting `"strategy": "average_vector"` in the recommendation request.

### Best score strategy

*Available as of v1.6.0*

A new strategy introduced in v1.6, is called `best_score`. It is based on the idea that the best way to find similar vectors is to find the ones that are closer to a positive example, while avoiding the ones that are closer to a negative one.
The way it works is that each candidate is measured against every example, then we select the best positive and best negative scores. The final score is chosen with this step formula:

```rust
let score = if best_positive_score > best_negative_score {
    best_positive_score;
} else {
    -(best_negative_score * best_negative_score);
};
```

<aside role="alert">
The performance of <code>best_score</code> strategy will be linearly impacted by the amount of examples.
</aside>

Since we are computing similarities to every example at each step of the search, the performance of this strategy will be linearly impacted by the amount of examples. This means that the more examples you provide, the slower the search will be. However, this strategy can be very powerful and should be more embedding-agnostic.

<aside role="status">
Accuracy may be impacted with this strategy. To improve it, increasing the <code>ef</code> search parameter to something above 32 will already be much better than the default 16, e.g: <code>"params": { "ef": 64 }</code>
</aside>

To use this algorithm, you need to set `"strategy": "best_score"` in the recommendation request.

#### Using only negative examples

A beneficial side-effect of `best_score` strategy is that you can use it with only negative examples. This will allow you to find the most dissimilar vectors to the ones you provide. This can be useful for finding outliers in your data, or for finding the most dissimilar vectors to a given one.

Combining negative-only examples with filtering can be a powerful tool for data exploration and cleaning.

### Multiple vectors

*Available as of v0.10.0*

If the collection was created with multiple vectors, the name of the vector should be specified in the recommendation request:

```http
POST /collections/{collection_name}/points/recommend
{
  "positive": [100, 231],
  "negative": [718],
  "using": "image",
  "limit": 10
 }
```

```python
client.recommend(
    collection_name="{collection_name}",
    positive=[100, 231],
    negative=[718],
    using="image",
    limit=10,
)
```

```typescript
client.recommend("{collection_name}", {
  positive: [100, 231],
  negative: [718],
  using: "image",
  limit: 10,
});
```

```rust
use qdrant_client::qdrant::RecommendPoints;

client
    .recommend(&RecommendPoints {
        collection_name: "{collection_name}".to_string(),
        positive: vec![100.into(), 231.into()],
        negative: vec![718.into()],
        using: Some("image".to_string()),
        limit: 10,
        ..Default::default()
    })
    .await?;
```

Parameter `using` specifies which stored vectors to use for the recommendation.

### Lookup vectors from another collection

*Available as of v0.11.6*

If you have collections with vectors of the same dimensionality,
and you want to look for recommendations in one collection based on the vectors of another collection,
you can use the `lookup_from` parameter.

It might be useful, e.g. in the item-to-user recommendations scenario. 
Where user and item embeddings, although having the same vector parameters (distance type and dimensionality), are usually stored in different collections.

```http
POST /collections/{collection_name}/points/recommend

{
  "positive": [100, 231],
  "negative": [718],
  "using": "image",
  "limit": 10,
  "lookup_from": {
    "collection":"{external_collection_name}",
    "vector":"{external_vector_name}"
 }
}
```

```python
client.recommend(
    collection_name="{collection_name}",
    positive=[100, 231],
    negative=[718],
    using="image",
    limit=10,
    lookup_from=models.LookupLocation(
        collection="{external_collection_name}",
        vector="{external_vector_name}"
    ),
)
```

```typescript
client.recommend("{collection_name}", {
  positive: [100, 231],
  negative: [718],
  using: "image",
  limit: 10,
  lookup_from: {
        "collection" : "{external_collection_name}",
        "vector" : "{external_vector_name}"
    },
});
```

Vectors are retrieved from the external collection by ids provided in the `positive` and `negative` lists. 
These vectors then used to perform the recommendation in the current collection, comparing against the "using" or default vector.


## Batch recommendation API

*Available as of v0.10.0*

Similar to the batch search API in terms of usage and advantages, it enables the batching of recommendation requests.

```http
POST /collections/{collection_name}/points/recommend/batch
{
    "searches": [
        {
            "filter": {
                    "must": [
                        {
                            "key": "city",
                            "match": {
                                "value": "London"
                            }
                        }
                    ]
            },
            "negative": [718],
            "positive": [100, 231],
            "limit": 10
        },
        {
            "filter": {
                "must": [
                    {
                        "key": "city",
                        "match": {
                            "value": "London"
                        }
                    }
                    ]
            },
            "negative": [300],
            "positive": [200, 67],
            "limit": 10
        }
    ]
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

filter = models.Filter(
    must=[
        models.FieldCondition(
            key="city",
            match=models.MatchValue(
                value="London",
            ),
        )
    ]
)

recommend_queries = [
    models.RecommendRequest(
        positive=[100, 231], negative=[718], filter=filter, limit=3
    ),
    models.RecommendRequest(positive=[200, 67], negative=[300], filter=filter, limit=3),
]

client.recommend_batch(collection_name="{collection_name}", requests=recommend_queries)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const filter = {
  must: [
    {
      key: "city",
      match: {
        value: "London",
      },
    },
  ],
};

const searches = [
  {
    positive: [100, 231],
    negative: [718],
    filter,
    limit: 3,
  },
  {
    positive: [200, 67],
    negative: [300],
    filter,
    limit: 3,
  },
];

client.recommend_batch("{collection_name}", {
  searches,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{Condition, Filter, RecommendBatchPoints, RecommendPoints},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

let filter = Filter::must([Condition::matches("city", "London".to_string())]);

let recommend_queries = vec![
    RecommendPoints {
        collection_name: "{collection_name}".to_string(),
        positive: vec![100.into(), 231.into()],
        negative: vec![718.into()],
        filter: Some(filter.clone()),
        limit: 3,
        ..Default::default()
    },
    RecommendPoints {
        collection_name: "{collection_name}".to_string(),
        positive: vec![200.into(), 67.into()],
        negative: vec![300.into()],
        filter: Some(filter),
        limit: 3,
        ..Default::default()
    },
];

client
    .recommend_batch(&RecommendBatchPoints {
        collection_name: "{collection_name}".to_string(),
        recommend_points: recommend_queries,
        ..Default::default()
    })
    .await?;
```

The result of this API contains one array per recommendation requests.

```json
{
  "result": [
    [
        { "id": 10, "score": 0.81 },
        { "id": 14, "score": 0.75 },
        { "id": 11, "score": 0.73 }
    ],
    [
        { "id": 1, "score": 0.92 },
        { "id": 3, "score": 0.89 },
        { "id": 9, "score": 0.75 }
    ]
  ],
  "status": "ok",
  "time": 0.001
}
```

## Discovery API

*Available as of v1.7*

REST API Schema definition available [here](https://qdrant.github.io/qdrant/redoc/index.html#tag/points/operation/discover_points)

In this API, Qdrant introduces the concept of `context`, which is used for splitting the space. Context is a set of positive-negative pairs, and each pair divides the space into positive and negative zones. In that mode, the search operation prefers points based on how many positive zones they belong to (or how much they avoid negative zones).

The interface for providing context is similar to the recommendation API (ids or raw vectors). Still, in this case, they need to be provided in the form of positive-negative pairs.

Discovery API lets you do two new types of search:
- **Discovery search**: Uses the context (the pairs of positive-negative vectors) and a target to return the points more similar to the target, but constrained by the context.
- **Context search**: Using only the context pairs, get the points that live in the best zone, where loss is minimized

The way positive and negative examples should be arranged in the context pairs is completely up to you. So you can have the flexibility of trying out different permutation techniques based on your model and data.

<aside role="alert">The speed of search is linearly related to the amount of examples you provide in the query.</aside>

### Discovery search

This type of search works specially well for combining multimodal, vector-constrained searches. Qdrant already has extensive support for filters, which constrain the search based on its payload, but using discovery search, you can also constrain the vector space in which the search is performed.

![Discovery search](/docs/discovery-search.png)

The formula for the discovery score can be expressed as:

$$
\text{rank}(v^+, v^-) = \begin{cases}
    1, &\quad s(v^+) \geq s(v^-) \\\\
    -1, &\quad s(v^+) < s(v^-)
\end{cases}
$$
where $v^+$ represents a positive example, $v^-$ represents a negative example, and $s(v)$ is the similarity score of a vector $v$ to the target vector. The discovery score is then computed as:
$$
 \text{discovery score} = \text{sigmoid}(s(v_t))+ \sum \text{rank}(v_i^+, v_i^-),
$$
where $s(v)$ is the similarity function, $v_t$ is the target vector, and again $v_i^+$ and $v_i^-$ are the positive and negative examples, respectively. The sigmoid function is used to normalize the score between 0 and 1 and the sum of ranks is used to penalize vectors that are closer to the negative examples than to the positive ones. In other words, the sum of individual ranks determines how many positive zones a point is in, while the closeness hierarchy comes second.

Example:

```http
POST /collections/{collection_name}/points/discover

{
  "target": [0.2, 0.1, 0.9, 0.7],
  "context": [
    {
      "positive": 100,
      "negative": 718
    },
    {
      "positive": 200,
      "negative": 300
    }
  ],
  "limit": 10
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

discover_queries = [
    models.DiscoverRequest(
        target=[0.2, 0.1, 0.9, 0.7],
        context=[
            models.ContextExamplePair(
                positive=100,
                negative=718,
            ),
            models.ContextExamplePair(
                positive=200,
                negative=300,
            ),
        ],
        limit=10,
    ),
]
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.discover("{collection_name}", {
    target: [0.2, 0.1, 0.9, 0.7],
    context: [
    {
        positive: 100,
        negative: 718,
    },
    {
        positive: 200,
        negative: 300,
    },
    ],
    limit: 10,
});
```

<aside role="status">
Notes about discovery search:

* When providing ids as examples, they will be excluded from the results.
* Score is always in descending order (larger is better), regardless of the metric used.
* Since the space is hard-constrained by the context, accuracy is normal to drop when using default settings. To mitigate this, increasing the `ef` search parameter to something above 64 will already be much better than the default 16, e.g: `"params": { "ef": 128 }`

</aside>

### Context search

Conversely, in the absence of a target, a rigid integer-by-integer function doesn't provide much guidance for the search when utilizing a proximity graph like HNSW. Instead, context search employs a function derived from the [triplet-loss](/articles/triplet-loss/) concept, which is usually applied during model training. For context search, this function is adapted to steer the search towards areas with fewer negative examples.

![Context search](/docs/context-search.png)

We can directly associate the score function to a loss function, where 0.0 is the maximum score a point can have, which means it is only in positive areas. As soon as a point exists closer to a negative example, its loss will simply be the difference of the positive and negative similarities.

$$
\text{context score} = \sum \min(s(v^+_i) - s(v^-_i), 0.0)
$$

Where $v^+_i$ and $v^-_i$ are the positive and negative examples of each pair, and $s(v)$ is the similarity function.

Using this kind of search, you can expect the output to not necessarily be around a single point, but rather, to be any point that isn’t closer to a negative example, which creates a constrained diverse result. So, even when the API is not called [`recommend`](#recommendation-api), recommendation systems can also use this approach and adapt it for their specific use-cases.

Example:

```http
POST /collections/{collection_name}/points/discover

{
  "context": [
    {
      "positive": 100,
      "negative": 718
    },
    {
      "positive": 200,
      "negative": 300
    }
  ],
  "limit": 10
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

discover_queries = [
    models.DiscoverRequest(
        context=[
            models.ContextExamplePair(
                positive=100,
                negative=718,
            ),
            models.ContextExamplePair(
                positive=200,
                negative=300,
            ),
        ],
        limit=10,
    ),
]
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.discover("{collection_name}", {
    context: [
    {
        positive: 100,
        negative: 718,
    },
    {
        positive: 200,
        negative: 300,
    },
    ],
    limit: 10,
});
```

<aside role="status">
Notes about context search:

* When providing ids as examples, they will be excluded from the results.
* Score is always in descending order (larger is better), regardless of the metric used.
* Best possible score is `0.0`, and it is normal that many points get this score.

</aside>
