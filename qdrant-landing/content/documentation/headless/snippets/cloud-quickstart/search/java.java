package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import io.qdrant.client.grpc.Points.WithPayloadSelector;
import java.util.List;

public class Snippet {
    public static void run() throws Exception {
        // @hide-start
        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                    .withApiKey("<your-api-key>")
                    .build());
        // @hide-end

        String queryText = "vegetarian dishes";

        List<ScoredPoint> results = client
            .queryAsync(
                QueryPoints.newBuilder()
                    .setCollectionName("items")
                    .setQuery(nearest(
                        Document.newBuilder()
                            .setText(queryText)
                            .setModel("sentence-transformers/all-MiniLM-L6-v2")
                            .build()))
                    .setWithPayload(
                        WithPayloadSelector.newBuilder().setEnable(true).build())
                    .setLimit(5)
                    .build())
            .get();

        for (ScoredPoint result : results) {
            System.out.println("Item: " + result.getPayloadMap().get("item_name").getStringValue());
            System.out.println("Score: " + result.getScore());
            System.out.println("Description: " + result.getPayloadMap().get("description").getStringValue());
            System.out.println("Price: " + result.getPayloadMap().get("price").getStringValue());
            System.out.println("---");
        }
    }
}
