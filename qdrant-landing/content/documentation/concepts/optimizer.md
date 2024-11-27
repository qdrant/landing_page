---
title: Optimizer
weight: 70
aliases:
  - ../optimizer
---

# Optimizer

It is much more efficient to apply changes in batches than perform each change individually, as many other databases do. Qdrant here is no exception. Since Qdrant operates with data structures that are not always easy to change, it is sometimes necessary to rebuild those structures completely.

Storage optimization in Qdrant occurs at the segment level (see [storage](/documentation/concepts/storage/)).
In this case, the segment to be optimized remains readable for the time of the rebuild.

![Segment optimization](/docs/optimization.svg)

The availability is achieved by wrapping the segment into a proxy that transparently handles data changes.
Changed data is placed in the copy-on-write segment, which has priority for retrieval and subsequent updates.

## Vacuum Optimizer

The simplest example of a case where you need to rebuild a segment repository is to remove points.
Like many other databases, Qdrant does not delete entries immediately after a query.
Instead, it marks records as deleted and ignores them for future queries.

This strategy allows us to minimize disk access - one of the slowest operations.
However, a side effect of this strategy is that, over time, deleted records accumulate, occupy memory and slow down the system.

To avoid these adverse effects, Vacuum Optimizer is used.
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

It is also essential to have at least one small segment that Qdrant will use to store frequently updated data.
On the other hand, too many small segments lead to suboptimal search performance.

The merge optimizer constantly tries to reduce the number of segments if there
currently are too many. The desired number of segments is specified
with `default_segment_number` and defaults to the number of CPUs. The optimizer
may takes at least the three smallest segments and merges them into one.

Segments will not be merged if they'll exceed the maximum configured segment
size with `max_segment_size_kb`. It prevents creating segments that are too
large to efficiently index. Increasing this number may help to reduce the number
of segments if you have a lot of data, and can potentially improve search performance.

The criteria for starting the optimizer are defined in the configuration file.

Here is an example of parameter values:

```yaml
storage:
  optimizers:
    # Target amount of segments optimizer will try to keep.
    # Real amount of segments may vary depending on multiple parameters:
    #  - Amount of stored points
    #  - Current write RPS
    #
    # It is recommended to select default number of segments as a factor of the number of search threads,
    # so that each segment would be handled evenly by one of the threads.
    # If `default_segment_number = 0`, will be automatically selected by the number of available CPUs
    default_segment_number: 0

    # Do not create segments larger this size (in KiloBytes).
    # Large segments might require disproportionately long indexation times,
    # therefore it makes sense to limit the size of segments.
    #
    # If indexation speed have more priority for your - make this parameter lower.
    # If search speed is more important - make this parameter higher.
    # Note: 1Kb = 1 vector of size 256
    # If not set, will be automatically selected considering the number of available CPUs.
    max_segment_size_kb: null
```

## Indexing Optimizer

Qdrant allows you to choose the type of indexes and data storage methods used depending on the number of records.
So, for example, if the number of points is less than 10000, using any index would be less efficient than a brute force scan.

The Indexing Optimizer is used to implement the enabling of indexes and memmap storage when the minimal amount of records is reached.

The criteria for starting the optimizer are defined in the configuration file.

Here is an example of parameter values:

```yaml
storage:
  optimizers:
    # Maximum size (in kilobytes) of vectors to store in-memory per segment.
    # Segments larger than this threshold will be stored as read-only memmaped file.
    # Memmap storage is disabled by default, to enable it, set this threshold to a reasonable value.
    # To disable memmap storage, set this to `0`.
    # Note: 1Kb = 1 vector of size 256
    memmap_threshold: 200000

    # Maximum size (in kilobytes) of vectors allowed for plain index, exceeding this threshold will enable vector indexing
    # Default value is 20,000, based on <https://github.com/google-research/google-research/blob/master/scann/docs/algorithms.md>.
    # To disable vector indexing, set to `0`.
    # Note: 1kB = 1 vector of size 256.
    indexing_threshold_kb: 20000
```

In addition to the configuration file, you can also set optimizer parameters separately for each [collection](/documentation/concepts/collections/).

Dynamic parameter updates may be useful, for example, for more efficient initial loading of points. You can disable indexing during the upload process with these settings and enable it immediately after it is finished. As a result, you will not waste extra computation resources on rebuilding the index.
