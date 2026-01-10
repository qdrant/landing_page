package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.*;

public class Snippet {
  public static void run() throws Exception {
    QdrantClient client =
        new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

    client
        .queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName("books")
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText("time travel")
                            .setModel("qdrant/bm25")
                            .putOptions("avg_len", value(5.0))
                            .build()))
                .setUsing("title-bm25")
                .setLimit(10)
                .setWithPayload(enable(true))
                .build())
        .get();
  }
}
