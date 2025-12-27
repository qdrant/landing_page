package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.*;

public class Snippet {
  public static void run() throws Exception {
    QdrantClient client =
        new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

    client
        .createCollectionAsync(
            CreateCollection.newBuilder()
                .setCollectionName("books")
                .setSparseVectorsConfig(
                    SparseVectorConfig.newBuilder()
                        .putMap(
                            "title-bm25",
                            SparseVectorParams.newBuilder().setModifier(Modifier.Idf).build())
                        .build())
                .build())
        .get();
  }
}
