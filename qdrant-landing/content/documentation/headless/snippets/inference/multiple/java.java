package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.Image;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(
                        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                            .withApiKey("<your-api-key")
                            .build());

                client
                    .upsertAsync(
                        "{collection_name}",
                        List.of(
                            PointStruct.newBuilder()
                                .setId(id(1))
                                .setVectors(
                                    namedVectors(
                                        Map.of(
                                            "image",
                                            vector(
                                                Image.newBuilder()
                                                    .setModel("jinaai/jina-clip-v2")
                                                    .setImage(value("https://qdrant.tech/example.png"))
                                                    .putAllOptions(
                                                        Map.of(
                                                            "jina-api-key",
                                                            value("<YOUR_JINAAI_API_KEY>"),
                                                            "dimensions",
                                                            value(512)))
                                                    .build()),
                                            "text",
                                            vector(
                                                Document.newBuilder()
                                                    .setModel("sentence-transformers/all-minilm-l6-v2")
                                                    .setText("Mars, the red planet")
                                                    .build()),
                                            "bm25",
                                            vector(
                                                Document.newBuilder()
                                                    .setModel("qdrant/bm25")
                                                    .setText("Mars, the red planet")
                                                    .build()))))
                                .build()))
                    .get();
        }
}
