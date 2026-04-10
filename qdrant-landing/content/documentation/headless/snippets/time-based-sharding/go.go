package snippet

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	QDRANT_URL := ""
	QDRANT_API_KEY := ""
	// @hide-end

	// @block-start initialize-client
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   QDRANT_URL,
		APIKey: QDRANT_API_KEY,
		UseTLS: true,
	})
	// @block-end initialize-client

	// @hide-start
	if err != nil {
		panic(err)
	}
	// @hide-end

	// @block-start create-collection
	collectionName := "my_collection"

	exists, err := client.CollectionExists(context.Background(), collectionName)
	if err != nil { panic(err) } // @hide
	if exists {
		client.DeleteCollection(context.Background(), collectionName)
	}

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: collectionName,
		VectorsConfig: qdrant.NewVectorsConfigMap(
			map[string]*qdrant.VectorParams{
				"dense_vector": {
					Size:     384,
					Distance: qdrant.Distance_Cosine,
				},
			},
		),
		ShardingMethod: qdrant.ShardingMethod_Custom.Enum(),
	})
	// @block-end create-collection

	// @block-start upload-vectors
	csvUrl := "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv"

	shardKeyDescriptions, err := client.ListShardKeys(context.Background(), collectionName)
	if err != nil { panic(err) } // @hide

	existingShardKeys := make(map[string]bool)
	for _, desc := range shardKeyDescriptions {
		existingShardKeys[desc.Key.GetKeyword()] = true
	}

	denseModel := "sentence-transformers/all-MiniLM-L6-v2"
	batchSize := 100
	var currentDate string
	var buffer []*qdrant.PointStruct

	resp, err := http.Get(csvUrl)
	if err != nil { panic(err) } // @hide
	defer resp.Body.Close()

	csvReader := csv.NewReader(resp.Body)
	headers, err := csvReader.Read()
	if err != nil { panic(err) } // @hide

	// @hide-start
	textIdx, datetimeIdx := -1, -1
	for i, h := range headers {
		switch h {
		case "text":
			textIdx = i
		case "datetime":
			datetimeIdx = i
		}
	}
	// @hide-end

	for {
		row, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil { panic(err) } // @hide

		text := row[textIdx]
		datetime := row[datetimeIdx]
		shardDate := datetime[:10] // Extract YYYY-MM-DD

		if shardDate != currentDate {
			// Flush buffer for the previous date before switching
			if len(buffer) > 0 {
				client.Upsert(context.Background(), &qdrant.UpsertPoints{
					CollectionName: collectionName,
					Points:         buffer,
					ShardKeySelector: &qdrant.ShardKeySelector{
						ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey(currentDate)},
					},
				})
				buffer = nil
			}

			// Create shard for the new date if it doesn't exist yet
			if !existingShardKeys[shardDate] {
				client.CreateShardKey(context.Background(), collectionName, &qdrant.CreateShardKey{
					ShardKey: qdrant.NewShardKey(shardDate),
				})
				existingShardKeys[shardDate] = true
			}

			currentDate = shardDate
		}

		buffer = append(buffer, &qdrant.PointStruct{
			Id: qdrant.NewID(uuid.New().String()),
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				"dense_vector": qdrant.NewVectorDocument(&qdrant.Document{
					Text:  text,
					Model: denseModel,
				}),
			}),
			Payload: qdrant.NewValueMap(map[string]any{
				"text":     text,
				"datetime": datetime,
			}),
		})

		if len(buffer) >= batchSize {
			client.Upsert(context.Background(), &qdrant.UpsertPoints{
				CollectionName: collectionName,
				Points:         buffer,
				ShardKeySelector: &qdrant.ShardKeySelector{
					ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey(currentDate)},
				},
			})
			buffer = nil
		}
	}

	// Flush remaining partial batch
	if len(buffer) > 0 {
		client.Upsert(context.Background(), &qdrant.UpsertPoints{
			CollectionName: collectionName,
			Points:         buffer,
			ShardKeySelector: &qdrant.ShardKeySelector{
				ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey(currentDate)},
			},
		})
	}
	// @block-end upload-vectors

	// @block-start search-single-shard
	queryText := "coffee"

	result, err := client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: collectionName,
		Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: queryText, Model: denseModel}),
		Using:          qdrant.PtrOf("dense_vector"),
		Limit:          qdrant.PtrOf(uint64(5)),
		ShardKeySelector: &qdrant.ShardKeySelector{
			ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey("2026-04-07")},
		},
	})

	// @hide-start
	if err != nil {
		panic(err)
	}
	// @hide-end

	for _, hit := range result {
		fmt.Println(hit)
	}
	// @block-end search-single-shard

	// @block-start search-multiple-shards
	result, err = client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: collectionName,
		Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: queryText, Model: denseModel}),
		Using:          qdrant.PtrOf("dense_vector"),
		Limit:          qdrant.PtrOf(uint64(5)),
		ShardKeySelector: &qdrant.ShardKeySelector{
			ShardKeys: []*qdrant.ShardKey{
				qdrant.NewShardKey("2026-04-06"),
				qdrant.NewShardKey("2026-04-07"),
			},
		},
	})

	// @hide-start
	if err != nil {
		panic(err)
	}
	// @hide-end

	for _, hit := range result {
		fmt.Println(hit)
	}
	// @block-end search-multiple-shards

	// @block-start search-all-shards
	result, err = client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: collectionName,
		Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: queryText, Model: denseModel}),
		Using:          qdrant.PtrOf("dense_vector"),
		Limit:          qdrant.PtrOf(uint64(5)),
	})

	// @hide-start
	if err != nil {
		panic(err)
	}
	// @hide-end

	for _, hit := range result {
		fmt.Println(hit)
	}
	// @block-end search-all-shards

	// @block-start pruning-shards
	today := "2026-04-08"
	t, _ := time.Parse("2006-01-02", today)
	oldestShardKey := t.AddDate(0, 0, -7).Format("2006-01-02")

	client.CreateShardKey(context.Background(), collectionName, &qdrant.CreateShardKey{
		ShardKey: qdrant.NewShardKey(today),
	})
	client.DeleteShardKey(context.Background(), collectionName, &qdrant.DeleteShardKey{
		ShardKey: qdrant.NewShardKey(oldestShardKey),
	})
	// @block-end pruning-shards

	// @block-start ingest-new-data
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: collectionName,
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewID(uuid.New().String()),
				Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
					"dense_vector": qdrant.NewVectorDocument(&qdrant.Document{
						Text:  "The best way to start a Wednesday is with a cup of coffee",
						Model: denseModel,
					}),
				}),
				Payload: qdrant.NewValueMap(map[string]any{
					"text":     "The best way to start a Wednesday is with a cup of coffee",
					"datetime": "2026-04-08T07:57:47",
				}),
			},
		},
		ShardKeySelector: &qdrant.ShardKeySelector{
			ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey(today)},
		},
	})
	// @block-end ingest-new-data
}
