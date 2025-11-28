package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.hasId;
import static io.qdrant.client.PointIdFactory.id;

import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .scrollAsync(
                        ScrollPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setFilter(
                                Filter.newBuilder()
                                    .addMust(hasId(List.of(id(1), id(3), id(5), id(7), id(9), id(11))))
                                    .build())
                            .build())
                    .get();
        }
}
