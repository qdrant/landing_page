## Payload indexing

To search more efficiently with filters, Qdrant allows you to create indexes for payload fields by specifying the name and type of field it is intended to be.

The indexed fields also affect the vector index. See [Indexing](/documentation/concepts/indexing/) for details.

In practice, we recommend creating an index on those fields that could potentially constrain the results the most.
For example, using an index for the object ID will be much more efficient, being unique for each record, than an index by its color, which has only a few possible values.

In compound queries involving multiple fields, Qdrant will attempt to use the most restrictive index first.

To create index for the field, you can use the following:

REST API ([Schema](https://api.qdrant.tech/api-reference/indexes/create-field-index))

