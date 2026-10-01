from qdrant_edge import FieldCondition, MatchValue

FieldCondition(
    key="color",
    match=MatchValue(value="red"),
)
