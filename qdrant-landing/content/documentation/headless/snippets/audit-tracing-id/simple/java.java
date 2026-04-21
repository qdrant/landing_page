package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.grpc.Context;

public class Snippet {
    public static void run() throws Exception {
        // @hide-start
        QdrantClient client = new QdrantClient(
            QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
        // @hide-end

        Context ctx = RequestHeaders.withHeader(Context.current(), "x-request-id", "my-trace-id");
        ctx.run(() -> client.listCollectionsAsync());
    }
}
