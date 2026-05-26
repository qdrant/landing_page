package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "",
		APIKey: "",
		UseTLS: true,
	})

	if err != nil {
		panic(err)
	}

	NEW_COLLECTION := "new_collection"
	OLD_COLLECTION := "old_collection"

	OLD_MODEL := "sentence-transformers/all-minilm-l6-v2"
	NEW_MODEL := "qdrant/clip-vit-b-32-text"

	COLLECTION := "my_collection"
	OLD_VECTOR := "old-model"
	NEW_VECTOR := "new-model"
	// @hide-end

	// @block-start create-new-collection
	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: NEW_COLLECTION,
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     512, // Size of the new embedding vectors
			Distance: qdrant.Distance_Cosine,
		}),
	})
	// @block-end create-new-collection

	// @block-start upsert-old-collection
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: OLD_COLLECTION,
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(1),
				Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
					Text:  "Example document",
					Model: OLD_MODEL,
				}),
				Payload: qdrant.NewValueMap(map[string]any{"text": "Example document"}),
			},
		},
	})
	// @block-end upsert-old-collection

	// @block-start upsert-new-collection
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: NEW_COLLECTION,
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(1),
				// Use the new embedding model to encode the document
				Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
					Text:  "Example document",
					Model: NEW_MODEL,
				}),
				Payload: qdrant.NewValueMap(map[string]any{"text": "Example document"}),
			},
		},
	})
	// @block-end upsert-new-collection

	// @block-start migrate-points
	var lastOffset *qdrant.PointId
	batchSize := uint32(100) // Number of points to read in each batch
	reachedEnd := false

	for !reachedEnd {
		// Get the next batch of points from the old collection
		scrollResult, err := client.Scroll(context.Background(), &qdrant.ScrollPoints{
			CollectionName: OLD_COLLECTION,
			Limit:          qdrant.PtrOf(batchSize),
			Offset:         lastOffset,
			// Include payloads in the response, as we need them to re-embed the vectors
			WithPayload: qdrant.NewWithPayload(true),
			// We don't need the old vectors, so let's save on the bandwidth
			WithVectors: qdrant.NewWithVectors(false),
		})

		// @hide-start
		if err != nil {
			panic(err)
		}
		// @hide-end

		records := scrollResult
		lastOffset = scrollResult[len(scrollResult)-1].Id // @hide

		// Re-embed the points using the new model
		points := make([]*qdrant.PointStruct, len(records))
		for idx, record := range records {
			text := ""
			if val, ok := record.Payload["text"]; ok {
				text = val.GetStringValue()
			}

			points[idx] = &qdrant.PointStruct{
				// Keep the original ID to ensure consistency
				Id: record.Id,
				// Use the new embedding model to encode the text from the payload,
				// assuming that was the original source of the embedding
				Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
					Text:  text,
					Model: NEW_MODEL,
				}),
				// Keep the original payload
				Payload: record.Payload,
			}
		}

		// Upsert the re-embedded points into the new collection
		client.Upsert(context.Background(), &qdrant.UpsertPoints{
			CollectionName: NEW_COLLECTION,
			Points:         points,
			// Only insert the point if a point with this ID does not already exist.
			UpdateMode: qdrant.UpdateMode_InsertOnly.Enum(),
		})

		// Check if we reached the end of the collection
		reachedEnd = (lastOffset == nil)
	}
	// @block-end migrate-points

	// @block-start search-old-collection
	results, err := client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: OLD_COLLECTION,
		Query: qdrant.NewQueryDocument(&qdrant.Document{
			Text:  "my query",
			Model: OLD_MODEL,
		}),
		Limit: qdrant.PtrOf(uint64(10)),
	})
	// @block-end search-old-collection

	// @hide-start
	if err != nil {
		panic(err)
	}
	_ = results
	// @hide-end

	// @block-start search-new-collection
	results, err = client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: NEW_COLLECTION,
		Query: qdrant.NewQueryDocument(&qdrant.Document{
			Text:  "my query",
			Model: NEW_MODEL,
		}),
		Limit: qdrant.PtrOf(uint64(10)),
	})
	// @block-end search-new-collection

	// @hide-start
	if err != nil {
		panic(err)
	}
	_ = results
	// @hide-end

	// @block-start add-named-vector
	client.CreateVectorName(context.Background(), &qdrant.CreateVectorNameRequest{
		CollectionName: COLLECTION,
		VectorName:     NEW_VECTOR,
		VectorConfig: &qdrant.CreateVectorNameRequest_DenseConfig{
			DenseConfig: &qdrant.DenseVectorCreationConfig{
				Size:     512, // Size of the new embedding vectors
				Distance: qdrant.Distance_Cosine,
			},
		},
	})
	// @block-end add-named-vector

	// @block-start upsert-both-vectors
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: COLLECTION,
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(1),
				Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
					OLD_VECTOR: qdrant.NewVectorDocument(&qdrant.Document{
						Text:  "Example document",
						Model: OLD_MODEL,
					}),
					NEW_VECTOR: qdrant.NewVectorDocument(&qdrant.Document{
						Text:  "Example document",
						Model: NEW_MODEL,
					}),
				}),
				Payload: qdrant.NewValueMap(map[string]any{"text": "Example document"}),
			},
		},
	})
	// @block-end upsert-both-vectors

	// @block-start re-embed-existing
	var reEmbedLastOffset *qdrant.PointId
	reEmbedBatchSize := uint32(100)
	reEmbedReachedEnd := false

	for !reEmbedReachedEnd {
		reEmbedScrollResult, err := client.Scroll(context.Background(), &qdrant.ScrollPoints{
			CollectionName: COLLECTION,
			Limit:          qdrant.PtrOf(reEmbedBatchSize),
			Offset:         reEmbedLastOffset,
			WithPayload:    qdrant.NewWithPayload(true),
			WithVectors:    qdrant.NewWithVectors(false),
		})

		// @hide-start
		if err != nil {
			panic(err)
		}
		// @hide-end

		reEmbedRecords := reEmbedScrollResult
		reEmbedLastOffset = reEmbedScrollResult[len(reEmbedScrollResult)-1].Id // @hide

		pointVectors := make([]*qdrant.PointVectors, len(reEmbedRecords))
		for idx, record := range reEmbedRecords {
			text := ""
			if val, ok := record.Payload["text"]; ok {
				text = val.GetStringValue()
			}

			// Update only the new vector on each point; the old vector and payload are untouched
			pointVectors[idx] = &qdrant.PointVectors{
				Id: record.Id,
				Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
					NEW_VECTOR: qdrant.NewVectorDocument(&qdrant.Document{
						Text:  text,
						Model: NEW_MODEL,
					}),
				}),
			}
		}

		client.UpdateVectors(context.Background(), &qdrant.UpdatePointVectors{
			CollectionName: COLLECTION,
			Points:         pointVectors,
		})

		reEmbedReachedEnd = (reEmbedLastOffset == nil)
	}
	// @block-end re-embed-existing

	// @block-start search-with-old-vector
	oldVectorResults, err := client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: COLLECTION,
		Query: qdrant.NewQueryDocument(&qdrant.Document{
			Text:  "my query",
			Model: OLD_MODEL,
		}),
		Using: qdrant.PtrOf(OLD_VECTOR),
		Limit: qdrant.PtrOf(uint64(10)),
	})
	// @block-end search-with-old-vector

	// @hide-start
	if err != nil {
		panic(err)
	}
	_ = oldVectorResults
	// @hide-end

	// @block-start search-with-new-vector
	newVectorResults, err := client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: COLLECTION,
		Query: qdrant.NewQueryDocument(&qdrant.Document{
			Text:  "my query",
			Model: NEW_MODEL,
		}),
		Using: qdrant.PtrOf(NEW_VECTOR),
		Limit: qdrant.PtrOf(uint64(10)),
	})
	// @block-end search-with-new-vector

	// @hide-start
	if err != nil {
		panic(err)
	}
	_ = newVectorResults
	// @hide-end

	// @block-start delete-old-named-vector
	client.DeleteVectorName(context.Background(), &qdrant.DeleteVectorNameRequest{
		CollectionName: COLLECTION,
		VectorName:     OLD_VECTOR,
	})
	// @block-end delete-old-named-vector
}
