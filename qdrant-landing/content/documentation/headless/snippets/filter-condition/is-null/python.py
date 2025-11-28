from qdrant_client import models  # @hide

models.IsNullCondition(
    is_null=models.PayloadField(key="reports"),
)
