```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

type Venue struct {
	Name, Description string
	Lat, Lon          float64
}

venues := []Venue{
{"Kaffeehaus Linden", "Quiet café with long tables and free Wi-Fi", 52.5236, 13.3989},
{"Roastery 12", "Specialty roastery with a calm back room", 52.5189, 13.4102},
{"Spree Books & Coffee", "Bookstore café with armchairs and tea", 52.5254, 13.4113},
{"Atelier Coworking", "Coworking space with silent rooms", 52.5298, 13.3984},
{"Ramen Ichi", "Small ramen bar with counter seating", 52.5222, 13.392},
{"Club Nachtschicht", "Loud techno club open until sunrise", 52.516, 13.4185},
{"Skyline Bar", "Rooftop bar with cocktails and live DJs", 52.5232, 13.416},
{"Kreuzberg Corner Café", "Cozy café with strong espresso and cake", 52.4985, 13.403},
{"Café Tempelhof", "Spacious café, quiet in the mornings", 52.473, 13.4034},
{"Charlottenburg Tea House", "Calm tea house with a garden terrace", 52.516, 13.304},
}

points := make([]*qdrant.PointStruct, len(venues))
for i, venue := range venues {
	points[i] = &qdrant.PointStruct{
		Id: qdrant.NewIDNum(uint64(i)),
		Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
			Text:  venue.Description,
			Model: "sentence-transformers/all-minilm-l6-v2",
		}),
		Payload: qdrant.NewValueMap(map[string]any{
			"name":        venue.Name,
			"description": venue.Description,
			"location":    map[string]any{"lat": venue.Lat, "lon": venue.Lon},
		}),
	}
}

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "venues",
	Points:         points,
})
```
