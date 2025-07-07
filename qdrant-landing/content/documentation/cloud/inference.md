---
title: Inference
weight: 81
---

# Inference in Qdrant Managed Cloud

Inference is the process of creating vector embeddings from text, images, or other data types using a machine learning model.

Qdrant Managed Cloud allows you to use inference directly in the cloud, without the need to set up and maintain your own inference infrastructure.

<aside role="alert">
    Inference is currently only available in US regions for paid clusters. Support for inference in other regions is coming soon.
</aside>

![Cluster Cluster UI](/documentation/cloud/cloud-inference.png)

## Supported Models

You can see the list of supported models in the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. The list includes models for text, both to produce dense and sparse vectors, as well as multi-modal models for images.

## Enabling/Disabling Inference

Inference is enabled by default for all new clusters, created after July, 7th 2025. You can enable it for existing clusters directly from the Inference tab of the Cluster Detail page in the Qdrant Cloud Console. Activating inference will trigger a restart of your cluster to apply the new configuration.

## Billing

Inference is billed based on the number of tokens processed by the model. The cost is calculated per 1,000,000 tokens. The price depends on the model and is displayed ont the Inference tab of the Cluster Detail page. You also can see the current usage of each model there.

## Using Inference

Inference can be easily used through the Qdrant SDKs and the REST or GRPC APIs. Inference is available when upserting points as well as when querying the database.

```bash
# Create a new vector    
curl -X PUT "https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6333/collections/<your-collection>/points?wait=true" \\
  -H "Content-Type: application/json" \\
  -H "api-key: <paste-your-api-key-here>" \\
  -d '{
    "points": [
      {
        "id": 1,
        "payload": { "topic": "cooking", "type": "dessert" },
        "vector": {
          "text": "Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.",
          "model": "<the-model-to-use>"
        }
      }
    ]
  }'
  
# Perform a search query
curl -X POST "https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6333/collections/<your-collection>/points/query" \\
  -H "Content-Type: application/json" \\
  -H "api-key: <paste-your-api-key-here>" \\
  -d '{
    "query": {
      "text": "Recipe for baking chocolate chip cookies",
      "model": "<the-model-to-use>"
    }
  }' 
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, Document

client = QdrantClient(
    url="https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6333",
    api_key="<paste-your-api-key-here>",
    cloud_inference=True,
)

points = [
    PointStruct(
        id=1,
        payload={"topic": "cooking", "type": "dessert"},
        vector=Document(
            text="Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.",
            model="<the-model-to-use>"
        )
    )
]

client.upsert(collection_name="<your-collection>", points=points)

points = client.query_points(collection_name="<your-collection>", query=Document(
    text="Recipe for baking chocolate chip cookies requires flour",
    model="<the-model-to-use>"
))

print(points)
```

```typescript
import {QdrantClient} from "@qdrant/js-client-rest";

const client = new QdrantClient({
    url: 'https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6333',
    apiKey: '<paste-your-api-key-here>',
});

const points = [
  {
    id: 1,
    payload: { topic: "cooking", type: "dessert" },
    vector: {
        text: "Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.",
        model: "<the-model-to-use>"
      }
  }
];

await client.upsert("<your-collection>", { wait: true, points });

const result = await client.query(
    "<your-collection>",
    {
      query: {
          text: "What ingredients are needed for baking chocolate chip cookies?",
          model: "<the-model-to-use>"
      },
    }
)

console.log(result);
```

```rust
use qdrant_client::qdrant::vector;
use qdrant_client::qdrant::vector_input;
use qdrant_client::qdrant::QueryPointsBuilder;
use qdrant_client::qdrant::Vector;
use qdrant_client::qdrant::VectorInput;
use qdrant_client::Payload;
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Document};
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};

#[tokio::main]
async fn main() {
    let client = Qdrant::from_url("https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6334")
        .api_key("<paste-your-api-key-here>")
        .build()
        .unwrap();

    let mut points = Vec::new();

    let vector = Vector {
        vector: Some(vector::Vector::Document(Document {
            text: "Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.".to_string(),
            model: "<the-model-to-use>".to_string(),
            options: Default::default(),
        })),
        ..Default::default()
    };

    points.push(PointStruct::new(1, vector, Payload::default()));

    let _ = client
        .upsert_points(UpsertPointsBuilder::new("<your-collection>", points).wait(true))
        .await;

    let document = Document {
        text: "Recipe for baking chocolate chip cookies".to_string(),
        model: "<the-model-to-use>".to_string(),
        options: Default::default(),
    };

    let query = VectorInput {
        variant: Some(vector_input::Variant::Document(document)),
    };

    let query_request = QueryPointsBuilder::new("<your-collection>").query(query);

    let result = client.query(query_request).await.unwrap();
    println!("Result: {:?}", result);
```

```java
package org.example;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.grpc.Points;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class Main {
  public static void main(String[] args) throws ExecutionException, InterruptedException {
    QdrantClient client =
      new QdrantClient(
        QdrantGrpcClient.newBuilder("xyz-example.cloud-region.cloud-provider.cloud.qdrant.io", 6334, true)
        .withApiKey("<paste-your-api-key-here>")
        .build());

    client
      .upsertAsync(
        "<your-collection>",
        List.of(
          PointStruct.newBuilder()
          .setId(id(1))
          .setVectors(
            vectors(
              Document.newBuilder()
              .setText(
                "Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.")
              .setModel("<the-model-to-use>")
              .build()))
          .putAllPayload(Map.of("topic", value("cooking"), "type", value("dessert")))
          .build()))
      .get();

    List <Points.ScoredPoint> points =
      client
      .queryAsync(
        Points.QueryPoints.newBuilder()
        .setCollectionName("<your-collection>")
        .setQuery(
          nearest(
            Document.newBuilder()
            .setText("Recipe for baking chocolate chip cookies")
            .setModel("<the-model-to-use>")
            .build()))
        .build())
      .get();

    System.out.printf(points.toString());
  }
}
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using Value = Qdrant.Client.Grpc.Value;

var client = new QdrantClient(
  host: "xyz-example.cloud-region.cloud-provider.cloud.qdrant.io",
  port: 6334,
  https: true,
  apiKey: "<paste-your-api-key-here>"
);

await client.UpsertAsync(
  collectionName: "<your-collection>",
  points: new List <PointStruct> {
    new() {
      Id = 1,
        Vectors = new Document() {
          Text =
            "Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.",
            Model = "<the-model-to-use>",
        },
        Payload = {
          ["topic"] = "cooking",
          ["type"] = "dessert"
        },
    },
  }
);

var points = await client.QueryAsync(
  collectionName: "<your-collection>",
  query: new Document() {
    Text = "Recipe for baking chocolate chip cookies", Model = "<the-model-to-use>"
  }
);

foreach(var point in points) {
  Console.WriteLine(point);
}
```

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
		Host:   "xyz-example.cloud-region.cloud-provider.cloud.qdrant.io",
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
				Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
					Text:  "Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.",
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
				Text:  "Recipe for baking chocolate chip cookies",
				Model: "<the-model-to-use>",
			}),
		),
	})
	log.Printf("List of points: %s", points)
}
})
```

Usage examples, specific to each cluster and model, can also be found in the Inference tab of the Cluster Detail page in the Qdrant Cloud Console.

Note that each model has a context window, which is the maximum number of tokens that can be processed by the model in a single request. If the input text exceeds the context window, it will be truncated to fit within the limit. The context window size is displayed in the Inference tab of the Cluster Detail page.

For dense vector models, you also have to ensure that the vector size configured in the collection matches the output size of the model. If the vector size does not match, the upsert will fail with an error.
