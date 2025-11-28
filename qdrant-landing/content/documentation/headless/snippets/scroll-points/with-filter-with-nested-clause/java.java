package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.match;
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.ConditionFactory.nested;

import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                client
                    .scrollAsync(
                        ScrollPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setFilter(
                                Filter.newBuilder()
                                    .addMust(
                                        nested(
                                            "diet",
                                            Filter.newBuilder()
                                                .addAllMust(
                                                    List.of(
                                                        matchKeyword("food", "meat"), match("likes", true)))
                                                .build()))
                                    .build())
                            .build())
                    .get();
        }
}
