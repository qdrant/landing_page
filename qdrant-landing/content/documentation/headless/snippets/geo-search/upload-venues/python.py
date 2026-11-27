from qdrant_client import QdrantClient, models

client = QdrantClient(url="https://xyz-example.qdrant.io:6333", api_key="<your-api-key>", cloud_inference=True) # @hide

# name, description, latitude, longitude
venues = [
    ("Kaffeehaus Linden", "Quiet café with long tables and free Wi-Fi", 52.5236, 13.3989),
    ("Roastery 12", "Specialty roastery with a calm back room", 52.5189, 13.4102),
    ("Spree Books & Coffee", "Bookstore café with armchairs and tea", 52.5254, 13.4113),
    ("Atelier Coworking", "Coworking space with silent rooms", 52.5298, 13.3984),
    ("Ramen Ichi", "Small ramen bar with counter seating", 52.5222, 13.392),
    ("Club Nachtschicht", "Loud techno club open until sunrise", 52.516, 13.4185),
    ("Skyline Bar", "Rooftop bar with cocktails and live DJs", 52.5232, 13.416),
    ("Kreuzberg Corner Café", "Cozy café with strong espresso and cake", 52.4985, 13.403),
    ("Café Tempelhof", "Spacious café, quiet in the mornings", 52.473, 13.4034),
    ("Charlottenburg Tea House", "Calm tea house with a garden terrace", 52.516, 13.304),
]

client.upsert(
    collection_name="venues",
    points=[
        models.PointStruct(
            id=i,
            vector=models.Document(text=description, model="sentence-transformers/all-minilm-l6-v2"),
            payload={
                "name": name,
                "description": description,
                "location": {"lat": lat, "lon": lon},
            },
        )
        for i, (name, description, lat, lon) in enumerate(venues)
    ],
)
