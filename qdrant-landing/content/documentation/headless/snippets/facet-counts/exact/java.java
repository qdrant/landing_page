package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Points.FacetCounts;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                      .facetAsync(
                          FacetCounts.newBuilder()
                              .setCollectionName("{collection_name}")
                              .setKey("foo")
                              .setExact(true)
                              .build())
                      .get();
        }
}
