package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.*;

public class Snippet {
  public static void run() throws Exception {
    QdrantClient client =
        new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

    PrefetchQuery densePrefetch =
        PrefetchQuery.newBuilder()
            .setUsing("description-dense")
            .setScoreThreshold(0.5f)
            .setQuery(
                nearest(
                    Document.newBuilder()
                        .setText("9780553213515")
                        .setModel("sentence-transformers/all-minilm-l6-v2")
                        .build()))
            .build();

    PrefetchQuery bm25Prefetch =
        PrefetchQuery.newBuilder()
            .setUsing("isbn-bm25")
            .setQuery(
                nearest(
                    Document.newBuilder().setText("9780553213515").setModel("Qdrant/bm25").build()))
            .build();

    client
        .queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName("books")
                .addPrefetch(densePrefetch)
                .addPrefetch(bm25Prefetch)
                .setQuery(Query.newBuilder().setFusion(Fusion.RRF).build())
                .setLimit(10)
                .setWithPayload(enable(true))
                .build())
        .get();
  }
}
