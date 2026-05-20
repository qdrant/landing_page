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
		CollectionName: "documents",
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(200),
				Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{}),
				Payload: qdrant.NewValueMap(map[string]any{
					"title": "Document A",
					"text":  "This is document A",
				}),
			},
			{
				Id: qdrant.NewIDNum(201),
				Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{}),
				Payload: qdrant.NewValueMap(map[string]any{
					"title": "Document B",
					"text":  "This is document B",
				}),
			},
		},
	})

	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "chunks",
		Points: []*qdrant.PointStruct{
			{
				Id:      qdrant.NewIDNum(0),
				Vectors: qdrant.NewVectors(0.1, 0.2, 0.3, 0.4),
				Payload: qdrant.NewValueMap(map[string]any{"document_id": 200}),
			},
			{
				Id:      qdrant.NewIDNum(1),
				Vectors: qdrant.NewVectors(0.5, 0.6, 0.7, 0.8),
				Payload: qdrant.NewValueMap(map[string]any{"document_id": 201}),
			},
		},
	})
}
