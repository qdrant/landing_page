from qdrant_client import models

models.FieldCondition(
    key="comments",
    values_count=models.ValuesCount(gt=2),
)
