from qdrant_client import models  # @hide

models.FieldCondition(
    key="comments",
    values_count=models.ValuesCount(gt=2),
)
