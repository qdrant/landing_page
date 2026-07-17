package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Datatype;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client = new QdrantClient(
                    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .createCollectionAsync("{collection_name}",
                        VectorParams.newBuilder()
                            .setSize(1024)
                            .setDistance(Distance.Cosine)
                            .setDatatype(Datatype.Turbo4)
                            .build())
                    .get();
        }
}
