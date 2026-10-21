```java
import static io.qdrant.client.ExpressionFactory.constant;
import static io.qdrant.client.ExpressionFactory.max;
import static io.qdrant.client.ExpressionFactory.mult;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.QueryFactory.formula;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.MaxExpression;
import io.qdrant.client.grpc.Points.MultExpression;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.Query;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.TextQuery;

client
  .queryAsync(
    QueryPoints.newBuilder()
      .setCollectionName("{collection_name}")
      .addPrefetch(
        PrefetchQuery.newBuilder()
          .setQuery(
            Query.newBuilder()
              .setText(TextQuery.newBuilder().setQuery("vector database"))
              .build())
          .setUsing("title")
          .setLimit(50)
          .build())
      .addPrefetch(
        PrefetchQuery.newBuilder()
          .setQuery(
            Query.newBuilder()
              .setText(TextQuery.newBuilder().setQuery("vector database"))
              .build())
          .setUsing("body")
          .setLimit(50)
          .build())
      .setQuery(
        formula(
          Formula.newBuilder()
            .setExpression(
              max(
                MaxExpression.newBuilder()
                  // boost title matches
                  .addMax(
                    mult(
                      MultExpression.newBuilder()
                        .addMult(constant(3.0f))
                        .addMult(variable("$score[0]"))
                        .build()))
                  .addMax(variable("$score[1]"))
                  .build()))
            .build()))
      .build())
  .get();
```
