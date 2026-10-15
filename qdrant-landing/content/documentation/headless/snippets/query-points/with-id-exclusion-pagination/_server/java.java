package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.hasId;
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                var seenIds = List.of(id(83461), id(19284), id(57392), id(44017), id(91825)); // IDs returned on previous pages

                client.queryAsync(
                        QueryPoints.newBuilder()
                                .setCollectionName("{collection_name}")
                                .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
                                .setFilter(
                                        Filter.newBuilder()
                                                .addMustNot(hasId(seenIds))
                                                .build())
                                .setLimit(5)
                                .build())
                        .get();
        }
}
