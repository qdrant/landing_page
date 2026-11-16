```http
PUT /collections/{collection_name}/index
{
    "field_name": "offers[].shop",
    "field_schema": {
        "type": "keyword",
        "nested": "offers"
    }
}

PUT /collections/{collection_name}/index
{
    "field_name": "offers[].price",
    "field_schema": {
        "type": "float",
        "nested": "offers"
    }
}
```
