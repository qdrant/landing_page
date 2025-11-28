package snippet

import (
	"context"
	"time"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
	    Host:   "xyz-example.qdrant.io",
	    Port:   6334,
	    APIKey: "<paste-your-api-key-here>",
	    UseTLS: true,
	})

	client.Upsert(ctx, &qdrant.UpsertPoints{
		CollectionName: "{collection_name}",
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(uint64(1)),
				Vectors: qdrant.NewVectorsImage(&qdrant.Image{
					Model: "cohere/embed-v4.0",
					Image: qdrant.NewValueString("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC"),
					Options: qdrant.NewValueMap(map[string]any{
						"cohere-api-key":   "<YOUR_COHERE_API_KEY>",
						"output_dimension": 512,
					}),
				}),
			},
		},
	})
}
