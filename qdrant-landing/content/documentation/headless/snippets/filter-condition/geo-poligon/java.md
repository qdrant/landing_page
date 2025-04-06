```java
import static io.qdrant.client.ConditionFactory.geoPolygon;

import io.qdrant.client.grpc.Points.GeoLineString;
import io.qdrant.client.grpc.Points.GeoPoint;

geoPolygon(
    "location",
    GeoLineString.newBuilder()
        .addAllPoints(
            List.of(
                GeoPoint.newBuilder().setLon(-70.0).setLat(-70.0).build(),
                GeoPoint.newBuilder().setLon(60.0).setLat(-70.0).build(),
                GeoPoint.newBuilder().setLon(60.0).setLat(60.0).build(),
                GeoPoint.newBuilder().setLon(-70.0).setLat(60.0).build(),
                GeoPoint.newBuilder().setLon(-70.0).setLat(-70.0).build()))
        .build(),
    List.of(
        GeoLineString.newBuilder()
            .addAllPoints(
                List.of(
                    GeoPoint.newBuilder().setLon(-65.0).setLat(-65.0).build(),
                    GeoPoint.newBuilder().setLon(0.0).setLat(-65.0).build(),
                    GeoPoint.newBuilder().setLon(0.0).setLat(0.0).build(),
                    GeoPoint.newBuilder().setLon(-65.0).setLat(0.0).build(),
                    GeoPoint.newBuilder().setLon(-65.0).setLat(-65.0).build()))
            .build()));
```
