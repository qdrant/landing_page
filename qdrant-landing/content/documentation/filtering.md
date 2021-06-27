---
title: Filtering
weight: 27
---

Qdrant allows you to set the conditions to be used when searching or retrieving points.
You can impose conditions both on the [payload](../payload) that corresponds to the [point](../points) and on, for example, the `id` of the point.

The use of additional conditions is important when, for example, it is impossible to express all the features of the object in the embedding.
Examples include a variety of business requirements: stock availability, user location, or desired price range.

## Filtering causes

Qdrant allows you to combine conditions in causes.
Clauses are different logical operations, such as `OR`, `AND` and `NOT`.
Causes can be recursively nested into each other, so that you can reproduce an arbitrary boolean expressions.

Let's take a look at the clauses implemented in Qdrant.

Suppose we have a set of points with the following payload:

```
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

```
{
    "filter": {
        "must": [
            { "key": "city", "match": { "keyword": "London" } },
            { "key": "color", "match": { "keyword": "red" } }
        ]
    }
  ...
}
```

Filtered points would be:

```
[
    {"id": 2, "city": "London", "color": "red"}
]
```


When using `must`, the clause takes a true value only if every condition listed inside `must` is satisfied.
In this sense `must` is equivalent to the operator `AND`.

### Should

Example:

```
{
    "filter": {
        "should": [
            { "key": "city", "match": { "keyword": "London" } },
            { "key": "color", "match": { "keyword": "red" } }
        ]
    }
  ...
}
```

Filtered points would be:

```
[
    {"id": 1, "city": "London", "color": "green"},
    {"id": 2, "city": "London", "color": "red"},
    {"id": 3, "city": "London", "color": "blue"},
    {"id": 4, "city": "Berlin", "color": "red"}
]
```

When using `should`, the clause takes a true value if at least one condition listed inside `should` is satisfied.
In this sense `should` is equivalent to the operator `OR`.


### Must Not

Example:

```
{
    "filter": {
        "must_not": [
            { "key": "city", "match": { "keyword": "London" } },
            { "key": "color", "match": { "keyword": "red" } }
        ]
    }
  ...
}
```

Filtered points would be:

```
[
    {"id": 5, "city": "Moscow", "color": "green"},
    {"id": 6, "city": "Moscow", "color": "blue"}
]
```

When using `must_not`, the clause takes a true value if none if the conditions listed inside `should` is satisfied.
In this sense `must_not` is equivalent to the expression `(NOT A) AND (NOT B) AND (NOT C)`.


### Clauses combination

It is also possible to use several clauses simultaneously:

```
{
    "filter": {
        "must": [
            { "key": "city", "match": { "keyword": "London" } }
        ],
        "must_not": [
            { "key": "color", "match": { "keyword": "red" } }
        ]
    }
  ...
}
```

Filtered points would be:

```
[
    {"id": 1, "city": "London", "color": "green"},
    {"id": 3, "city": "London", "color": "blue"},
]
```

In this case, the conditions are combined by `AND`.

Also the conditions could be recursively nested. Example:

```
{
    "filter": {
        "must_not": [
            {
                "must": [
                    { "key": "city", "match": { "keyword": "London" } },
                    { "key": "color", "match": { "keyword": "red" } }
                ]
            }
        ]
    }
  ...
}
```

Filtered points would be:

```
[
    {"id": 1, "city": "London", "color": "green"},
    {"id": 3, "city": "London", "color": "blue"},
    {"id": 4, "city": "Berlin", "color": "red"},
    {"id": 5, "city": "Moscow", "color": "green"},
    {"id": 6, "city": "Moscow", "color": "blue"}
]
```

## Filtering conditions

Different types of values in payload correspond to different types of queries that can be applied to them.
Let's look at the existing condition variants and what types of data they apply to.

### Match

```
{ 
    "key": "color",
    "match": {
        "keyword": "red" 
    }
}
```

```
{ 
    "key": "count",
    "match": {
        "integer": 0 
    }
}
```


The simplest kind of condition that checks if the stored value equals to the given one.
If several values are stored, at least one of them should match the condition.
Can be applied to payloads of type `keyword` or `integer`.

### Range

```
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

The `range` condition sets the range of possible values for stored payload values.
If several values are stored, at least one of them should match the condition.

Comparisons that can be used: 

- `gt` - greater than
- `gte` - greater than or equal
- `lt` - less than
- `lte` - less than or equal

Can be applied to payloads of type `float` or `integer`.

### Geo

```
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


Matches with `location`, which are inside a rectangle with the coordinates of the upper left corner in `bottom_right` and the coordinates of the lower right corner in `top_left`.


```
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

Matches with `location`, which is inside a circle with the `center` at the center and a radius of `radius` meters.

If several values are stored, at least one of them should match the condition.
These conditions can only be applied to payloads of the `geo` type.


### Has id

This type of query is not related to payload, but can be very useful in some situations.
For example, the user could mark some specific search results as not interesting, or we want to search only among the specified points.

```
{
    "filter": {
        "must": [
            { "has_id": [1,3,5,7,9,11] }
        ]
    }
  ...
}
```


Filtered points would be:

```
[
    {"id": 1, "city": "London", "color": "green"},
    {"id": 3, "city": "London", "color": "blue"},
    {"id": 5, "city": "Moscow", "color": "green"},
]
```
