package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client = new QdrantClient(
                    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client.createCollectionAsync("{collection_name}",
                        VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(100).build()).get();
        }
}
