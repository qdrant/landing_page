package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                      new QdrantClient(
                        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                        .withApiKey("<paste-your-api-key-here>")
                        .build());
        }
}
