### Vector datatypes

*Available as of v1.9.0*

Some embedding providers may provide embeddings in a pre-quantized format.
One of the most notable examples is the [Cohere int8 & binary embeddings](https://cohere.com/blog/int8-binary-embeddings).
Qdrant has direct support for uint8 embeddings, which you can also use in combination with binary quantization.

To create a collection with uint8 embeddings, you can use the following configuration:

