package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import java.util.Map;

public class Snippet {
    public static void run() throws Exception {
        QdrantClient client = new QdrantClient(
            QdrantGrpcClient.newBuilder("xyz-example.eu-central.aws.cloud.qdrant.io", 6334, true)
                .withHeaders(Map.of("authorization", "Bearer your_token_here"))
                .build());
    }
}
