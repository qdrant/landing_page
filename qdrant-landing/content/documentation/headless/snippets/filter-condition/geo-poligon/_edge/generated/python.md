```python
from qdrant_edge import FieldCondition, GeoPoint, GeoPolygon

FieldCondition(
    key="location",
    geo_polygon=GeoPolygon(
        exterior=[
            GeoPoint(lon=-70.0, lat=-70.0),
            GeoPoint(lon=60.0, lat=-70.0),
            GeoPoint(lon=60.0, lat=60.0),
            GeoPoint(lon=-70.0, lat=60.0),
            GeoPoint(lon=-70.0, lat=-70.0),
        ],
        interiors=[
            [
                GeoPoint(lon=-65.0, lat=-65.0),
                GeoPoint(lon=0.0, lat=-65.0),
                GeoPoint(lon=0.0, lat=0.0),
                GeoPoint(lon=-65.0, lat=0.0),
                GeoPoint(lon=-65.0, lat=-65.0),
            ],
        ],
    ),
)
```
