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

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Query: qdrant.NewQueryMMR(
			qdrant.NewVectorInput(0.01, 0.45, 0.67),
			&qdrant.Mmr{
				Diversity:       qdrant.PtrOf(float32(0.5)), // 0.0 - relevance; 1.0 - diversity
				CandidatesLimit: qdrant.PtrOf(uint32(100)),  // num of candidates to preselect
			}),
		Limit: qdrant.PtrOf(uint64(10)),
	})
}
