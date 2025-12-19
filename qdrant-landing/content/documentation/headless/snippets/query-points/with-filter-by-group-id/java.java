package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client.queryAsync(
                        QueryPoints.newBuilder()
                                .setCollectionName("{collection_name}")
                                .setFilter(
                                        Filter.newBuilder().addMust(matchKeyword("group_id", "user_1")).build())
                                .setQuery(nearest(0.1f, 0.1f, 0.9f))
                                .setLimit(10)
                                .build())
                        .get();
        }
}
