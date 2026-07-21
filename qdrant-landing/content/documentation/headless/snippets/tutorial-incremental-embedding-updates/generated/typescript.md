```typescript
import { QdrantClient, Schemas } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
});

const MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const PIPELINE = "docs-prep-pipeline-v1";
const COLLECTION = "docs-sync-tutorial";

await client.createCollection(COLLECTION, {
    vectors: {
        size: 384, // all-MiniLM-L6-v2 output dimension
        distance: "Cosine",
    },
});

await client.updateCollection(COLLECTION, {
    metadata: { embedding_model: MODEL, pipeline_version: PIPELINE },
});

async function checkGate() {
    // compare this pipeline's constants against what the collection records about itself
    const meta = ((await client.getCollection(COLLECTION)).config.metadata ??
        {}) as Record<string, unknown>;

    if (meta.embedding_model !== MODEL || meta.pipeline_version !== PIPELINE) {
        throw new Error(`collection was built by ${JSON.stringify(meta)}: full re-embed into a fresh collection required`);
    }
}

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

function payload(chunk: SyncChunk, lastUpdated?: string) {
    return {
        url: chunk.url,
        anchor: chunk.anchor,
        chunk_num: chunk.chunk_num,
        section_url: chunk.section_url,
        text: chunk.text,
        content_hash: chunk.content_hash,
        last_updated: lastUpdated ?? new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    };
}

for (const field of ["content_hash", "url", "section_url"]) {
    await client.createPayloadIndex(COLLECTION, {
        field_name: field,
        field_schema: "keyword",
    });
}

await client.upsert(COLLECTION, {
    points: prepareChunksForSync(CHUNKS).map((c) => ({
        id: c.point_id,
        vector: { text: c.text, model: MODEL },
        payload: payload(c),
    })),
    wait: true,
});

const QUERY = "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?";

await client.query(COLLECTION, {
    query: { text: QUERY, model: MODEL },
    limit: 3,
    with_payload: ["section_url", "text"],
});

// Compare the incoming chunk list to the collection: who is unchanged, changed, or unknown.
async function splitByState(latestChunks: SyncChunk[]) {
    const incoming = new Map(latestChunks.map((c) => [c.point_id, c]));

    const stored = new Map<string, string>();
    const points = await client.retrieve(COLLECTION, {
        ids: [...incoming.keys()],
        with_payload: ["content_hash"],
        with_vector: false,
    });
    for (const p of points) {
        stored.set(String(p.id), p.payload?.content_hash as string);
    }

    const unchanged: SyncChunk[] = [];
    const contentChanged: SyncChunk[] = [];
    const unknownIds: SyncChunk[] = [];
    for (const [pid, c] of incoming) {
        if (stored.get(pid) === c.content_hash) {
            unchanged.push(c);
        } else if (stored.has(pid)) {
            contentChanged.push(c);
        } else {
            unknownIds.push(c);
        }
    }

    return { incoming, unchanged, contentChanged, unknownIds };
}

const { incoming, unchanged, contentChanged, unknownIds } = await splitByState(LATEST_CHUNKS);

async function reEmbedChanged(contentChanged: SyncChunk[]) {
    if (contentChanged.length === 0) {
        return;
    }
    await client.upsert(COLLECTION, {
        points: contentChanged.map((c) => ({
            id: c.point_id,
            vector: { text: c.text, model: MODEL },
            payload: payload(c),
        })),
        wait: true,
    });
}

// Reuse an existing embedding when the same text is already stored; embed only what is new.
async function reuseOrAdd(unknownIds: SyncChunk[]) {
    let reused = 0;
    let added = 0;

    for (const c of unknownIds) {
        const sameText = {
            must: [
                {
                    key: "content_hash",
                    match: { value: c.content_hash },
                },
            ],
        };
        const hits = (await client.scroll(COLLECTION, {
            filter: sameText,
            limit: 1,
            with_payload: ["last_updated"],
            with_vector: true,
        })).points;

        let point: Schemas["PointStruct"];
        if (hits.length > 0) { // same text, new address: copy the vector, keep its last_updated
            point = {
                id: c.point_id,
                vector: hits[0].vector as number[],
                payload: payload(c, hits[0].payload?.last_updated as string),
            };
            reused += 1;
        } else { // genuinely new content: embed and insert
            point = {
                id: c.point_id,
                vector: { text: c.text, model: MODEL },
                payload: payload(c),
            };
            added += 1;
        }

        await client.upsert(COLLECTION, { points: [point], wait: true });
    }

    return { reused, added };
}

// Remove every point the current crawl no longer contains. Returns how many.
async function deleteGone(incoming: Map<string, SyncChunk>) {
    if (incoming.size === 0) {
        throw new Error("Refusing to delete from an empty source snapshot.");
    }

    const stale = { must_not: [{ has_id: [...incoming.keys()] }] };

    const toDelete = (await client.count(COLLECTION, { filter: stale })).count;

    // potential check against a threshold to avoid accidental mass deletion could be added here
    await client.delete(COLLECTION, { filter: stale, wait: true });
    return toDelete;
}

async function sync(latestChunks: RawChunk[]) {
    await checkGate(); // refuse to mix embedding models or pipeline versions

    const chunks = prepareChunksForSync(latestChunks);
    const { incoming, unchanged, contentChanged, unknownIds } = await splitByState(chunks);

    await reEmbedChanged(contentChanged);
    const { reused, added } = await reuseOrAdd(unknownIds);
    const deleted = await deleteGone(incoming);

    return {
        "unchanged": unchanged.length,
        "re-embedded": contentChanged.length,
        "reused_embedding": reused,
        "added": added,
        "deleted": deleted,
    };
}

const run = await sync(LATEST_CHUNKS);
console.log(run);
```
