```http
POST /collections/chunks/points/query/groups
{
    // Same as in the regular query API
    "query": [1.1],

    // Grouping parameters
    "group_by": "document_id",
    "limit": 2,
    "group_size": 2,

    // Lookup parameters
    "with_lookup": {
        // Name of the collection to look up points in
        "collection": "documents",

        // Options for specifying what to bring from the payload 
        // of the looked up point, true by default
        "with_payload": ["title", "text"],

        // Options for specifying what to bring from the vector(s) 
        // of the looked up point, true by default
        "with_vectors": false
    }
}
```
