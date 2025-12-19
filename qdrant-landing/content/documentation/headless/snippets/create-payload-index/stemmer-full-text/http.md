```http
PUT /collections/{collection_name}/index
{
    "field_name": "name_of_the_field_to_index",
    "field_schema": {
        "type": "text",
        "tokenizer": "word",
        "stemmer": {
            "type": "snowball",
            "language": "english"
        }
    }
}
```
