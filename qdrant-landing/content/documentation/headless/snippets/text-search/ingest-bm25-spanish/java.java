package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ConditionFactory.*;
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.namedVectors;
import static io.qdrant.client.VectorFactory.vector;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.*;
import io.qdrant.client.grpc.Points.*;
import java.util.*;

public class Snippet { // @hide
    public static void run() throws Exception { // @hide
        QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

        PointStruct point = PointStruct.newBuilder()
            .setId(id(1))
            .setVectors(namedVectors(Map.of(
                "title-bm25",
                vector(Document.newBuilder().setText("La Máquina del Tiempo").setModel("qdrant/bm25").build())
            )))
            .putAllPayload(Map.of(
                "title", value("La Máquina del Tiempo"),
                "author", value("H.G. Wells"),
                "isbn", value("9788411486880")
            ))
            .build();

        client.upsertAsync("books", List.of(point)).get();
    } // @hide
} // @hide
