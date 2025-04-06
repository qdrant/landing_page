### Maximizing Throughput

To maximize throughput, configure Qdrant to use as many cores as possible to process multiple requests in parallel.

To do that, use fewer segments (usually 2) to handle more requests in parallel.

Large segments benefit from the size of the index and overall smaller number of vector comparisons required to find the nearest neighbors. However, they will require more time to build the HNSW index.

