from qdrant_edge import FieldCondition, MatchTextAny

FieldCondition(
    key="description",
    match=MatchTextAny(text_any="good cheap"),
)
