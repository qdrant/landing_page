---
title: Filtering
weight: 27
---

Qdrant allows you to set the conditions to be used when searching or retrieving points.
You can impose conditions both on the [payload](../payload) and on, for example, the `id` of the point.

The use of additional conditions is important when, for example, it is impossible to express all the features of the object in the embedding.
Examples include a variety of business requirements: stock availability, user location, or desired price range.

## Filtering causes

Qdrant allows you to combine conditions in causes.
Clauses are different logical operations, such as `OR`, `AND`, and `NOT`.
Clauses can be recursively nested into each other so that you can reproduce an arbitrary boolean expression.

Let's take a look at the clauses implemented in Qdrant.

Suppose we have a set of points with the following payload:

```json
[
    {"id": 1, "city": "London", "color": "green"},
    {"id": 2, "city": "London", "color": "red"},
    {"id": 3, "city": "London", "color": "blue"},
    {"id": 4, "city": "Berlin", "color": "red"},
    {"id": 5, "city": "Moscow", "color": "green"},
    {"id": 6, "city": "Moscow", "color": "blue"}
]
```

### Must

Example:

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "must": [
            { "key": "city", "match": { "value": "London" } },
            { "key": "color", "match": { "value": "red" } }
        ]
    }
  ...
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient(host="localhost", port=6333)

client.scroll(
    collection_name="{collection_name}", 
    scroll_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="city", 
                match=models.MatchValue(value="London"),
            ),
            models.FieldCondition(
                key="color",
                match=models.MatchValue(value="red"),
            ),
        ]
    ),
)
```

Filtered points would be:

```json
[
    {"id": 2, "city": "London", "color": "red"}
]
```


When using `must`, the clause becomes `true` only if every condition listed inside `must` is satisfied.
In this sense, `must` is equivalent to the operator `AND`.

### Should

Example:

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "should": [
            { "key": "city", "match": { "value": "London" } },
            { "key": "color", "match": { "value": "red" } }
        ]
    }
  ...
}
```

```python
client.scroll(
    collection_name="{collection_name}", 
    scroll_filter=models.Filter(
        should=[
            models.FieldCondition(
                key="city", 
                match=models.MatchValue(value="London"),
            ),
            models.FieldCondition(
                key="color", 
                match=models.MatchValue(value="red"),
            ),
        ]
    ),
)
```

Filtered points would be:

```json
[
    {"id": 1, "city": "London", "color": "green"},
    {"id": 2, "city": "London", "color": "red"},
    {"id": 3, "city": "London", "color": "blue"},
    {"id": 4, "city": "Berlin", "color": "red"}
]
```

When using `should`, the clause becomes `true` if at least one condition listed inside `should` is satisfied.
In this sense, `should` is equivalent to the operator `OR`.


### Must Not

Example:

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "must_not": [
            { "key": "city", "match": { "value": "London" } },
            { "key": "color", "match": { "value": "red" } }
        ]
    }
  ...
}
```

```python
client.scroll(
    collection_name="{collection_name}", 
    scroll_filter=models.Filter(
        must_not=[
            models.FieldCondition(
                key="city", 
                match=models.MatchValue(value="London")
            ),
            models.FieldCondition(
                key="color", 
                match=models.MatchValue(value="red")
            ),
        ]
    ),
)
```

Filtered points would be:

```json
[
    {"id": 5, "city": "Moscow", "color": "green"},
    {"id": 6, "city": "Moscow", "color": "blue"}
]
```

When using `must_not`, the clause becomes `true` if none if the conditions listed inside `should` is satisfied.
In this sense, `must_not` is equivalent to the expression `(NOT A) AND (NOT B) AND (NOT C)`.


### Clauses combination

It is also possible to use several clauses simultaneously:

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "must": [
            { "key": "city", "match": { "value": "London" } }
        ],
        "must_not": [
            { "key": "color", "match": { "value": "red" } }
        ]
    }
  ...
}
```

```python
client.scroll(
    collection_name="{collection_name}", 
    scroll_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="city", 
                match=models.MatchValue(value="London")
            ),
        ],
        must_not=[
            models.FieldCondition(
                key="color", 
                match=models.MatchValue(value="red")
            ),
        ],
    ),
)
```

Filtered points would be:

```json
[
    {"id": 1, "city": "London", "color": "green"},
    {"id": 3, "city": "London", "color": "blue"},
]
```

In this case, the conditions are combined by `AND`.

