from qdrant_client import models

models.FieldCondition(
    key="description",
    match=models.MatchPhrase(phrase="brown fox"),
)
