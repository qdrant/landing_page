---
title: Configure Optimizer
weight: 40
---

# Configure Optimizer

The optimizer is a fundamental architecture component of Qdrant.
It is responsible for indexing, merging, vacuuming, and quantizing segments of the collection.

The optimizer allows to combine dynamic updates of any record in the collection with the ability to perform efficient bulk updates. It is especially important for building efficient indexes, which require knowledge of various statistics and distributions before they can be built.

The parameters which affect the most the optimizer's behavior are:

```yaml
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

# Maximum size (in kilobytes) of vectors to store in-memory per segment.
# Segments larger than this threshold will be stored as read-only memmaped file.
# Memmap storage is disabled by default, to enable it, set this threshold to a reasonable value.
# To disable memmap storage, set this to `0`.
# Note: 1Kb = 1 vector of size 256
memmap_threshold_kb: null

# Maximum size (in kilobytes) of vectors allowed for plain index, exceeding this threshold will enable vector indexing
# Default value is 20,000, based on <https://github.com/google-research/google-research/blob/master/scann/docs/algorithms.md>.
# To disable vector indexing, set to `0`.
# Note: 1kB = 1 vector of size 256.
indexing_threshold_kb: 20000
```

Those parameters are working as a conditional statement, which is evaluated for each segment after each update.
If the condition is true, the segment will be scheduled for optimization.

The values of those parameters will affect how Qdrant handles updates of the data.

- If you have enough RAM and CPU, it is fine to go with default values - Qdrant will index all vectors as fast as possible.
- If you have a limited amount of RAM, you can set `memmap_threshold_kb=20000` to the same value as `indexing_threshold_kb`. This ensures that all vectors will be stored on disk during the optimization iteration running the indexation.
- If you are doing bulk updates, you can set `indexing_threshold_kb=0` (or some very large value) to **disable** indexing during bulk updates. It will speed up the process significantly, but will require re-setting the parameter after bulk updates are finished.

Depending on your collection, you might not have enough vectors per segment to start building the index.
E.g. if you have 100k vecotrs and 8 segments, one for each CPU core, each segment will have only 12.5k vectors, which is not enough to build index.
In this case, you can set `indexing_threshold_kb=5000` to start building index even for small segments.