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

	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "{collection_name}",
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(1),
				Vectors: qdrant.NewVectorsMap(
					map[string]*qdrant.Vector{
						"text": qdrant.NewVectorSparse(
							[]uint32{1, 3, 5, 7},
							[]float32{0.1, 0.2, 0.3, 0.4}),
					}),
			},
		},
	})
}
