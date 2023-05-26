---
title: Filtering
weight: 60
---

With Qdrant, you can set conditions when searching or retrieving points.
For example, you can impose conditions on both the [payload](../payload) and the `id` of the point.

Setting additional conditions is important when it is impossible to express all the features of the object in the embedding.
Examples include a variety of business requirements: stock availability, user location, or desired price range.

## Filtering clauses

Qdrant allows you to combine conditions in clauses.
Clauses are different logical operations, such as `OR`, `AND`, and `NOT`.
Clauses can be recursively nested into each other so that you can reproduce an arbitrary boolean expression.

Let's take a look at the clauses implemented in Qdrant.

Suppose we have a set of points with the following payload:

```json
[
  { "id": 1, "city": "London", "color": "green" },
  { "id": 2, "city": "London", "color": "red" },
  { "id": 3, "city": "London", "color": "blue" },
  { "id": 4, "city": "Berlin", "color": "red" },
  { "id": 5, "city": "Moscow", "color": "green" },
  { "id": 6, "city": "Moscow", "color": "blue" }
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
[{ "id": 2, "city": "London", "color": "red" }]
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
  { "id": 1, "city": "London", "color": "green" },
  { "id": 2, "city": "London", "color": "red" },
  { "id": 3, "city": "London", "color": "blue" },
  { "id": 4, "city": "Berlin", "color": "red" }
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
  { "id": 5, "city": "Moscow", "color": "green" },
  { "id": 6, "city": "Moscow", "color": "blue" }
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
  { "id": 1, "city": "London", "color": "green" },
  { "id": 3, "city": "London", "color": "blue" }
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
  { "id": 1, "city": "London", "color": "green" },
  { "id": 3, "city": "London", "color": "blue" },
  { "id": 4, "city": "Berlin", "color": "red" },
  { "id": 5, "city": "Moscow", "color": "green" },
  { "id": 6, "city": "Moscow", "color": "blue" }
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

### Match Any

*Available as of v1.1.0*

In case you want to check if the stored value is one of multiple values, you can use the Match Any condition.
Match Any works as a logical OR for the given values. It can also be described as a `IN` operator.

You can apply it to [keyword](../payload/#keyword) and [integer](../payload/#integer) payloads.

Example:

```json
{
  "key": "color",
  "match": {
    "any": ["black", "yellow"]
  }
}
```

```python
FieldCondition(
    key="color",
    match=models.MatchAny(any=["black", "yellow"]),
)
```

In this example, the condition will be satisfied if the stored value is either `black` or `yellow`.

If the stored value is an array, it should have at least one value matching any of the given values. E.g. if the stored value is `["black", "green"]`, the condition will be satisfied, because `"black"` is in `["black", "yellow"]`.


### Match Except

*Available as of v1.2.0*

In case you want to check if the stored value is not one of multiple values, you can use the Match Except condition.
Match Except works as a logical NOR for the given values.
It can also be described as a `NOT IN` operator.

You can apply it to [keyword](../payload/#keyword) and [integer](../payload/#integer) payloads.

Example:

```json
{
  "key": "color",
  "match": {
    "except": ["black", "yellow"]
  }
}
```

```python
FieldCondition(
    key="color",
    match=models.MatchExcept(**{"except": ["black", "yellow"]}),
)
```

In this example, the condition will be satisfied if the stored value is neither `black` nor `yellow`.

If the stored value is an array, it should have at least one value not matching any of the given values. E.g. if the stored value is `["black", "green"]`, the condition will be satisfied, because `"green"` does not match `"black"` nor `"yellow"`.

### Nested key

*Available as of v1.1.0*

Payloads being arbitrary JSON object, it is likely that you will need to filter on a nested field.

For convenience, we use a syntax similar to what can be found in the [Jq](https://stedolan.github.io/jq/manual/#Basicfilters) project.

Suppose we have a set of points with the following payload:

```json
[
  {
    "id": 1,
    "country": {
      "name": "Germany",
      "cities": [
        {
          "name": "Berlin",
          "population": 3.7,
          "sightseeing": ["Brandenburg Gate", "Reichstag"]
        },
        {
          "name": "Munich",
          "population": 1.5,
          "sightseeing": ["Marienplatz", "Olympiapark"]
        }
      ]
    }
  },
  {
    "id": 2,
    "country": {
      "name": "Japan",
      "cities": [
        {
          "name": "Tokyo",
          "population": 9.3,
          "sightseeing": ["Tokyo Tower", "Tokyo Skytree"]
        },
        {
          "name": "Osaka",
          "population": 2.7,
          "sightseeing": ["Osaka Castle", "Universal Studios Japan"]
        }
      ]
    }
  }
]
```

You can search on a nested field using a dot notation.

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "should": [
            {
                "key": "country.name",
                "match": {
                    "value": "Germany"
                }
            }
        ]
    }
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        should=[
            models.FieldCondition(
                key="country.name",
                match=models.MatchValue(value="Germany")
            ),
        ],
    ),
)
```

