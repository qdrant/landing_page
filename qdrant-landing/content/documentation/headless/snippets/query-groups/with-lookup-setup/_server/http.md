```http
PUT /collections/chunks
{
    "vectors": {
        "size": 4,
        "distance": "Cosine"
    }
}

PUT /collections/chunks/index
{
    "field_name": "document_id",
    "field_schema": "integer"
}

PUT /collections/documents
{
    "vectors": {}
}
```
