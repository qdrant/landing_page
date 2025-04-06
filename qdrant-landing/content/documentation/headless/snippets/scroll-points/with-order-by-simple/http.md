```http
POST /collections/{collection_name}/points/scroll
{
    "limit": 15,
    "order_by": "timestamp", // <-- this!
}
```
