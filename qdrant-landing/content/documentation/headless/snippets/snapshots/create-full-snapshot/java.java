package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client.createFullSnapshotAsync().get();
        }
}
