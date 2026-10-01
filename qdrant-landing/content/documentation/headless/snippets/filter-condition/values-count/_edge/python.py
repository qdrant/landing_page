from qdrant_edge import FieldCondition, ValuesCount

FieldCondition(
    key="comments",
    values_count=ValuesCount(gt=2),
)
