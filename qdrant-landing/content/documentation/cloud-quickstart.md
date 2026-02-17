---
title: Cloud Quickstart
weight: 4
partition: cloud
aliases:
  - ../cloud-quick-start
  - cloud-quick-start
  - cloud-quickstart
  - cloud/quickstart-cloud/
  - /documentation/quickstart-cloud/
---

# Quick Start with Qdrant Cloud

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/xvWIssi_cjQ?si=CLhFrUDpQlNog9mz&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></p>

Learn how to set up Qdrant Cloud and perform your first semantic search in just a few minutes. We'll use a sample dataset of menu items pre-embedded with the `BAAI/bge-small-en-v1.5` model.

## 1. Create a Cloud Cluster

1. Register for a [Cloud account](https://cloud.qdrant.io/signup) with your email, Google or Github credentials.
2. Go to **Clusters** and click **Create First Cluster**.
3. Copy your **API key** when prompted - you'll need it to connect. Store it somewhere safe as it won't be displayed again.

For detailed cluster setup instructions, see the [Cloud documentation](/documentation/cloud-intro/).

## 2. Install the Qdrant Client

Once you have a cluster, the fastest way to get started is to use our official SDKs which provide a convenient interface for working with Qdrant in your preferred programming language.

```bash
pip install qdrant-client fastembed             # for Python projects
# cargo add qdrant-client fastembed             # for Rust projects 
# npm install @qdrant/js-client-rest fastembed  # for Node.js projects
# 
```

## 3. Connect to Qdrant Cloud

Import the qdrant client and create a connection to your Qdrant Cloud cluster using your cluster URL and API key.

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Document

# connect to Qdrant Cloud
client = QdrantClient(
    url="https://xyz-example.eu-central.aws.cloud.qdrant.io",
    api_key="your-api-key",
)
```

```rust
use qdrant_client::{Qdrant, Payload};
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder, PointStruct, DocumentBuilder, UpsertPointsBuilder, QueryPointsBuilder, Query};

use serde_json::json;

// connect to Qdrant Cloud
let client = Qdrant::from_url("https://xyz-example.eu-central.aws.cloud.qdrant.io:6334")
    .api_key("your-api-key")
    .build()?;
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: "https://xyz-example.eu-central.aws.cloud.qdrant.io",
  apiKey: "your-api-key",
});
```

```java
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.Image;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;


QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
            .withApiKey("<your-api-key>")
            .build());
```


```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient(
    host: "xyz-example.qdrant.io",
    port: 6334,
    https: true,
    apiKey: "<your-api-key>"
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
    Host:   "xyz-example.qdrant.io",
    Port:   6334,
    APIKey: "<paste-your-api-key-here>",
    UseTLS: true,
})

```

```bash
# test the connection
curl -X GET \
  'http://<your-qdrant-host>:6333/collections' \
  --header 'api-key: <api-key-value>'
```

## 4. Create our collection

We will use some sample menu items to demonstrate how to create a collection and add data to it. Each menu item has a name, description, price, and category. First, we need to create a collection in Qdrant to store our menu items.


```python
# create collection
client.create_collection(
    collection_name="items",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)
```

```rust
// create collection
client.create_collection(
  CreateCollectionBuilder::new("items")
    .vectors_config(VectorParamsBuilder::new(384, Distance::Cosine)),
)
.await?;
```

```typescript
await client.createCollection("items", {
  vectors: { size: 384, distance: "Cosine" },
});
```

```java
client.createCollectionAsync("items",
        VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(384).build()).get();
