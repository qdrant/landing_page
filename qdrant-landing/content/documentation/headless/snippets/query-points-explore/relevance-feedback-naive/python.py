from qdrant_client import QdrantClient, models

client = QdrantClient()

client.query_points(
    "{collection_name}",
    query=models.RelevanceFeedbackQuery(
        relevance_feedback=models.RelevanceFeedbackInput(
            target=[0.1, 0.9, 0.23],
            feedback=[
                models.FeedbackItem(example=111, score=0.68),
                models.FeedbackItem(example=222, score=0.72),
                models.FeedbackItem(example=333, score=0.61),
            ],
            strategy=models.NaiveFeedbackStrategy(
                naive=models.NaiveFeedbackStrategyParams(
                    a=0.12,
                    b=0.43,
                    c=0.03
                )
            )
        )
    )
)