Also, the conditions could be recursively nested. Example:

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "must_not": [
            {
                "must": [
                    { "key": "city", "match": { "value": "London" } },
                    { "key": "color", "match": { "value": "red" } }
                ]
            }
        ]
    }
  ...
}
```

```python
client.scroll(
    collection_name="{collection_name}", 
    scroll_filter=models.Filter(
        must_not=[
            models.Filter(
                must=[
                    models.FieldCondition(
                        key="city", 
                        match=models.MatchValue(value="London")
                    ),
                    models.FieldCondition(
                        key="color", 
                        match=models.MatchValue(value="red")
                    ),
                ],
            ),
        ],
    ),
)
```

Filtered points would be:

```json
[
    {"id": 1, "city": "London", "color": "green"},
    {"id": 3, "city": "London", "color": "blue"},
    {"id": 4, "city": "Berlin", "color": "red"},
    {"id": 5, "city": "Moscow", "color": "green"},
    {"id": 6, "city": "Moscow", "color": "blue"}
]
```

## Filtering conditions

Different types of values in payload correspond to different kinds of queries that we can apply to them.
Let's look at the existing condition variants and what types of data they apply to.

### Match

```json
{ 
    "key": "color",
    "match": {
        "value": "red" 
    }
}
```

```python
models.FieldCondition(
    key="color",
    match=models.MatchValue(value="red"),
)
```

For the other types, the match condition will look exactly the same, except for the type used:

```json
{ 
    "key": "count",
    "match": {
        "value": 0 
    }
}
```

```python
models.FieldCondition(
    key="count",
    match=models.MatchValue(value=0),
)
```


The simplest kind of condition is one that checks if the stored value equals the given one.
If several values are stored, at least one of them should match the condition.
You can apply it to [keyword](../payload/#keyword), [integer](../payload/#integer) and [bool](../payload/#bool) payloads.

### Full Text Match

*Avaliable since version 0.10.0*

A special case of the `match` condition is the `text` match condition.
It allows you to search for a specific substring, token or phrase within the text field.

Exact texts that will match the condition depend on full-text index configuration.
Configuration is defined during the index creation and describe at [full-text index](../indexing/#full-text-index).

If there is no full-text index for the field, the condition will work as exact substring match.

```json
{ 
    "key": "description",
    "match": {
        "text": "good cheap" 
    }
}
```

```python
models.FieldCondition(
    key="description",
    match=models.MatchText(text="good cheap"),
)
```

If the query has several words, the condition will be satisfied if all of them are present in the text.

### Range

```json
{
    "key": "price",
    "range": {
        "gt": null,
        "gte": 100.0,
        "lt": null,
        "lte": 450.0
    }
}
```

```python
models.FieldCondition(
    key="price",
    range=models.Range(
        gt=None, 
        gte=100.0, 
        lt=None, 
        lte=450.0,
    ),
)
```

The `range` condition sets the range of possible values for stored payload values.
If several values are stored, at least one of them should match the condition.

Comparisons that can be used: 

- `gt` - greater than
- `gte` - greater than or equal
- `lt` - less than
- `lte` - less than or equal

Can be applied to [float](../payload/#float) and [integer](../payload/#integer) payloads.

### Geo

#### Geo Bounding Box 

```json
{
    "key": "location",
    "geo_bounding_box": {
        "bottom_right": {
            "lat": 52.495862,
            "lon": 13.455868
        },
        "top_left": {
            "lat": 52.520711,
            "lon": 13.403683
        }
    }
}
```

```python
models.FieldCondition(
    key="location",
    geo_bounding_box=models.GeoBoundingBox(
        bottom_right=models.GeoPoint(
            lat=52.495862,
            lon=13.455868,
        ),
        top_left=models.GeoPoint(
            lat=52.520711,
            lon=13.403683,
        ),
    ),
)
```

It matches with `location`s inside a rectangle with the coordinates of the upper left corner in `bottom_right` and the coordinates of the lower right corner in `top_left`.


#### Geo Radius

```json
{
    "key": "location",
    "geo_radius": {
        "center": {
            "lat": 52.520711,
            "lon": 13.403683
        },
        "radius": 1000.0
    }
}
```

```python
models.FieldCondition(
    key="location",
    geo_radius=models.GeoRadius(
        center=models.GeoPoint(
            lat=52.520711,
            lon=13.403683,
        ),
        radius=1000.0,
    ),
)
```


It matches with `location`s inside a circle with the `center` at the center and a radius of `radius` meters.

If several values are stored, at least one of them should match the condition.
These conditions can only be applied to payloads that match the [geo-data format](../payload/#geo).

### Values count

In addition to the direct value comparison, it is also possible to filter by the amount of values.

For example, given the data:

```json
[
    {"id": 1, "name": "product A", "comments": ["Very good!", "Excellent"]},
    {"id": 2, "name": "product B", "comments": ["meh", "expected more", "ok"]},
]
```

We can perform the search only among the items with more than two comments:

```json
{
    "key": "comments",
    "values_count": {
        "gt": 2
    }
}
```

```python
models.FieldCondition(
    key="comments",
    values_count=models.ValuesCount(gt=2),
)
```

The result would be:

```json
[
    {"id": 2, "name": "product B", "comments": ["meh", "expected more", "ok"]},
]
```

If stored value is not an array - it is assumed that the amount of values is equals to 1.

### Is Empty

Sometimes it is also useful to filter out records that are missing some value.
The `IsEmpty` condition may help you with that:

```json
{
    "is_empty": {
        "key": "reports"
    }
}
```

```python
models.IsEmptyCondition(
    is_empty=models.PayloadField(key="reports"),
)
```

This condition will match all records where the field `reports` either does not exist, or have `NULL` or `[]` value.

<aside role="status">The <b>IsEmpty</b> is often useful together with the logical negation <b>must_not</b>. In this case all non-empty values will be selected.</aside>

### Has id

This type of query is not related to payload, but can be very useful in some situations.
For example, the user could mark some specific search results as irrelevant, or we want to search only among the specified points.

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "must": [
            { "has_id": [1,3,5,7,9,11] }
        ]
    }
  ...
}
```

```python
client.scroll(
    collection_name="{collection_name}", 
    scroll_filter=models.Filter(
        must=[
            models.HasIdCondition(has_id=[1, 3, 5, 7, 9, 11]),
        ],
    ),
)
```


Filtered points would be:

```json
[
    {"id": 1, "city": "London", "color": "green"},
    {"id": 3, "city": "London", "color": "blue"},
    {"id": 5, "city": "Moscow", "color": "green"},
]
```
