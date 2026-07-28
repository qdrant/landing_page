```typescript
import { QdrantClient, Schemas } from "@qdrant/js-client-rest";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

type RawChunk = { url: string; anchor: string; chunk_num: number; text: string };

const CHUNKS: RawChunk[] = [
    { url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
      anchor: "prerequisites", chunk_num: 0,
      text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ..." },
    { url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
      anchor: "step-2-enable-tls", chunk_num: 0,
      text: "Step 2: Enable TLS. Generate a local self-signed certificate and point Qdrant at it ..." },
    { url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
      anchor: "step-3-enable-an-admin-api-key", chunk_num: 0,
      text: "Step 3: Enable an Admin API Key. Without authentication, anyone with network access ..." },
];

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

const MAIN = "docs-sync-scale";
const MODEL = "sentence-transformers/all-MiniLM-L6-v2";

if (!(await client.collectionExists(MAIN)).exists) {
    await client.createCollection(MAIN, {
        vectors: { size: 384, distance: "Cosine" },
    });
    await client.updateCollection(MAIN, {
        metadata: { embedding_model: MODEL, pipeline_version: "1" },
    });
    await client.createPayloadIndex(MAIN, { field_name: "sync_bucket", field_schema: "integer" });
}

function payload(c: SyncChunk) {
    return {
        url: c.url,
        anchor: c.anchor,
        chunk_num: c.chunk_num,
        section_url: c.section_url,
        text: c.text,
        content_hash: c.content_hash,
        sync_bucket: bucket(c.point_id),
    };
}

function asPoints(chunks: SyncChunk[]): Schemas["PointStruct"][] {
    return chunks.map((c) => ({
        id: c.point_id,
        vector: { text: c.text, model: MODEL },  // embedded by Qdrant Cloud Inference
        payload: payload(c),
    }));
}

await client.upsert(MAIN, { points: asPoints(prepare(CHUNKS)), wait: true });

const META = "docs-sync-digests";
const N_META = N_BUCKETS / GROUP_SIZE;

if (!(await client.collectionExists(META)).exists) {
    await client.createCollection(META, {
        vectors: { size: 1, distance: "Cosine" },
    });
}

// Digests are stored as decimal strings, for the 2^53 reason given above.

// Store bucket digests in the summary collection, one point per group.
// digests: the full list of N_BUCKETS digests.
// groups:  which group points to rewrite; defaults to all of them.
async function writeMeta(digests: string[], groups?: Iterable<number>) {
    const points = [];
    for (const g of groups ?? Array.from({ length: N_META }, (_, i) => i)) {
        // group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
        const start = g * GROUP_SIZE;
        points.push({
            id: g,
            vector: [1.0],  // dummy: this collection is never searched
            payload: { group: g, digests: digests.slice(start, start + GROUP_SIZE) },
        });
    }
    await client.upsert(META, { points, wait: true });
}

// Read the summary back as a flat list of N_BUCKETS digests.
async function readMeta(): Promise<string[]> {
    const digests = new Array<string>(N_BUCKETS).fill("0");
    const points = await client.retrieve(META, {
        ids: Array.from({ length: N_META }, (_, i) => i),
        with_payload: true,
    });
    for (const point of points) {
        const g = point.payload!.group as number;
        (point.payload!.digests as string[]).forEach((digest, slot) => {
            digests[g * GROUP_SIZE + slot] = digest;
        });
    }
    return digests;
}

await writeMeta(computeDigests(prepare(CHUNKS)));
await readMeta();

const LATEST: RawChunk[] = [
    // unchanged
    { url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
      anchor: "prerequisites", chunk_num: 0,
      text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ..." },
    // edited text
    { url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
      anchor: "step-2-enable-tls", chunk_num: 0,
      text: "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ..." },
    // step-3 removed; new step-4 added
    { url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
      anchor: "step-4-restrict-access", chunk_num: 0,
      text: "Step 4: Restrict access with read-only API keys for untrusted clients ..." },
];

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

// Return a map of point_id to content_hash for every chunk stored in bucket b.
// Pages through the results so nothing is missed in a large bucket.
async function readBucket(b: number): Promise<Map<string, string>> {
    const stored = new Map<string, string>();
    let offset: Schemas["ExtendedPointId"] | null | undefined = undefined;
    do {
        const page = await client.scroll(MAIN, {
            filter: { must: [{ key: "sync_bucket", match: { value: b } }] },
            with_payload: ["content_hash"],
            with_vector: false,
            limit: 1000,
            offset,
        });
        for (const point of page.points) {
            stored.set(String(point.id), point.payload!.content_hash as string);
        }
        offset = page.next_page_offset;
    } while (offset !== null && offset !== undefined);
    return stored;
}

// Make bucket b in Qdrant match sourceChunks. Returns the counts of what it did.
async function reconcileBucket(b: number, sourceChunks: Map<string, SyncChunk>) {
    const stored = await readBucket(b);   // point_id -> content_hash currently in Qdrant

    const toWrite: SyncChunk[] = [];      // new or content-changed chunks: embed and upsert
    let added = 0;
    let reEmbedded = 0;
    for (const [pid, chunk] of sourceChunks) {
        if (!stored.has(pid)) {
            toWrite.push(chunk);          // new chunk in this bucket
            added += 1;
        } else if (stored.get(pid) !== chunk.content_hash) {
            toWrite.push(chunk);          // same chunk, changed text
            reEmbedded += 1;
        }
    }

    const toDelete: string[] = [];        // chunks Qdrant has but the source no longer does
    for (const pid of stored.keys()) {
        if (!sourceChunks.has(pid)) {
            toDelete.push(pid);
        }
    }

    if (toWrite.length > 0) {
        await client.upsert(MAIN, { points: asPoints(toWrite), wait: true });
    }
    if (toDelete.length > 0) {
        await client.delete(MAIN, { points: toDelete, wait: true });
    }

    return { added, reEmbedded, deleted: toDelete.length };
}

async function sync(latestChunks: RawChunk[]) {
    const latest = prepare(latestChunks);

    // group the source chunks by bucket once
    const sourceByBucket = new Map<number, Map<string, SyncChunk>>();
    for (const c of latest) {
        const b = bucket(c.point_id);
        if (!sourceByBucket.has(b)) {
            sourceByBucket.set(b, new Map());
        }
        sourceByBucket.get(b)!.set(c.point_id, c);
    }

    // steps 1-3: which buckets changed
    const source = computeDigests(latest);
    const stored = await readMeta();
    const changed: number[] = [];
    for (let b = 0; b < N_BUCKETS; b++) {
        if (source[b] !== stored[b]) {
            changed.push(b);
        }
    }

    // step 4: reconcile each changed bucket
    const report = { changed_buckets: changed, added: 0, re_embedded: 0, deleted: 0 };
    for (const b of changed) {
        const counts = await reconcileBucket(b, sourceByBucket.get(b) ?? new Map());
        report.added += counts.added;
        report.re_embedded += counts.reEmbedded;
        report.deleted += counts.deleted;
    }

    // step 5: rewrite only the changed groups of the summary, after the data writes
    const changedGroups = new Set<number>();
    for (const b of changed) {
        changedGroups.add(Math.floor(b / GROUP_SIZE));
    }
    await writeMeta(source, changedGroups);

    return report;
}

console.log(await sync(LATEST));
```
