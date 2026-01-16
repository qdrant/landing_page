```typescript
client.createPayloadIndex("books", {
  field_name: "title",
  field_schema: {
    type: "text",
    ascii_folding: true,
    phrase_matching: true,
  },
});
```
