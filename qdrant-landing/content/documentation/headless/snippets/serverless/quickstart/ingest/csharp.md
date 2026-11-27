```csharp
using Qdrant.Client.Grpc;

const string model = "sentence-transformers/all-minilm-l6-v2";

var menu = new[]
{
    new { Name = "Garden Salad", Description = "Crisp romaine, cherry tomatoes, cucumber, and lemon vinaigrette", Price = 9.0 },
    new { Name = "Falafel Wrap", Description = "Chickpea fritters with tahini, pickled turnip, and parsley", Price = 11.5 },
    new { Name = "Mushroom Risotto", Description = "Arborio rice slow-cooked with porcini and parmesan", Price = 16.0 },
    new { Name = "Roasted Cauliflower", Description = "Whole head charred with cumin, pomegranate, and herbs", Price = 13.0 },
    new { Name = "Caprese Salad", Description = "Buffalo mozzarella, basil, and heirloom tomatoes with olive oil", Price = 12.0 },
    new { Name = "Lentil Soup", Description = "Red lentils simmered with carrot, celery, and cumin", Price = 8.0 },
    new { Name = "Grilled Ribeye", Description = "Twelve-ounce cut finished with herb butter", Price = 32.0 },
    new { Name = "Clam Chowder", Description = "New England style, with potato, bacon, and thyme", Price = 12.0 },
    new { Name = "Roast Chicken", Description = "Half bird with lemon, garlic, and pan drippings", Price = 19.0 },
    new { Name = "Seared Salmon", Description = "Fillet with dill cream and charred lemon", Price = 24.0 },
    new { Name = "Tiramisu", Description = "Espresso-soaked ladyfingers layered with mascarpone", Price = 8.5 },
};

var points = menu.Select((item, idx) => new PointStruct
{
    Id = (ulong)idx,
    Vectors = new Dictionary<string, Vector>
    {
        ["dense"] = new Document { Text = item.Description, Model = model }
    },
    Payload =
    {
        ["name"] = item.Name,
        ["description"] = item.Description,
        ["price"] = item.Price
    }
}).ToList();

await client.UpsertAsync("menu", points);
```
