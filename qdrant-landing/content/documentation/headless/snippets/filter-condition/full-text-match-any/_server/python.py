from qdrant_client import models

models.FieldCondition(
    key="description",
    match=models.MatchTextAny(text_any="good cheap"),
)
