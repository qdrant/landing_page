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
		Query: qdrant.NewQueryText(qdrant.NewTextQueryBM25("time travel", &qdrant.Bm25Params{
			K: qdrant.PtrOf(float32(1.5)),
			B: qdrant.PtrOf(float32(0.5)),
		})),
		Using:       qdrant.PtrOf("title"),
		WithPayload: qdrant.NewWithPayload(true),
		Limit:       qdrant.PtrOf(uint64(10)),
	})
}
