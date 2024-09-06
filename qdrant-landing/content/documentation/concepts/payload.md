---
title: Payload
weight: 45
aliases:
  - ../payload
---

# Payload

One of the significant features of Qdrant is the ability to store additional information along with vectors.
This information is called `payload` in Qdrant terminology.

Qdrant allows you to store any information that can be represented using JSON.

Here is an example of a typical payload:

```json
{
    "name": "jacket",
    "colors": ["red", "blue"],
    "count": 10,
    "price": 11.99,
    "locations": [
        {
            "lon": 52.5200, 
            "lat": 13.4050
        }
    ],
    "reviews": [
        {
            "user": "alice",
            "score": 4
        },
        {
            "user": "bob",
            "score": 5
        }
    ]
}
```

## Payload types

In addition to storing payloads, Qdrant also allows you search based on certain kinds of values.
This feature is implemented as additional filters during the search and will enable you to incorporate custom logic on top of semantic similarity.

During the filtering, Qdrant will check the conditions over those values that match the type of the filtering condition. If the stored value type does not fit the filtering condition - it will be considered not satisfied.

For example, you will get an empty output if you apply the [range condition](../filtering/#range) on the string data.

However, arrays (multiple values of the same type) are treated a little bit different. When we apply a filter to an array, it will succeed if at least one of the values inside the array meets the condition.

The filtering process is discussed in detail in the section [Filtering](../filtering/).

Let's look at the data types that Qdrant supports for searching:

### Integer

`integer` - 64-bit integer in the range from `-9223372036854775808` to `9223372036854775807`.

Example of single and multiple `integer` values:

```json
{
    "count": 10,
    "sizes": [35, 36, 38]
}
```

### Float

`float` - 64-bit floating point number.

Example of single and multiple `float` values:

```json
{
    "price": 11.99,
    "ratings": [9.1, 9.2, 9.4]
}
```

### Bool

Bool - binary value. Equals to `true` or `false`.

Example of single and multiple `bool` values:

```json
{
    "is_delivered": true,
    "responses": [false, false, true, false]
}
```

### Keyword

`keyword` - string value.

Example of single and multiple `keyword` values:

```json
{
    "name": "Alice",
    "friends": [
        "bob",
        "eva",
        "jack"
    ]
}
```

### Geo

`geo` is used to represent geographical coordinates.

Example of single and multiple `geo` values:

```json
{
    "location": {
        "lon": 52.5200,
        "lat": 13.4050
    },
    "cities": [
        {
            "lon": 51.5072,
            "lat": 0.1276
        },
        {
            "lon": 40.7128,
            "lat": 74.0060
        }
    ]
}
```

Coordinate should be described as an object containing two fields: `lon` - for longitude, and `lat` - for latitude.

### Datetime

*Available as of v1.8.0*

`datetime` - date and time in [RFC 3339] format.

See the following examples of single and multiple `datetime` values:

```json
{
    "created_at": "2023-02-08T10:49:00Z",
    "updated_at": [
        "2023-02-08T13:52:00Z",
        "2023-02-21T21:23:00Z"
    ]
}
```

The following formats are supported:

- `"2023-02-08T10:49:00Z"` ([RFC 3339], UTC)
- `"2023-02-08T11:49:00+01:00"` ([RFC 3339], with timezone)
- `"2023-02-08T10:49:00"` (without timezone, UTC is assumed)
- `"2023-02-08T10:49"` (without timezone and seconds)
- `"2023-02-08"` (only date, midnight is assumed)

Notes about the format:

- `T` can be replaced with a space.
- The `T` and `Z` symbols are case-insensitive.
- UTC is always assumed when the timezone is not specified.
- Timezone can have the following formats: `±HH:MM`, `±HHMM`, `±HH`, or `Z`.
- Seconds can have up to 6 decimals, so the finest granularity for `datetime` is microseconds.

[RFC 3339]: https://datatracker.ietf.org/doc/html/rfc3339#section-5.6

### UUID

*Available as of v1.11.0*

In addition to the basic `keyword` type, Qdrant supports `uuid` type for storing UUID values.
Functionally, it works the same as `keyword`, internally stores parsed UUID values.

```json
{
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "uuids": [
        "550e8400-e29b-41d4-a716-446655440000",
        "550e8400-e29b-41d4-a716-446655440001"
    ]
}
```

String representation of UUID (e.g. `550e8400-e29b-41d4-a716-446655440000`) occupies 36 bytes.
But when numeric representation is used, it is only 128 bits (16 bytes).

Usage of `uuid` index type is recommended in payload-heavy collections to save RAM and improve search performance.


## Create point with payload
REST API ([Schema](https://api.qdrant.tech/api-reference/points/upsert-points))

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1,
            "vector": [0.05, 0.61, 0.76, 0.74],
            "payload": {"city": "Berlin", "price": 1.99}
        },
        {
            "id": 2,
            "vector": [0.19, 0.81, 0.75, 0.11],
            "payload": {"city": ["Berlin", "London"], "price": 1.99}
        },
        {
            "id": 3,
            "vector": [0.36, 0.55, 0.47, 0.94],
            "payload": {"city": ["Berlin", "Moscow"], "price": [1.99, 2.99]}
        }
    ]
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector=[0.05, 0.61, 0.76, 0.74],
            payload={
                "city": "Berlin",
                "price": 1.99,
            },
        ),
        models.PointStruct(
            id=2,
            vector=[0.19, 0.81, 0.75, 0.11],
            payload={
                "city": ["Berlin", "London"],
                "price": 1.99,
            },
        ),
        models.PointStruct(
            id=3,
            vector=[0.36, 0.55, 0.47, 0.94],
            payload={
                "city": ["Berlin", "Moscow"],
                "price": [1.99, 2.99],
            },
        ),
    ],
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      vector: [0.05, 0.61, 0.76, 0.74],
      payload: {
        city: "Berlin",
        price: 1.99,
      },
    },
    {
      id: 2,
      vector: [0.19, 0.81, 0.75, 0.11],
      payload: {
        city: ["Berlin", "London"],
        price: 1.99,
      },
    },
    {
      id: 3,
      vector: [0.36, 0.55, 0.47, 0.94],
      payload: {
        city: ["Berlin", "Moscow"],
        price: [1.99, 2.99],
      },
    },
  ],
});
```

```rust
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::{Payload, Qdrant, QdrantError};
use serde_json::json;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let points = vec![
    PointStruct::new(
        1,
        vec![0.05, 0.61, 0.76, 0.74],
        Payload::try_from(json!({"city": "Berlin", "price": 1.99})).unwrap(),
    ),
    PointStruct::new(
        2,
        vec![0.19, 0.81, 0.75, 0.11],
        Payload::try_from(json!({"city": ["Berlin", "London"]})).unwrap(),
    ),
    PointStruct::new(
        3,
        vec![0.36, 0.55, 0.47, 0.94],
        Payload::try_from(json!({"city": ["Berlin", "Moscow"], "price": [1.99, 2.99]}))
            .unwrap(),
    ),
];

