package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.hasId;
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.VectorOutputHelper;
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
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ScrollPoints;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

public class Snippet {

    // @block-start client-connection
    // Replace the host and API key with your own from https://cloud.qdrant.io
    static final QdrantClient client =
        new QdrantClient(
            QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                .withApiKey("<your-api-key>")
                .build());
    // @block-end client-connection

    // @hide-start
    // data and text normalization are not the lesson of this tutorial:
    // the full CHUNKS list and normalize() live in the tutorial notebook
    static class Chunk {
        String url;
        String anchor;
        int chunkNum;
        String text;
        String sectionUrl;  // derived in prepareChunksForSync
        String contentHash; // derived in prepareChunksForSync
        String pointId;     // derived in prepareChunksForSync

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
            "Prerequisites - Docker and Docker Compose installed - `curl` available in your terminal ..."),
        new Chunk(
            "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
            "step-3-enable-an-admin-api-key",
            0,
            "Step 3: Enable an Admin API Key Without enabling authentication, anyone with network access ..."));

    static String normalize(String text) {
        return text.replaceAll("\\s+", " ").strip();
    }
    // @hide-end

    // @block-start create-collection
    static final String MODEL = "sentence-transformers/all-MiniLM-L6-v2";
    static final String PIPELINE = "docs-prep-pipeline-v1";
    static final String COLLECTION = "docs-sync-tutorial";

    static void createCollection() throws Exception {
        client.createCollectionAsync(
            CreateCollection.newBuilder()
                .setCollectionName(COLLECTION)
                .setVectorsConfig(
                    VectorsConfig.newBuilder()
                        .setParams(
                            VectorParams.newBuilder()
                                .setSize(384) // all-MiniLM-L6-v2 output dimension
                                .setDistance(Distance.Cosine)
                                .build())
                        .build())
                .putAllMetadata(
                    Map.of(
                        "embedding_model", value(MODEL),
                        "pipeline_version", value(PIPELINE)))
                .build()).get();
    }
    // @block-end create-collection

    // @block-start check-gate
    static void checkGate() throws Exception {
        // compare this pipeline's constants against what the collection records about itself
        Map<String, Value> meta =
            client.getCollectionInfoAsync(COLLECTION).get().getConfig().getMetadataMap();

        Value model = meta.get("embedding_model");
        Value pipeline = meta.get("pipeline_version");
        if (model == null || !MODEL.equals(model.getStringValue())
                || pipeline == null || !PIPELINE.equals(pipeline.getStringValue())) {
            throw new RuntimeException(
                "collection was built by " + meta + ": full re-embed into a fresh collection required");
        }
    }
    // @block-end check-gate

    // @block-start identity-and-fingerprint
    static String contentHash(String text) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256")
            .digest(text.getBytes(StandardCharsets.UTF_8));
        return String.format("%064x", new BigInteger(1, digest));
    }

    static String pointId(String url, String anchor, int num) {
        // name-based UUID (version 3); the same address always yields the same ID
        return UUID.nameUUIDFromBytes(
            (url + "#" + anchor + "::" + num).getBytes(StandardCharsets.UTF_8)).toString();
    }

    // Derive both values (and the section address) for every raw chunk.
    static List<Chunk> prepareChunksForSync(List<Chunk> chunks) throws Exception {
        List<Chunk> out = new ArrayList<>();
        for (Chunk c : chunks) {
            String text = normalize(c.text);
            Chunk prepared = new Chunk(c.url, c.anchor, c.chunkNum, text);
            prepared.sectionUrl = !c.anchor.isEmpty() ? c.url + "#" + c.anchor : c.url;
            prepared.contentHash = contentHash(text);
            prepared.pointId = pointId(c.url, c.anchor, c.chunkNum);
            out.add(prepared);
        }
        return out;
    }
    // @block-end identity-and-fingerprint

    // @block-start payload
    static Map<String, Value> payload(Chunk chunk, String lastUpdated) {
        Map<String, Value> p = new HashMap<>();
        p.put("url", value(chunk.url));
        p.put("anchor", value(chunk.anchor));
        p.put("chunk_num", value(chunk.chunkNum));
        p.put("section_url", value(chunk.sectionUrl));
        p.put("text", value(chunk.text));
        p.put("content_hash", value(chunk.contentHash));
        p.put("last_updated", value(lastUpdated != null
            ? lastUpdated
            : OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS).toString()));
        return p;
    }
    // @block-end payload

    // @block-start payload-indexes
    static void createPayloadIndexes() throws Exception {
        for (String field : List.of("content_hash", "url", "section_url")) {
            client.createPayloadIndexAsync(
                COLLECTION, field, PayloadSchemaType.Keyword, null, null, null, null).get();
        }
    }
    // @block-end payload-indexes

    // @block-start populate
    static void populate() throws Exception {
        List<PointStruct> points = new ArrayList<>();
        for (Chunk c : prepareChunksForSync(CHUNKS)) {
            points.add(
                PointStruct.newBuilder()
                    .setId(id(UUID.fromString(c.pointId)))

                    .setVectors(
                        vectors(
                            vector(
                                Document.newBuilder()
                                    .setText(c.text)
                                    .setModel(MODEL)
                                    .build())))
                    .putAllPayload(payload(c, null))
                    .build());
        }
        client.upsertAsync(COLLECTION, points).get();
    }
    // @block-end populate

    // @block-start search
    static final String QUERY =
        "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?";

    static void search() throws Exception {
        client.queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName(COLLECTION)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText(QUERY)
                            .setModel(MODEL)
                            .build()))
                .setLimit(3)
                .setWithPayload(WithPayloadSelectorFactory.include(List.of("section_url", "text")))
                .build()).get();
    }
    // @block-end search

    // @hide-start
    // the simulated month of edits (LATEST_CHUNKS) is spelled out in the tutorial and the notebook
    static List<Chunk> LATEST_CHUNKS;
    // @hide-end

    // @block-start split-by-state
    static class SyncState {
        Map<String, Chunk> incoming = new LinkedHashMap<>();
        List<Chunk> unchanged = new ArrayList<>();
        List<Chunk> contentChanged = new ArrayList<>();
        List<Chunk> unknownIds = new ArrayList<>();
    }

    // Compare the incoming chunk list to the collection: who is unchanged, changed, or unknown.
    static SyncState splitByState(List<Chunk> latestChunks) throws Exception {
        SyncState state = new SyncState();
        for (Chunk c : latestChunks) {
            state.incoming.put(c.pointId, c);
        }

        Map<String, String> stored = new HashMap<>();
        var points = client.retrieveAsync(
            COLLECTION,
            state.incoming.keySet().stream()
                .map(pid -> id(UUID.fromString(pid)))
                .collect(Collectors.toList()),
            WithPayloadSelectorFactory.include(List.of("content_hash")),
            WithVectorsSelectorFactory.enable(false),
            null).get();
        for (var p : points) {
            stored.put(p.getId().getUuid(), p.getPayloadMap().get("content_hash").getStringValue());
        }

        for (Map.Entry<String, Chunk> e : state.incoming.entrySet()) {
            String pid = e.getKey();
            Chunk c = e.getValue();
            if (c.contentHash.equals(stored.get(pid))) {
                state.unchanged.add(c);
            } else if (stored.containsKey(pid)) {
                state.contentChanged.add(c);
            } else {
                state.unknownIds.add(c);
            }
        }

        return state;
    }
    // @block-end split-by-state

    // @block-start re-embed-changed
    static void reEmbedChanged(List<Chunk> contentChanged) throws Exception {
        if (contentChanged.isEmpty()) {
            return;
        }
        List<PointStruct> points = new ArrayList<>();
        for (Chunk c : contentChanged) {
            points.add(
                PointStruct.newBuilder()
                    .setId(id(UUID.fromString(c.pointId)))
                    .setVectors(
                        vectors(
                            vector(
                                Document.newBuilder()
                                    .setText(c.text)
                                    .setModel(MODEL)
                                    .build())))
                    .putAllPayload(payload(c, null))
                    .build());
        }
        client.upsertAsync(COLLECTION, points).get();
    }
    // @block-end re-embed-changed

    // @block-start reuse-or-add
    // Reuse an existing embedding when the same text is already stored; embed only what is new.
    static int[] reuseOrAdd(List<Chunk> unknownIds) throws Exception {
        int reused = 0;
        int added = 0;

        for (Chunk c : unknownIds) {
            Filter sameText = Filter.newBuilder()
                .addMust(matchKeyword("content_hash", c.contentHash))
                .build();

            var hits = client.scrollAsync(
                ScrollPoints.newBuilder()
                    .setCollectionName(COLLECTION)
                    .setFilter(sameText)
                    .setLimit(1)
                    .setWithPayload(WithPayloadSelectorFactory.include(List.of("last_updated")))
                    .setWithVectors(WithVectorsSelectorFactory.enable(true))
                    .build()).get().getResultList();

            PointStruct point;
            if (!hits.isEmpty()) { // same text, new address: copy the vector, keep its last_updated
                point = PointStruct.newBuilder()
                    .setId(id(UUID.fromString(c.pointId)))
                    .setVectors(vectors(vector(
                        VectorOutputHelper.getDenseVector(hits.get(0).getVectors().getVector())
                            .getDataList())))
                    .putAllPayload(
                        payload(c, hits.get(0).getPayloadMap().get("last_updated").getStringValue()))
                    .build();
                reused++;
            } else { // genuinely new content: embed and insert
                point = PointStruct.newBuilder()
                    .setId(id(UUID.fromString(c.pointId)))
                    .setVectors(
                        vectors(
                            vector(
                                Document.newBuilder()
                                    .setText(c.text)
                                    .setModel(MODEL)
                                    .build())))
                    .putAllPayload(payload(c, null))
                    .build();
                added++;
            }

            client.upsertAsync(COLLECTION, List.of(point)).get();
        }

        return new int[] {reused, added};
    }
    // @block-end reuse-or-add

    // @block-start delete-gone
    // Remove every point the current crawl no longer contains. Returns how many.
    static long deleteGone(Map<String, Chunk> incomingIds) throws Exception {
        if (incomingIds.isEmpty()) {
            throw new IllegalArgumentException("Refusing to delete from an empty source snapshot.");
        }

        Filter stale = Filter.newBuilder()
            .addMustNot(hasId(
                incomingIds.keySet().stream()
                    .map(pid -> id(UUID.fromString(pid)))
                    .collect(Collectors.toList())))
            .build();

        long toDelete = client.countAsync(COLLECTION, stale, true).get();

        // potential check against a threshold to avoid accidental mass deletion could be added here
        client.deleteAsync(COLLECTION, stale).get();
        return toDelete;
    }
    // @block-end delete-gone

    // @block-start sync
    static Map<String, Long> sync(List<Chunk> latestChunks) throws Exception {
        checkGate(); // refuse to mix embedding models or pipeline versions

        List<Chunk> chunks = prepareChunksForSync(latestChunks);
        SyncState state = splitByState(chunks);

        reEmbedChanged(state.contentChanged);
        int[] reusedAdded = reuseOrAdd(state.unknownIds); // {reused, added}
        long deleted = deleteGone(state.incoming);

        return Map.of(
            "unchanged", (long) state.unchanged.size(),
            "re-embedded", (long) state.contentChanged.size(),
            "reused_embedding", (long) reusedAdded[0],
            "added", (long) reusedAdded[1],
            "deleted", deleted);
    }
    // @block-end sync

    // @block-start run-sync
    static void runSync() throws Exception {
        Map<String, Long> run = sync(LATEST_CHUNKS);
        System.out.println(run);
    }
    // @block-end run-sync

    // @hide-start
    public static void run() throws Exception {
        createCollection();
        createPayloadIndexes();
        populate();
        search();

        LATEST_CHUNKS = prepareChunksForSync(CHUNKS);
        SyncState state = splitByState(LATEST_CHUNKS);

        runSync();
        // @hide-end
    }
}
