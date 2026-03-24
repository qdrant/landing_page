package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.Image;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;

public class Snippet {
    public static void run() throws Exception {
        // @hide-start
        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                    .withApiKey("<paste-your-api-key-here>")
                    .build());
        // @hide-end

        client
            .upsertAsync(
                "<your-collection>",
                List.of(
                    PointStruct.newBuilder()
                        .setId(id(1))
                        .setVectors(
                            vectors(
                                Image.newBuilder()
                                    .setImage(value("https://qdrant.tech/example.png"))
                                    .setModel("qdrant/clip-vit-b-32-vision")
                                    .build()))
                        .putAllPayload(Map.of("title", value("Example Image")))
                        .build()))
            .get();

        List<Points.ScoredPoint> points =
            client
                .queryAsync(
                    Points.QueryPoints.newBuilder()
                        .setCollectionName("<your-collection>")
                        .setQuery(
                            nearest(
                                Document.newBuilder()
                                    .setText("Mission to Mars")
                                    .setModel("qdrant/clip-vit-b-32-text")
                                    .build()))
                        .build())
                .get();

        System.out.printf(points.toString());
    }
}
