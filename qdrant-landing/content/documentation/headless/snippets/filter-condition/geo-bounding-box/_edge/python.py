from qdrant_edge import FieldCondition, GeoBoundingBox, GeoPoint

FieldCondition(
    key="location",
    geo_bounding_box=GeoBoundingBox(
        bottom_right=GeoPoint(
            lon=13.455868,
            lat=52.495862,
        ),
        top_left=GeoPoint(
            lon=13.403683,
            lat=52.520711,
        ),
    ),
)
