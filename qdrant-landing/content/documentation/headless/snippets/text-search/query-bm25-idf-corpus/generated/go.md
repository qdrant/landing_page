```go
client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model: "qdrant/bm25",
			Text:  "time travel",
		}),
	),
	Using: qdrant.PtrOf("title-bm25"),
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewMatch("tenant", "acme"),
			qdrant.NewMatchInt("year", 2024),
		},
	},
	Params: &qdrant.SearchParams{
		Idf: &qdrant.IdfParams{
			Corpus: &qdrant.Filter{
				Must: []*qdrant.Condition{
					qdrant.NewMatch("tenant", "acme"),
				},
			},
		},
	},
	Limit: qdrant.PtrOf(uint64(10)),
})
```