```

```csharp
await client.CreateCollectionAsync(
	collectionName: "items",
	vectorsConfig: new VectorParams { Size = 384, Distance = Distance.Cosine }
);
```

```go
client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "items",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     384,
		Distance: qdrant.Distance_Cosine,
	}),
})
```

```bash
curl -X PUT \
  'http://<your-qdrant-host>:6333/collections/items' \
  --header 'api-key: <api-key-value>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "vectors": {
    "size": 384,
    "distance": "Cosine"
  }
}'
```

## 5. Populate the collection
Next, we will populate the collection with menu items. Each item will be represented as a point in the collection, with its vector embedding and associated metadata.

```python
menu_items = [
    ("Pad Thai with Tofu", "Stir-fried rice noodles with tofu bean sprouts scallions and crushed peanuts in traditional tamarind sauce", "$13.95", "Noodles"),
    ("Grilled Salmon Fillet", "Wild-caught Atlantic salmon grilled with lemon butter and fresh herbs served with seasonal vegetables", "$24.50", "Seafood Entrees"),
    ("Mushroom Risotto", "Creamy arborio rice with mixed mushrooms parmesan truffle oil and fresh thyme", "$16.75", "Vegetarian"),
    ("Bibimbap Bowl", "Korean rice bowl with seasoned vegetables fried egg gochujang sauce and choice of protein", "$14.50", "Korean Bowls"),
    ("Falafel Wrap", "Crispy chickpea fritters with hummus tahini cucumber tomato and pickled vegetables in warm pita", "$11.25", "Mediterranean"),
    ("Shrimp Tacos", "Three soft tacos with grilled shrimp cabbage slaw chipotle aioli and fresh lime", "$13.00", "Tacos"),
    ("Vegetable Curry", "Mixed vegetables in aromatic coconut curry sauce with jasmine rice and naan bread", "$12.95", "Indian Curries"),
    ("Tuna Poke Bowl", "Fresh ahi tuna with avocado edamame cucumber seaweed salad over sushi rice with spicy mayo", "$16.50", "Poke Bowls"),
    ("Margherita Pizza", "Fresh mozzarella san marzano tomatoes basil and extra virgin olive oil on wood-fired crust", "$14.00", "Pizza"),
    ("Chicken Tikka Masala", "Tandoori chicken in creamy tomato sauce with aromatic spices served with basmati rice", "$15.95", "Indian Entrees"),
    ("Greek Salad", "Romaine lettuce tomatoes cucumbers kalamata olives feta cheese red onion with lemon oregano dressing", "$10.50", "Salads"),
    ("Lobster Roll", "Fresh Maine lobster meat with light mayo on toasted buttery roll served with chips", "$22.00", "Seafood Sandwiches"),
    ("Quinoa Buddha Bowl", "Organic quinoa with roasted chickpeas kale sweet potato tahini dressing and hemp seeds", "$13.50", "Healthy Bowls"),
    ("Beef Pho", "Traditional Vietnamese beef noodle soup with rice noodles fresh herbs bean sprouts and lime", "$12.75", "Noodle Soups"),
    ("Eggplant Parmesan", "Breaded eggplant layered with marinara mozzarella and parmesan served with pasta", "$15.25", "Italian Entrees"),
    ("Crab Cakes", "Maryland-style lump crab cakes with remoulade sauce and mixed greens", "$18.50", "Seafood Appetizers"),
    ("Tofu Stir Fry", "Crispy tofu with broccoli bell peppers snap peas in garlic ginger sauce over steamed rice", "$12.50", "Vegetarian Entrees"),
    ("Salmon Sushi Platter", "12 pieces of fresh salmon nigiri and sashimi with wasabi pickled ginger and soy sauce", "$19.95", "Sushi"),
    ("Caprese Sandwich", "Fresh mozzarella tomatoes basil pesto balsamic glaze on ciabatta bread", "$11.75", "Sandwiches"),
    ("Tom Yum Soup", "Spicy and sour Thai soup with shrimp lemongrass galangal mushrooms and kaffir lime leaves", "$11.50", "Soups"),
    ("Lentil Dal", "Red lentils simmered with turmeric cumin coriander served with rice and naan", "$11.95", "Vegan Entrees"),
    ("Fish and Chips", "Beer-battered cod with crispy fries malt vinegar and tartar sauce", "$16.00", "British Classics"),
    ("Veggie Burger", "House-made black bean and quinoa patty with avocado sprouts tomato on brioche bun", "$13.25", "Burgers"),
    ("Miso Ramen", "Rich miso broth with ramen noodles soft-boiled egg bamboo shoots nori and scallions", "$14.50", "Ramen"),
    ("Stuffed Bell Peppers", "Roasted bell peppers filled with rice vegetables herbs and melted cheese", "$13.75", "Vegetarian Entrees"),
    ("Scallop Risotto", "Pan-seared sea scallops over creamy parmesan risotto with white wine and lemon", "$26.50", "Seafood Specials"),
    ("Spring Rolls", "Fresh rice paper rolls with vegetables tofu rice noodles herbs and peanut dipping sauce", "$8.95", "Appetizers"),
    ("Oyster Po Boy", "Fried oysters with lettuce tomato pickles and remoulade on french bread", "$15.50", "Sandwiches"),
    ("Portobello Mushroom Steak", "Grilled portobello cap marinated in balsamic with roasted vegetables and quinoa", "$14.95", "Vegan Entrees"),
    ("Coconut Shrimp", "Jumbo shrimp breaded in shredded coconut served with sweet chili sauce", "$14.25", "Seafood Appetizers")
]

