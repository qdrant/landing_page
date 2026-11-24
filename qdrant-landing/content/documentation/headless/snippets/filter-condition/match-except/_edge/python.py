from qdrant_edge import FieldCondition, MatchExcept

FieldCondition(
    key="color",
    match=MatchExcept(["black", "yellow"]),
)
