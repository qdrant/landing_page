package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.*;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.*;

public class Snippet {
  public static void run() throws Exception {
    QdrantClient client =
        new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

    Filter filter = Filter.newBuilder().addMust(matchText("title", "space")).build();

    client
        .queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName("books")
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText("space opera")
                            .setModel("sentence-transformers/all-minilm-l6-v2")
                            .build()))
                .setUsing("description-dense")
                .setFilter(filter)
                .setWithPayload(enable(true))
                .build())
        .get();
  }
}
