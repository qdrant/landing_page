package com.example.snippets_amalgamation;

import static io.qdrant.client.ExpressionFactory.max;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.QueryFactory.formula;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.MaxExpression;
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
                          .setQuery(nearest(0.01f, 0.45f, 0.67f))
                          .setUsing("title")
                          .setLimit(50)
                          .build())
                      .addPrefetch(
                        PrefetchQuery.newBuilder()
                          .setQuery(nearest(0.01f, 0.45f, 0.67f))
                          .setUsing("summary")
                          .setLimit(50)
                          .build())
                      .setQuery(
                        formula(
                          Formula.newBuilder()
                            .setExpression(
                              max(
                                MaxExpression.newBuilder()
                                  .addMax(variable("$score[0]"))
                                  .addMax(variable("$score[1]"))
                                  .build()))
                            // used when a point is missing from the second prefetch
                            .putDefaults("$score[1]", value(-1e30))
                            .build()))
                      .build())
                  .get();
        }
}
