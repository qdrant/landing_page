```http
PUT /collections/{collection_name}/index
{
    "field_name": "payload_field_name",
    "field_schema": {
        "type": "keyword",
        "on_disk": true
    }
}
```
