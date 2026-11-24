from qdrant_client import models

models.FieldCondition(
    key="color",
    match=models.MatchExcept(**{"except": ["black", "yellow"]}),
)
