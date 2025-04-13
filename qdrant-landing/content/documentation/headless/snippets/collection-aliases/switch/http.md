```http
POST /collections/aliases
{
    "actions": [
        {
            "delete_alias": {
                "alias_name": "production_collection"
            }
        },
        {
            "create_alias": {
                "collection_name": "example_collection",
                "alias_name": "production_collection"
            }
        }
    ]
}
```
