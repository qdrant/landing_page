package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorParamsMap;
import io.qdrant.client.grpc.Collections.VectorsConfig;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client = new QdrantClient(
                    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client.createCollectionAsync("chunks",
                        VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(4).build()).get();

                client.createPayloadIndexAsync(
                    "chunks",
                    "document_id",
                    PayloadSchemaType.Integer,
                    null,
                    true,
                    null,
                    null).get();

                // No vectors, payload only.
                client.createCollectionAsync(
                    CreateCollection.newBuilder()
                        .setCollectionName("documents")
                        .setVectorsConfig(VectorsConfig.newBuilder()
                            .setParamsMap(VectorParamsMap.newBuilder().build())
                            .build())
                        .build()).get();
        }
}
