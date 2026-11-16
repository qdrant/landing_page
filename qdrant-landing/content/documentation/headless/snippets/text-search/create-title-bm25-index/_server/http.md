```http
PUT /collections/books/index?wait=true
{
  "field_name": "title",
  "field_schema": {
    "type": "text",
    "scoring": true
  }
}
```
