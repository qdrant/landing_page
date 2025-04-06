When recovering a snapshot, you can set a priority to determine how conflicts between snapshot data and existing data are handled. There are three priority options available:

- `replica` (default): Prioritizes existing data over snapshot data.
- `snapshot`: Prioritizes snapshot data over existing data.
- `no_sync`: Restores snapshot without additional synchronization, useful for manual shard management.

By setting the priority to `snapshot`, all data from the snapshot will be recovered onto the cluster. Using `replica` may result in an empty collection if there was no existing data in the cluster. `no_sync` is for specialized cases involving manual shard management and should be used carefully to avoid cluster issues. The priority setting is essential for controlling the outcome of snapshot recoveries.