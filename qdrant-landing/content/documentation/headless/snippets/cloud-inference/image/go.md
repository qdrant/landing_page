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

    _, err = client.GetPointsClient().Upsert(ctx, &qdrant.UpsertPoints{
        CollectionName: "<your-collection>",
        Points: []*qdrant.PointStruct{
            {
                Id: qdrant.NewIDNum(uint64(1)),
                Vectors: qdrant.NewVectorsImage(&qdrant.Image{
                    Image: "https://qdrant.tech/example.png",
                    Model: "qdrant/clip-vit-b-32-vision",
                }),
                Payload: qdrant.NewValueMap(map[string]any{
                    "title": "Example image",
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
                Text:  "Mission to Mars",
                Model: "qdrant/clip-vit-b-32-text",
            }),
        ),
    })
    log.Printf("List of points: %s", points)
}
```
