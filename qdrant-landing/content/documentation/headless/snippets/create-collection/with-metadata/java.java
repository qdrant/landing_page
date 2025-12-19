package com.example.snippets_amalgamation;

import static io.qdrant.client.ValueFactory.value;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client = new QdrantClient(
                    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .createCollectionAsync(
                        CreateCollection.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setVectorsConfig(
                                VectorsConfig.newBuilder()
                                    .setParams(
                                        VectorParams.newBuilder()
                                            .setDistance(Distance.Cosine)
                                            .setSize(100)
                                            .build())
                                    .build())
                            .putAllMetadata(
                                Map.of(
                                    "my-metadata-field", value("value-1"),
                                    "another-field", value(123)))
                            .build())
                    .get();
        }
}
