### Lookup in groups

*Available as of v1.3.0*

Having multiple points for parts of the same item often introduces redundancy in the stored data. Which may be fine if the information shared by the points is small, but it can become a problem if the payload is large, because it multiplies the storage space needed to store the points by a factor of the amount of points we have per group.

One way of optimizing storage when using groups is to store the information shared by the points with the same group id in a single point in another collection. Then, when using the [**groups** API](#grouping-api), add the `with_lookup` parameter to bring the information from those points into each group.

![Group id matches point id](/docs/lookup_id_linking.png)

<aside role="status">Store only document-level metadata (e.g., titles, abstracts) in the lookup collection, not chunks or duplicated data.</aside>

This has the extra benefit of having a single point to update when the information shared by the points in a group changes.

For example, if you have a collection of documents, you may want to chunk them and store the points for the chunks in a separate collection, making sure that you store the point id from the document it belongs in the payload of the chunk point.

In this case, to bring the information from the documents into the chunks grouped by the document id, you can use the `with_lookup` parameter:

