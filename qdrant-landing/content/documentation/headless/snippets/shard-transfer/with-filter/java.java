package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ShardKeyFactory.shardKey;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.ReplicatePoints;
import io.qdrant.client.grpc.Collections.UpdateCollectionClusterSetupRequest;
import io.qdrant.client.grpc.Common.Filter;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());


                client
                    .updateCollectionClusterSetupAsync(
                        UpdateCollectionClusterSetupRequest.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setReplicatePoints(
                                ReplicatePoints.newBuilder()
                                    .setFromShardKey(shardKey("default"))
                                    .setToShardKey(shardKey("user_1"))
                                    .setFilter(
                                        Filter.newBuilder().addMust(matchKeyword("group_id", "user_1")).build())
                                    .build())
                            .build())
                    .get();
        }
}
