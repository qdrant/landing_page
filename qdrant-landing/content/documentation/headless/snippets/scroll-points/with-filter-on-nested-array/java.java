package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.range;

import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.Range;
import io.qdrant.client.grpc.Points.ScrollPoints;

public class Snippet {
        public static void run() throws Exception {
                client
                    .scrollAsync(
                        ScrollPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setFilter(
                                Filter.newBuilder()
                                    .addShould(
                                        range(
                                            "country.cities[].population",
                                            Range.newBuilder().setGte(9.0).build()))
                                    .build())
                            .build())
                    .get();
        }
}
