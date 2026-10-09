```csharp
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

GeoPolygon(
	field: "location",
	exterior: new GeoLineString
	{
		Points =
		{
			new GeoPoint { Lat = -70.0, Lon = -70.0 },
			new GeoPoint { Lat = 60.0, Lon = -70.0 },
			new GeoPoint { Lat = 60.0, Lon = 60.0 },
			new GeoPoint { Lat = -70.0, Lon = 60.0 },
			new GeoPoint { Lat = -70.0, Lon = -70.0 }
		}
	},
	interiors: [
		new()
		{
			Points =
			{
				new GeoPoint { Lat = -65.0, Lon = -65.0 },
				new GeoPoint { Lat = 0.0, Lon = -65.0 },
				new GeoPoint { Lat = 0.0, Lon = 0.0 },
				new GeoPoint { Lat = -65.0, Lon = 0.0 },
				new GeoPoint { Lat = -65.0, Lon = -65.0 }
			}
		}
	]
);
```
