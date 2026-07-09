---
title: Indexing Payloads of Random Shape
short_description: "Index open-ended payloads whose keys are data in Qdrant, using a nested filter over a fixed key-value array instead of one index per key."
description: "Model payloads with arbitrary keys in Qdrant. Reshape open-ended fields into a key-value array, index it at setup, and query exact matches and ranges with a nested filter."
weight: 13
---

# Indexing Payloads of Random Shape

| Time: 25 min | Level: Intermediate |
| --- | ----------- |

Most collections have a fixed schema: a price, a category, a timestamp. This tutorial is about the ones where the payload keys themselves are data, like a catalog ingesting each vendor's raw feed. A collection like that can hold thousands of distinct keys, most on a handful of points. When users need to filter on any of them, the intuitive fix is to index each key as it appears, which scales badly. This tutorial reshapes open-ended keys into values, so a small, fixed set of payload indexes and a nested filter cover the whole key space.

## Setup

Connect a client and create a collection. The vectors are incidental to the pattern, so keep them small and generic. The [Cloud Quickstart](/documentation/cloud-quickstart/) covers creating a cluster and getting your endpoint and API key.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://your-endpoint.cloud.qdrant.io:6333",
    api_key="<paste-your-key>",
)

client.create_collection(
    collection_name="catalog",
    vectors_config=models.VectorParams(size=128, distance=models.Distance.COSINE),
)
```

## The One-Index-Per-Key Trap

The reactive approach indexes each key the moment it appears:

```python
# Anti-pattern: one index per distinct key, created at ingest time.
for key in incoming_keys:
    client.create_payload_index(
        collection_name="catalog", field_name=key,
        field_schema=models.PayloadSchemaType.KEYWORD,
    )
```

This works for the first hundred keys and becomes a liability as the key space grows, because each key adds an index. The collection here stays at 10,000 points while the key count varies, so the growth in memory and build time is the indexes alone, not the data:

| Points | Distinct keys (= indexes) | Build time | Memory added |
|---|---|---|---|
| 10,000 | 300 | 19.7 s | +377 MiB |
| 10,000 | 1,000 | 63.4 s | +1,190 MiB |
| 10,000 | 3,000 | 220.0 s | +3,203 MiB |

A 40,000-key catalog would extrapolate to tens of GB of index memory.

The memory and build time above are only part of it: because user uploads define the schema, there is no fixed field list to index against, so the set of indexes keeps growing with the data instead of staying fixed.

## Reshape Keys Into Values

The variety lives in the key position, where each distinct key forces its own index. Move it to the value position and it stops creating new indexes. Reshape the payload into one array of `{key, value}` objects under a fixed field (the entity-attribute-value shape). You do this once, in your ingest code, before upserting.

```text
{ "vendor": "acme", "screen_size": "27in" }
        ↓  reshape in your code
{ "attrs": [ {"key": "vendor",      "value": "acme"},
             {"key": "screen_size", "value": "27in"} ] }
