package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.rrf;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.Rrf;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                        .queryAsync(
                        QueryPoints.newBuilder()
                                .setCollectionName("{collection_name}")
                                // .addPrefetch(...) <┐
                                // .addPrefetch(...) <┴─ Prefetches here
                                .setQuery(rrf(Rrf.newBuilder().addAllWeights(List.of(3.0f, 1.0f)).build()))
                                .build())
                        .get();
        }
}
