package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.KeywordIndexParams;
import io.qdrant.client.grpc.Collections.Memory;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .createPayloadIndexAsync(
                        "{collection_name}",
                        "payload_field_name",
                        PayloadSchemaType.Keyword,
                        PayloadIndexParams.newBuilder()
                            .setKeywordIndexParams(
                                KeywordIndexParams.newBuilder()
                                    .setMemory(Memory.Cold)
                                    .build())
                            .build(),
                        null,
                        null,
                        null)
                    .get();
        }
}
