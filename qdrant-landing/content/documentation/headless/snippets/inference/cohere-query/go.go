package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
	    Host:   "xyz-example.qdrant.io",
	    Port:   6334,
	    APIKey: "<paste-your-api-key-here>",
	    UseTLS: true,
	})
	// @hide-end

	if err != nil { panic(err) } // @hide

	ctx := qdrant.WithHeader(context.Background(), "cohere-api-key", "<YOUR_COHERE_API_KEY>")

	client.Query(ctx, &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Query: qdrant.NewQueryNearest(
			qdrant.NewVectorInputDocument(&qdrant.Document{
				Text:  "a green square",
				Model: "cohere/embed-v4.0",
				Options: qdrant.NewValueMap(map[string]any{
					"output_dimension": 512,
				}),
			}),
		),
	})
}
