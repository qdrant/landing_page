package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
	    Host:   "xyz-example.qdrant.io",
	    Port:   6334,
	    APIKey: "<paste-your-api-key-here>",
	    UseTLS: true,
	})

	if err != nil { panic(err) } // @hide

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Query: qdrant.NewQueryNearest(
			qdrant.NewVectorInputDocument(&qdrant.Document{
				Text:  "a green square",
				Model: "cohere/embed-v4.0",
				Options: qdrant.NewValueMap(map[string]any{
					"cohere-api-key":   "<YOUR_COHERE_API_KEY>",
					"output_dimension": 512,
				}),
			}),
		),
	})
}
