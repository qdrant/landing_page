

This will create a collection with all vectors immediately stored in memmap storage.
This is the recommended way, in case your Qdrant instance operates with fast disks and you are working with large collections.


- Set up `memmap_threshold` option. This option will set the threshold after which the segment will be converted to memmap storage.

There are two ways to do this:

1. You can set the threshold globally in the [configuration file](/documentation/guides/configuration/). The parameter is called `memmap_threshold` (previously `memmap_threshold_kb`).
2. You can set the threshold for each collection separately during [creation](/documentation/concepts/collections/#create-collection) or [update](/documentation/concepts/collections/#update-collection-parameters).

