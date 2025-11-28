package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.fusion;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Fusion;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client.queryAsync(
                    QueryPoints.newBuilder()
                    .setCollectionName("{collection_name}")
                    .addPrefetch(PrefetchQuery.newBuilder()
                      .setQuery(nearest(List.of(0.22f, 0.8f), List.of(1, 42)))
                      .setUsing("sparse")
                      .setLimit(20)
                      .build())
                    .addPrefetch(PrefetchQuery.newBuilder()
                      .setQuery(nearest(List.of(0.01f, 0.45f, 0.67f)))
                      .setUsing("dense")
                      .setLimit(20)
                      .build())
                    .setQuery(fusion(Fusion.RRF))
                    .build())
                  .get();
        }
}
