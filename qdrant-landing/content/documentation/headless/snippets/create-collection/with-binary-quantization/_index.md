### Setting up Binary Quantization

To enable binary quantization, you need to specify the quantization parameters in the `quantization_config` section of the collection configuration.

When enabling binary quantization on an existing collection, use a PATCH request or the corresponding `update_collection` method and omit the vector configuration, as it's already defined.

