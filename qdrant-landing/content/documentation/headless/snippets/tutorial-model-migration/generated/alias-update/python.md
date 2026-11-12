```python
client.update_collection_aliases(
    change_aliases_operations=[
        models.DeleteAliasOperation(
            delete_alias=models.DeleteAlias(alias_name="prod")
        ),
        models.CreateAliasOperation(
            create_alias=models.CreateAlias(
                collection_name=NEW_COLLECTION, alias_name="prod"
            )
        ),
    ]
)
```
