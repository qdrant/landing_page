package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .upsertAsync(
                        "{collection_name}",
                        List.of(
                            PointStruct.newBuilder()
                                .setId(id(1))
                                .setVectors(vectors(0.9f, 0.1f, 0.1f))
                                .putAllPayload(Map.of("color", value("red")))
                                .build(),
                            PointStruct.newBuilder()
                                .setId(id(2))
                                .setVectors(vectors(0.1f, 0.9f, 0.1f))
                                .putAllPayload(Map.of("color", value("green")))
                                .build(),
                            PointStruct.newBuilder()
                                .setId(id(3))
                                .setVectors(vectors(0.1f, 0.1f, 0.9f))
                                .putAllPayload(Map.of("color", value("blue")))
                                .build()))
                    .get();
        }
}
