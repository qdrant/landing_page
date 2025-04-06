```typescript
client.setPayload("{collection_name}", {
  payload: {
    property1: "string",
    property2: "string",
  },
  filter: {
    must: [
      {
        key: "color",
        match: {
          value: "red",
        },
      },
    ],
  },
});
```
