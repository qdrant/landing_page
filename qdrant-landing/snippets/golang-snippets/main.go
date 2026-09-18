package main

import (
	"context"
	"fmt"

	"github.com/qdrant/go-client/qdrant"
)

func main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil {
		fmt.Println("Error creating Qdrant client:", err)
		return
	}

	client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
		CollectionName:     "{collection_name}",
		QuantizationConfig: qdrant.NewQuantizationDiffDisabled(),
	})
}
