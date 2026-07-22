package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.match;
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
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
                            .build()))
                .setUsing("title-bm25")
                .setFilter(
                    Filter.newBuilder()
                        .addMust(matchKeyword("tenant", "acme"))
                        .addMust(match("year", 2024))
                        .build())
                .setParams(
                    SearchParams.newBuilder()
                        .setIdf(
                            IdfParams.newBuilder()
                                .setCorpus(
                                    Filter.newBuilder()
                                        .addMust(matchKeyword("tenant", "acme"))
                                        .build())
                                .build())
                        .build())
                .setLimit(10)
                .build())
        .get();
  }
}
