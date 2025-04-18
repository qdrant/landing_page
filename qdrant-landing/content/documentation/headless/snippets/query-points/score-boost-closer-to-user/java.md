```java
import static io.qdrant.client.ExpressionFactory.expDecay;
import static io.qdrant.client.ExpressionFactory.geoDistance;
import static io.qdrant.client.ExpressionFactory.sum;
import static io.qdrant.client.ExpressionFactory.variable;
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.QueryFactory.formula;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.DecayParamsExpression;
import io.qdrant.client.grpc.Points.Formula;
import io.qdrant.client.grpc.Points.GeoDistance;
import io.qdrant.client.grpc.Points.GeoPoint;
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
                    expDecay(
                      DecayParamsExpression.newBuilder()
                        .setX(
                          geoDistance(
                            GeoDistance.newBuilder()
                              .setOrigin(
                                GeoPoint.newBuilder()
                                  .setLat(52.504043)
                                  .setLon(13.393236)
                                  .build())
                              .setTo("geo.location")
                              .build()))
                        .setScale(5000)
                        .build()))
                  .build()))
            .putDefaults(
              "geo.location",
              value(
                Map.of(
                  "lat", value(48.137154),
                  "lon", value(11.576124))))
            .build()))
      .build())
  .get();
```
