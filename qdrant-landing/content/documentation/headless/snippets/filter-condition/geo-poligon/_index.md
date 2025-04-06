#### Geo Polygon
Geo Polygons search is useful for when you want to find points inside an irregularly shaped area, for example a country boundary or a forest boundary. A polygon always has an exterior ring and may optionally include interior rings. A lake with an island would be an example of an interior ring. If you wanted to find points in the water but not on the island, you would make an interior ring for the island. 

When defining a ring, you must pick either a clockwise or counterclockwise ordering for your points.  The first and last point of the polygon must be the same. 

Currently, we only support unprojected global coordinates (decimal degrees longitude and latitude) and we are datum agnostic.

