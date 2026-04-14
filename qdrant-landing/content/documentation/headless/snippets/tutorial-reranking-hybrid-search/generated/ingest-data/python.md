```python
import csv
from qdrant_client.models import Document, PointStruct
import urllib.request

csv_url = 'https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv'

with urllib.request.urlopen(csv_url) as response:
    reader = csv.DictReader(line.decode('utf-8') for line in response)
    points = (
        PointStruct(
            id=idx,
            vector={
                "dense": Document(text=row['Description'], model=dense_embedding_model),
                "sparse": Document(text=row['Description'], model=sparse_embedding_model),
                "multi": Document(text=row['Description'], model=late_interaction_embedding_model),
            },
            payload={"title": row['Title'], "author": row['Author'], "description": row['Description']}
        )
        for idx, row in enumerate(reader)
    )
    client.upload_points(
        collection_name=collection_name,
        points=points,
        batch_size=25
    )
```
