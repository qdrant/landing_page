```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var menuItems = new[]
{
	("Pad Thai with Tofu", "Stir-fried rice noodles with tofu bean sprouts scallions and crushed peanuts in traditional tamarind sauce", "$13.95", "Noodles"),
	("Grilled Salmon Fillet", "Wild-caught Atlantic salmon grilled with lemon butter and fresh herbs served with seasonal vegetables", "$24.50", "Seafood Entrees"),
	("Mushroom Risotto", "Creamy arborio rice with mixed mushrooms parmesan truffle oil and fresh thyme", "$16.75", "Vegetarian"),
	("Bibimbap Bowl", "Korean rice bowl with seasoned vegetables fried egg gochujang sauce and choice of protein", "$14.50", "Korean Bowls"),
	("Falafel Wrap", "Crispy chickpea fritters with hummus tahini cucumber tomato and pickled vegetables in warm pita", "$11.25", "Mediterranean"),
	("Shrimp Tacos", "Three soft tacos with grilled shrimp cabbage slaw chipotle aioli and fresh lime", "$13.00", "Tacos"),
	("Vegetable Curry", "Mixed vegetables in aromatic coconut curry sauce with jasmine rice and naan bread", "$12.95", "Indian Curries"),
	("Tuna Poke Bowl", "Fresh ahi tuna with avocado edamame cucumber seaweed salad over sushi rice with spicy mayo", "$16.50", "Poke Bowls"),
	("Margherita Pizza", "Fresh mozzarella san marzano tomatoes basil and extra virgin olive oil on wood-fired crust", "$14.00", "Pizza"),
	("Chicken Tikka Masala", "Tandoori chicken in creamy tomato sauce with aromatic spices served with basmati rice", "$15.95", "Indian Entrees"),
	("Greek Salad", "Romaine lettuce tomatoes cucumbers kalamata olives feta cheese red onion with lemon oregano dressing", "$10.50", "Salads"),
	("Lobster Roll", "Fresh Maine lobster meat with light mayo on toasted buttery roll served with chips", "$22.00", "Seafood Sandwiches"),
	("Quinoa Buddha Bowl", "Organic quinoa with roasted chickpeas kale sweet potato tahini dressing and hemp seeds", "$13.50", "Healthy Bowls"),
	("Beef Pho", "Traditional Vietnamese beef noodle soup with rice noodles fresh herbs bean sprouts and lime", "$12.75", "Noodle Soups"),
	("Eggplant Parmesan", "Breaded eggplant layered with marinara mozzarella and parmesan served with pasta", "$15.25", "Italian Entrees"),
	("Crab Cakes", "Maryland-style lump crab cakes with remoulade sauce and mixed greens", "$18.50", "Seafood Appetizers"),
	("Tofu Stir Fry", "Crispy tofu with broccoli bell peppers snap peas in garlic ginger sauce over steamed rice", "$12.50", "Vegetarian Entrees"),
	("Salmon Sushi Platter", "12 pieces of fresh salmon nigiri and sashimi with wasabi pickled ginger and soy sauce", "$19.95", "Sushi"),
	("Caprese Sandwich", "Fresh mozzarella tomatoes basil pesto balsamic glaze on ciabatta bread", "$11.75", "Sandwiches"),
	("Tom Yum Soup", "Spicy and sour Thai soup with shrimp lemongrass galangal mushrooms and kaffir lime leaves", "$11.50", "Soups"),
	("Lentil Dal", "Red lentils simmered with turmeric cumin coriander served with rice and naan", "$11.95", "Vegan Entrees"),
	("Fish and Chips", "Beer-battered cod with crispy fries malt vinegar and tartar sauce", "$16.00", "British Classics"),
	("Veggie Burger", "House-made black bean and quinoa patty with avocado sprouts tomato on brioche bun", "$13.25", "Burgers"),
	("Miso Ramen", "Rich miso broth with ramen noodles soft-boiled egg bamboo shoots nori and scallions", "$14.50", "Ramen"),
	("Stuffed Bell Peppers", "Roasted bell peppers filled with rice vegetables herbs and melted cheese", "$13.75", "Vegetarian Entrees"),
	("Scallop Risotto", "Pan-seared sea scallops over creamy parmesan risotto with white wine and lemon", "$26.50", "Seafood Specials"),
	("Spring Rolls", "Fresh rice paper rolls with vegetables tofu rice noodles herbs and peanut dipping sauce", "$8.95", "Appetizers"),
	("Oyster Po Boy", "Fried oysters with lettuce tomato pickles and remoulade on french bread", "$15.50", "Sandwiches"),
	("Portobello Mushroom Steak", "Grilled portobello cap marinated in balsamic with roasted vegetables and quinoa", "$14.95", "Vegan Entrees"),
	("Coconut Shrimp", "Jumbo shrimp breaded in shredded coconut served with sweet chili sauce", "$14.25", "Seafood Appetizers"),
};

var points = new List<PointStruct>();
for (int i = 0; i < menuItems.Length; i++)
{
	var item = menuItems[i];
	points.Add(new PointStruct
	{
		Id = (ulong)i,
		Vectors = new Document
		{
			Text = $"{item.Item1} {item.Item2}",
			Model = "sentence-transformers/all-MiniLM-L6-v2",
		},
		Payload =
		{
			["item_name"] = item.Item1,
			["description"] = item.Item2,
			["price"] = item.Item3,
			["category"] = item.Item4,
		},
	});
}

await client.UpsertAsync("items", points);
```