client
    .upsert_points(UpsertPointsBuilder::new("{collection_name}", points).wait(true))
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(vectors(0.05f, 0.61f, 0.76f, 0.74f))
                .putAllPayload(Map.of("city", value("Berlin"), "price", value(1.99)))
                .build(),
            PointStruct.newBuilder()
                .setId(id(2))
                .setVectors(vectors(0.19f, 0.81f, 0.75f, 0.11f))
                .putAllPayload(
                    Map.of("city", list(List.of(value("Berlin"), value("London")))))
                .build(),
            PointStruct.newBuilder()
                .setId(id(3))
                .setVectors(vectors(0.36f, 0.55f, 0.47f, 0.94f))
                .putAllPayload(
                    Map.of(
                        "city",
                        list(List.of(value("Berlin"), value("London"))),
                        "price",
                        list(List.of(value(1.99), value(2.99)))))
                .build()))
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
	collectionName: "{collection_name}",
	points: new List<PointStruct>
	{
		new PointStruct
		{
			Id = 1,
			Vectors = new[] { 0.05f, 0.61f, 0.76f, 0.74f },
			Payload = { ["city"] = "Berlin", ["price"] = 1.99 }
		},
		new PointStruct
		{
			Id = 2,
			Vectors = new[] { 0.19f, 0.81f, 0.75f, 0.11f },
			Payload = { ["city"] = new[] { "Berlin", "London" } }
		},
		new PointStruct
		{
			Id = 3,
			Vectors = new[] { 0.36f, 0.55f, 0.47f, 0.94f },
			Payload =
			{
				["city"] = new[] { "Berlin", "Moscow" },
				["price"] = new Value
				{
					ListValue = new ListValue { Values = { new Value[] { 1.99, 2.99 } } }
				}
			}
		}
	}
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

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id:      qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectors(0.05, 0.61, 0.76, 0.74),
			Payload: qdrant.NewValueMap(map[string]any{
				"city": "Berlin", "price": 1.99}),
		},
		{
			Id:      qdrant.NewIDNum(2),
			Vectors: qdrant.NewVectors(0.19, 0.81, 0.75, 0.11),
			Payload: qdrant.NewValueMap(map[string]any{
				"city": []any{"Berlin", "London"}}),
		},
		{
			Id:      qdrant.NewIDNum(3),
			Vectors: qdrant.NewVectors(0.36, 0.55, 0.47, 0.94),
			Payload: qdrant.NewValueMap(map[string]any{
				"city":  []any{"Berlin", "London"},
				"price": []any{1.99, 2.99}}),
		},
	},
})
```

## Update payload

### Set payload

Set only the given payload values on a point.

REST API ([Schema](https://api.qdrant.tech/api-reference/points/set-payload)):

```http
POST /collections/{collection_name}/points/payload
{
    "payload": {
        "property1": "string",
        "property2": "string"
    },
    "points": [
        0, 3, 100
    ]
}
```

```python
client.set_payload(
    collection_name="{collection_name}",
    payload={
        "property1": "string",
        "property2": "string",
    },
    points=[0, 3, 10],
)
```

```typescript
client.setPayload("{collection_name}", {
  payload: {
    property1: "string",
    property2: "string",
  },
  points: [0, 3, 10],
});
```

```rust
use qdrant_client::qdrant::{
    PointsIdsList, SetPayloadPointsBuilder,
};
use qdrant_client::Payload,;
use serde_json::json;

