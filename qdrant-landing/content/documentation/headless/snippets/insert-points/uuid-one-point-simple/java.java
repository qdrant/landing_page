package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .upsertAsync(
                        "{collection_name}",
                        List.of(
                            PointStruct.newBuilder()
                                .setId(id(UUID.fromString("5c56c793-69f3-4fbf-87e6-c4bf54c28c26")))
                                .setVectors(vectors(0.05f, 0.61f, 0.76f, 0.74f))
                                .putAllPayload(Map.of("color", value("Red")))
                                .build()))
                    .get();
        }
}
