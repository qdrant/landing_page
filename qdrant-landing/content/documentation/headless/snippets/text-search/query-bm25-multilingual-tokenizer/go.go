package snippet

// @hide-start
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

// @hide-end
func Main() {
	//@hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil {
		panic(err)
	}
	// @hide-end

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "books",
		Query: qdrant.NewQueryNearest(
			qdrant.NewVectorInputDocument(&qdrant.Document{
				Model:   "qdrant/bm25",
				Text:    "村上春樹",
				Options: qdrant.NewValueMap(map[string]any{"tokenizer": "multilingual"}),
			}),
		),
		Using:       qdrant.PtrOf("author-bm25"),
		WithPayload: qdrant.NewWithPayload(true),
		Limit:       qdrant.PtrOf(uint64(10)),
	})

}
