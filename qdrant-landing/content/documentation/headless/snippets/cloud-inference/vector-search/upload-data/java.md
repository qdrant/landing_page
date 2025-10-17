```java
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorsFactory.namedVectors;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

String denseModel = "sentence-transformers/all-minilm-l6-v2";
String bm25Model = "qdrant/bm25";
List<Map<String, String>> dataset = loadDataset("miriad/miriad-4.4M", "train[0:100]");
List<PointStruct> points = new ArrayList<>();

for (Map<String, String> item : dataset) {
  String passage = item.get("passage_text");
  PointStruct point =
      PointStruct.newBuilder()
          .setId(id(UUID.randomUUID()))
          .setVectors(
              namedVectors(
                  Map.of(
                      "dense_vector",
                      vectors(
                          Document.newBuilder().setText(passage).setModel(denseModel).build()),
                      "bm25_sparse_vector",
                      vectors(
                          Document.newBuilder().setText(passage).setModel(bm25Model).build()))))
          .build();
  points.add(point);
}

client.upsertAsync("{collection_name}", points).get();
```
