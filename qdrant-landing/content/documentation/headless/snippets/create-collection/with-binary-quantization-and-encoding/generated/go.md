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
            Encoding: qdrant.BinaryQuantizationEncoding_TwoBits.Enum(),
            Memory: qdrant.Memory_Pinned.Enum(),
        },
    ),
})
```
