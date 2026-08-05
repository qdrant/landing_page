```typescript
client.createPayloadIndex("{collection_name}", {
  field_name: "url",
  field_schema: {
    type: "keyword",
    prefix: true
  },
});
```
