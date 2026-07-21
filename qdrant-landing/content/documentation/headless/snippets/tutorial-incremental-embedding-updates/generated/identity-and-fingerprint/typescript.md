```typescript
import { createHash } from "node:crypto";

type RawChunk = { url: string; anchor: string; chunk_num: number; text: string };
type SyncChunk = RawChunk & { section_url: string; content_hash: string; point_id: string };

function contentHash(text: string): string {
    return createHash("sha256").update(text).digest("hex");
}

// NAMESPACE_URL is a fixed constant name-based (v5) UUIDs require; it marks the input as a URL-like name
function pointId(url: string, anchor: string, num: number): string {
    // Qdrant accepts any well-formed UUID as a point ID:
    // hash the address, format the digest as a UUID, and the same address always yields the same ID
    const hex = createHash("sha256").update(`${url}#${anchor}::${num}`).digest("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// Derive both values (and the section address) for every raw chunk.
function prepareChunksForSync(chunks: RawChunk[]): SyncChunk[] {
    return chunks.map((c) => {
        const text = normalize(c.text);
        return {
            ...c,
            text,
            section_url: c.anchor ? `${c.url}#${c.anchor}` : c.url,
            content_hash: contentHash(text),
            point_id: pointId(c.url, c.anchor, c.chunk_num),
        };
    });
}
```
