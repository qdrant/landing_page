### Create collection from another collection

*Available as of v1.0.0*

It is possible to initialize a collection from another existing collection.

This might be useful for experimenting quickly with different configurations for the same data set.

<aside role="alert"> Usage of the <code>init_from</code> can create unpredictable load on the qdrant cluster. It is not recommended to use <code>init_from</code> in performance-sensitive environments.</aside>

Make sure the vectors have the same `size` and `distance` function when setting up the vectors configuration in the new collection. If you used the previous sample
code, `"size": 300` and `"distance": "Cosine"`.


