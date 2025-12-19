package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.multiVector;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                .upsertAsync(
                    "{collection_name}",
                    List.of(
                        PointStruct.newBuilder()
                            .setId(id(1))
                            .setVectors(vectors(multiVector(new float[][] {
                                {-0.013f,  0.020f, -0.007f, -0.111f},
                                {-0.030f, -0.055f,  0.001f,  0.072f},
                                {-0.041f,  0.014f, -0.032f, -0.062f}
                            })))
                            .build()
                    ))
                .get();
        }
}
