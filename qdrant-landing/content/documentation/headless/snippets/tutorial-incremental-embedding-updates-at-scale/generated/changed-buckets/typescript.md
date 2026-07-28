```typescript
const latest = prepare(LATEST);
const source = computeDigests(latest);   // digests of the edited source
const stored = await readMeta();         // digests Qdrant currently holds

const changedBuckets: number[] = [];
for (let b = 0; b < N_BUCKETS; b++) {
    if (source[b] !== stored[b]) {
        changedBuckets.push(b);
    }
}

console.log(changedBuckets);
```
