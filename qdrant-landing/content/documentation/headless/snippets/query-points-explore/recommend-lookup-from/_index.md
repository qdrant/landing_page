### Lookup vectors from another collection

*Available as of v0.11.6*

If you have collections with vectors of the same dimensionality,
and you want to look for recommendations in one collection based on the vectors of another collection,
you can use the `lookup_from` parameter.

It might be useful, e.g. in the item-to-user recommendations scenario. 
Where user and item embeddings, although having the same vector parameters (distance type and dimensionality), are usually stored in different collections.

