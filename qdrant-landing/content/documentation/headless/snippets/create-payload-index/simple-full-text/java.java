package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.TextIndexParams;
import io.qdrant.client.grpc.Collections.TextScoringParams;
import io.qdrant.client.grpc.Collections.TextScoringType;
import io.qdrant.client.grpc.Collections.TokenizerType;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .createPayloadIndexAsync(
                        "{collection_name}",
                        "name_of_the_field_to_index",
                        PayloadSchemaType.Text,
                        PayloadIndexParams.newBuilder()
                            .setTextIndexParams(
                                TextIndexParams.newBuilder()
                                    .setTokenizer(TokenizerType.Word)
                                    .setMinTokenLen(2)
                                    .setMaxTokenLen(10)
                                    .setLowercase(true)
                                    .setScoring(
                                        TextScoringParams.newBuilder()
                                            .setType(TextScoringType.Bm25)
                                            .build())
                                    .build())
                            .build(),
                        null,
                        null,
                        null)
                    .get();
        }
}
