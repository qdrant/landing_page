```typescript
client.updateCollection("{collection_name}", {
  vectors: {
    my_vector: {
      hnsw_config: {
        m: 32,
        ef_construct: 123,
      },
      quantization_config: {
        product: {
          compression: "x32",
          always_ram: true,
        },
      },
      on_disk: true,
    },
  },
  hnsw_config: {
    ef_construct: 123,
  },
  quantization_config: {
    scalar: {
      type: "int8",
      quantile: 0.8,
      always_ram: true,
    },
  },
});
```
