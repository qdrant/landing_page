package snippet

import (
    "context"

    "github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
	    Host: "localhost",
	    Port: 6334,
	})

	if err != nil { panic(err) } // @hide

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	    CollectionName: "{collection_name}",
	    VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
	        Size:     1536,
	        Distance: qdrant.Distance_Cosine,
	    }),
	    QuantizationConfig: qdrant.NewQuantizationBinary(
	        &qdrant.BinaryQuantization{
	            QueryEncoding: qdrant.NewBinaryQuantizationQueryEncodingSetting(qdrant.BinaryQuantizationQueryEncoding_Scalar8Bits),
	            AlwaysRam: qdrant.PtrOf(true),
	        },
	    ),
	})
}
