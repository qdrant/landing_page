```java
import static io.qdrant.client.QueryFactory.relevanceFeedback;
import static io.qdrant.client.VectorInputFactory.vectorInput;

import io.qdrant.client.grpc.Points.FeedbackItem;
import io.qdrant.client.grpc.Points.FeedbackStrategy;
import io.qdrant.client.grpc.Points.NaiveFeedbackStrategy;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.RelevanceFeedbackInput;

import java.util.List;

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setQuery(
                relevanceFeedback(
                    RelevanceFeedbackInput.newBuilder()
                        .setTarget(vectorInput(0.01f, 0.45f, 0.67f))
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
                                        .setC(0.16f)
                                        .build())
                                .build())
                        .build()))
            .build())
    .get();
```