client
    .set_payload(
        SetPayloadPointsBuilder::new(
            "{collection_name}",
            Payload::try_from(json!({
                "property1": "string",
                "property2": "string",
            }))
            .unwrap(),
        )
        .points_selector(PointsIdsList {
            ids: vec![0.into(), 3.into(), 10.into()],
        })
        .wait(true),
    )
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;

client
    .setPayloadAsync(
        "{collection_name}",
        Map.of("property1", value("string"), "property2", value("string")),
        List.of(id(0), id(3), id(10)),
        true,
        null,
        null)
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.SetPayloadAsync(
	collectionName: "{collection_name}",
	payload: new Dictionary<string, Value> { { "property1", "string" }, { "property2", "string" } },
	ids: new ulong[] { 0, 3, 10 }
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

client.SetPayload(context.Background(), &qdrant.SetPayloadPoints{
	CollectionName: "{collection_name}",
	Payload: qdrant.NewValueMap(
		map[string]any{"property1": "string", "property2": "string"}),
	PointsSelector: qdrant.NewPointsSelector(
		qdrant.NewIDNum(0),
		qdrant.NewIDNum(3)),
})
```

You don't need to know the ids of the points you want to modify. The alternative
is to use filters.

```http
POST /collections/{collection_name}/points/payload
{
    "payload": {
        "property1": "string",
        "property2": "string"
    },
    "filter": {
        "must": [
            {
                "key": "color",
                "match": {
                    "value": "red"
                }
            }
        ]
    }
}
```

```python
client.set_payload(
    collection_name="{collection_name}",
    payload={
        "property1": "string",
        "property2": "string",
    },
    points=models.Filter(
        must=[
            models.FieldCondition(
                key="color",
                match=models.MatchValue(value="red"),
            ),
        ],
    ),
)
```

```typescript
client.setPayload("{collection_name}", {
  payload: {
    property1: "string",
    property2: "string",
  },
  filter: {
    must: [
      {
        key: "color",
        match: {
          value: "red",
        },
      },
    ],
  },
});
```

```rust
use qdrant_client::qdrant::{Condition, Filter, SetPayloadPointsBuilder};
use qdrant_client::Payload;
use serde_json::json;

client
    .set_payload(
        SetPayloadPointsBuilder::new(
            "{collection_name}",
            Payload::try_from(json!({
                "property1": "string",
                "property2": "string",
            }))
            .unwrap(),
        )
        .points_selector(Filter::must([Condition::matches(
            "color",
            "red".to_string(),
        )]))
        .wait(true),
    )
    .await?;
```

```java
import java.util.Map;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.ValueFactory.value;

client
    .setPayloadAsync(
        "{collection_name}",
        Map.of("property1", value("string"), "property2", value("string")),
        Filter.newBuilder().addMust(matchKeyword("color", "red")).build(),
        true,
        null,
        null)
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.SetPayloadAsync(
	collectionName: "{collection_name}",
	payload: new Dictionary<string, Value> { { "property1", "string" }, { "property2", "string" } },
	filter: MatchKeyword("color", "red")
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

client.SetPayload(context.Background(), &qdrant.SetPayloadPoints{
	CollectionName: "{collection_name}",
	Payload: qdrant.NewValueMap(
		map[string]any{"property1": "string", "property2": "string"}),
	PointsSelector: qdrant.NewPointsSelectorFilter(&qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewMatch("color", "red"),
		},
	}),
})
```

_Available as of v1.8.0_

It is possible to modify only a specific key of the payload by using the `key` parameter.

For instance, given the following payload JSON object on a point:

```json
{
    "property1": {
        "nested_property": "foo",
    },
    "property2": {
        "nested_property": "bar",
    }
}
```

You can modify the `nested_property` of `property1` with the following request:

```http
POST /collections/{collection_name}/points/payload
{
    "payload": {
        "nested_property": "qux",
    },
    "key": "property1",
    "points": [1]
}
```

Resulting in the following payload:

```json
{
    "property1": {
        "nested_property": "qux",
    },
    "property2": {
        "nested_property": "bar",
    }
}
```

### Overwrite payload

Fully replace any existing payload with the given one.

REST API ([Schema](https://api.qdrant.tech/api-reference/points/overwrite-payload)):

```http
PUT /collections/{collection_name}/points/payload
{
    "payload": {
        "property1": "string",
        "property2": "string"
    },
    "points": [
        0, 3, 100
    ]
}
```

```python
client.overwrite_payload(
    collection_name="{collection_name}",
    payload={
        "property1": "string",
        "property2": "string",
    },
    points=[0, 3, 10],
)
```

```typescript
client.overwritePayload("{collection_name}", {
  payload: {
    property1: "string",
    property2: "string",
  },
  points: [0, 3, 10],
});
```

```rust
use qdrant_client::qdrant::{PointsIdsList, SetPayloadPointsBuilder};
use qdrant_client::Payload;
use serde_json::json;

