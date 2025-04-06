

**Uint8**

Another step towards memory optimization is to use the Uint8 datatype for vectors.
Unlike Float16, Uint8 is not a floating-point number, but an integer number in the range from 0 to 255.

Not all embeddings models generate vectors in the range from 0 to 255, so you need to be careful when using Uint8 datatype.

In order to convert a number from float range to Uint8 range, you need to apply a process called quantization.

Some embedding providers may provide embeddings in a pre-quantized format.
One of the most notable examples is the [Cohere int8 & binary embeddings](https://cohere.com/blog/int8-binary-embeddings).

For other embeddings, you will need to apply quantization yourself.


<aside role="alert">
There is a difference in how Uint8 vectors are handled for dense and sparse vectors.
Dense vectors are required to be in the range from 0 to 255, while sparse vectors can be quantized in-flight.
</aside>


