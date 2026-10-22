package com.example.snippets_amalgamation;

import static io.qdrant.client.ExpressionFactory.constant;
import static io.qdrant.client.ExpressionFactory.min;
import static io.qdrant.client.ExpressionFactory.mult;
import static io.qdrant.client.ExpressionFactory.sum;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.QueryFactory.formula;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.MinExpression;
import io.qdrant.client.grpc.Points.MultExpression;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.SumExpression;

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
                          .setQuery(nearest(0.01f, 0.45f, 0.67f))
                          .setLimit(100)
                          .build())
                      .setQuery(
                        formula(
                          Formula.newBuilder()
                            .setExpression(
                              sum(
                                SumExpression.newBuilder()
                                  .addSum(variable("$score"))
                                  .addSum(
                                    min(
                                      MinExpression.newBuilder()
                                        .addMin(constant(2.0f)) // the boost can't exceed this value
                                        .addMin(
                                          mult(
                                            MultExpression.newBuilder()
                                              .addMult(constant(0.1f))
                                              .addMult(variable("log_views"))
                                              .build()))
                                        .build()))
                                  .build()))
                            .build()))
                      .build())
                  .get();
        }
}
