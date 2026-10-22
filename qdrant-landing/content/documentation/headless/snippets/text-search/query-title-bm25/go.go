package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil { panic(err) }
	// @hide-end

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "books",
		Query: &qdrant.Query{
			Variant: &qdrant.Query_Text{
				Text: &qdrant.TextQuery{Query: "time travel"},
			},
		},
		Using:       qdrant.PtrOf("title"),
		WithPayload: qdrant.NewWithPayload(true),
		Limit:       qdrant.PtrOf(uint64(10)),
	})
}