# points generator
points = []
for i, menu_item in enumerate(menu_items):
    point = PointStruct(
        id=i,
        vector=Document(
            text=f"{menu_item[0]} {menu_item[1]}",
            model="sentence-transformers/all-MiniLM-L6-v2"
        ),
        payload={
            "item_name": menu_items[i][0],
            "description": menu_items[i][1],
            "price": menu_items[i][2],
            "category": menu_items[i][3],
        }
    )
    points.append(point)

# upsert points to collection
client.upsert(
  collection_name="items",
  points=points,
)
```

```rust
// generate embeddings and prepare points
let menu_items = vec![
    (
        "Pad Thai with Tofu",
        "Stir-fried rice noodles with tofu bean sprouts scallions and crushed peanuts in traditional tamarind sauce",
        "$13.95",
        "Noodles",
    ),
    (
        "Grilled Salmon Fillet",
        "Wild-caught Atlantic salmon grilled with lemon butter and fresh herbs served with seasonal vegetables",
        "$24.50",
        "Seafood Entrees",
    ),
    (
        "Mushroom Risotto",
        "Creamy arborio rice with mixed mushrooms parmesan truffle oil and fresh thyme",
        "$16.75",
        "Vegetarian",
    ),
    (
        "Bibimbap Bowl",
        "Korean rice bowl with seasoned vegetables fried egg gochujang sauce and choice of protein",
        "$14.50",
        "Korean Bowls",
    ),
    (
        "Falafel Wrap",
        "Crispy chickpea fritters with hummus tahini cucumber tomato and pickled vegetables in warm pita",
        "$11.25",
        "Mediterranean",
    ),
    (
        "Shrimp Tacos",
        "Three soft tacos with grilled shrimp cabbage slaw chipotle aioli and fresh lime",
        "$13.00",
        "Tacos",
    ),
    (
        "Vegetable Curry",
        "Mixed vegetables in aromatic coconut curry sauce with jasmine rice and naan bread",
        "$12.95",
        "Indian Curries",
    ),
    (
        "Tuna Poke Bowl",
        "Fresh ahi tuna with avocado edamame cucumber seaweed salad over sushi rice with spicy mayo",
        "$16.50",
        "Poke Bowls",
    ),
    (
        "Margherita Pizza",
        "Fresh mozzarella san marzano tomatoes basil and extra virgin olive oil on wood-fired crust",
        "$14.00",
        "Pizza",
    ),
    (
        "Chicken Tikka Masala",
        "Tandoori chicken in creamy tomato sauce with aromatic spices served with basmati rice",
        "$15.95",
        "Indian Entrees",
    ),
    (
        "Greek Salad",
        "Romaine lettuce tomatoes cucumbers kalamata olives feta cheese red onion with lemon oregano dressing",
        "$10.50",
        "Salads",
    ),
    (
        "Lobster Roll",
        "Fresh Maine lobster meat with light mayo on toasted buttery roll served with chips",
        "$22.00",
        "Seafood Sandwiches",
    ),
    (
        "Quinoa Buddha Bowl",
        "Organic quinoa with roasted chickpeas kale sweet potato tahini dressing and hemp seeds",
        "$13.50",
        "Healthy Bowls",
    ),
    (
        "Beef Pho",
        "Traditional Vietnamese beef noodle soup with rice noodles fresh herbs bean sprouts and lime",
        "$12.75",
        "Noodle Soups",
    ),
    (
        "Eggplant Parmesan",
        "Breaded eggplant layered with marinara mozzarella and parmesan served with pasta",
        "$15.25",
        "Italian Entrees",
    ),
    (
        "Crab Cakes",
        "Maryland-style lump crab cakes with remoulade sauce and mixed greens",
        "$18.50",
        "Seafood Appetizers",
    ),
    (
        "Tofu Stir Fry",
        "Crispy tofu with broccoli bell peppers snap peas in garlic ginger sauce over steamed rice",
        "$12.50",
        "Vegetarian Entrees",
    ),
    (
        "Salmon Sushi Platter",
        "12 pieces of fresh salmon nigiri and sashimi with wasabi pickled ginger and soy sauce",
        "$19.95",
        "Sushi",
    ),
    (
        "Caprese Sandwich",
        "Fresh mozzarella tomatoes basil pesto balsamic glaze on ciabatta bread",
        "$11.75",
        "Sandwiches",
    ),
    (
        "Tom Yum Soup",
        "Spicy and sour Thai soup with shrimp lemongrass galangal mushrooms and kaffir lime leaves",
        "$11.50",
        "Soups",
    ),
    (
        "Lentil Dal",
        "Red lentils simmered with turmeric cumin coriander served with rice and naan",
        "$11.95",
        "Vegan Entrees",
    ),
    (
        "Fish and Chips",
        "Beer-battered cod with crispy fries malt vinegar and tartar sauce",
        "$16.00",
        "British Classics",
    ),
    (
        "Veggie Burger",
        "House-made black bean and quinoa patty with avocado sprouts tomato on brioche bun",
        "$13.25",
        "Burgers",
    ),
    (
        "Miso Ramen",
        "Rich miso broth with ramen noodles soft-boiled egg bamboo shoots nori and scallions",
        "$14.50",
        "Ramen",
    ),
    (
        "Stuffed Bell Peppers",
        "Roasted bell peppers filled with rice vegetables herbs and melted cheese",
        "$13.75",
        "Vegetarian Entrees",
    ),
    (
        "Scallop Risotto",
        "Pan-seared sea scallops over creamy parmesan risotto with white wine and lemon",
        "$26.50",
        "Seafood Specials",
    ),
    (
        "Spring Rolls",
        "Fresh rice paper rolls with vegetables tofu rice noodles herbs and peanut dipping sauce",
        "$8.95",
        "Appetizers",
    ),
    (
        "Oyster Po Boy",
        "Fried oysters with lettuce tomato pickles and remoulade on french bread",
        "$15.50",
        "Sandwiches",
    ),
    (
        "Portobello Mushroom Steak",
        "Grilled portobello cap marinated in balsamic with roasted vegetables and quinoa",
        "$14.95",
        "Vegan Entrees",
    ),
    (
        "Coconut Shrimp",
        "Jumbo shrimp breaded in shredded coconut served with sweet chili sauce",
        "$14.25",
        "Seafood Appetizers",
    ),
];

