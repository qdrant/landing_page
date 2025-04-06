### Tenant Index

*Available as of v1.11.0*

Many vector search use-cases require multitenancy. In a multi-tenant scenario the collection is expected to contain multiple subsets of data, where each subset belongs to a different tenant. 

Qdrant supports efficient multi-tenant search by enabling [special configuration](/documentation/guides/multiple-partitions/) vector index, which disables global search and only builds sub-indexes for each tenant.

<aside role="note">
    In Qdrant, tenants are not necessarily non-overlapping. It is possible to have subsets of data that belong to multiple tenants.
</aside>

However, knowing that the collection contains multiple tenants unlocks more opportunities for optimization.
To optimize storage in Qdrant further, you can enable tenant indexing for payload fields.

This option will tell Qdrant which fields are used for tenant identification and will allow Qdrant to structure storage for faster search of tenant-specific data.
One example of such optimization is localizing tenant-specific data closer on disk, which will reduce the number of disk reads during search.

To enable tenant index for a field, you can use the following index parameters:

