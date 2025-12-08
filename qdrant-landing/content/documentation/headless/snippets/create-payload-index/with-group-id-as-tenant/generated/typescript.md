```typescript
client.createPayloadIndex("{collection_name}", {
  field_name: "group_id",
  field_schema: {
    type: "keyword",
    is_tenant: true,
  },
});
```
