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
    QdrantClient client =
        new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

    client
        .createPayloadIndexAsync(
            "books",
            "title",
            PayloadSchemaType.Text,
            PayloadIndexParams.newBuilder()
                .setTextIndexParams(
                    TextIndexParams.newBuilder()
                        .setTokenizer(TokenizerType.Word)
                        .setScoring(
                            TextScoringParams.newBuilder().setType(TextScoringType.Bm25).build())
                        .build())
                .build(),
            null,
            null,
            null)
        .get();
  }
}
