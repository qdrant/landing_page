package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.SearchParams;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client.queryAsync(QueryPoints.newBuilder()
                        .setCollectionName("{collection_name}")
                        .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
                        .setFilter(Filter.newBuilder().addMust(matchKeyword("city", "London")).build())
                        .setParams(SearchParams.newBuilder().setExact(false).setHnswEf(128).build())
                        .setLimit(3)
                        .build()).get();
        }
}
