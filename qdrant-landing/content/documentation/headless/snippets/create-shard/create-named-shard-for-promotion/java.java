package com.example.snippets_amalgamation;

import static io.qdrant.client.ShardKeyFactory.shardKey;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateShardKey;
import io.qdrant.client.grpc.Collections.CreateShardKeyRequest;
import io.qdrant.client.grpc.Collections.ReplicaState;
import io.qdrant.client.grpc.Common.Filter;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client.createShardKeyAsync(CreateShardKeyRequest.newBuilder()
                                .setCollectionName("{collection_name}")
                                .setRequest(CreateShardKey.newBuilder()
                                                .setShardKey(shardKey("default"))
                                                .setInitialState(ReplicaState.Partial)
                                                .build())
                                .build()).get();
        }
}
