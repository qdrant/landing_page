package com.example.snippets_amalgamation;

import static io.qdrant.client.ShardKeyFactory.shardKey;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.ShardKeySelector;
import java.util.List;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .upsertAsync(
                        UpsertPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .addAllPoints(
                                List.of(
                                    PointStruct.newBuilder()
                                        .setId(id(1))
                                        .setVectors(vectors(0.9f, 0.1f, 0.1f))
                                        .putAllPayload(Map.of("group_id", value("user_1")))
                                        .build()))
                            .setShardKeySelector(
                                ShardKeySelector.newBuilder()
                                    .addShardKeys(shardKey("user_1"))
                                    .setFallback(shardKey("default"))
                                    .build())
                            .build())
                    .get();
        }
}
