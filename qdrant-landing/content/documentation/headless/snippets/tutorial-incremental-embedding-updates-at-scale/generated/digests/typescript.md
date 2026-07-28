```typescript
// A digest is a 60-bit number, but JavaScript numbers are exact only up to 2^53, and BigInt
// cannot be JSON-serialized. So the arithmetic runs in BigInt and every digest is carried and
// stored as a decimal string. Compare those strings; never coerce a digest back to Number.
function chunkDigest(pid: string, chash: string): bigint {
    // First 15 hex digits of the combined hash = a 60-bit number.
    const combined = createHash("sha256").update(pid + chash).digest("hex");
    return BigInt("0x" + combined.slice(0, 15));
}

function computeDigests(chunks: SyncChunk[]): string[] {
    const digests = new Array<bigint>(N_BUCKETS).fill(0n);
    for (const c of chunks) {
        const b = bucket(c.point_id);
        digests[b] ^= chunkDigest(c.point_id, c.content_hash);
    }
    return digests.map((d) => d.toString());
}

computeDigests(prepare(CHUNKS));
```
