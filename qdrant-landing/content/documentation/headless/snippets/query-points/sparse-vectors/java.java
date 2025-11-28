package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client.queryAsync(
                        QueryPoints.newBuilder()
                                .setCollectionName("{collection_name}")
                                .setUsing("text")
                                .setQuery(nearest(List.of(0.1f, 0.2f, 0.3f, 0.4f), List.of(1, 3, 5, 7)))
                                .setLimit(3)
                                .build())
                        .get();
        }
}
