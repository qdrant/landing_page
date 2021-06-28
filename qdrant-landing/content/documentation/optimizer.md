---
title: Optimizer
weight: 28
---

As in many other databases, it is much more efficient to apply changes in batches than to perform each change individually.
Qdrant here is no exception.
Since Qdrant operates with data structures that are not always easy to change, it is sometimes necessary to rebuild those structures completely.

Storage optimization in Qdrant occurs at the segment level (see [storage](../storage)).
In this case, the segment to be optimized remains readable for the time of the rebuild.

![Segment optimization](/docs/optimization.svg)

This is achieved by wrapping the segment to be optimized in a proxy that transparently handles data changes within the segment.
Changed data is placed in the copy-on-write segment, which has priority for retrieval and subsequent updates.

## Vacuum Optimizer

The simplest example of a case where you need to rebuild a segment repository is to remove points.
Like many other databases, Qdrant does not delete entries immediately after a query.
Instead, it marks records as deleted and ignores them for future queries.

This strategy allows us to minimize disk access - one of the slowest operations.
A side effect of this strategy is that, over time, deleted records accumulate, occupy memory and slow down the system.

To avoid these negative effects, Vacuum Optimizer is used.
It is used if the segment has accumulated too many deleted records.

The criteria for starting the optimizer are defined in the configuration file.

Here is an example of parameter values:

```yaml
storage:
  optimizers:
    # The minimal fraction of deleted vectors in a segment, required to perform segment optimization
    deleted_threshold: 0.2
    # The minimal number of vectors in a segment, required to perform segment optimization
    vacuum_min_vector_number: 1000
```


## Merge Optimizer

The service may require the creation of temporary segments.
Such segments, for example, are created as copy-on-write segments during optimization itself.

It is also important to have at least one small segment that will be used to store frequently updated data.
On the other hand, too many small segments lead to suboptimal search performance.

To solve this problem, there is the Merge Optimizer, which combines the smallest segments into one large segment.

The criteria for starting the optimizer are defined in the configuration file.

Here is an example of parameter values:

```yaml
storage:
  optimizers:
    # If the number of segments exceeds this value, the optimizer will merge the smallest segments.
    max_segment_number: 5
```


## Indexing Optimizer

Qdrant allows you to choose the type of indexes and data storage methods used depending on the number of records.
So, for example, if the number of points is less than 10000, then using any type of index would be less efficient than a brute force scan.

To implement the enabling of indexes and mmap storage when the minimal amount of records is reached, the Indexing Optimizer is used.


The criteria for starting the optimizer are defined in the configuration file.

Here is an example of parameter values:

```yaml
storage:
  optimizers:
    # Maximum number of vectors to store in-memory per segment.
    # Segments larger than this threshold will be stored as read-only memmaped file.
    memmap_threshold: 50000
    # Maximum number of vectors allowed for plain index.
    # Default value based on 
    # https://github.com/google-research/google-research/blob/master/scann/docs/algorithms.md
    indexing_threshold: 20000
    # Starting from this amount of vectors per-segment 
    # the engine will start building index for payload.
    payload_indexing_threshold: 10000
```

In addition to the configuration file, optimizer parameters can also be set separately for each [collection](../collections).


Dynamic parameter update may be useful, for example, for more efficient initial loading of points.
With these settings, you can disable indexing during the upload process and enable it immediately after it is finished.
As a result, you will not waste extra computation resources on rebuilding the index.
