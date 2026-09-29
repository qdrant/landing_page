from qdrant_client import models  # @hide

models.FieldCondition(
    key="description",
    match=models.MatchText(text="good cheap"),
)
