package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.Modifier;
import io.qdrant.client.grpc.Collections.SparseVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorParams;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorParamsMap;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .createCollectionAsync(
                        CreateCollection.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setVectorsConfig(
                                VectorsConfig.newBuilder()
                                    .setParamsMap(
                                        VectorParamsMap.newBuilder()
                                            .putAllMap(
                                                Map.of(
                                                    "dense_vector",
                                                    VectorParams.newBuilder()
                                                        .setSize(384)
                                                        .setDistance(Distance.Cosine)
                                                        .build())))
                                    .build())
                            .setSparseVectorsConfig(
                                SparseVectorConfig.newBuilder()
                                    .putMap(
                                        "bm25_sparse_vector",
                                        SparseVectorParams.newBuilder()
                                            .setModifier(Modifier.Idf)
                                            .build()))
                            .build())
                    .get();
        }
}
