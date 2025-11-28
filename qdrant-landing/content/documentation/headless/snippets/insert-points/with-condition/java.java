package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.match;
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.UpsertPoints;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .upsertAsync(
                        UpsertPoints.newBuilder()
                            .setCollectionName("{collectionName}")
                            .addPoint(
                                PointStruct.newBuilder()
                                    .setId(id(1))
                                    .setVectors(vectors(0.05f, 0.61f, 0.76f, 0.74f))
                                    .putAllPayload(Map.of("city", value("Berlin"), "price", value(1.99)))
                                    .build())
                            .setUpdateFilter(Filter.newBuilder().addMust(match("version", 2)).build())
                            .build())
                    .get();
        }
}
