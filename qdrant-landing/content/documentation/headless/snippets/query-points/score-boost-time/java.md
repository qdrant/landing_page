```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.*;
import java.util.List;

import static io.qdrant.client.ExpressionFactory.*;
import static io.qdrant.client.QueryFactory.*;
import static io.qdrant.client.ValueFactory.*;

QdrantClient client =
  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

List<ScoredPoint> time_boosted = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName({collection_name})
        .addPrefetch(
            PrefetchQuery.newBuilder()
                .setQuery(nearest(0.2f, 0.8f, .., ..))  // <-- dense vector
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
```