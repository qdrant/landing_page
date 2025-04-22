```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.matchKeywords;
import static io.qdrant.client.ExpressionFactory.condition;
import static io.qdrant.client.ExpressionFactory.constant;
import static io.qdrant.client.ExpressionFactory.mult;
import static io.qdrant.client.ExpressionFactory.sum;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.QueryFactory.formula;
import static io.qdrant.client.QueryFactory.nearest;


import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.MultExpression;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.SumExpression;

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
                    mult(
                      MultExpression.newBuilder()
                        .addMult(constant(0.5f))
                        .addMult(
                          condition(
                            matchKeywords(
                              "tag",
                              List.of("h1", "h2", "h3", "h4"))))
                        .build()))
                  .addSum(mult(MultExpression.newBuilder()
                  .addMult(constant(0.25f))
                  .addMult(
                    condition(
                      matchKeywords(
                        "tag",
                        List.of("p", "li"))))
                  .build()))
                  .build()))
            .build()))
      .build())
  .get();
```
