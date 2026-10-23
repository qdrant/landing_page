package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.SearchParams;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client.queryAsync(
                        QueryPoints.newBuilder()
                                .setCollectionName("{collection_name}")
                                .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
                                .setParams(SearchParams.newBuilder().setExact(true).build())
                                .setLimit(10)
                                .build())
                        .get();
        }
}
