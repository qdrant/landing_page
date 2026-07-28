```typescript
const N_BUCKETS = 16;   // use something much larger in production
const GROUP_SIZE = 4;   // bucket digests packed per summary point; 16 / 4 = 4 groups

function bucket(pid: string): number {
    const hex = createHash("sha256").update(pid).digest("hex");
    return Number(BigInt("0x" + hex) % BigInt(N_BUCKETS));
}

// The buckets printed in the tutorial come from the Python point IDs; this file derives its own.
for (const c of prepare(CHUNKS)) {
    console.log(bucket(c.point_id), c.point_id, c.section_url);
}
```
