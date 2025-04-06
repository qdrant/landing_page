### Minimizing Latency

To minimize latency, you can set up Qdrant to use as many cores as possible for a single request.
You can do this by setting the number of segments in the collection to be equal to the number of cores in the system. 

In this case, each segment will be processed in parallel, and the final result will be obtained faster.

