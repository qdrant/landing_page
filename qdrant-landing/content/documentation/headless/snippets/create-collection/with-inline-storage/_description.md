When creating a collection with inline storage enabled, the HNSW index stores copies of both the original vectors and quantized vectors within the index file itself.
This reduces random disk seeks during search, trading disk space for improved search speed.
The `inline_storage` option requires quantization to be enabled and does not support multi-vectors.
Set `hnsw_config.inline_storage` to `true` and configure quantization to use this feature.
