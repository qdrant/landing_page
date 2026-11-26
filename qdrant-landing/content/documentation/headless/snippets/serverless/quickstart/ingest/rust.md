```rust
use std::collections::HashMap;

use qdrant_client::serverless::{Document, Payload, PointStruct, UpsertPointsBuilder};
use serde_json::json;

const MODEL: &str = "sentence-transformers/all-minilm-l6-v2";

let menu = [
    ("Garden Salad", "Crisp romaine, cherry tomatoes, cucumber, and lemon vinaigrette", 9.0),
    ("Falafel Wrap", "Chickpea fritters with tahini, pickled turnip, and parsley", 11.5),
    ("Mushroom Risotto", "Arborio rice slow-cooked with porcini and parmesan", 16.0),
    ("Roasted Cauliflower", "Whole head charred with cumin, pomegranate, and herbs", 13.0),
    ("Caprese Salad", "Buffalo mozzarella, basil, and heirloom tomatoes with olive oil", 12.0),
    ("Lentil Soup", "Red lentils simmered with carrot, celery, and cumin", 8.0),
    ("Grilled Ribeye", "Twelve-ounce cut finished with herb butter", 32.0),
    ("Clam Chowder", "New England style, with potato, bacon, and thyme", 12.0),
    ("Roast Chicken", "Half bird with lemon, garlic, and pan drippings", 19.0),
    ("Seared Salmon", "Fillet with dill cream and charred lemon", 24.0),
    ("Tiramisu", "Espresso-soaked ladyfingers layered with mascarpone", 8.5),
];

let mut points = Vec::new();
for (idx, (name, description, price)) in menu.into_iter().enumerate() {
    points.push(PointStruct::new(
        idx as u64,
        HashMap::from([("dense".to_string(), Document::new(description, MODEL))]),
        Payload::try_from(json!({
            "name": name,
            "description": description,
            "price": price,
        }))?,
    ));
}

client
    .upsert_points(UpsertPointsBuilder::new("menu", points))
    .await?;
```
