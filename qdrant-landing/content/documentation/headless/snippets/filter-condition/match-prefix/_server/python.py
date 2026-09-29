from qdrant_client import models  # @hide

models.FieldCondition(
    key="url",
    match=models.MatchPrefix(prefix="https://qdrant."),
)
