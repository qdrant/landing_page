```typescript
const today = "2026-04-08";
const oldestDate = new Date(today);
oldestDate.setDate(oldestDate.getDate() - 7);
const oldestShardKey = oldestDate.toISOString().slice(0, 10);

await client.createShardKey(collectionName, { shard_key: today });
await client.deleteShardKey(collectionName, { shard_key: oldestShardKey });
```
