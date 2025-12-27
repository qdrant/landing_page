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
				Model: "prithivida/splade_pp_en_v1",
				Text:  "time travel",
			}),
		),
		Using:       qdrant.PtrOf("title-splade"),
		WithPayload: qdrant.NewWithPayload(true),
		Limit:       qdrant.PtrOf(uint64(10)),
	})

}