client
    .overwrite_payload(
        SetPayloadPointsBuilder::new(
            "{collection_name}",
            Payload::try_from(json!({
                "property1": "string",
                "property2": "string",
            }))
            .unwrap(),
        )
        .points_selector(PointsIdsList {
            ids: vec![0.into(), 3.into(), 10.into()],
        })
        .wait(true),
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;

client
    .overwritePayloadAsync(
        "{collection_name}",
        Map.of("property1", value("string"), "property2", value("string")),
        List.of(id(0), id(3), id(10)),
        true,
        null,
        null)
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.OverwritePayloadAsync(
	collectionName: "{collection_name}",
	payload: new Dictionary<string, Value> { { "property1", "string" }, { "property2", "string" } },
	ids: new ulong[] { 0, 3, 10 }
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

client.OverwritePayload(context.Background(), &qdrant.SetPayloadPoints{
	CollectionName: "{collection_name}",
	Payload: qdrant.NewValueMap(
		map[string]any{"property1": "string", "property2": "string"}),
	PointsSelector: qdrant.NewPointsSelector(
		qdrant.NewIDNum(0),
		qdrant.NewIDNum(3)),
})
```

Like [set payload](#set-payload), you don't need to know the ids of the points
you want to modify. The alternative is to use filters.

### Clear payload

This method removes all payload keys from specified points

REST API ([Schema](https://api.qdrant.tech/api-reference/points/clear-payload)):

```http
POST /collections/{collection_name}/points/payload/clear
{
    "points": [0, 3, 100]
}
```

```python
client.clear_payload(
    collection_name="{collection_name}",
    points_selector=[0, 3, 100],
)
```

```typescript
client.clearPayload("{collection_name}", {
  points: [0, 3, 100],
});
```

```rust
use qdrant_client::qdrant::{ClearPayloadPointsBuilder, PointsIdsList};

client
    .clear_payload(
        ClearPayloadPointsBuilder::new("{collection_name}")
            .points(PointsIdsList {
                ids: vec![0.into(), 3.into(), 10.into()],
            })
            .wait(true),
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;

client
    .clearPayloadAsync("{collection_name}", List.of(id(0), id(3), id(100)), true, null, null)
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.ClearPayloadAsync(collectionName: "{collection_name}", ids: new ulong[] { 0, 3, 100 });
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

client.ClearPayload(context.Background(), &qdrant.ClearPayloadPoints{
	CollectionName: "{collection_name}",
	Points: qdrant.NewPointsSelector(
		qdrant.NewIDNum(0),
		qdrant.NewIDNum(3)),
})
```

<aside role="status">
You can also use <code>models.FilterSelector</code> to remove the points matching given filter criteria, instead of providing the ids.
</aside>

### Delete payload keys

Delete specific payload keys from points.

REST API ([Schema](https://api.qdrant.tech/api-reference/points/delete-payload)):

```http
POST /collections/{collection_name}/points/payload/delete
{
    "keys": ["color", "price"],
    "points": [0, 3, 100]
}
```

```python
client.delete_payload(
    collection_name="{collection_name}",
    keys=["color", "price"],
    points=[0, 3, 100],
)
```

```typescript
client.deletePayload("{collection_name}", {
  keys: ["color", "price"],
  points: [0, 3, 100],
});
```

```rust
use qdrant_client::qdrant::{DeletePayloadPointsBuilder, PointsIdsList};

client
    .delete_payload(
        DeletePayloadPointsBuilder::new(
            "{collection_name}",
            vec!["color".to_string(), "price".to_string()],
        )
        .points_selector(PointsIdsList {
            ids: vec![0.into(), 3.into(), 10.into()],
        })
        .wait(true),
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;

client
    .deletePayloadAsync(
        "{collection_name}",
        List.of("color", "price"),
        List.of(id(0), id(3), id(100)),
        true,
        null,
        null)
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.DeletePayloadAsync(
	collectionName: "{collection_name}",
	keys: ["color", "price"],
	ids: new ulong[] { 0, 3, 100 }
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

client.DeletePayload(context.Background(), &qdrant.DeletePayloadPoints{
	CollectionName: "{collection_name}",
	Keys:           []string{"color", "price"},
	PointsSelector: qdrant.NewPointsSelector(
		qdrant.NewIDNum(0),
		qdrant.NewIDNum(3)),
})
```

Alternatively, you can use filters to delete payload keys from the points.

```http
POST /collections/{collection_name}/points/payload/delete
{
    "keys": ["color", "price"],
    "filter": {
        "must": [
            {
                "key": "color",
                "match": {
                    "value": "red"
                }
            }
        ]
    }
}
```

```python
client.delete_payload(
    collection_name="{collection_name}",
    keys=["color", "price"],
    points=models.Filter(
        must=[
            models.FieldCondition(
                key="color",
                match=models.MatchValue(value="red"),
            ),
        ],
    ),
)
```

```typescript
client.deletePayload("{collection_name}", {
  keys: ["color", "price"],
  filter: {
    must: [
      {
        key: "color",
        match: {
          value: "red",
        },
      },
    ],
  },
});
```

```rust
use qdrant_client::qdrant::{Condition, DeletePayloadPointsBuilder, Filter};

client
    .delete_payload(
        DeletePayloadPointsBuilder::new(
            "{collection_name}",
            vec!["color".to_string(), "price".to_string()],
        )
        .points_selector(Filter::must([Condition::matches(
            "color",
            "red".to_string(),
        )]))
        .wait(true),
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.matchKeyword;

client
    .deletePayloadAsync(
        "{collection_name}",
        List.of("color", "price"),
        Filter.newBuilder().addMust(matchKeyword("color", "red")).build(),
        true,
        null,
        null)
    .get();
```

```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.DeletePayloadAsync(
	collectionName: "{collection_name}",
	keys: ["color", "price"],
	filter: MatchKeyword("color", "red")
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

client.DeletePayload(context.Background(), &qdrant.DeletePayloadPoints{
	CollectionName: "{collection_name}",
	Keys:           []string{"color", "price"},
	PointsSelector: qdrant.NewPointsSelectorFilter(
		&qdrant.Filter{
			Must: []*qdrant.Condition{qdrant.NewMatch("color", "red")},
		},
	),
})
```

## Payload indexing

To search more efficiently with filters, Qdrant allows you to create indexes for payload fields by specifying the name and type of field it is intended to be.

The indexed fields also affect the vector index. See [Indexing](../indexing/) for details.

In practice, we recommend creating an index on those fields that could potentially constrain the results the most.
For example, using an index for the object ID will be much more efficient, being unique for each record, than an index by its color, which has only a few possible values.

In compound queries involving multiple fields, Qdrant will attempt to use the most restrictive index first.

To create index for the field, you can use the following:

REST API ([Schema](https://api.qdrant.tech/api-reference/indexes/create-field-index))

```http
PUT /collections/{collection_name}/index
{
    "field_name": "name_of_the_field_to_index",
    "field_schema": "keyword"
}
```

```python
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema="keyword",
)
```

```typescript
client.createPayloadIndex("{collection_name}", {
  field_name: "name_of_the_field_to_index",
  field_schema: "keyword",
});
```

```rust
use qdrant_client::qdrant::{CreateFieldIndexCollectionBuilder, FieldType};

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "name_of_the_field_to_index",
            FieldType::Keyword,
        )
        .wait(true),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.PayloadSchemaType;

client.createPayloadIndexAsync(
    "{collection_name}",
    "name_of_the_field_to_index",
    PayloadSchemaType.Keyword,
    null,
    true,
    null,
    null);
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.CreatePayloadIndexAsync(
	collectionName: "{collection_name}",
	fieldName: "name_of_the_field_to_index"
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

client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
	CollectionName: "{collection_name}",
	FieldName:      "name_of_the_field_to_index",
	FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
})
```

The index usage flag is displayed in the payload schema with the [collection info API](https://api.qdrant.tech/api-reference/collections/get-collection).

Payload schema example:

```json
{
    "payload_schema": {
        "property1": {
            "data_type": "keyword"
        },
        "property2": {
            "data_type": "integer"
        }
    }
}
```
