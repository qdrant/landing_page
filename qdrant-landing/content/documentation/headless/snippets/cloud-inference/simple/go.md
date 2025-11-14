```go
package main

import (
    "context"
    "log"
    "time"

    "github.com/qdrant/go-client/qdrant"
)

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), time.Second)
    defer cancel()

    client, err := qdrant.NewClient(&qdrant.Config{
        Host:   "xyz-example.qdrant.io",
        Port:   6334,
        APIKey: "<paste-your-api-key-here>",
        UseTLS: true,
    })
    if err != nil {
        log.Fatalf("did not connect: %v", err)
    }
    defer client.Close()

    _, err = client.Upsert(ctx, &qdrant.UpsertPoints{
        CollectionName: "<your-collection>",
        Points: []*qdrant.PointStruct{
            {
                Id: qdrant.NewIDNum(1),
                Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
                    Text:  "Recipe for baking chocolate chip cookies",
                    Model: "<the-model-to-use>",
                }),
                Payload: qdrant.NewValueMap(map[string]any{
                    "topic": "cooking",
                    "type":  "dessert",
                }),
            },
        },
    })
    if err != nil {
        log.Fatalf("error creating point: %v", err)
    }

    points, err := client.Query(ctx, &qdrant.QueryPoints{
        CollectionName: "<your-collection>",
        Query: qdrant.NewQueryNearest(
            qdrant.NewVectorInputDocument(&qdrant.Document{
                Text:  "How to bake cookies?",
                Model: "<the-model-to-use>",
            }),
        ),
    })
    log.Printf("List of points: %s", points)
}
```
