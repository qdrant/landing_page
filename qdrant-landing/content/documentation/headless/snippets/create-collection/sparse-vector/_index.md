### Collection with sparse vectors

*Available as of v1.7.0*

Qdrant supports sparse vectors as a first-class citizen.

Sparse vectors are useful for text search, where each word is represented as a separate dimension.

Collections can contain sparse vectors as additional [named vectors](#collection-with-multiple-vectors) along side regular dense vectors in a single point.

Unlike dense vectors, sparse vectors must be named.
And additionally, sparse vectors and dense vectors must have different names within a collection.

