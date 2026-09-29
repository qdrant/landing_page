from qdrant_edge import FieldCondition, MatchPrefix

FieldCondition(
    key="url",
    match=MatchPrefix(prefix="https://qdrant."),
)
