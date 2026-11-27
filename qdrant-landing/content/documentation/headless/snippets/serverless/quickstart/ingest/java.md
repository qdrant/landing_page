```java
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.grpc.JsonWithInt.Value;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

String model = "sentence-transformers/all-minilm-l6-v2";

List<Map<String, Value>> menu =
    List.of(
        Map.of("name", value("Garden Salad"), "description", value("Crisp romaine, cherry tomatoes, cucumber, and lemon vinaigrette"), "price", value(9.0)),
        Map.of("name", value("Falafel Wrap"), "description", value("Chickpea fritters with tahini, pickled turnip, and parsley"), "price", value(11.5)),
        Map.of("name", value("Mushroom Risotto"), "description", value("Arborio rice slow-cooked with porcini and parmesan"), "price", value(16.0)),
        Map.of("name", value("Roasted Cauliflower"), "description", value("Whole head charred with cumin, pomegranate, and herbs"), "price", value(13.0)),
        Map.of("name", value("Caprese Salad"), "description", value("Buffalo mozzarella, basil, and heirloom tomatoes with olive oil"), "price", value(12.0)),
        Map.of("name", value("Lentil Soup"), "description", value("Red lentils simmered with carrot, celery, and cumin"), "price", value(8.0)),
        Map.of("name", value("Grilled Ribeye"), "description", value("Twelve-ounce cut finished with herb butter"), "price", value(32.0)),
        Map.of("name", value("Clam Chowder"), "description", value("New England style, with potato, bacon, and thyme"), "price", value(12.0)),
        Map.of("name", value("Roast Chicken"), "description", value("Half bird with lemon, garlic, and pan drippings"), "price", value(19.0)),
        Map.of("name", value("Seared Salmon"), "description", value("Fillet with dill cream and charred lemon"), "price", value(24.0)),
        Map.of("name", value("Tiramisu"), "description", value("Espresso-soaked ladyfingers layered with mascarpone"), "price", value(8.5)));

List<PointStruct> points = new ArrayList<>();
for (int idx = 0; idx < menu.size(); idx++) {
    Map<String, Value> item = menu.get(idx);
    String description = item.get("description").getStringValue();
    points.add(
        PointStruct.newBuilder()
            .setId(id(idx))
            .setVectors(
                namedVectors(
                    Map.of(
                        "dense",
                        vector(Document.newBuilder().setText(description).setModel(model).build()))))
            .putAllPayload(item)
            .build());
}

client.upsertAsync("menu", points).get();
```
