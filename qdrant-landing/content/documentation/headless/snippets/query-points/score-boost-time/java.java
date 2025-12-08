package com.example.snippets_amalgamation;

import static io.qdrant.client.ExpressionFactory.datetime;
import static io.qdrant.client.ExpressionFactory.datetimeKey;
import static io.qdrant.client.ExpressionFactory.expDecay;
import static io.qdrant.client.ExpressionFactory.sum;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.QueryFactory.formula;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.DecayParamsExpression;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import io.qdrant.client.grpc.Points.SumExpression;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                List<ScoredPoint> time_boosted = client.queryAsync(
                    QueryPoints.newBuilder()
                        .setCollectionName("{collection_name}")
                        .addPrefetch(
                            PrefetchQuery.newBuilder()
                                .setQuery(nearest(0.1f, 0.45f, 0.67f))  // <-- dense vector
                                .setLimit(50)
                                .build())
                        .setQuery(
                            formula(
                                Formula.newBuilder()
                                    .setExpression(
                                        sum( //  the final score = score + exp_decay(target_time - x_time)
                                            SumExpression.newBuilder()
                                                .addSum(variable("$score"))
                                                .addSum(
                                                    expDecay(
                                                        DecayParamsExpression.newBuilder()
                                                            .setX(
                                                                datetimeKey("update_time"))  // payload key
                                                            .setTarget(
                                                                datetime("YYYY-MM-DDT00:00:00Z"))  // current datetime
                                                            .setMidpoint(0.5f)
                                                            .setScale(86400)  // 1 day in seconds
                                                            .build()))
                                                .build()))
                                    .build()))
                        .build()
                ).get();
        }
}