You can also search through arrays by projecting inner values using the `[]` syntax.

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "should": [
            {
                "key": "country.cities[].population",
                "range": {
                    "gte": 9.0,
                }
            }
        ]
    }
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        should=[
            models.FieldCondition(
                key="country.cities[].population",
                range=models.Range(
                    gt=None,
                    gte=9.0,
                    lt=None,
                    lte=None,
                ),
            ),
        ],
    ),
)
```

This query would only output the point with id 2 as only Japan has a city with population greater than 9.0.

And the leaf nested field can also be an array.

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "should": [
            {
                "key": "country.cities[].sightseeing",
                "match": {
                    "value": "Osaka Castle"
                }
            }
        ]
    }
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        should=[
            models.FieldCondition(
                key="country.cities[].sightseeing",
                match=models.MatchValue(value="Osaka Castle")
            ),
        ],
    ),
)
```

This query would only output the point with id 2 as only Japan has a city with the "Osaka castke" as part of the sightseeing.

### Nested object filter

*Available as of v1.2.0*

By default, the conditions are taking into account the entire payload of a point.

For instance, given two points with the following payload:

```json
[
  {
    "id": 1,
    "dinosaur": "t-rex",
    "diet": [
      { "food": "leaves", "likes": false},
      { "food": "meat", "likes": true}
    ]
  },
  {
    "id": 2,
    "dinosaur": "diplodocus",
    "diet": [
      { "food": "leaves", "likes": true},
      { "food": "meat", "likes": false}
    ]
  }
]
```

The following query would match both points:

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "must": [
            {
                "key": "diet[].food",
                  "match": {
                    "value": "meat"
                }
            },
            {
                "key": "diet[].likes",
                  "match": {
                    "value": true
                }
            }
        ]
    }
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="diet[].food",
                match=models.MatchValue(value="meat")
            ),
            models.FieldCondition(
                key="diet[].likes",
                match=models.MatchValue(value=True)
            ),
        ],
    ),
)
```

This happens because both points are matching the two conditions:

- the "t-rex" matches food=meat on `diet[1].food` and likes=true on `diet[1].likes`
- the "diplodocus" matches food=meat on `diet[1].food` and likes=true on `diet[0].likes`

To retrieve only the points which are matching the conditions on an array element basis, that is the point with id 1 in this example, you would need to use a nested object filter.

Nested object filters allow arrays of objects to be queried independently of each other.

It is achieved by using the `nested` condition type formed by a payload key to focus on and a filter to apply.

The key should point to an array of objects and can be used with or without the bracket notation ("data" or "data[]").

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "must": [
            "nested": {
                {
                    "key": "diet",
                    "filter":{
                        "must": [
                            {
                                "key": "food",
                                "match": {
                                    "value": "meat"
                                }
                            },
                            {
                                "key": "likes",
                                "match": {
                                    "value": true
                                }
                            }
                        ]
                    }
                }
            }
        ]
    }
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.NestedContainer(
                nested=models.NestedCondition(
                    key="diet",
                    filter=(
                        must=[
                            models.FieldCondition(
                                key="food",
                                match=models.MatchValue(value="meat")
                            ),
                            models.FieldCondition(
                                key="likes",
                                match=models.MatchValue(value=True)
                            ),
                        ]
                    )
                )
            )
        ],
    ),
)
```

The matching logic is modified to be applied at the level of an array element within the payload.

Nested filters work in the same way as if the nested filter was applied to a single element of the array at a time.
Parent document is considered to match the condition if at least one element of the array matches the nested filter.

**Limitations**

The `has_id` condition is not supported within the nested object filter. If you need it, place it in an adjacent `must` clause.

```http
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "must": [
            "nested": {
                {
                    "key": "diet",
                    "filter":{
                        "must": [
                            {
                                "key": "food",
                                "match": {
                                    "value": "meat"
                                }
                            },
                            {
                                "key": "likes",
                                "match": {
                                    "value": true
                                }
                            }
                        ]
                    }
                }
            },
            { "has_id": [1] }
        ]
    }
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.NestedContainer(
                nested=models.NestedCondition(
                    key="diet",
                    filter=(
                        must=[
                            models.FieldCondition(
                                key="food",
                                match=models.MatchValue(value="meat")
                            ),
                            models.FieldCondition(
                                key="likes",
                                match=models.MatchValue(value=True)
                            ),
                        ]
                    )
                )
            )
            models.HasIdCondition(has_id=[1]),
        ],
    ),
)
```

### Full Text Match

*Available as of v0.10.0*

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

If the query has several words, then the condition will be satisfied only if all of them are present in the text.

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
  { "id": 1, "name": "product A", "comments": ["Very good!", "Excellent"] },
  { "id": 2, "name": "product B", "comments": ["meh", "expected more", "ok"] }
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
[{ "id": 2, "name": "product B", "comments": ["meh", "expected more", "ok"] }]
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

This condition will match all records where the field `reports` either does not exist, or has `null` or `[]` value.

<aside role="status">The <b>IsEmpty</b> is often useful together with the logical negation <b>must_not</b>. In this case all non-empty values will be selected.</aside>

### Is Null

It is not possible to test for `NULL` values with the <b>match</b> condition. 
We have to use `IsNull` condition instead:

```json
{
    "is_null": {
        "key": "reports"
    }
}
```

```python
models.IsNullCondition(
    is_null=models.PayloadField(key="reports"),
)
```

This condition will match all records where the field `reports` exists and has `NULL` value.


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
  { "id": 1, "city": "London", "color": "green" },
  { "id": 3, "city": "London", "color": "blue" },
  { "id": 5, "city": "Moscow", "color": "green" }
]
```
