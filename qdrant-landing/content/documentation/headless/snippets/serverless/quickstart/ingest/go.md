```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

const model = "sentence-transformers/all-minilm-l6-v2"

menu := []struct {
	Name        string
	Description string
	Price       float64
}{
	{"Garden Salad", "Crisp romaine, cherry tomatoes, cucumber, and lemon vinaigrette", 9.0},
	{"Falafel Wrap", "Chickpea fritters with tahini, pickled turnip, and parsley", 11.5},
	{"Mushroom Risotto", "Arborio rice slow-cooked with porcini and parmesan", 16.0},
	{"Roasted Cauliflower", "Whole head charred with cumin, pomegranate, and herbs", 13.0},
	{"Caprese Salad", "Buffalo mozzarella, basil, and heirloom tomatoes with olive oil", 12.0},
	{"Lentil Soup", "Red lentils simmered with carrot, celery, and cumin", 8.0},
	{"Grilled Ribeye", "Twelve-ounce cut finished with herb butter", 32.0},
	{"Clam Chowder", "New England style, with potato, bacon, and thyme", 12.0},
	{"Roast Chicken", "Half bird with lemon, garlic, and pan drippings", 19.0},
	{"Seared Salmon", "Fillet with dill cream and charred lemon", 24.0},
	{"Tiramisu", "Espresso-soaked ladyfingers layered with mascarpone", 8.5},
}

points := make([]*qdrant.PointStruct, 0, len(menu))
for idx, item := range menu {
	points = append(points, &qdrant.PointStruct{
		Id: qdrant.NewIDNum(uint64(idx)),
		Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
			"dense": qdrant.NewVectorDocument(&qdrant.Document{Text: item.Description, Model: model}),
		}),
		Payload: qdrant.NewValueMap(map[string]any{
			"name":        item.Name,
			"description": item.Description,
			"price":       item.Price,
		}),
	})
}

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "menu",
	Points:         points,
})
```
