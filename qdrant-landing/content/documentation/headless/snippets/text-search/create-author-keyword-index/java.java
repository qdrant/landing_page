package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;

public class Snippet {
    public static void run() throws Exception {
        QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

        client.createPayloadIndexAsync(
            "books",
            "author",
            PayloadSchemaType.Keyword,
            null,
            null,
            null,
            null
        ).get();
    }
}
