```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
    CollectionName: "{collection_name}",
    VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
        Size:     1536,
        Distance: qdrant.Distance_Cosine,
    }),
    QuantizationConfig: qdrant.NewQuantizationBinary(
        &qdrant.BinaryQuantization{
            QueryEncoding: qdrant.NewBinaryQuantizationQueryEncodingSetting(qdrant.BinaryQuantizationQueryEncoding_Scalar8Bits),
            Memory: qdrant.Memory_Pinned.Enum(),
        },
    ),
})
```
