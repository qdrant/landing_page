### Order points by payload key

_Available as of v1.8.0_

When using the [`scroll`](#scroll-points) API, you can sort the results by payload key. For example, you can retrieve points in chronological order if your payloads have a `"timestamp"` field, as is shown from the example below:

<aside role="status">Without an appropriate index, payload-based ordering would create too much load on the system for each request. Qdrant therefore requires a payload index which supports <a href=/documentation/concepts/indexing/#payload-index target="_blank">Range filtering conditions</a> on the field used for <code>order_by</code></aside>

