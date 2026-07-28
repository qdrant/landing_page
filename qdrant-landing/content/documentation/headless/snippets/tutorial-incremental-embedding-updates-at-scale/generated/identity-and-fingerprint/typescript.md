```typescript
import { createHash } from "node:crypto";

type SyncChunk = RawChunk & { section_url: string; content_hash: string; point_id: string };

function contentHash(text: string): string {
    return createHash("sha256").update(text).digest("hex");
}

// JavaScript has no built-in UUIDv5, so the point ID is the address hash formatted as a UUID.
// Same address, same ID, which is all this tutorial needs. Note that these IDs differ from the
// Python tab's uuid5 values, so every ID, bucket, and digest printed in the tutorial is Python's.
function pointId(url: string, anchor: string, num: number): string {
    const hex = createHash("sha256").update(`${url}#${anchor}::${num}`).digest("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// Attach the derived values every later step depends on.
function prepare(chunks: RawChunk[]): SyncChunk[] {
    return chunks.map((c) => ({
        ...c,
        // Run c.text through your normalization pass before hashing it.
        section_url: c.anchor ? `${c.url}#${c.anchor}` : c.url,
        content_hash: contentHash(c.text),
        point_id: pointId(c.url, c.anchor, c.chunk_num),
    }));
}
```
