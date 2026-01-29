---
title: "Video Anomaly Detection Part 2: Edge-to-Cloud Pipeline"
short_description: "Implement a two-shard Qdrant Edge architecture on NVIDIA Jetson with edge triage, ensemble scoring, and offline resilience."
description: "Part 2 of a 3-part series on building a real-time video anomaly detection system. Implement the two-shard Qdrant Edge architecture, edge triage scoring, escalation flow with ensemble scoring, temporal boosting, and offline resilience."
preview_dir: /articles_data/video-anomaly-edge/preview
social_preview_image: /articles_data/video-anomaly-edge/preview/social_preview.jpg
author: Thierry Damiba
draft: false
date: 2026-01-28T00:00:00.000Z
category: practical-examples
---

*This is Part 2 of a 3-part series on building real-time video anomaly detection from edge to cloud. In [Part 1](/articles/video-anomaly-edge/), we covered the architecture, Twelve Labs integration, and NVIDIA VSS. Now we build the edge-to-cloud pipeline.*

---

## Qdrant's Two-Shard Edge Architecture

This is the technical heart of the system. Edge devices need to serve kNN queries with minimal latency while continuously ingesting new clips.

**Learning Opportunity**: Why can't we just run a single Qdrant collection on the edge? Two reasons: (1) Building an HNSW index is expensive and blocks reads, and (2) you can't ship the entire cloud baseline to every edge device -it may contain hundreds of thousands of vectors.

### The Solution: Mutable + Immutable Shards

The edge collection uses two shards:

**Immutable shard** -A pre-built HNSW index synced from the cloud. Contains a representative subset of the normal baseline selected via k-means clustering (default: 500 centroids). This shard is read-only. It provides the core "what does normal look like?" reference.

**Mutable shard** -Receives live clip embeddings as they arrive. Unindexed (brute-force scan), optimized for fast writes. Contains recent clips from this specific camera site, capturing local context the cloud baseline may not include.

```python
class EdgeDetector:
    def __init__(self):
        self.client = QdrantClient(path="qdrant_edge_storage")
        self.mutable_shard = "mutable"
        self.immutable_shard = "immutable"
```

### Query Path

Every kNN query searches **both shards simultaneously**, merges results by score, and takes the top-k:

```python
async def score_clip(self, embedding: list[float], k: int = 3) -> float:
    # Query both shards
    mutable_results = self.client.search(
        collection_name=self.mutable_shard,
        query_vector=embedding, limit=k
    )
    immutable_results = self.client.search(
        collection_name=self.immutable_shard,
        query_vector=embedding, limit=k
    )
    # Merge and take top-k by score (descending = most similar)
    combined = sorted(
        mutable_results + immutable_results,
        key=lambda r: r.score, reverse=True
    )[:k]
    mean_sim = sum(r.score for r in combined) / len(combined)
    return 1.0 - mean_sim
```

This gives the edge device the best of both worlds: a high-quality global baseline (immutable shard) augmented with recent local context (mutable shard).

### Representative Subset Selection

The cloud baseline may contain 100,000+ normal vectors. The edge device only needs 500. We use MiniBatchKMeans to cluster the cloud embeddings and select the vector closest to each centroid:

```python
from sklearn.cluster import MiniBatchKMeans

kmeans = MiniBatchKMeans(n_clusters=500, batch_size=1000)
kmeans.fit(all_embeddings)
# For each cluster, find the embedding closest to the centroid
for i in range(500):
    cluster_mask = kmeans.labels_ == i
    cluster_embeddings = all_embeddings[cluster_mask]
    distances = np.linalg.norm(
        cluster_embeddings - kmeans.cluster_centers_[i], axis=1
    )
    representative_idx = np.argmin(distances)
    # Add this embedding to the edge collection
```

This preserves the baseline's coverage while fitting comfortably in edge device memory.

---

## Edge Triage: Why Imperfect Is the Point

**Learning Opportunity**: Not only is processing every frame in the cloud difficult, with limited bandwidth and high latency, but also costly! Let's prove it with some simple math.

How much would it cost to process 24 hours of continuous surveillance through the full cloud pipeline?

At 10-second clips, that's **8,640 clips per day per camera**. Running each through Twelve Labs Marengo embedding + Qdrant scoring + VLM captioning adds up quickly. For a fleet of 50 cameras, you're looking at 432,000 cloud API calls per day.

So how do we solve this? The answer lies in **edge triage**.

The edge embedding model (running as a DeepStream inference plugin on Jetson) produces lightweight spatial embeddings -roughly ~0.85 AUC-ROC compared to the cloud's 0.97. That is a significant accuracy gap. Edge embeddings capture spatial features but miss temporal dynamics entirely.

This is fine, because the edge is not trying to detect anomalies -it is trying to **not miss them**. The edge threshold (0.06) is set deliberately loose, optimizing for recall over precision:

- **Without edge triage**: Stream 100% of footage to the cloud. 360 clips/hour/camera through the full pipeline.
- **With edge triage**: Stream ~15% of footage. ~54 clips/hour/camera. A **~6x bandwidth reduction**.
- **Cost of false positives**: A false escalation costs one cloud API call. The cloud re-scores it, gets a low score, and drops it. No incident created.
- **Cost of false negatives**: A missed anomaly never reaches the cloud. At ~95% edge recall, roughly 1 in 20 anomalies is missed entirely.

