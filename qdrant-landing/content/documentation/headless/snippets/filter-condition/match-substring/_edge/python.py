from qdrant_edge import FieldCondition, MatchSubstring

FieldCondition(
    key="url",
    match=MatchSubstring(substring="qdrant.tech/"),
)
