### IDF Modifier

*Available as of v1.10.0*

For many search algorithms, it is important to consider how often an item occurs in a collection.
Intuitively speaking, the less frequently an item appears in a collection, the more important it is in a search. 

This is also known as the Inverse Document Frequency (IDF). It is used in text search engines to rank search results based on the rarity of a word in a collection.

IDF depends on the currently stored documents and therefore can't be pre-computed in the sparse vectors in streaming inference mode.
In order to support IDF in the sparse vector index, Qdrant provides an option to modify the sparse vector query with the IDF statistics automatically.

The only requirement is to enable the IDF modifier in the collection configuration:

