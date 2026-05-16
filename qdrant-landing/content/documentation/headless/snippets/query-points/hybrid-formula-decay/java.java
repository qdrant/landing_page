package com.example.snippets_amalgamation;

import static io.qdrant.client.ExpressionFactory.datetime;
import static io.qdrant.client.ExpressionFactory.datetimeKey;
import static io.qdrant.client.ExpressionFactory.expDecay;
import static io.qdrant.client.ExpressionFactory.sum;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.QueryFactory.formula;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.QueryFactory.rrf;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.DecayParamsExpression;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.Rrf;
import io.qdrant.client.grpc.Points.SumExpression;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client.queryAsync(
                    QueryPoints.newBuilder()
                        .setCollectionName("{collection_name}")
                        .addPrefetch(
                            PrefetchQuery.newBuilder()
                                .addPrefetch(
                                    PrefetchQuery.newBuilder()
                                        .setQuery(nearest(List.of(0.22f, 0.8f), List.of(1, 42)))
                                        .setUsing("sparse")
                                        .setLimit(100)
                                        .build())
                                .addPrefetch(
                                    PrefetchQuery.newBuilder()
                                        .setQuery(nearest(List.of(0.01f, 0.45f, 0.67f)))
                                        .setUsing("dense")
                                        .setLimit(100)
                                        .build())
                                .setQuery(rrf(Rrf.newBuilder().build()))
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
                                                    expDecay(
                                                        DecayParamsExpression.newBuilder()
                                                            .setX(datetimeKey("published_at"))
                                                            .setTarget(
                                                                datetime("YYYY-MM-DDT00:00:00Z"))
                                                            .setScale(86400 * 180)
                                                            .setMidpoint(0.5f)
                                                            .build()))
                                                .build()))
                                    .build()))
                        .setLimit(10)
                        .build())
                  .get();
        }
}
