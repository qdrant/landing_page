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

	if err != nil { panic(err) } // @hide

	client.Delete(context.Background(), &qdrant.DeletePoints{
		CollectionName: "{collection_name}",
		Points: qdrant.NewPointsSelectorFilter(
			&qdrant.Filter{
				Must: []*qdrant.Condition{
					qdrant.NewMatch("color", "red"),
				},
			},
		),
	})
}
