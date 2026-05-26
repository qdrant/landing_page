package snippet

import (
	"context"
	"fmt"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	var client *qdrant.Client
	var err error
	// @hide-end

	// @block-start upsert-no-auth
	client, err = qdrant.NewClient(&qdrant.Config{
		Host:   "localhost",
		Port:   6334,
		UseTLS: true,
	})
	if err != nil {
		panic(err)
	}

	_, err = client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "my_collection",
		Points: []*qdrant.PointStruct{
			{
				Id:      qdrant.NewIDNum(1),
				Vectors: qdrant.NewVectors(0.1, 0.2, 0.3, 0.4),
			},
		},
	})
	if err != nil {
		fmt.Println(err) // Unauthenticated
	}
	// @block-end upsert-no-auth

	// @block-start upsert-admin-key
	client, err = qdrant.NewClient(&qdrant.Config{
		Host:   "localhost",
		Port:   6334,
		APIKey: "my-admin-key",
		UseTLS: true,
	})
	if err != nil {
		panic(err)
	}

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: "my_collection",
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     4,
			Distance: qdrant.Distance_Cosine,
		}),
	})

	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "my_collection",
		Points: []*qdrant.PointStruct{
			{
				Id:      qdrant.NewIDNum(1),
				Vectors: qdrant.NewVectors(0.1, 0.2, 0.3, 0.4),
			},
		},
	})
	// @block-end upsert-admin-key

	// @block-start delete-read-only-key
	client, err = qdrant.NewClient(&qdrant.Config{
		Host:   "localhost",
		Port:   6334,
		APIKey: "my-read-only-key",
		UseTLS: true,
	})
	if err != nil {
		panic(err)
	}

	_, err = client.Delete(context.Background(), &qdrant.DeletePoints{
		CollectionName: "my_collection",
		Points:         qdrant.NewPointsSelector(qdrant.NewIDNum(1)),
	})
	if err != nil {
		fmt.Println(err) // PermissionDenied
	}
	// @block-end delete-read-only-key

	// @block-start upsert-jwt-rw-collection
	client, err = qdrant.NewClient(&qdrant.Config{
		Host:   "localhost",
		Port:   6334,
		APIKey: "<your-jwt>",
		UseTLS: true,
	})
	if err != nil {
		panic(err)
	}

	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "my_collection",
		Points: []*qdrant.PointStruct{
			{
				Id:      qdrant.NewIDNum(2),
				Vectors: qdrant.NewVectors(0.5, 0.6, 0.7, 0.8),
			},
		},
	})
	// @block-end upsert-jwt-rw-collection

	// @block-start upsert-jwt-ro-collection
	client, err = qdrant.NewClient(&qdrant.Config{
		Host:   "localhost",
		Port:   6334,
		APIKey: "<your-jwt>",
		UseTLS: true,
	})
	if err != nil {
		panic(err)
	}

	_, err = client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "other_collection",
		Points: []*qdrant.PointStruct{
			{
				Id:      qdrant.NewIDNum(2),
				Vectors: qdrant.NewVectors(0.5, 0.6, 0.7, 0.8),
			},
		},
	})
	if err != nil {
		fmt.Println(err) // PermissionDenied
	}
	// @block-end upsert-jwt-ro-collection
}
