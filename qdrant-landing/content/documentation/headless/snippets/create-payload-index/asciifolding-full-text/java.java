package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.TextIndexParams;
import io.qdrant.client.grpc.Collections.TokenizerType;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .createPayloadIndexAsync(
                        "{collection_name}",
                        "name_of_the_field_to_index",
                        PayloadSchemaType.Text,
                        PayloadIndexParams.newBuilder()
                            .setTextIndexParams(
                                TextIndexParams.newBuilder()
                                    .setTokenizer(TokenizerType.Word)
                                    .setLowercase(true)
                                    .setAsciiFolding(true)
                                    .build())
                            .build(),
                        null,
                        null,
                        null)
                    .get();
        }
}
