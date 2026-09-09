package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.grpc.Context;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorParamsMap;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.Image;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.Map;

public class Snippet {

    // @block-start define-dataset
    static class Doc {
        final String caption;
        final String image;
        Doc(String caption, String image) {
            this.caption = caption;
            this.image = image;
        }
    }

    static String imageToBase64Url(String imagePath) throws Exception {
        String prefix = "data:image/png;base64";
        byte[] bytes = Files.readAllBytes(Path.of(imagePath));
        return prefix + "," + Base64.getEncoder().encodeToString(bytes);
    }

    static List<Doc> documents = List.of(
        new Doc("An image about plane emergency safety.", "images/image-1.png"),
        new Doc("An image about airplane components.", "images/image-2.png"),
        new Doc("An image about COVID safety restrictions.", "images/image-3.png"),
        new Doc("A confidential image about UFO sightings.", "images/image-4.png"),
        new Doc("An image about unusual footprints on Aralar 2011.", "images/image-5.png")
    );
    // @block-end define-dataset

    public static void run() throws Exception {
        // @hide-start
        String QDRANT_URL = "xyz-example.eu-central.aws.cloud.qdrant.io";
        String QDRANT_API_KEY = "<your-api-key>";
        // @hide-end
        // @block-start client-connection
        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder(QDRANT_URL, 6334, true)
                    .withApiKey(QDRANT_API_KEY)
                    .build());
        // @block-end client-connection

        // @block-start create-collection
        String collectionName = "multimodal-embeddings";

        if (!client.collectionExistsAsync(collectionName).get()) {
            client.createCollectionAsync(
                CreateCollection.newBuilder()
                    .setCollectionName(collectionName)
                    .setVectorsConfig(
                        VectorsConfig.newBuilder()
                            .setParamsMap(
                                VectorParamsMap.newBuilder()
                                    .putMap(
                                        "image",
                                        VectorParams.newBuilder()
                                            .setSize(512)
                                            .setDistance(Distance.Cosine)
                                            .build())
                                    .putMap(
                                        "text",
                                        VectorParams.newBuilder()
                                            .setSize(512)
                                            .setDistance(Distance.Cosine)
                                            .build())
                                    .build()))
                    .build()
            ).get();
        }
        // @block-end create-collection

        // @block-start upload-data
        String cohereApiKey = System.getenv("COHERE_API_KEY");
        Context ctx = RequestHeaders.withHeader(
            Context.current(), "cohere-api-key", cohereApiKey);

        List<PointStruct> points = new java.util.ArrayList<>();
        for (int idx = 0; idx < documents.size(); idx++) {
            Doc doc = documents.get(idx);
            points.add(
                PointStruct.newBuilder()
                    .setId(io.qdrant.client.PointIdFactory.id(idx))
                    .setVectors(
                        namedVectors(
                            Map.of(
                                "text",
                                vector(
                                    Document.newBuilder()
                                        .setText(doc.caption)
                                        .setModel("cohere/embed-v4.0")
                                        .putOptions("output_dimension", value(512))
                                        .build()),
                                "image",
                                vector(
                                    Image.newBuilder()
                                        .setImage(value(imageToBase64Url(doc.image)))
                                        .setModel("cohere/embed-v4.0")
                                        .putOptions("output_dimension", value(512))
                                        .build()))))
                    .putAllPayload(
                        Map.of(
                            "caption", value(doc.caption),
                            "image", value(doc.image)))
                    .build());
        }

        ctx.call(() -> client.upsertAsync(collectionName, points).get());
        // @block-end upload-data

        // @block-start text-to-image-search
        var results = ctx.call(() -> client.queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName(collectionName)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText("Plane components")
                            .setModel("cohere/embed-v4.0")
                            .putOptions("output_dimension", value(512))
                            .build()))
                .setUsing("image")
                .setWithPayload(enable(true))
                .setLimit(1)
                .build()
        ).get());

        System.out.println(results.get(0).getPayloadMap().get("image"));
        // @block-end text-to-image-search

        // @block-start multilingual-search
        results = ctx.call(() -> client.queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName(collectionName)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText("Componenti di un aereo")
                            .setModel("cohere/embed-v4.0")
                            .putOptions("output_dimension", value(512))
                            .build()))
                .setUsing("image")
                .setWithPayload(enable(true))
                .setLimit(1)
                .build()
        ).get());

        System.out.println(results.get(0).getPayloadMap().get("image"));
        // @block-end multilingual-search

        // @block-start image-to-text-search
        results = ctx.call(() -> client.queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName(collectionName)
                .setQuery(
                    nearest(
                        Image.newBuilder()
                            .setImage(value(imageToBase64Url("images/image-2.png")))
                            .setModel("cohere/embed-v4.0")
                            .putOptions("output_dimension", value(512))
                            .build()))
                .setUsing("text")
                .setWithPayload(enable(true))
                .setLimit(1)
                .build()
        ).get());

        System.out.println(results.get(0).getPayloadMap().get("caption"));
        // @block-end image-to-text-search
    }
}
