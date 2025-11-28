from qdrant_client import models  # @hide

models.FieldCondition(
    key="color",
    match=models.MatchValue(value="red"),
)
