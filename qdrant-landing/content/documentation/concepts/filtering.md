---
title: Filtering
weight: 60
aliases:
  - ../filtering
---

# Filtering

With Qdrant, you can set conditions when searching or retrieving points.
For example, you can impose conditions on both the [payload](/documentation/concepts/payload/) and the `id` of the point.

Setting additional conditions is important when it is impossible to express all the features of the object in the embedding.
Examples include a variety of business requirements: stock availability, user location, or desired price range.

## Related Content
|[A Complete Guide to Filtering in Vector Search](/articles/vector-search-filtering/)|Developer advice on proper usage and advanced practices.|
|-|-|

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

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-must-filter/" >}}

Filtered points would be:

```json
[{ "id": 2, "city": "London", "color": "red" }]
```

When using `must`, the clause becomes `true` only if every condition listed inside `must` is satisfied.
In this sense, `must` is equivalent to the operator `AND`.

### Should

Example:

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-should-filter/" >}}

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

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-must-not-filter/" >}}

Filtered points would be:

```json
[
  { "id": 5, "city": "Moscow", "color": "green" },
  { "id": 6, "city": "Moscow", "color": "blue" }
]
```

When using `must_not`, the clause becomes `true` if none of the conditions listed inside `should` is satisfied.
In this sense, `must_not` is equivalent to the expression `(NOT A) AND (NOT B) AND (NOT C)`.

### Clauses combination

It is also possible to use several clauses simultaneously:

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-multiple-clauses-combination/" >}}

Filtered points would be:

```json
[
  { "id": 1, "city": "London", "color": "green" },
  { "id": 3, "city": "London", "color": "blue" }
]
```

In this case, the conditions are combined by `AND`.

Also, the conditions could be recursively nested. Example:

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-nested-clauses-filter/" >}}

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

{{< code-snippet path="/documentation/headless/snippets/filter-condition/match-keyword/" >}}

For the other types, the match condition will look exactly the same, except for the type used:

{{< code-snippet path="/documentation/headless/snippets/filter-condition/match-integer/" >}}

