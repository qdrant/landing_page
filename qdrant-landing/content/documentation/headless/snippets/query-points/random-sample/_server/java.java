package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.sample;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.Sample;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end


                client
                    .queryAsync(
                        QueryPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setQuery(sample(Sample.Random))
                            .build())
                    .get();
        }
}
