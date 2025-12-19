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

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Query: qdrant.NewQueryMulti(
			[][]float32{
				{-0.013, 0.020, -0.007, -0.111},
				{-0.030, -0.055, 0.001, 0.072},
				{-0.041, 0.014, -0.032, -0.062},
			}),
	})
}
