

The results are sorted by the count in descending order, then by the value in ascending order.
Only values with non-zero counts will be returned.

By default, the way Qdrant the counts for each value is approximate to achieve fast results. This should accurate enough for most cases, but if you need to debug your storage, you can use the `exact` parameter to get exact counts.

