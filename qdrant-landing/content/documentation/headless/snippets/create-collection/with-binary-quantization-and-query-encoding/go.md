```go
import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
    Host: "localhost",
    Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
    CollectionName: "{collection_name}",
    VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
        Size:     1536,
        Distance: qdrant.Distance_Cosine,
    }),
    QuantizationConfig: qdrant.NewQuantizationBinary(
        &qdrant.BinaryQuantization{
            QueryEncoding: qdrant.NewBinaryQuantizationQueryEncodingSetting(BinaryQuantizationQueryEncoding_Scalar8Bits),
            AlwaysRam: qdrant.PtrOf(true),
        },
    ),
})
```
