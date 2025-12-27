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
                .setVectorsConfig(
                    VectorsConfig.newBuilder()
                        .setParamsMap(
                            VectorParamsMap.newBuilder()
                                .putMap(
                                    "description-dense",
                                    VectorParams.newBuilder()
                                        .setSize(384)
                                        .setDistance(Distance.Cosine)
                                        .build())
                                .build())
                        .build())
                .build())
        .get();
  }
}
