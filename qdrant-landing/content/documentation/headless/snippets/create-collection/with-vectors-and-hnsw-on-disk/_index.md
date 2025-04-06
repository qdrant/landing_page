

The rule of thumb to set the memmap threshold parameter is simple:

- if you have a balanced use scenario - set memmap threshold the same as `indexing_threshold` (default is 20000). In this case the optimizer will not make any extra runs and will optimize all thresholds at once.
- if you have a high write load and low RAM - set memmap threshold lower than `indexing_threshold` to e.g. 10000. In this case the optimizer will convert the segments to memmap storage first and will only apply indexing after that.

In addition, you can use memmap storage not only for vectors, but also for HNSW index.
To enable this, you need to set the `hnsw_config.on_disk` parameter to `true` during collection [creation](/documentation/concepts/collections/#create-a-collection) or [updating](/documentation/concepts/collections/#update-collection-parameters).

