---
title: Payload
weight: 25
---

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

Qdrant also allows multiple values of the same type to be stored and applied to the filter at once.
The condition will be considered satisfied if at least one value meets the condition.

The filtering process is discussed in detail in the section [Filtering](../filtering).

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

Bool - is binary value equals to `true` or `false`.

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

## Create point with payload

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
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient(host="localhost", port=6333)

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
    ]
)
```

## Update payload


### Set payload

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/set_payload)):

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

### Delete payload

This method removes specified payload keys from specified points


REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/delete_payload)):

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

### Clear payload

This method removes all payload keys from specified points

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/clear_payload)):

```http
POST /collections/{collection_name}/points/payload/clear

{
    "points": [0, 3, 100]
}
```

```python
client.clear_payload(
    collection_name="{collection_name}",
    points_selector=models.PointIdsList(
        points=[0, 3, 100],
    )
)
```

<aside role="status">You can also use `models.FilterSelector` to remove the points matching given filter criteria, instead of providing the ids.</aside>

## Payload indexing

To search more efficiently with filters, Qdrant allows you to specify payload fields as indexed.
For marked fields will Qdrant will build an index for the corresponding types of queries.

The indexed fields also affect the vector index. See [Indexing](../indexing) for details.

In practice, we recommend creating an index on those fields that could potentially constrain the results the most.
For example, building an index for the object ID (if it is used in the filter) will be much more efficient than an index by its color, which has only a few possible values.

In compound queries involving multiple fields, Qdrant will attempt to use the most restrictive index first.

To create index for the field, you can use the following:

REST API

```http
PUT /collections/{collection_name}/index

{
    "field_name": "name_of_the_field_to_index",
    "field_type": "keyword"
}
```

```python
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_type="keyword",
)
```

The index usage flag is displayed in the payload schema with the [collection info API](https://qdrant.github.io/qdrant/redoc/index.html#operation/get_collection).

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
