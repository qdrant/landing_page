from qdrant_client import models  # @hide

models.FieldCondition(
    key="description",
    match=models.MatchPhrase(phrase="brown fox"),
)