The two-tier architecture only works *because* the edge is imperfect and the cloud cleans up after it. If the edge were perfect, you wouldn't need the cloud. If the edge were random, you wouldn't save any bandwidth. The sweet spot is a cheap, fast model with high recall and tolerable precision.

---

## Edge-to-Cloud Escalation

When an edge device scores a clip above the escalation threshold, it sends the clip to the cloud for re-analysis. Here's where Twelve Labs and Qdrant work together for the final verdict.

### Escalation Flow

1. **Edge detection**: DeepStream inference produces an embedding, Qdrant Edge kNN scores above `ESCALATION_THRESHOLD` (0.06)
2. **Queue**: Metropolis IoT Gateway queues the clip for secure cloud transport (persists across restarts)
3. **Upload**: Clip and edge metadata sent to cloud
4. **Cloud re-analysis**: Twelve Labs Marengo produces embeddings, kNN score in Qdrant Cloud + semantic signals
5. **VSS enrichment**: VLM captioning, audio transcription, CV pipeline (if enabled)
6. **Ensemble scoring**: 70% cloud score + 30% edge score
7. **Confirmation**: Final score compared against cloud threshold (0.038)

The escalation handler in our backend supports both Twelve Labs and local model server paths:

`/backend/escalation.py`

```python
async def handle_escalation(request: EscalationRequest) -> EscalationResult:
    cloud_embedding = None

    if request.clip_data:
        # Try Twelve Labs path first if enabled
        if twelvelabs_client.is_enabled():
            try:
                # Upload to Twelve Labs for indexing
                upload_result = twelvelabs_client.upload_video(
                    tmp_path, index_type="marengo"
                )
                video_id = upload_result.get("marengo_video_id")

                if video_id:
                    # Also ingest via VSS if enabled
                    if vss.is_enabled():
                        await vss.ingest_video(tmp_path)

                    # Get cloud embedding from Twelve Labs
                    embedding = twelvelabs_client.get_video_embedding(video_id)
                    if embedding:
                        cloud_embedding = embedding
            except Exception:
                pass  # Fall back to local model server

        # Fallback: local model server
        if cloud_embedding is None:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{MODEL_SERVER_URL}/embed",
                    files={"file": (request.clip_filename, request.clip_data)},
                )
                cloud_embedding = resp.json()["embedding"]

    # Score with cloud embedding against Qdrant baseline
    scoring_embedding = cloud_embedding or request.edge_embedding
    cloud_result = score_clip(
        embedding=scoring_embedding,
        collection_name=CLOUD_COLLECTION,
        k=CONFIRMATION_K,
    )

    # Ensemble scoring
    cloud_score = cloud_result.anomaly_score
    is_confirmed = cloud_score > ESCALATION_THRESHOLD
    return EscalationResult(
        cloud_score=cloud_score,
        is_confirmed_anomaly=is_confirmed,
        ...
    )
```

### Ensemble Scoring

The ensemble weighting reflects the accuracy differential between tiers:

```python
ensemble_score = (
    DEFAULT_CLOUD_WEIGHT * cloud_score +  # 0.7
    DEFAULT_EDGE_WEIGHT * edge_score       # 0.3
)
```

A low cloud score suppresses a high edge score (false positive). A high cloud score confirms a high edge score (true anomaly). This is why the cloud threshold (0.038) is lower than the edge threshold (0.06) -the cloud model is more accurate, so it can set a tighter decision boundary.

### Temporal Boosting

Consecutive escalations from the same device within a 5-minute window receive a score boost:

```python
boost = min(0.3, (consecutive_count - 1) * TEMPORAL_BOOST_FACTOR)  # Factor = 0.1
final_score = ensemble_score + boost
```

Three consecutive escalations add +0.2 to the score. This helps sustained events (like an ongoing altercation) cross the confirmation threshold even if individual clip scores are borderline.

### Offline Resilience

If the cloud is unreachable, escalation data is persisted to disk via SQLite-backed queues:

```python
async def escalate_to_cloud(clip_path, edge_embedding, edge_score):
    try:
        await httpx.post(CLOUD_URL + "/api/escalate", ...)
    except httpx.ConnectError:
        # Persist to offline queue for later flush
        queue_path = OFFLINE_QUEUE_DIR / f"{uuid4()}.json"
        queue_path.write_text(json.dumps({
            "clip_path": str(clip_path),
            "edge_score": edge_score,
            "edge_embedding": edge_embedding,
            "timestamp": time.time()
        }))
```

Pending escalations are flushed during the next baseline sync cycle.

---

## What's Next

In <span style="color: #888;">**Part 3: Scoring, Governance, and Deployment** (coming soon)</span>, we'll cover incident formation from raw scores, baseline governance to prevent poisoning, unified retrieval across cameras, evaluation results on UCF-Crime, and deployment on Vultr Cloud GPUs.

---

Check out the resources:

- **Project Repository**: [thierrydamiba/video-anomaly](https://github.com/thierrydamiba/video-anomaly)
- **Part 1**: [Architecture, Twelve Labs, and NVIDIA VSS](/articles/video-anomaly-edge/)
- **Twelve Labs Documentation**: [docs.twelvelabs.io](https://docs.twelvelabs.io/)
- **Qdrant Documentation**: [qdrant.tech/documentation](https://qdrant.tech/documentation/)
- **Vultr Cloud GPUs**: [vultr.com/products/cloud-gpu](https://www.vultr.com/products/cloud-gpu/)
