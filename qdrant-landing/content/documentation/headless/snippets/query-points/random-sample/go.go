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

	client.QueryGroups(context.Background(), &qdrant.QueryPointGroups{
		CollectionName: "{collection_name}",
		Query:          qdrant.NewQuerySample(qdrant.Sample_Random),
	})
}
