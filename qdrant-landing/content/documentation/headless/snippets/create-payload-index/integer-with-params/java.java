package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.IntegerIndexParams;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .createPayloadIndexAsync(
                        "{collection_name}",
                        "name_of_the_field_to_index",
                        PayloadSchemaType.Integer,
                        PayloadIndexParams.newBuilder()
                            .setIntegerIndexParams(
                                IntegerIndexParams.newBuilder().setLookup(false).setRange(true).build())
                            .build(),
                        null,
                        null,
                        null)
                    .get();
        }
}
