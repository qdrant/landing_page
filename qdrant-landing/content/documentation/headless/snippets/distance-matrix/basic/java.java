package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.SearchMatrixPoints;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .searchMatrixPairsAsync(
                        Points.SearchMatrixPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setFilter(Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
                            .setSample(10)
                            .setLimit(2)
                            .build())
                    .get();
        }
}
