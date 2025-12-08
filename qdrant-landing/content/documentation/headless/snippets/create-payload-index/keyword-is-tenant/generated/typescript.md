```typescript
client.createPayloadIndex("{collection_name}", {
  field_name: "payload_field_name",
  field_schema: {
    type: "keyword",
    is_tenant: true
  },
});
```
