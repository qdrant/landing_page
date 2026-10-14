```java
import static io.qdrant.client.ExpressionFactory.constant;
import static io.qdrant.client.ExpressionFactory.max;
import static io.qdrant.client.ExpressionFactory.min;
import static io.qdrant.client.ExpressionFactory.sum;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.QueryFactory.formula;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.MaxExpression;
import io.qdrant.client.grpc.Points.MinExpression;
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
                  // clamp `rating` into the range [0, 1]
                  .addSum(
                    max(
                      MaxExpression.newBuilder()
                        .addMax(constant(0.0f))
                        .addMax(
                          min(
                            MinExpression.newBuilder()
                              .addMin(constant(1.0f))
                              .addMin(variable("rating"))
                              .build()))
                        .build()))
                  .build()))
            .build()))
      .build())
  .get();
```
