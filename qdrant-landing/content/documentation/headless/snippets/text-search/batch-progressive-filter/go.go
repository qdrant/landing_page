// @hide-start

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
// @hide-end


strict := &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{ Model: "sentence-transformers/all-minilm-l6-v2", Text: "time travel" }),
	),
	Using: qdrant.PtrOf("description-dense"),
	Filter: &qdrant.Filter{ Must: []*qdrant.Condition{ qdrant.NewExpressionCondition(qdrant.NewMatchText("title", "time travel")) } },
}

relaxed := &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{ Model: "sentence-transformers/all-minilm-l6-v2", Text: "time travel" }),
	),
	Using: qdrant.PtrOf("description-dense"),
	Filter: &qdrant.Filter{ Must: []*qdrant.Condition{ qdrant.NewExpressionCondition(qdrant.NewMatchTextAny("title", "time travel")) } },
}

vectorOnly := &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{ Model: "sentence-transformers/all-minilm-l6-v2", Text: "time travel" }),
	),
	Using: qdrant.PtrOf("description-dense"),
}

client.QueryBatch(context.Background(), &qdrant.QueryBatchPoints{
	CollectionName: "books",
	QueryPoints:   []*qdrant.QueryPoints{ strict, relaxed, vectorOnly },
})

} // @hide
