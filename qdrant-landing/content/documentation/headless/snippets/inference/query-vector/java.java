package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

                client.queryAsync(QueryPoints.newBuilder()
                    .setCollectionName("{collection_name}")
                    .setQuery(nearest(List.of(0.12f, 0.34f, 0.56f, 0.78f)))
                    .build()).get();
        }
}
