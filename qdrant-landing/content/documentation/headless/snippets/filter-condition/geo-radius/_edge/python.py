from qdrant_edge import FieldCondition, GeoPoint, GeoRadius

FieldCondition(
    key="location",
    geo_radius=GeoRadius(
        center=GeoPoint(
            lon=13.403683,
            lat=52.520711,
        ),
        radius=1000.0,
    ),
)
