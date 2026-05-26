package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;

public class Snippet {

    public static void run() throws Exception {
        // @hide-start
        QdrantClient client = null;
        // @hide-end

        // @block-start upsert-no-auth
        client = new QdrantClient(
            QdrantGrpcClient.newBuilder("localhost", 6334, true).build());

        try {
            client.upsertAsync("my_collection", List.of(
                PointStruct.newBuilder()
                    .setId(id(1))
                    .setVectors(vectors(0.1f, 0.2f, 0.3f, 0.4f))
                    .build()
            )).get();
        } catch (Exception e) {
            System.out.println(e.getMessage()); // UNAUTHENTICATED
        }
        // @block-end upsert-no-auth

        // @block-start upsert-admin-key
        client = new QdrantClient(
            QdrantGrpcClient.newBuilder("localhost", 6334, true)
                .withApiKey("my-admin-key")
                .build());

        client.createCollectionAsync("my_collection",
            VectorParams.newBuilder()
                .setSize(4)
                .setDistance(Distance.Cosine)
                .build()).get();

        client.upsertAsync("my_collection", List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(vectors(0.1f, 0.2f, 0.3f, 0.4f))
                .build()
        )).get();
        // @block-end upsert-admin-key

        // @block-start delete-read-only-key
        client = new QdrantClient(
            QdrantGrpcClient.newBuilder("localhost", 6334, true)
                .withApiKey("my-read-only-key")
                .build());

        try {
            client.deleteAsync("my_collection", List.of(id(1))).get();
        } catch (Exception e) {
            System.out.println(e.getMessage()); // PERMISSION_DENIED
        }
        // @block-end delete-read-only-key

        // @block-start upsert-jwt-rw-collection
        client = new QdrantClient(
            QdrantGrpcClient.newBuilder("localhost", 6334, true)
                .withApiKey("<your-jwt>")
                .build());

        client.upsertAsync("my_collection", List.of(
            PointStruct.newBuilder()
                .setId(id(2))
                .setVectors(vectors(0.5f, 0.6f, 0.7f, 0.8f))
                .build()
        )).get();
        // @block-end upsert-jwt-rw-collection

        // @block-start upsert-jwt-ro-collection
        client = new QdrantClient(
            QdrantGrpcClient.newBuilder("localhost", 6334, true)
                .withApiKey("<your-jwt>")
                .build());

        try {
            client.upsertAsync("other_collection", List.of(
                PointStruct.newBuilder()
                    .setId(id(2))
                    .setVectors(vectors(0.5f, 0.6f, 0.7f, 0.8f))
                    .build()
            )).get();
        } catch (Exception e) {
            System.out.println(e.getMessage()); // PERMISSION_DENIED
        }
        // @block-end upsert-jwt-ro-collection
    }
}
