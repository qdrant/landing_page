package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Points.OrderBy;
import io.qdrant.client.grpc.Points.ScrollPoints;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client.scrollAsync(ScrollPoints.newBuilder()
                  .setCollectionName("{collection_name}")
                  .setLimit(15)
                  .setOrderBy(OrderBy.newBuilder().setKey("timestamp").build())
                  .build()).get();
        }
}