```

Every point now carries the same field names: `attrs`, and inside it `key` and `value`. That set never grows. `"vendor"` and `"screen_size"` are now string values in the `key` field, so a new attribute name is just another value to store, not a new index.

Index those two fields once, at setup, before ingesting:

```python
client.create_payload_index(
    collection_name="catalog", field_name="attrs[].key",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
client.create_payload_index(
    collection_name="catalog", field_name="attrs[].value",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

Upsert points in the reshaped form. Each raw attribute becomes one entry in the array:

```python
client.upsert(
    collection_name="catalog",
    points=[
        models.PointStruct(
            id=1, vector=[0.1] * 128,
            payload={"attrs": [
                {"key": "vendor", "value": "acme"},
                {"key": "refresh_rate", "value": "144"},
            ]},
        ),
    ],
)
```

The index count is now fixed at two, no matter how many distinct keys the data has. On the same 10,000-point collection, the two indexes build in 0.2 s and add 24 MiB, against 63 s and 1,190 MiB for one index per key at 1,000 keys. Ingest never creates an index again.

## Tie Key to Value With a Nested Filter

Filtering `attrs[].key` as `"refresh_rate"` and `attrs[].value` as `"144"` with two independent conditions has a trap: Qdrant matches a point where *some* element has that key and *some* element has that value, not necessarily the same element. A monitor with `refresh_rate` of 60 and `weight` of 144 would match.

The [nested filter](/documentation/search/filtering/#nested-object-filter) fixes this. It evaluates the inner filter against each array element on its own, so both conditions must hold within one element.

```python
results = client.query_points(
    collection_name="catalog",
    query_filter=models.Filter(
        must=[
            models.NestedCondition(
                nested=models.Nested(
                    key="attrs",
                    filter=models.Filter(must=[
                        models.FieldCondition(
                            key="key", match=models.MatchValue(value="refresh_rate")),
                        models.FieldCondition(
                            key="value", match=models.MatchValue(value="144")),
                    ]),
                )
            )
        ]
    ),
)
```

Inside `nested`, the inner keys are relative to the array element: `key`, not `attrs[].key`. A point matches if at least one element satisfies the whole inner filter. To require two different attributes, use two `nested` blocks in the outer `must`.

## Keep Value Types for Ranges

The string array handles exact match, but strings have no numeric ordering, so it rules out range queries like `price` below 500. Split attributes by value type into parallel arrays, one per type: strings, numbers, and booleans, each indexed with the schema that fits.

`reshape` takes one raw payload dict (the attributes as they arrive) and sorts each entry into the array for its type:

```python
def reshape(raw: dict) -> dict:
    """Sort a raw payload's attributes into one array per value type."""
    strings, numbers, bools = [], [], []
    for key, value in raw.items():
        # bool is a subclass of int in Python, so check it first
        if isinstance(value, bool):
            bools.append({"key": key, "value": value})
        elif isinstance(value, (int, float)):
            numbers.append({"key": key, "value": float(value)})
        else:
            strings.append({"key": key, "value": value})
    return {"attrs": strings, "attrs_num": numbers, "attrs_bool": bools}
```

A payload of mixed types splits into one array per type:

```python
reshape({"vendor": "acme", "price": 499, "in_stock": True})
# {
#     "attrs":      [{"key": "vendor",   "value": "acme"}],
#     "attrs_num":  [{"key": "price",    "value": 499.0}],
#     "attrs_bool": [{"key": "in_stock", "value": True}],
# }
```

Index the numeric array's key as a keyword and its value as a float, which supports `Range`:

```python
client.create_payload_index(
    collection_name="catalog", field_name="attrs_num[].key",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
client.create_payload_index(
    collection_name="catalog", field_name="attrs_num[].value",
    field_schema=models.PayloadSchemaType.FLOAT,
)
```

A range query is a `nested` filter on `attrs_num` with a `Range` condition on `value`:

```python
models.NestedCondition(
    nested=models.Nested(
        key="attrs_num",
        filter=models.Filter(must=[
            models.FieldCondition(key="key", match=models.MatchValue(value="price")),
            models.FieldCondition(key="value", range=models.Range(lt=500)),
        ]),
    )
)
```

This is why the array of objects is the spine: one shape handles both exact match and ranges, so copying just this is correct for either. The split extends to [every payload index type](/documentation/manage-data/indexing/#payload-index): boolean, datetime, geo, uuid, and full-text values each get their own typed array, indexed with the matching schema and queried through the same nested filter.

## Optimize Exact Match by Concatenating key=value

For categorical attributes that only ever need exact match, you can store each as a single `key=value` keyword term in a flat string array, indexed once.

```python
# Payload: {"attrs_flat": ["vendor=acme", "screen_size=27in"]}
client.create_payload_index(
    collection_name="catalog", field_name="attrs_flat",
    field_schema=models.PayloadSchemaType.KEYWORD,
)

results = client.query_points(
    collection_name="catalog",
    query_filter=models.Filter(must=[
        models.FieldCondition(
            key="attrs_flat", match=models.MatchValue(value="vendor=acme")),
    ]),
)
```

One index instead of two, no nested block, and the same-element trap disappears by construction: the key and value are bound in one term. It is also faster. Measured on the same instance, median over 300 exact-match lookups:

| Points | Shape | Indexes | Median |
|---|---|---|---|
| 10,000 | nested key-value | 2 | 1.54 ms |
| 10,000 | concatenated | 1 | 1.01 ms |
| 100,000 | nested key-value | 2 | 2.22 ms |
| 100,000 | concatenated | 1 | 1.32 ms |

Concatenation is 30 to 40% faster on the median, and the gap widens as points grow. The limits are real: it does exact match only, so no ranges; its terms are distinct `key=value` pairs, so the index bloats when values are high-cardinality; values lose their type; and "does key X exist" needs a text-prefix index or a separate `attr_keys` array. It fits categorical, exact-match attributes, not the whole problem.

## When to Use Which

The real design mixes shapes on a single point. Route each attribute by its query type, not by preference.

| Query need | Shape |
|---|---|
| Categorical, exact match only | Concatenated `key=value` term, one keyword index |
| Ranges, datetimes, high-cardinality values | Typed `{key, value}` array plus a nested filter |
| A few hot fields queried on every request | Dedicated top-level payload index |

One point can carry both `attrs_flat` and the typed arrays. One limit is specific to this pattern: `has_id` is not supported inside `nested`. If you need it, put it in an adjacent `must` clause alongside the nested block.

## Related Reading

- [Nested object filter](/documentation/search/filtering/#nested-object-filter): full mechanics of the nested condition.
- [Payload index](/documentation/manage-data/indexing/#payload-index): index types and when each applies.
- [Multitenancy](/documentation/manage-data/multitenancy/): a sibling data-modeling pattern for partitioning a collection.
