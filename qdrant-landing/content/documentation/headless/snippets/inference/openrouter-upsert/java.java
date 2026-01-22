package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(
                        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                            .withApiKey("<your-openrouter-key>")
                            .build());

                client
                    .upsertAsync(
                        "{collection_name}",
                        List.of(
                            PointStruct.newBuilder()
                                .setId(id(1))
                                .setVectors(
                                    vectors(
                                        Document.newBuilder()
                                            .setModel("openrouter/mistralai/mistral-embed-2312")
                                            .setText("Recipe for baking chocolate chip cookies")
                                            .putAllOptions(
                                                Map.of(
                                                    "openrouter-api-key",
                                                    value("<YOUR_OPENROUTER_API_KEY>")
                                            .build()))
                                .build()))
                    .get();
        }
}