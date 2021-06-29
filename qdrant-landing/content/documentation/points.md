---
title: Points
weight: 24
---

The points are the main entity that Qdrant operates with.
A point is a record consisting of a vector and an optional [payload](../payload).

You can search among the points grouped in one [collection](../collections) on the base of vector similarity.
This procedure is described in more detail in the [search](../search) and [filtering](../filtering) sections.

This section explains how to create and manage vectors.

Any point modification operation is asynchronous and takes place in 2 steps.
At the first stage the operation is written to the Write-ahead-log.

After this moment the service will not lose the data, even if the machine loses power supply.

If the API is called with the `&wait=false` parameter, or if it is not explicitly specified, the client will receive an acknowledgement of receiving data: 

```json
{
    "result": {
        "operation_id": 123,
        "status": "acknowledged"
    },
    "status": "ok",
    "time": 0.000206061
}
```

This does not yet mean that the data is available for retrieval, as it is only added to the collection in the second step.
Actual addition to the collection happens in the background, and if you are doing initial vector loading, we recommend using asynchronous addition to take advantage of pipelining.

If the logic of your application requires a guarantee that the vector will be available for searching immediately after the API execution, then use the flag `?wait=true`. In this case the API will return the result only after the operation is finished:

```json
{
    "result": {
        "operation_id": 0,
        "status": "completed"
    },
    "status": "ok",
    "time": 0.000206061
}
```


## Upload points

To optimize performance, Qdrant supports batch loading of points. I.e. you can load several points into the service in one API call.
This allows you to minimize the overhead of creating a network connection.

The Qdrant API supports two ways of creating batches - record-oriented and column-oriented.
Internally, these options do not differ and are made only for the convenience of interaction.

Create points with REST API :

```
POST /collections/{collection_name}

{
    "upsert_points": {
        "batch": {
            "ids": [1, 2, 3],
            "payloads": [
                {"color": "red"},
                {"color": "green"},
                {"color": "blue"}
            ],
            "vectors": [
                [0.9, 0.1, 0.1],
                [0.1, 0.9, 0.1],
                [0.1, 0.1, 0.9],
            ]
        }
    }
}
```

or record-oriented equivalent:

```
POST /collections/{collection_name}

{
    "upsert_points": {
        "points": [
            {
                "id": 1,
                "payload": {"color": "red"},
                "vector": [0.9, 0.1, 0.1]
            },
            {
                "id": 2,
                "payload": {"color": "green"},
                "vector": [0.1, 0.9, 0.1]
            },
            {
                "id": 3,
                "payload": {"color": "blue"},
                "vector": [0.1, 0.1, 0.9]
            },
        ] 
    }
}
```

<!-- 

The Python client has additional features for loading points.
These include parallel loading, and also loading directly from a numpy file.

```python
``` 

-->

All APIs in Qdrant, including point loading, are idempotent.
This means that executing the same method several times in a row is equivalent to a single execution.

In this case it means that points with the same id will be overwritten when re-uploaded.
Idempotence property is useful if you use, for example, a message queue that doesn't provide exactly-ones guarantee.
Even with such a system, Qdrant ensures data consistency.




## Modify points

You can modify a point in two ways. The first is to modify vector.
Currently you would need to re-upload point in order to modify vector.

The second is not modify payload, for which there are several methods.

#### Set payload

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/update_points)):

```
POST /collections/{collection_name}

{
    "set_payload": {
        "payload": {
            "property1": "string",
            "property2": "string"
        },
        "points": [
            0, 3, 100
        ]
    }
}
```

<!-- 

Python client:

```python
``` 

-->

#### Delete payload keys

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/update_points)):

```
POST /collections/{collection_name}

{
    "delete_payload": {
        "keys": ["color", "price"],
        "points": [0, 3, 100]
    }
}
```

<!-- 

Python client:

```python
``` 

-->

#### Clear payload

This method removes all payload keys from specified points

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/update_points)):

```
POST /collections/{collection_name}

{
    "clear_payload": {
        "points": [0, 3, 100]
    }
}
```

<!--

 Python client:

```python
``` 

-->

## Delete points


REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/update_points)):

```
POST /collections/{collection_name}

{
    "delete_points": {
        "ids": [0, 3, 100]
    }
}
```

<!--

 Python client:

```python
```

 -->

## Retrieve points

There is a method for retrieving points by their ids.


REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/get_points)):

```
POST /collections/{collection_name}/points

{
    "ids": [0, 3, 100]
}
```

<!--

 Python client:

```python
```
 -->

This method has additional parameters `?with_vector` and `?with_payload`. 
Using these parameters, you can select parts of the point you want as a result.
Excluding helps you not to waste traffic transmitting useless data.


The single point can also be retrieved via the API:

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/get_point)):

```
GET /collections/{collection_name}/points/{point_id}
```

<!-- 
Python client:

```python
```
 -->

## Scroll points


Sometimes it might be necessary to get all stored points without knowing ids, or iterate over points that correspond to a filter.

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/scroll_points)):

```
POST /collections/{collection_name}/points/scroll

{
    "filter": {
        "must": [
            {
                "key": "color",
                "match": {
                    "keyword": "red"
                }
            }
        ]
    },
    "limit": 1,
    "offset": 0,
    "with_payload": true,
    "with_vector": false
}
```

Returns all point with `color` = `red`.

```json
{
    "result": {
        "next_page_offset": 1,
        "points": [
            {
                "id": 0,
                "payload": {
                    "color": { "type": "keyword", "value": [ "red" ] }
                }
            }
        ]
    },
    "status": "ok",
    "time": 0.0001
}
```

The Scroll API will return all points that match the filter in a page-by-page manner.

All resulting points are sorted by ID. To query the next page it is necessary to specify the largest seen ID in the `offset` field.
For convenience, this ID is also returned in the field `next_page_offset`.
If the value of the `next_page_offset` field is `null` - the last page is reached.

<!-- 
Python client:

```python
```
 -->

