## Named Vectors

In Qdrant, you can store multiple vectors of different sizes and [types](#vector-types) in the same data [point](/documentation/concepts/points/). This is useful when you need to define your data with multiple embeddings to represent different features or modalities (e.g., image, text or video). 

To store different vectors for each point, you need to create separate named vector spaces in the [collection](/documentation/concepts/collections/). You can define these vector spaces during collection creation and manage them independently.

<aside role="status">
Each vector should have a unique name. Vectors can represent different modalities and you can use different embedding models to generate them.
</aside>

To create a collection with named vectors, you need to specify a configuration for each vector:

