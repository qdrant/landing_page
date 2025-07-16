```http
// Simple
PUT collections/test/index
{
    "field_name": "name_of_the_field_to_index",
    "field_schema": {
        "type": "text",
        "tokenizer": "word",
        "stopwords": "english"
    }
}

// Explicit
PUT collections/test/index
{
    "field_name": "name_of_the_field_to_index",
    "field_schema": {
        "type": "text",
        "tokenizer": "word",
        "stopwords": {
            "languages": [
                "english",
                "spanish"
            ],
            "custom": [
                "example"
            ]
        }
    }
}
```