let points = menu_items
    .into_iter()
    .enumerate()
    .map(|(idx, menu_item)| {
        PointStruct::new(
            idx as u64,
            DocumentBuilder::new(
                format!("{} {}", menu_item.0, menu_item.1),
                "sentence-transformers/all-MiniLM-L6-v2"
                )
                .build(),
            Payload::try_from(json!({
                "item_name": menu_item.0,
                "description": menu_item.1,
                "price": menu_item.2,
                "category": menu_item.3,
            }))
            .unwrap(),
        )
    })
    .collect::<Vec<_>>();

let _ = client
    .upsert_points(UpsertPointsBuilder::new("items", points).wait(true))
    .await;
```

```typescript
let menuItems = [
    [
        "Pad Thai with Tofu",
        "Stir-fried rice noodles with tofu bean sprouts scallions and crushed peanuts in traditional tamarind sauce",
        "$13.95",
        "Noodles",
    ],
    [
        "Grilled Salmon Fillet",
        "Wild-caught Atlantic salmon grilled with lemon butter and fresh herbs served with seasonal vegetables",
        "$24.50",
        "Seafood Entrees",
    ],
    [
        "Mushroom Risotto",
        "Creamy arborio rice with mixed mushrooms parmesan truffle oil and fresh thyme",
        "$16.75",
        "Vegetarian",
    ],
    [
        "Bibimbap Bowl",
        "Korean rice bowl with seasoned vegetables fried egg gochujang sauce and choice of protein",
        "$14.50",
        "Korean Bowls",
    ],
    [
        "Falafel Wrap",
        "Crispy chickpea fritters with hummus tahini cucumber tomato and pickled vegetables in warm pita",
        "$11.25",
        "Mediterranean",
    ],
    [
        "Shrimp Tacos",
        "Three soft tacos with grilled shrimp cabbage slaw chipotle aioli and fresh lime",
        "$13.00",
        "Tacos",
    ],
    [
        "Vegetable Curry",
        "Mixed vegetables in aromatic coconut curry sauce with jasmine rice and naan bread",
        "$12.95",
        "Indian Curries",
    ],
    [
        "Tuna Poke Bowl",
        "Fresh ahi tuna with avocado edamame cucumber seaweed salad over sushi rice with spicy mayo",
        "$16.50",
        "Poke Bowls",
    ],
    [
        "Margherita Pizza",
        "Fresh mozzarella san marzano tomatoes basil and extra virgin olive oil on wood-fired crust",
        "$14.00",
        "Pizza",
    ],
    [
        "Chicken Tikka Masala",
        "Tandoori chicken in creamy tomato sauce with aromatic spices served with basmati rice",
        "$15.95",
        "Indian Entrees",
    ],
    [
        "Greek Salad",
        "Romaine lettuce tomatoes cucumbers kalamata olives feta cheese red onion with lemon oregano dressing",
        "$10.50",
        "Salads",
    ],
    [
        "Lobster Roll",
        "Fresh Maine lobster meat with light mayo on toasted buttery roll served with chips",
        "$22.00",
        "Seafood Sandwiches",
    ],
    [
        "Quinoa Buddha Bowl",
        "Organic quinoa with roasted chickpeas kale sweet potato tahini dressing and hemp seeds",
        "$13.50",
        "Healthy Bowls",
    ],
    [
        "Beef Pho",
        "Traditional Vietnamese beef noodle soup with rice noodles fresh herbs bean sprouts and lime",
        "$12.75",
        "Noodle Soups",
    ],
    [
        "Eggplant Parmesan",
        "Breaded eggplant layered with marinara mozzarella and parmesan served with pasta",
        "$15.25",
        "Italian Entrees",
    ],
    [
        "Crab Cakes",
        "Maryland-style lump crab cakes with remoulade sauce and mixed greens",
        "$18.50",
        "Seafood Appetizers",
    ],
    [
        "Tofu Stir Fry",
        "Crispy tofu with broccoli bell peppers snap peas in garlic ginger sauce over steamed rice",
        "$12.50",
        "Vegetarian Entrees",
    ],
    [
        "Salmon Sushi Platter",
        "12 pieces of fresh salmon nigiri and sashimi with wasabi pickled ginger and soy sauce",
        "$19.95",
        "Sushi",
    ],
    [
        "Caprese Sandwich",
        "Fresh mozzarella tomatoes basil pesto balsamic glaze on ciabatta bread",
        "$11.75",
        "Sandwiches",
    ],
    [
        "Tom Yum Soup",
        "Spicy and sour Thai soup with shrimp lemongrass galangal mushrooms and kaffir lime leaves",
        "$11.50",
        "Soups",
    ],
    [
        "Lentil Dal",
        "Red lentils simmered with turmeric cumin coriander served with rice and naan",
        "$11.95",
        "Vegan Entrees",
    ],
    [
        "Fish and Chips",
        "Beer-battered cod with crispy fries malt vinegar and tartar sauce",
        "$16.00",
        "British Classics",
    ],
    [
        "Veggie Burger",
        "House-made black bean and quinoa patty with avocado sprouts tomato on brioche bun",
        "$13.25",
        "Burgers",
    ],
    [
        "Miso Ramen",
        "Rich miso broth with ramen noodles soft-boiled egg bamboo shoots nori and scallions",
        "$14.50",
        "Ramen",
    ],
    [
        "Stuffed Bell Peppers",
        "Roasted bell peppers filled with rice vegetables herbs and melted cheese",
        "$13.75",
        "Vegetarian Entrees",
    ],
    [
        "Scallop Risotto",
        "Pan-seared sea scallops over creamy parmesan risotto with white wine and lemon",
        "$26.50",
        "Seafood Specials",
    ],
    [
        "Spring Rolls",
        "Fresh rice paper rolls with vegetables tofu rice noodles herbs and peanut dipping sauce",
        "$8.95",
        "Appetizers",
    ],
    [
        "Oyster Po Boy",
        "Fried oysters with lettuce tomato pickles and remoulade on french bread",
        "$15.50",
        "Sandwiches",
    ],
    [
        "Portobello Mushroom Steak",
        "Grilled portobello cap marinated in balsamic with roasted vegetables and quinoa",
        "$14.95",
        "Vegan Entrees",
    ],
    [
        "Coconut Shrimp",
        "Jumbo shrimp breaded in shredded coconut served with sweet chili sauce",
        "$14.25",
        "Seafood Appetizers",
    ],
] as const;

