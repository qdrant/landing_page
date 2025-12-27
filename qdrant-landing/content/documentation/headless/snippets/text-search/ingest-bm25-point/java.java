package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.*;
import java.util.*;

public class Snippet {
  public static void run() throws Exception {
    QdrantClient client =
        new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

    PointStruct point =
        PointStruct.newBuilder()
            .setId(id(1))
            .setVectors(
                namedVectors(
                    Map.of(
                        "title-bm25",
                        vector(
                            Document.newBuilder()
                                .setText("The Time Machine")
                                .setModel("qdrant/bm25")
                                .build()))))
            .putAllPayload(
                Map.of(
                    "title", value("The Time Machine"),
                    "author", value("H.G. Wells"),
                    "isbn", value("9780553213515")))
            .build();

    client.upsertAsync("books", List.of(point)).get();
  }
}
