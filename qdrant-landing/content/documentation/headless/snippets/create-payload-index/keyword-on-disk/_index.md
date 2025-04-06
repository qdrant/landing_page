### On-disk payload index

*Available as of v1.11.0*

By default all payload-related structures are stored in memory. In this way, the vector index can quickly access payload values during search.
As latency in this case is critical, it is recommended to keep hot payload indexes in memory.

There are, however, cases when payload indexes are too large or rarely used. In those cases, it is possible to store payload indexes on disk.

<aside role="alert">
    On-disk payload index might affect cold requests latency, as it requires additional disk I/O operations.
</aside>

To configure on-disk payload index, you can use the following index parameters:

