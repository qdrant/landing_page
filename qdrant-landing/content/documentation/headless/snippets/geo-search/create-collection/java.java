package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

public class Snippet {
    public static void run() throws Exception {
        // @hide-start
        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                    .withApiKey("<your-api-key>")
                    .build());
        // @hide-end

        client.createCollectionAsync("venues",
                VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(384).build()).get();
    }
}
