package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.KeywordIndexParams;
import io.qdrant.client.grpc.Collections.KeywordPrefixParams;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .createPayloadIndexAsync(
                        "{collection_name}",
                        "url",
                        PayloadSchemaType.Keyword,
                        PayloadIndexParams.newBuilder()
                            .setKeywordIndexParams(
                                KeywordIndexParams.newBuilder()
                                    .setPrefix(KeywordPrefixParams.newBuilder().build())
                                    .build())
                            .build(),
                        null,
                        null,
                        null)
                    .get();
        }
}
