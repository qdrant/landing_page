package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;

import io.qdrant.client.grpc.Points.NamedVectors;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.Vectors;
import java.util.List;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .upsertAsync(
                        "{collection_name}",
                        List.of(
                            PointStruct.newBuilder()
                                .setId(id(1))
                                .setVectors(
                                    Vectors.newBuilder()
                                        .setVectors(
                                            NamedVectors.newBuilder()
                                                .putAllVectors(
                                                    Map.of(
                                                        "text", vector(List.of(1.0f, 2.0f), List.of(6, 7))))
                                                .build())
                                        .build())
                                .build(),
                            PointStruct.newBuilder()
                                .setId(id(2))
                                .setVectors(
                                    Vectors.newBuilder()
                                        .setVectors(
                                            NamedVectors.newBuilder()
                                                .putAllVectors(
                                                    Map.of(
                                                        "text",
                                                        vector(
                                                            List.of(0.1f, 0.2f, 0.3f, 0.4f, 0.5f),
                                                            List.of(1, 2, 3, 4, 5))))
                                                .build())
                                        .build())
                                .build()))
                    .get();
        }
}
