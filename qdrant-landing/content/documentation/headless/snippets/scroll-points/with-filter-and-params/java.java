package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

public class Snippet {
        public static void run() throws Exception {
                client
                    .scrollAsync(
                        ScrollPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setFilter(Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
                            .setLimit(1)
                            .setWithPayload(enable(true))
                            .build())
                    .get();
        }
}
