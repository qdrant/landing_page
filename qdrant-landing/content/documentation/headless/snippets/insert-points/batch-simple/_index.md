## Upload points

To optimize performance, Qdrant supports batch loading of points. I.e., you can load several points into the service in one API call.
Batching allows you to minimize the overhead of creating a network connection.

The Qdrant API supports two ways of creating batches - record-oriented and column-oriented.
Internally, these options do not differ and are made only for the convenience of interaction.

Create points with batch:

