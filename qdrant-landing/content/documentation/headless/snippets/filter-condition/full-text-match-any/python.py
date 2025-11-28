from qdrant_client import models  # @hide

models.FieldCondition(
    key="description",
    match=models.MatchTextAny(text_any="good cheap"),
)
