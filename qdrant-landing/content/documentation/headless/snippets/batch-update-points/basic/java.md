```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.PointVectors;
import io.qdrant.client.grpc.Points.PointsIdsList;
import io.qdrant.client.grpc.Points.PointsSelector;
import io.qdrant.client.grpc.Points.PointsUpdateOperation;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.ClearPayload;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.DeletePayload;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.DeletePoints;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.DeleteVectors;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.PointStructList;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.SetPayload;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.UpdateVectors;
import io.qdrant.client.grpc.Points.VectorsSelector;

client
    .batchUpdateAsync(
        "{collection_name}",
        List.of(
            PointsUpdateOperation.newBuilder()
                .setUpsert(
                    PointStructList.newBuilder()
                        .addPoints(
                            PointStruct.newBuilder()
                                .setId(id(1))
                                .setVectors(vectors(1.0f, 2.0f, 3.0f, 4.0f))
                                .build())
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setUpdateVectors(
                    UpdateVectors.newBuilder()
                        .addPoints(
                            PointVectors.newBuilder()
                                .setId(id(1))
                                .setVectors(vectors(1.0f, 2.0f, 3.0f, 4.0f))
                                .build())
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setDeleteVectors(
                    DeleteVectors.newBuilder()
                        .setPointsSelector(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .setVectors(VectorsSelector.newBuilder().addNames("").build())
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setOverwritePayload(
                    SetPayload.newBuilder()
                        .setPointsSelector(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .putAllPayload(Map.of("test_payload", value(1)))
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setSetPayload(
                    SetPayload.newBuilder()
                        .setPointsSelector(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .putAllPayload(
                            Map.of("test_payload_2", value(2), "test_payload_3", value(3)))
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setDeletePayload(
                    DeletePayload.newBuilder()
                        .setPointsSelector(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .addKeys("test_payload_2")
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setClearPayload(
                    ClearPayload.newBuilder()
                        .setPoints(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setDeletePoints(
                    DeletePoints.newBuilder()
                        .setPoints(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .build())
                .build()))
    .get();
```
