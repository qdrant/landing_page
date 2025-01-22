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

The **Vacuum Optimizer** in Qdrant helps manage storage by handling deleted records. When a record is deleted, it isn’t removed right away but marked as deleted to avoid slow disk operations during queries. While this improves performance, over time, these marked records can build up, wasting memory and slowing down the system.

The Vacuum Optimizer solves this problem by permanently removing marked records and reorganizing storage. This cleanup saves memory and keeps the system running smoothly, especially when large amounts of deleted data build up in the database.

The Optimizer is not triggered arbitrarily. You need define triggers in the [Qdrant configuration file](/documentation/guides/configuration/). Two key parameters control its behavior: 

```yaml
storage:
  optimizers:
    # The minimal fraction of deleted vectors in a segment, required to perform segment optimization
    deleted_threshold: 0.2
    # The minimal number of vectors in a segment, required to perform segment optimization
    vacuum_min_vector_number: 1000
```

- `deleted_threshold` sets the minimum fraction of deleted records in a segment required to initiate optimization. For example, a value of 0.2 means that 20% of a segment’s records must be marked as deleted for the optimizer to consider running. 

- `vacuum_min_vector_number`, specifies the minimum number of vectors a segment must contain to qualify for optimization. For instance, a value of 1000 ensures that only segments with at least 1,000 vectors are optimized.

When these criteria are met, the Optimizer processes the segment by removing deleted records and reorganizing the data to improve efficiency. This process not only enhances the database’s query performance but also reduces memory usage by eliminating redundant data. 

## Merge Optimizer

Qdrant uses the **Merge Optimizer** to manage the number and size of segments in its storage system, ensuring efficient data organization and query performance. Temporary segments may be created during processes like optimization, such as copy-on-write segments, which help facilitate operations.

Qdrant requires at least one small segment to handle frequently updated data efficiently. However, having too many small segments can harm search performance. To address this, the Merge Optimizer works to reduce the number of segments when there are more than optimal. 

The target number of segments is specified by the `default_segment_number` parameter, which typically defaults to the number of CPUs. During optimization, the optimizer may merge the three smallest segments into one, aiming to balance segment size and system performance.

To prevent oversized segments that could slow down indexing, the `max_segment_size_kb` parameter sets a limit on segment size. Larger segments may improve search performance but can take longer to index. Adjusting this parameter helps strike a balance between indexing speed and search efficiency, especially when dealing with large datasets.

You need to define the Optimizer’s behavior in the [Qdrant configuration file](/documentation/guides/configuration/). Below is an example configuration:

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
- `default_segment_number` ensures that segments align with the system’s thread count, enabling even distribution of processing across threads. 

- `max_segment_size_kb` controls segment size to optimize both indexing and search performance, depending on system priorities. 
Proper configuration of these parameters allows Qdrant to maintain an efficient and responsive storage system.

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
