```typescript
client.createPayloadIndex("{collection_name}", {
  field_name: "timestamp",
  field_schema: {
    type: "integer",
    is_principal: true
  },
});
```
