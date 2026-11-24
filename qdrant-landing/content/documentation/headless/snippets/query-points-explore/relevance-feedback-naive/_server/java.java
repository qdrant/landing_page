package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.relevanceFeedback;
import static io.qdrant.client.VectorInputFactory.vectorInput;

import io.qdrant.client.grpc.Points.FeedbackItem;
import io.qdrant.client.grpc.Points.FeedbackStrategy;
import io.qdrant.client.grpc.Points.NaiveFeedbackStrategy;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.RelevanceFeedbackInput;

import java.util.List;

public class Snippet {
    public static void run() throws Exception {
        // @hide-start
        io.qdrant.client.QdrantClient client =
            new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
        // @hide-end

        client
            .queryAsync(
                QueryPoints.newBuilder()
                    .setCollectionName("{collection_name}")
                    .setQuery(
                        relevanceFeedback(
                            RelevanceFeedbackInput.newBuilder()
                                .setTarget(vectorInput(0.1f, 0.9f, 0.23f))
                                .addFeedback(
                                    FeedbackItem.newBuilder()
                                        .setExample(vectorInput(111))
                                        .setScore(0.68f)
                                        .build())
                                .addFeedback(
                                    FeedbackItem.newBuilder()
                                        .setExample(vectorInput(222))
                                        .setScore(0.72f)
                                        .build())
                                .addFeedback(
                                    FeedbackItem.newBuilder()
                                        .setExample(vectorInput(333))
                                        .setScore(0.61f)
                                        .build())
                                .setStrategy(
                                    FeedbackStrategy.newBuilder()
                                        .setNaive(
                                            NaiveFeedbackStrategy.newBuilder()
                                                .setA(0.12f)
                                                .setB(0.43f)
                                                .setC(0.03f)
                                                .build())
                                        .build())
                                .build()))
                    .build())
            .get();
    }
}
