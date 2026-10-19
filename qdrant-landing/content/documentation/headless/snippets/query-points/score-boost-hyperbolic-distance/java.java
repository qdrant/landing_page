package com.example.snippets_amalgamation;

import static io.qdrant.client.ExpressionFactory.acosh;
import static io.qdrant.client.ExpressionFactory.negate;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.QueryFactory.formula;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                  .queryAsync(
                    QueryPoints.newBuilder()
                      .setCollectionName("{collection_name}")
                      .addPrefetch(
                        PrefetchQuery.newBuilder()
                          // the sign of the first element is flipped
                          .setQuery(nearest(-1.118f, 0.3f, 0.4f))
                          .setLimit(100)
                          .build())
                      .setQuery(
                        formula(
                          Formula.newBuilder()
                            .setExpression(negate(acosh(negate(variable("$score")))))
                            .build()))
                      .build())
                  .get();
        }
}
