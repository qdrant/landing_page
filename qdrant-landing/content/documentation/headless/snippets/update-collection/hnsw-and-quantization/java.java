package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.QuantizationConfigDiff;
import io.qdrant.client.grpc.Collections.QuantizationType;
import io.qdrant.client.grpc.Collections.ScalarQuantization;
import io.qdrant.client.grpc.Collections.UpdateCollection;
import io.qdrant.client.grpc.Collections.VectorParamsDiff;
import io.qdrant.client.grpc.Collections.VectorParamsDiffMap;
import io.qdrant.client.grpc.Collections.VectorsConfigDiff;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .updateCollectionAsync(
                        UpdateCollection.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setHnswConfig(HnswConfigDiff.newBuilder().setEfConstruct(123).build())
                            .setVectorsConfig(
                                VectorsConfigDiff.newBuilder()
                                    .setParamsMap(
                                        VectorParamsDiffMap.newBuilder()
                                            .putMap(
                                                "my_vector",
                                                VectorParamsDiff.newBuilder()
                                                    .setHnswConfig(
                                                        HnswConfigDiff.newBuilder()
                                                            .setM(3)
                                                            .setEfConstruct(123)
                                                            .build())
                                                    .build())))
                            .setQuantizationConfig(
                                QuantizationConfigDiff.newBuilder()
                                    .setScalar(
                                        ScalarQuantization.newBuilder()
                                            .setType(QuantizationType.Int8)
                                            .setQuantile(0.8f)
                                            .setAlwaysRam(true)
                                            .build()))
                            .build())
                    .get();
        }
}