// generate embeddings and prepare points
const points: any[] = [];
let idx = 0;

for (const menuItem of menuItems) {
  points.push({
    id: idx,
    vector: {
        text: `${menuItem[0]} ${menuItem[1]}`,
        model: "sentence-transformers/all-MiniLM-L6-v2",
    },
    payload: {
      item_name: menuItems[idx][0],
      description: menuItems[idx][1],
      price: menuItems[idx][2],
      category: menuItems[idx][3],
    },
  });
  idx++;
}

// upsert points to collection
await client.upsert("items", { points });
```

```java
client
    .upsertAsync(
        "items",
        List.of(
            PointStruct::newBuilder()
            .setId(id(0))
            .setVectors(
                namedVectors(
                    Map.of(
                        "
                    )
                )
            )
        )
    )
```

## 6. Search the Menu Items
Now we can search the menu item dataset! We'll use the same `sentence-transformers/all-MiniLM-L6-v2` model in Cloud Inference to embed our query text, then find the best dishes matching that embedding.

```python
# generate query embedding
query_text = "vegetarian dishes"

# search for similar menu items
results = client.query_points(
    collection_name="items",
    query=Document(text=query_text, model="sentence-transformers/all-MiniLM-L6-v2"),
    with_payload=True,
    limit=5
)

