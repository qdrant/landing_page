---
title: Collections
weight: 21
---

## Collections

A collection is a named set of points (vectors with a payload) among which you can search.
Vectors within the same collection must have the same dimensionality and be compared by a single metric.

Distance metrics used to measure similarities among vectors.
The choice of metric depends on the way vectors obtaining and, in particular, on the method of neural network encoder training.

Qdrant supports these most popular types of metrics:

* Dot product: `Dot` - https://en.wikipedia.org/wiki/Dot_product
* Cosine similarity: `Cosine`  - https://en.wikipedia.org/wiki/Cosine_similarity
* Euclidean distance: `Euclid` - https://en.wikipedia.org/wiki/Euclidean_distance

In addition to metrics and vector size, each collection uses its own set of parameters that controls collection optimization, index construction, and vacuum.
These settings can be changed at any time by a suitable request.

### Create collection

```json
```

<!-- 
#### Python

```python
```
 -->

### Delete collection

```json
```

<!-- 
#### Python

```python
```
 -->


### Update collection parameters

Dynamic parameter update may be useful, for example, for more efficient initial loading of vectors.
With these settings, you can disable indexing during the upload process and enable it immediately after it is finished.
As a result, you will not waste extra time on rebuilding the index.

```json
```

<!-- 
#### Python

```python
```
 -->


## Collection aliases

In production environment, it is sometimes necessary to switch different versions of vectors seamlessly.
For example, when upgrading to a new version of the neural network.

In these situations, there is no way to stop the service and rebuild the collection with new vectors.
To avoid this, you can use aliases. 
Aliases are additional names for existing collections.
All queries to the collection can also be done identically, using alias instead of the collection name.

Thus, it is possible to build a second collection in the background and then switch alias from the old to the new collection.
Due to the fact that all changes of aliases happen atomically, no concurrent requests will be affected during the switch.

### Crate alias

```json
```

<!-- 
#### Python

```python
```
 -->


### Change alias

```json
```

<!-- 
#### Python

```python
```
 -->


### Remove alias

```json
```

<!-- 
#### Python

```python
```
 -->
