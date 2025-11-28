package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

public class Snippet {
        public static void run() throws Exception {
                client
                    .scrollAsync(
                        ScrollPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setFilter(
                                Filter.newBuilder()
                                    .addShould(matchKeyword("country.name", "Germany"))
                                    .build())
                            .build())
                    .get();
        }
}
