package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.grpc.Context;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
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
                            .withApiKey("<your-api-key")
                            .build());
                // @hide-end

                Context ctx = RequestHeaders.withHeader(
                    Context.current(), "jina-api-key", "<YOUR_JINAAI_API_KEY>");

                ctx.call(() -> client
                    .upsertAsync(
                        "{collection_name}",
                        List.of(
                            PointStruct.newBuilder()
                                .setId(id(1))
                                .setVectors(
                                    vectors(
                                        Image.newBuilder()
                                            .setModel("jinaai/jina-clip-v2")
                                            .setImage(value("https://qdrant.tech/example.png"))
                                            .putAllOptions(
                                                Map.of(
                                                    "dimensions",
                                                    value(512)))
                                            .build()))
                                .build()))
                    .get());
        }
}
