## 1. High-Speed Search with Low Memory Usage

To achieve high search speed with minimal memory usage, you can store vectors on disk while minimizing the number of disk reads. Vector quantization is a technique that compresses vectors, allowing more of them to be stored in memory, thus reducing the need to read from disk.

To configure in-memory quantization, with on-disk original vectors, you need to create a collection with the following parameters:

- `on_disk`: Stores original vectors on disk.
- `quantization_config`: Compresses quantized vectors to `int8` using the `scalar` method.
- `always_ram`: Keeps quantized vectors in RAM.

