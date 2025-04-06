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

For example, you will get an empty output if you apply the [range condition](/documentation/concepts/filtering/#range) on the string data.

However, arrays (multiple values of the same type) are treated a little bit different. When we apply a filter to an array, it will succeed if at least one of the values inside the array meets the condition.

The filtering process is discussed in detail in the section [Filtering](/documentation/concepts/filtering/).

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

{{< code-snippet path="/documentation/headless/snippets/insert-points/with-payload/" >}}

## Update payload

Updating payloads in Qdrant offers flexible methods to manage vector metadata. The **set payload** method updates specific fields while keeping others unchanged, while the **overwrite** method replaces the entire payload. Developers can also use **clear payload** to remove all metadata or delete fields to remove specific keys without affecting the rest. These options provide precise control for adapting to dynamic datasets.

### Set payload

Set only the given payload values on a point.

REST API ([Schema](https://api.qdrant.tech/api-reference/points/set-payload)):

{{< code-snippet path="/documentation/headless/snippets/set-payload/by-point-id/" >}}

You don't need to know the ids of the points you want to modify. The alternative
is to use filters.

{{< code-snippet path="/documentation/headless/snippets/set-payload/by-filter/" >}}

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

{{< code-snippet path="/documentation/headless/snippets/set-payload/by-nested-key/" >}}

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

{{< code-snippet path="/documentation/headless/snippets/overwrite-payload/by-point-id/" >}}

Like [set payload](#set-payload), you don't need to know the ids of the points
you want to modify. The alternative is to use filters.

### Clear payload

This method removes all payload keys from specified points

REST API ([Schema](https://api.qdrant.tech/api-reference/points/clear-payload)):

{{< code-snippet path="/documentation/headless/snippets/clear-payload/simple/" >}}

<aside role="status">
You can also use <code>models.FilterSelector</code> to remove the points matching given filter criteria, instead of providing the ids.
</aside>

### Delete payload keys

Delete specific payload keys from points.

REST API ([Schema](https://api.qdrant.tech/api-reference/points/delete-payload)):

{{< code-snippet path="/documentation/headless/snippets/delete-payload/by-point-id/" >}}

Alternatively, you can use filters to delete payload keys from the points.

{{< code-snippet path="/documentation/headless/snippets/delete-payload/by-filter/" >}}

## Payload indexing

To search more efficiently with filters, Qdrant allows you to create indexes for payload fields by specifying the name and type of field it is intended to be.

The indexed fields also affect the vector index. See [Indexing](/documentation/concepts/indexing/) for details.

In practice, we recommend creating an index on those fields that could potentially constrain the results the most.
For example, using an index for the object ID will be much more efficient, being unique for each record, than an index by its color, which has only a few possible values.

In compound queries involving multiple fields, Qdrant will attempt to use the most restrictive index first.

To create index for the field, you can use the following:

REST API ([Schema](https://api.qdrant.tech/api-reference/indexes/create-field-index))

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/simple-keyword/" >}}

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

## Facet counts

*Available as of v1.12.0*

Faceting is a special counting technique that can be used for various purposes:
- Know which unique values exist for a payload key.
- Know the number of points that contain each unique value.
- Know how restrictive a filter would become by matching a specific value.

Specifically, it is a counting aggregation for the values in a field, akin to a `GROUP BY` with `COUNT(*)` commands in SQL.

These results for a specific field is called a "facet". For example, when you look at an e-commerce search results page, you might see a list of brands on the sidebar, showing the number of products for each brand. This would be a facet for a `"brand"` field.

<aside role="status">In Qdrant you can facet on a field <strong>only</strong> if you have created a field index that supports <code>MatchValue</code> conditions for it, like a <code>keyword</code> index.</aside>

To get the facet counts for a field, you can use the following:

<aside role="status">By default, the number of <code>hits</code> returned is limited to 10. To change this, use the <code>limit</code> parameter. Keep this in mind when checking the number of unique values a payload field contains.</aside>

REST API ([Facet](https://api.qdrant.tech/v-1-13-x/api-reference/points/facet))

{{< code-snippet path="/documentation/headless/snippets/facet-counts/simple-with-filter/" >}}

The response will contain the counts for each unique value in the field:

```json
{
  "response": {
    "hits": [
      {"value": "L", "count": 19},
      {"value": "S", "count": 10},
      {"value": "M", "count": 5},
      {"value": "XL", "count": 1},
      {"value": "XXL", "count": 1}
    ]
  },
  "time": 0.0001
}
```

The results are sorted by the count in descending order, then by the value in ascending order.
Only values with non-zero counts will be returned.

By default, the way Qdrant the counts for each value is approximate to achieve fast results. This should accurate enough for most cases, but if you need to debug your storage, you can use the `exact` parameter to get exact counts.

{{< code-snippet path="/documentation/headless/snippets/facet-counts/exact/" >}}
