package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.Memory;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .createCollectionAsync(
                        CreateCollection.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setVectorsConfig(
                                VectorsConfig.newBuilder()
                                    .setParams(
                                        VectorParams.newBuilder()
                                            .setSize(768)
                                            .setDistance(Distance.Cosine)
                                            .setMemory(Memory.Cold)
                                            .build())
                                    .build())
                            .setHnswConfig(HnswConfigDiff.newBuilder().setMemory(Memory.Cold).build())
                            .build())
                    .get();
        }
}