# print results
for result in results.points:
    print(f"Item: {result.payload.get('item_name', 'N/A')}")
    print(f"Score: {result.score}")
    print(f"Description: {result.payload['description'][:150]}...")
    print(f"Price: {result.payload.get('price', 'N/A')}")
    print("---")
```

```rust
// generate query embedding
let query_text = "vegetarian dishes";

let results = client
    .query(
        QueryPointsBuilder::new("items")
            .query(Query::new_nearest(
                DocumentBuilder::new(
                    query_text,
                    "sentence-transformers/all-MiniLM-L6-v2"
                )
                .build(),
            ))
            .with_payload(true)
            .limit(5),
    )
    .await
    .expect("Query failed");

let na_str = "N/A".to_string();

for result in results.result {
    let payload = result.payload;
    println!("Item: {}", payload.get("item_name")
        .and_then(|v| v.as_str()).unwrap_or(&na_str));
    println!("Score: {}", result.score);
    println!("Description: {}", payload.get("description")
        .and_then(|v| v.as_str()).unwrap_or(&na_str));
    println!("Price: {}", payload.get("price")
        .and_then(|v| v.as_str()).unwrap_or(&na_str));
    println!("---");
}
```

```typescript
// generate query embedding
const queryText = "vegetarian dishes";
const queryEmbedding = (await model.embed([queryText]).next()).value!

// search for similar items
const results = await client.query("items", {
  query: Array.from(queryEmbedding[0]),
  with_payload: true,
  limit: 5,
});

// print results
for (const result of results.points) {
  console.log(`Item: ${result.payload?.item_name || 'N/A'}`);
  console.log(`Score: ${result.score}`);
  console.log(`Description: ${result.payload?.description || 'N/A'}`);
  console.log(`Price: ${result.payload?.price || 'N/A'}`);
  console.log('---');
}
```

## That's Vector Search!

You've just performed semantic search on real menu item data. The query "vegetarian dishes" returned similar menu items based on meaning, not just keyword matching.

## What's Next?

- Explore [filtering](/documentation/concepts/filtering/) to combine semantic search with structured queries
- Learn about [collections](/documentation/concepts/collections/) and advanced configuration options
- Check out more [examples and tutorials](/documentation/tutorials-overview/)