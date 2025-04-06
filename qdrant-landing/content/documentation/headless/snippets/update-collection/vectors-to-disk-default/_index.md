#### Update vector parameters

*Available as of v1.4.0*

<aside role="status">To update vector parameters using the collection update API, you must always specify a vector name. If your collection does not have named vectors, use an empty (<code>""</code>) name.</aside>

Qdrant 1.4 adds support for updating more collection parameters at runtime. HNSW
index, quantization and disk configurations can now be changed without
recreating a collection. Segments (with index and quantized data) will
automatically be rebuilt in the background to match updated parameters.

To put vector data on disk for a collection that **does not have** named vectors,
use `""` as name:


