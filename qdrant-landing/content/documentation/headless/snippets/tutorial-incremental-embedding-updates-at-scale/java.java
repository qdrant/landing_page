package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.match;
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.list;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.WithPayloadSelectorFactory;
import io.qdrant.client.WithVectorsSelectorFactory;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.JsonWithInt.Value;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointId;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.ScrollPoints;
import io.qdrant.client.grpc.Points.ScrollResponse;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class Snippet {

    // @block-start client-connection
    // The Java client takes a host and port rather than a URL, so only the API key is read
    // from the environment. Replace the host with your own from https://cloud.qdrant.io
    static final QdrantClient client =
        new QdrantClient(
            QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                .withApiKey(System.getenv("QDRANT_API_KEY"))
                .build());
    // @block-end client-connection

    // @block-start chunks
    static class Chunk {
        String url;
        String anchor;
        int chunkNum;
        String text;
        String sectionUrl;  // derived in prepare
        String contentHash; // derived in prepare
        String pointId;     // derived in prepare

        Chunk(String url, String anchor, int chunkNum, String text) {
            this.url = url;
            this.anchor = anchor;
            this.chunkNum = chunkNum;
            this.text = text;
        }
    }

    static final List<Chunk> CHUNKS = List.of(
        new Chunk(
            "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
            "prerequisites",
            0,
            "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ..."),
        new Chunk(
            "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
            "step-2-enable-tls",
            0,
            "Step 2: Enable TLS. Generate a local self-signed certificate and point Qdrant at it ..."),
        new Chunk(
            "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
            "step-3-enable-an-admin-api-key",
            0,
            "Step 3: Enable an Admin API Key. Without authentication, anyone with network access ..."));
    // @block-end chunks

    // @block-start identity-and-fingerprint
    static String sha256Hex(String text) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256")
            .digest(text.getBytes(StandardCharsets.UTF_8));
        return String.format("%064x", new BigInteger(1, digest));
    }

    static String contentHash(String text) throws Exception {
        return sha256Hex(text);
    }

    static String pointId(String url, String anchor, int num) {
        // The JDK has no UUIDv5, so this is a name-based UUID (version 3). It is just as stable
        // and deterministic, but it does not match the Python tab's uuid5 values, which means
        // every ID, bucket, and digest printed in this tutorial is Python's, not this file's.
        return UUID.nameUUIDFromBytes(
            (url + "#" + anchor + "::" + num).getBytes(StandardCharsets.UTF_8)).toString();
    }

    // Attach the derived values every later step depends on.
    static List<Chunk> prepare(List<Chunk> chunks) throws Exception {
        List<Chunk> prepared = new ArrayList<>();
        for (Chunk c : chunks) {
            // Run c.text through your normalization pass before hashing it.
            Chunk out = new Chunk(c.url, c.anchor, c.chunkNum, c.text);
            out.sectionUrl = !c.anchor.isEmpty() ? c.url + "#" + c.anchor : c.url;
            out.contentHash = contentHash(c.text);
            out.pointId = pointId(c.url, c.anchor, c.chunkNum);
            prepared.add(out);
        }
        return prepared;
    }
    // @block-end identity-and-fingerprint

    // @block-start buckets
    static final int N_BUCKETS = 16; // use something much larger in production
    static final int GROUP_SIZE = 4; // bucket digests packed per summary point; 16 / 4 = 4 groups

    static int bucket(String pid) throws Exception {
        // the whole 256-bit hash as one number, then modulo N_BUCKETS
        return new BigInteger(sha256Hex(pid), 16).mod(BigInteger.valueOf(N_BUCKETS)).intValue();
    }

    // The buckets printed in the tutorial come from the Python point IDs; this file derives its own.
    static void printBuckets() throws Exception {
        for (Chunk c : prepare(CHUNKS)) {
            System.out.println(bucket(c.pointId) + " " + c.pointId + " " + c.sectionUrl);
        }
    }
    // @block-end buckets

    // @block-start digests
    static long chunkDigest(String pid, String chash) throws Exception {
        // First 15 hex digits of the combined hash = a 60-bit number.
        // 60 bits fits Qdrant's signed 64-bit integer payload, so digests store as plain integers.
        String combined = sha256Hex(pid + chash);
        return new BigInteger(combined.substring(0, 15), 16).longValue();
    }

    static long[] computeDigests(List<Chunk> chunks) throws Exception {
        long[] digests = new long[N_BUCKETS];
        for (Chunk c : chunks) {
            int b = bucket(c.pointId);
            digests[b] ^= chunkDigest(c.pointId, c.contentHash);
        }
        return digests;
    }
    // @block-end digests

    // @block-start create-collection
    static final String MAIN = "docs-sync-scale";
    static final String MODEL = "sentence-transformers/all-MiniLM-L6-v2";

    static void createCollection() throws Exception {
        if (!client.collectionExistsAsync(MAIN).get()) {
            client.createCollectionAsync(
                CreateCollection.newBuilder()
                    .setCollectionName(MAIN)
                    .setVectorsConfig(
                        VectorsConfig.newBuilder()
                            .setParams(
                                VectorParams.newBuilder()
                                    .setSize(384)
                                    .setDistance(Distance.Cosine)
                                    .build())
                            .build())
                    .putAllMetadata(
                        Map.of(
                            "embedding_model", value(MODEL),
                            "pipeline_version", value("1")))
                    .build()).get();

            client.createPayloadIndexAsync(
                MAIN, "sync_bucket", PayloadSchemaType.Integer, null, null, null, null).get();
        }
    }
    // @block-end create-collection

    // @block-start payload
    static Map<String, Value> payload(Chunk c) throws Exception {
        Map<String, Value> p = new HashMap<>();
        p.put("url", value(c.url));
        p.put("anchor", value(c.anchor));
        p.put("chunk_num", value(c.chunkNum));
        p.put("section_url", value(c.sectionUrl));
        p.put("text", value(c.text));
        p.put("content_hash", value(c.contentHash));
        p.put("sync_bucket", value(bucket(c.pointId)));
        return p;
    }
    // @block-end payload

    // @block-start populate
    static List<PointStruct> asPoints(List<Chunk> chunks) throws Exception {
        List<PointStruct> points = new ArrayList<>();
        for (Chunk c : chunks) {
            points.add(
                PointStruct.newBuilder()
                    .setId(id(UUID.fromString(c.pointId)))
                    // embedded by Qdrant Cloud Inference
                    .setVectors(
                        vectors(
                            vector(
                                Document.newBuilder()
                                    .setText(c.text)
                                    .setModel(MODEL)
                                    .build())))
                    .putAllPayload(payload(c))
                    .build());
        }
        return points;
    }

    static void populate() throws Exception {
        client.upsertAsync(MAIN, asPoints(prepare(CHUNKS))).get();
    }
    // @block-end populate

    // @block-start summary-collection
    static final String META = "docs-sync-digests";
    static final int N_META = N_BUCKETS / GROUP_SIZE;

    static void createSummaryCollection() throws Exception {
        if (!client.collectionExistsAsync(META).get()) {
            client.createCollectionAsync(
                CreateCollection.newBuilder()
                    .setCollectionName(META)
                    .setVectorsConfig(
                        VectorsConfig.newBuilder()
                            .setParams(
                                VectorParams.newBuilder()
                                    .setSize(1)
                                    .setDistance(Distance.Cosine)
                                    .build())
                            .build())
                    .build()).get();
        }
    }
    // @block-end summary-collection

    // @block-start summary-read-write
    // Store bucket digests in the summary collection, one point per group.
    // digests: the full list of N_BUCKETS digests.
    // groups:  which group points to rewrite; null rewrites all of them.
    static void writeMeta(long[] digests, Set<Integer> groups) throws Exception {
        if (groups == null) {
            groups = new LinkedHashSet<>();
            for (int g = 0; g < N_META; g++) {
                groups.add(g);
            }
        }

        List<PointStruct> points = new ArrayList<>();
        for (int g : groups) {
            // group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
            int start = g * GROUP_SIZE;
            List<Value> groupDigests = new ArrayList<>();
            for (int slot = 0; slot < GROUP_SIZE; slot++) {
                groupDigests.add(value(digests[start + slot]));
            }
            points.add(
                PointStruct.newBuilder()
                    .setId(id(g))
                    .setVectors(vectors(1.0f)) // dummy: this collection is never searched
                    .putPayload("group", value(g))
                    .putPayload("digests", list(groupDigests))
                    .build());
        }
        client.upsertAsync(META, points).get();
    }

    // Read the summary back as a flat list of N_BUCKETS digests.
    static long[] readMeta() throws Exception {
        long[] digests = new long[N_BUCKETS];
        List<PointId> ids = new ArrayList<>();
        for (int g = 0; g < N_META; g++) {
            ids.add(id(g));
        }

        var points = client.retrieveAsync(
            META,
            ids,
            WithPayloadSelectorFactory.enable(true),
            WithVectorsSelectorFactory.enable(false),
            null).get();

        for (var point : points) {
            int g = (int) point.getPayloadMap().get("group").getIntegerValue();
            List<Value> groupDigests = point.getPayloadMap().get("digests").getListValue().getValuesList();
            for (int slot = 0; slot < groupDigests.size(); slot++) {
                digests[g * GROUP_SIZE + slot] = groupDigests.get(slot).getIntegerValue();
            }
        }
        return digests;
    }
    // @block-end summary-read-write

    // @block-start latest-chunks
    static final List<Chunk> LATEST = List.of(
        // unchanged
        new Chunk(
            "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
            "prerequisites",
            0,
            "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ..."),
        // edited text
        new Chunk(
            "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
            "step-2-enable-tls",
            0,
            "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ..."),
        // step-3 removed; new step-4 added
        new Chunk(
            "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
            "step-4-restrict-access",
            0,
            "Step 4: Restrict access with read-only API keys for untrusted clients ..."));
    // @block-end latest-chunks

    // @block-start changed-buckets
    static List<Integer> changedBuckets() throws Exception {
        List<Chunk> latest = prepare(LATEST);
        long[] source = computeDigests(latest); // digests of the edited source
        long[] stored = readMeta();             // digests Qdrant currently holds

        List<Integer> changed = new ArrayList<>();
        for (int b = 0; b < N_BUCKETS; b++) {
            if (source[b] != stored[b]) {
                changed.add(b);
            }
        }
        return changed;
    }
    // @block-end changed-buckets

    // @block-start read-bucket
    // Return a map of point ID to content hash for every chunk stored in bucket b.
    // Pages through the results so nothing is missed in a large bucket.
    static Map<String, String> readBucket(int b) throws Exception {
        Map<String, String> stored = new HashMap<>();
        PointId offset = null;

        while (true) {
            ScrollPoints.Builder request = ScrollPoints.newBuilder()
                .setCollectionName(MAIN)
                .setFilter(Filter.newBuilder().addMust(match("sync_bucket", b)).build())
                .setWithPayload(WithPayloadSelectorFactory.include(List.of("content_hash")))
                .setWithVectors(WithVectorsSelectorFactory.enable(false))
                .setLimit(1000);
            if (offset != null) {
                request.setOffset(offset);
            }

            ScrollResponse response = client.scrollAsync(request.build()).get();
            for (var point : response.getResultList()) {
                stored.put(
                    point.getId().getUuid(),
                    point.getPayloadMap().get("content_hash").getStringValue());
            }

            if (!response.hasNextPageOffset()) {
                return stored;
            }
            offset = response.getNextPageOffset();
        }
    }
    // @block-end read-bucket

    // @block-start reconcile-bucket
    // Make bucket b in Qdrant match sourceChunks. Returns {added, reEmbedded, deleted}.
    static int[] reconcileBucket(int b, Map<String, Chunk> sourceChunks) throws Exception {
        Map<String, String> stored = readBucket(b); // point ID -> content hash currently in Qdrant

        List<Chunk> toWrite = new ArrayList<>();    // new or content-changed chunks: embed and upsert
        int added = 0;
        int reEmbedded = 0;
        for (Map.Entry<String, Chunk> e : sourceChunks.entrySet()) {
            String storedHash = stored.get(e.getKey());
            if (storedHash == null) {
                toWrite.add(e.getValue());          // new chunk in this bucket
                added++;
            } else if (!storedHash.equals(e.getValue().contentHash)) {
                toWrite.add(e.getValue());          // same chunk, changed text
                reEmbedded++;
            }
        }

        List<PointId> toDelete = new ArrayList<>(); // chunks Qdrant has but the source no longer does
        for (String pid : stored.keySet()) {
            if (!sourceChunks.containsKey(pid)) {
                toDelete.add(id(UUID.fromString(pid)));
            }
        }

        if (!toWrite.isEmpty()) {
            client.upsertAsync(MAIN, asPoints(toWrite)).get();
        }
        if (!toDelete.isEmpty()) {
            client.deleteAsync(MAIN, toDelete).get();
        }

        return new int[] {added, reEmbedded, toDelete.size()};
    }
    // @block-end reconcile-bucket

    // @block-start sync
    static Map<String, Object> sync(List<Chunk> latestChunks) throws Exception {
        List<Chunk> latest = prepare(latestChunks);

        // group the source chunks by bucket once
        Map<Integer, Map<String, Chunk>> sourceByBucket = new LinkedHashMap<>();
        for (Chunk c : latest) {
            sourceByBucket
                .computeIfAbsent(bucket(c.pointId), key -> new LinkedHashMap<>())
                .put(c.pointId, c);
        }

        // steps 1-3: which buckets changed
        long[] source = computeDigests(latest);
        long[] stored = readMeta();
        List<Integer> changed = new ArrayList<>();
        for (int b = 0; b < N_BUCKETS; b++) {
            if (source[b] != stored[b]) {
                changed.add(b);
            }
        }

        // step 4: reconcile each changed bucket
        int added = 0;
        int reEmbedded = 0;
        int deleted = 0;
        for (int b : changed) {
            int[] counts = reconcileBucket(b, sourceByBucket.getOrDefault(b, Map.of()));
            added += counts[0];
            reEmbedded += counts[1];
            deleted += counts[2];
        }

        // step 5: rewrite only the changed groups of the summary, after the data writes
        Set<Integer> changedGroups = new LinkedHashSet<>();
        for (int b : changed) {
            changedGroups.add(b / GROUP_SIZE);
        }
        writeMeta(source, changedGroups);

        return Map.of(
            "changed_buckets", changed,
            "added", added,
            "re_embedded", reEmbedded,
            "deleted", deleted);
    }
    // @block-end sync

    // @block-start run-sync
    static void runSync() throws Exception {
        System.out.println(sync(LATEST));
    }
    // @block-end run-sync

    // @hide-start
    public static void run() throws Exception {
        printBuckets();
        computeDigests(prepare(CHUNKS));
        createCollection();
        populate();
        createSummaryCollection();
        writeMeta(computeDigests(prepare(CHUNKS)), null);
        readMeta();
        System.out.println(changedBuckets());
        readBucket(11);
        runSync();
        // @hide-end
    }
}
