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

public class Snippet {
    public static void run() throws Exception {
        QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build()); // @hide

        PointStruct point = PointStruct.newBuilder()
            .setId(id(1))
            .setVectors(namedVectors(Map.of(
                "description-dense",
                vector(Document.newBuilder()
                    .setText("A Victorian scientist builds a device to travel far into the future and observes the dim trajectories of humanity. He discovers evolutionary divergence and the consequences of class division. Wells's novella established time travel as a vehicle for social commentary.")
                    .setModel("sentence-transformers/all-minilm-l6-v2")
                    .build())
            )))
            .putAllPayload(Map.of(
                "title", value("The Time Machine"),
                "author", value("H.G. Wells"),
                "isbn", value("9780553213515")
            ))
            .build();

        client.upsertAsync("books", List.of(point)).get();
    }
}
