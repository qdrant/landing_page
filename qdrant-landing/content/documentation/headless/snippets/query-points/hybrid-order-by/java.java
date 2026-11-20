package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.range;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.QueryFactory.orderBy;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Common.Range;
import io.qdrant.client.grpc.Points.Direction;
import io.qdrant.client.grpc.Points.OrderBy;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .queryAsync(
                        QueryPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .addPrefetch(
                                PrefetchQuery.newBuilder()
                                    .setQuery(nearest(0.01f, 0.45f, 0.67f))
                                    .setFilter(
                                        Filter.newBuilder()
                                            .addMust(range("price", Range.newBuilder().setGte(10).setLte(80).build()))
                                            .build())
                                    .setLimit(100)
                                    .build())
                            .setQuery(
                                orderBy(
                                    OrderBy.newBuilder()
                                        .setKey("price")
                                        .setDirection(Direction.Asc)
                                        .build()))
                            .setLimit(10)
                            .setWithPayload(enable(true))
                            .build())
                    .get();
        }
}
