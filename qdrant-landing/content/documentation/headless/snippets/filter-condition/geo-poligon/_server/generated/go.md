```go
import "github.com/qdrant/go-client/qdrant"

qdrant.NewGeoPolygon("location",
	&qdrant.GeoLineString{
		Points: []*qdrant.GeoPoint{
			{Lat: -70, Lon: -70},
			{Lat: 60, Lon: -70},
			{Lat: 60, Lon: 60},
			{Lat: -70, Lon: 60},
			{Lat: -70, Lon: -70},
		},
	}, &qdrant.GeoLineString{
		Points: []*qdrant.GeoPoint{
			{Lat: -65, Lon: -65},
			{Lat: 0, Lon: -65},
			{Lat: 0, Lon: 0},
			{Lat: -65, Lon: 0},
			{Lat: -65, Lon: -65},
		},
	})
```
