package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.grpc.Points.PointStruct;
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
                                    namedVectors(
                                        Map.of(
                                            "image",
                                            vector(List.of(0.9f, 0.1f, 0.1f, 0.2f)),
                                            "text",
                                            vector(List.of(0.4f, 0.7f, 0.1f, 0.8f, 0.1f)),
                                            "text-sparse",
                                            vector(List.of(0.1f, 0.2f, 0.3f, 0.4f), List.of(1, 3, 5, 7)))))
                                .build()))
                    .get();
        }
}
