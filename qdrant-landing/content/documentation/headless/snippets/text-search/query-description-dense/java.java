package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;
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

        client.queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName("books")
                .setQuery(nearest(Document.newBuilder().setText("time travel").setModel("sentence-transformers/all-minilm-l6-v2").build()))
                .setUsing("description-dense")
                .setWithPayload(enable(true))
                .build()
        ).get();
    }
}
