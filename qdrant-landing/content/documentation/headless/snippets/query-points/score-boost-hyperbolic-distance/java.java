package com.example.snippets_amalgamation;

import static io.qdrant.client.ExpressionFactory.acosh;
import static io.qdrant.client.ExpressionFactory.constant;
import static io.qdrant.client.ExpressionFactory.mult;
import static io.qdrant.client.ExpressionFactory.negate;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.QueryFactory.formula;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.MultExpression;
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
                          // the time coordinate (the first value) is negated
                          .setQuery(nearest(-3.2f, 0.3f, 0.4f))
                          .setLimit(100)
                          .build())
                      .setQuery(
                        formula(
                          Formula.newBuilder()
                            .setExpression(
                              mult(
                                MultExpression.newBuilder()
                                  .addMult(constant(-3.1622776601683795f)) // -1 / sqrt(0.1)
                                  .addMult(
                                    acosh(
                                      mult(
                                        MultExpression.newBuilder()
                                          .addMult(constant(0.1f))
                                          .addMult(negate(variable("$score")))
                                          .build())))
                                  .build()))
                            .build()))
                      .build())
                  .get();
        }
}
