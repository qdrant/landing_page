package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ConditionFactory.*;
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.namedVectors;
import static io.qdrant.client.VectorFactory.vector;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.*;
import io.qdrant.client.grpc.Points.*;
import java.util.*;

public class Snippet { // @hide
    public static void run() throws Exception { // @hide
        QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

        client.createCollectionAsync(
            CreateCollection.newBuilder()
                .setCollectionName("books")
                .setVectorsConfig(
                    VectorsConfig.newBuilder()
                        .setParamsMap(
                            VectorParamsMap.newBuilder()
                                .putMap(
                                    "description-dense",
                                    VectorParams.newBuilder().setSize(384).setDistance(Distance.Cosine).build())
                                .build())
                        .build())
                .build())
            .get();
    } // @hide
} // @hide
