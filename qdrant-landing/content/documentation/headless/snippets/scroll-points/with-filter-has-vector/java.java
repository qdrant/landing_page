package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.hasVector;
import static io.qdrant.client.PointIdFactory.id;

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
                                    .addMust(hasVector("image"))
                                    .build())
                            .build())
                    .get();
        }
}
