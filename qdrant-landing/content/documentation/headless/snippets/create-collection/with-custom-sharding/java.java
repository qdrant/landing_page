package com.example.snippets_amalgamation;

import static io.qdrant.client.ShardKeyFactory.shardKey;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.ShardingMethod;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .createCollectionAsync(
                        CreateCollection.newBuilder()
                            .setCollectionName("{collection_name}")
                            // ... other collection parameters
                            .setShardNumber(1)
                            .setShardingMethod(ShardingMethod.Custom)
                            .build())
                    .get();
        }
}