The simplest kind of condition is one that checks if the stored value equals the given one.
If several values are stored, at least one of them should match the condition.
You can apply it to [keyword](/documentation/concepts/payload/#keyword), [integer](/documentation/concepts/payload/#integer) and [bool](/documentation/concepts/payload/#bool) payloads.

### Match Any

*Available as of v1.1.0*

In case you want to check if the stored value is one of multiple values, you can use the Match Any condition.
Match Any works as a logical OR for the given values. It can also be described as a `IN` operator.

You can apply it to [keyword](/documentation/concepts/payload/#keyword) and [integer](/documentation/concepts/payload/#integer) payloads.

Example:

{{< code-snippet path="/documentation/headless/snippets/filter-condition/match-any/" >}}

In this example, the condition will be satisfied if the stored value is either `black` or `yellow`.

If the stored value is an array, it should have at least one value matching any of the given values. E.g. if the stored value is `["black", "green"]`, the condition will be satisfied, because `"black"` is in `["black", "yellow"]`.


### Match Except

*Available as of v1.2.0*

In case you want to check if the stored value is not one of multiple values, you can use the Match Except condition.
Match Except works as a logical NOR for the given values.
It can also be described as a `NOT IN` operator.

You can apply it to [keyword](/documentation/concepts/payload/#keyword) and [integer](/documentation/concepts/payload/#integer) payloads.

Example:

{{< code-snippet path="/documentation/headless/snippets/filter-condition/match-except/" >}}

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

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-filter-on-nested-fields/" >}}

You can also search through arrays by projecting inner values using the `[]` syntax.

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-filter-on-nested-array/" >}}

This query would only output the point with id 2 as only Japan has a city with population greater than 9.0.

And the leaf nested field can also be an array.

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-filter-on-nested-array-match/" >}}

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

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-filter-with-multiple-nested/" >}}

This happens because both points are matching the two conditions:

- the "t-rex" matches food=meat on `diet[1].food` and likes=true on `diet[1].likes`
- the "diplodocus" matches food=meat on `diet[1].food` and likes=true on `diet[0].likes`

To retrieve only the points which are matching the conditions on an array element basis, that is the point with id 1 in this example, you would need to use a nested object filter.

Nested object filters allow arrays of objects to be queried independently of each other.

It is achieved by using the `nested` condition type formed by a payload key to focus on and a filter to apply.

The key should point to an array of objects and can be used with or without the bracket notation ("data" or "data[]").

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-filter-with-nested-clause/" >}}

The matching logic is modified to be applied at the level of an array element within the payload.

Nested filters work in the same way as if the nested filter was applied to a single element of the array at a time.
Parent document is considered to match the condition if at least one element of the array matches the nested filter.

**Limitations**

The `has_id` condition is not supported within the nested object filter. If you need it, place it in an adjacent `must` clause.

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-filter-with-nested-clause-and-has-id/" >}}

### Full Text Match

*Available as of v0.10.0*

A special case of the `match` condition is the `text` match condition.
It allows you to search for a specific substring, token or phrase within the text field.

Exact texts that will match the condition depend on full-text index configuration.
Configuration is defined during the index creation and describe at [full-text index](/documentation/concepts/indexing/#full-text-index).

If there is no full-text index for the field, the condition will work as exact substring match.

{{< code-snippet path="/documentation/headless/snippets/filter-condition/full-text-match/" >}}

If the query has several words, then the condition will be satisfied only if all of them are present in the text.

### Range

{{< code-snippet path="/documentation/headless/snippets/filter-condition/range/" >}}

The `range` condition sets the range of possible values for stored payload values.
If several values are stored, at least one of them should match the condition.

Comparisons that can be used:

- `gt` - greater than
- `gte` - greater than or equal
- `lt` - less than
- `lte` - less than or equal

Can be applied to [float](/documentation/concepts/payload/#float) and [integer](/documentation/concepts/payload/#integer) payloads.

### Datetime Range

The datetime range is a unique range condition, used for [datetime](/documentation/concepts/payload/#datetime) payloads, which supports RFC 3339 formats. 
You do not need to convert dates to UNIX timestaps. During comparison, timestamps are parsed and converted to UTC.

_Available as of v1.8.0_

{{< code-snippet path="/documentation/headless/snippets/filter-condition/datetime-range/" >}}

### UUID Match

_Available as of v1.11.0_

Matching of UUID values works similarly to the regular `match` condition for strings.
Functionally, it will work with `keyword` and `uuid` indexes exactly the same, but `uuid` index is more memory efficient.

{{< code-snippet path="/documentation/headless/snippets/filter-condition/match-uuid/" >}}

### Geo

#### Geo Bounding Box

{{< code-snippet path="/documentation/headless/snippets/filter-condition/geo-bounding-box/" >}}

It matches with `location`s inside a rectangle with the coordinates of the upper left corner in `bottom_right` and the coordinates of the lower right corner in `top_left`.

#### Geo Radius

{{< code-snippet path="/documentation/headless/snippets/filter-condition/geo-radius/" >}}

It matches with `location`s inside a circle with the `center` at the center and a radius of `radius` meters.

If several values are stored, at least one of them should match the condition.
These conditions can only be applied to payloads that match the [geo-data format](/documentation/concepts/payload/#geo).

#### Geo Polygon
Geo Polygons search is useful for when you want to find points inside an irregularly shaped area, for example a country boundary or a forest boundary. A polygon always has an exterior ring and may optionally include interior rings. A lake with an island would be an example of an interior ring. If you wanted to find points in the water but not on the island, you would make an interior ring for the island. 

When defining a ring, you must pick either a clockwise or counterclockwise ordering for your points.  The first and last point of the polygon must be the same. 

Currently, we only support unprojected global coordinates (decimal degrees longitude and latitude) and we are datum agnostic.

{{< code-snippet path="/documentation/headless/snippets/filter-condition/geo-poligon/" >}}

A match is considered any point location inside or on the boundaries of the given polygon's exterior but not inside any interiors.

If several location values are stored for a point, then any of them matching will include that point as a candidate in the resultset. 
These conditions can only be applied to payloads that match the [geo-data format](/documentation/concepts/payload/#geo).

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

{{< code-snippet path="/documentation/headless/snippets/filter-condition/values-count/" >}}

The result would be:

```json
[{ "id": 2, "name": "product B", "comments": ["meh", "expected more", "ok"] }]
```

If stored value is not an array - it is assumed that the amount of values is equals to 1.

### Is Empty

Sometimes it is also useful to filter out records that are missing some value.
The `IsEmpty` condition may help you with that:

{{< code-snippet path="/documentation/headless/snippets/filter-condition/is-empty/" >}}

This condition will match all records where the field `reports` either does not exist, or has `null` or `[]` value.

<aside role="status">The <b>IsEmpty</b> is often useful together with the logical negation <b>must_not</b>. In this case all non-empty values will be selected.</aside>

### Is Null

It is not possible to test for `NULL` values with the <b>match</b> condition. 
We have to use `IsNull` condition instead:

{{< code-snippet path="/documentation/headless/snippets/filter-condition/is-null/" >}}

This condition will match all records where the field `reports` exists and has `NULL` value.


### Has id

This type of query is not related to payload, but can be very useful in some situations.
For example, the user could mark some specific search results as irrelevant, or we want to search only among the specified points.

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-has-id-filter/" >}}

Filtered points would be:

```json
[
  { "id": 1, "city": "London", "color": "green" },
  { "id": 3, "city": "London", "color": "blue" },
  { "id": 5, "city": "Moscow", "color": "green" }
]
```


### Has vector

*Available as of v1.13.0*

This condition enables filtering by the presence of a given named vector on a point.

For example, if we have two named vector in our collection.

```http
PUT /collections/{collection_name}
{
    "vectors": {
        "image": {
            "size": 4,
            "distance": "Dot"
        },
        "text": {
            "size": 8,
            "distance": "Cosine"
        }
    },
    "sparse_vectors": {
        "sparse-image": {},
        "sparse-text": {},
    },
}
```

Some points in the collection might have all vectors, some might have only a subset of them.

<aside role="status">If your collection does not have named vectors, use an empty (<code>""</code>) name.</aside>

This is how you can search for points which have the dense `image` vector defined:

{{< code-snippet path="/documentation/headless/snippets/scroll-points/with-filter-has-vector/" >}}
