package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Points.OrderBy;
import io.qdrant.client.grpc.Points.ScrollPoints;

public class Snippet {
        public static void run() throws Exception {
                client.scrollAsync(ScrollPoints.newBuilder()
                  .setCollectionName("{collection_name}")
                  .setLimit(15)
                  .setOrderBy(OrderBy.newBuilder().setKey("timestamp").build())
                  .build()).get();
        }
}
