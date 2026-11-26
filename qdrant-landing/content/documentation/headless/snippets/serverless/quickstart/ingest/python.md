```python
from qdrant_client.models import Document, PointStruct

MODEL = "sentence-transformers/all-minilm-l6-v2"

menu = [
    {"name": "Garden Salad", "description": "Crisp romaine, cherry tomatoes, cucumber, and lemon vinaigrette", "price": 9.0},
    {"name": "Falafel Wrap", "description": "Chickpea fritters with tahini, pickled turnip, and parsley", "price": 11.5},
    {"name": "Mushroom Risotto", "description": "Arborio rice slow-cooked with porcini and parmesan", "price": 16.0},
    {"name": "Roasted Cauliflower", "description": "Whole head charred with cumin, pomegranate, and herbs", "price": 13.0},
    {"name": "Caprese Salad", "description": "Buffalo mozzarella, basil, and heirloom tomatoes with olive oil", "price": 12.0},
    {"name": "Lentil Soup", "description": "Red lentils simmered with carrot, celery, and cumin", "price": 8.0},
    {"name": "Grilled Ribeye", "description": "Twelve-ounce cut finished with herb butter", "price": 32.0},
    {"name": "Clam Chowder", "description": "New England style, with potato, bacon, and thyme", "price": 12.0},
    {"name": "Roast Chicken", "description": "Half bird with lemon, garlic, and pan drippings", "price": 19.0},
    {"name": "Seared Salmon", "description": "Fillet with dill cream and charred lemon", "price": 24.0},
    {"name": "Tiramisu", "description": "Espresso-soaked ladyfingers layered with mascarpone", "price": 8.5},
]

client.upsert(
    "menu",
    points=[
        PointStruct(
            id=idx,
            vector={"dense": Document(text=item["description"], model=MODEL)},
            payload=item,
        )
        for idx, item in enumerate(menu)
    ],
)
```
