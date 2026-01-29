---
title: "Real-Time Video Anomaly Detection from Edge to Cloud with Qdrant, Twelve Labs, and Vultr"
short_description: "Build a kNN-based video anomaly detection system using Qdrant vector search, Twelve Labs embeddings, and a two-shard edge architecture on NVIDIA Jetson."
description: "Learn how to build a real-time video anomaly detection system that monitors live surveillance cameras across multiple sites, automatically detecting unusual events without training on specific anomaly types. Combines Qdrant vector search, Twelve Labs Marengo and Pegasus, NVIDIA Metropolis VSS, and Vultr Cloud GPUs in an edge-to-cloud pipeline."
preview_dir: /articles_data/video-anomaly-edge/preview
social_preview_image: /articles_data/video-anomaly-edge/preview/social_preview.jpg
author: Thierry Damiba
draft: false
date: 2026-01-28T00:00:00.000Z
category: practical-examples
---

In this tutorial, you will learn how to build a real-time video anomaly detection system that monitors live surveillance cameras across multiple sites, automatically detecting unusual events without training on specific anomaly types. You'll see how Twelve Labs integrates with NVIDIA Metropolis VSS and Qdrant vector search to create a production-grade edge-to-cloud detection pipeline deployed on Vultr Cloud GPUs.

## Introduction

What if your surveillance cameras could autonomously detect any type of anomaly -- fights, accidents, intrusions, equipment failures -- without ever being trained on those specific events? What if instead of manually reviewing hours of footage, operators received instant alerts with severity scores, incident timelines, and natural-language explanations of what happened?

This might sound ambitious, but it's what we've built to showcase how **Twelve Labs** video intelligence, **Qdrant** vector search, **NVIDIA Metropolis**, and **Vultr Cloud GPUs** come together to solve a problem that traditional classifiers fundamentally cannot: detecting anomalies you've never seen before.

The key insight is deceptively simple. Instead of asking "is this a fight?" or "is this a robbery?", we ask "how different is this from what we normally see?" That reframes anomaly detection as a **nearest-neighbor search problem** -- and that is where Qdrant comes in.

Today you'll learn how this is all possible by not only deploying the application in this step-by-step guide, but also learning the in-depth technical architecture. Specifically, you will build a platform that transforms live surveillance streams into:

**Anomaly Detection**: Automatically scored clips using kNN distance from a normal baseline in Qdrant -- no anomaly labels required.

**Incident Reports**: Multi-signal incident formation using Twelve Labs embeddings, VLM captions, and audio transcription from NVIDIA VSS.

**Semantic Video Search**: Natural-language queries across all cameras and time periods -- "find clips similar to this incident" or "show me unusual activity at the north entrance last week."

**Interactive Q&A**: Ask questions about detected events and get answers grounded in actual video content via Twelve Labs Pegasus.

**Edge-to-Cloud Escalation**: Lightweight edge triage on NVIDIA Jetson reduces cloud processing volume by ~6x while catching ~95% of true anomalies.

*Note: The concepts and technology here stretch far beyond surveillance. If you're interested in applying this architecture to manufacturing safety, retail analytics, or traffic monitoring, the same stack applies -- swap the baseline data and the detection threshold, and you're operational in a new domain.*

---

## Application Demo

Before we begin coding, check out the project repository and live demo to get familiarized with what we'll be building.

**GitHub**: [thierrydamiba/video-anomaly](https://github.com/thierrydamiba/video-anomaly)

**Live Demo**: [avenue-demo.vercel.app](https://avenue-demo.vercel.app/)

With that in mind, let's get started!

---

## Learning Objectives

In this tutorial you will:

- **Build a kNN anomaly detector** using Qdrant vector search that detects novel anomaly types without per-category training.

- **Integrate Twelve Labs Marengo** for video embeddings that serve dual duty: kNN anomaly scoring *and* semantic understanding in a single model.

- **Deploy NVIDIA Metropolis VSS** on Vultr Cloud GPUs for orchestrated video ingestion -- embeddings, VLM captioning, audio transcription, and CV pipeline.

- **Implement a two-shard Qdrant Edge architecture** on NVIDIA Jetson for sub-millisecond kNN lookups with live baseline updates.

- **Build an edge-to-cloud escalation pipeline** with ensemble scoring, temporal boosting, and offline resilience.

- **Understand baseline governance** including quarantine, scrubbing, and poisoning prevention to maintain detection quality over time.

---

## Prerequisites

- **Python 3.12+**: [Download Python](https://python.org/downloads/)
- **Node.js 20+**: [Download Node.js](https://nodejs.org/)
- **uv** (Python package manager): [Install uv](https://docs.astral.sh/uv/)
- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Twelve Labs API Key**: [Authentication](https://docs.twelvelabs.io/docs/authentication)
- **Qdrant Cloud Account** (or local instance): [Qdrant Cloud](https://cloud.qdrant.io/)
- **Vultr Account** (for GPU instances): [Vultr Cloud GPUs](https://www.vultr.com/products/cloud-gpu/)
- **FFmpeg**: Required for video chunking
- Intermediate understanding of Python, vector databases, and REST APIs.

---

## Local Environment Setup

**1** -- Clone the repository into your local environment.

```bash
git clone https://github.com/thierrydamiba/video-anomaly
cd video-anomaly
```

**2** -- Install dependencies with uv.

```bash
uv sync
```

**3** -- Add environment variables.

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=<your-qdrant-api-key>

# Twelve Labs (cloud video understanding)
TWELVE_LABS_API_KEY=<your-twelve-labs-api-key>
TWELVE_LABS_API_URL=https://api.twelvelabs.io/v1.3
TWELVE_LABS_MARENGO_INDEX_NAME=anomaly-marengo-search
TWELVE_LABS_PEGASUS_INDEX_NAME=anomaly-pegasus-summary
TWELVE_LABS_MARENGO_MODEL=marengo2.7
TWELVE_LABS_PEGASUS_MODEL=pegasus1.2

# NVIDIA VSS
NVIDIA_VSS_BASE_URL=http://localhost:8080
VSS_ENABLED=false

# Model
MODEL_NAME=MCG-NJU/videomae-base
MODEL_SERVER_URL=http://localhost:9877
ANOMALY_THRESHOLD=0.15
```

**4** -- Clone the NVIDIA VSS framework (with Twelve Labs integration) for reference.

```bash
git clone https://github.com/james-le-twelve-labs/nvidia-vss
git clone https://github.com/nathanchess/twelvelabs-nvidia-vss-sample
```

**5** -- Start the full stack with Docker Compose.

```bash
# Core services (backend, Qdrant, frontend)
docker compose up

# With NVIDIA VSS (requires GPU)
docker compose -f docker-compose.yml -f docker-compose.vss.yml up
```

**6** -- Navigate to `localhost:4321` to access the dashboard.

---

## Why kNN Beats Classifiers for Anomaly Detection

**Learning Opportunity**: Before jumping into the code, it's important to understand *why* we use kNN vector search instead of a traditional classifier for anomaly detection.

Binary classifiers require labeled examples of every anomaly type you want to detect. This creates three fundamental problems:

**Open-world coverage** -- You cannot enumerate every possible anomaly in advance. A classifier trained on UCF-Crime's 13 categories will score 0.0 on a forklift collision or a pipe burst. The space of things that *can* go wrong is unbounded.

**Label noise** -- Surveillance footage is ambiguous. Is a person running an anomaly? Depends entirely on context. kNN sidesteps this by only requiring labels for *normal* behavior.

**Concept drift** -- What counts as "normal" changes over time. A school hallway looks different during class hours versus recess. kNN baselines can be updated continuously without retraining.

The kNN approach is elegantly simple. Embed video clips into a vector space, build a baseline of normal embeddings in Qdrant, and flag clips whose nearest neighbors are far away:

```
anomaly_score = 1 - mean(top_k_cosine_similarities)
```

A clip surrounded by similar normal clips scores near 0. A clip far from anything in the baseline scores near 1. No training loop, no class labels for anomalies, no catastrophic forgetting.

Let's prove why this matters with some numbers. We tested CLIP ViT-B/32 (512-dim, single-frame image embeddings) as an alternative and it scored **0.23 AUC-ROC** -- near random. The failure is instructive. Surveillance anomalies are defined by *temporal* patterns: a person running, a fight developing, a car crash unfolding. Single-frame embeddings cannot distinguish "person standing" from "person falling" because the anomaly exists *between* frames, not within them.

| Model | AUC-ROC | Notes |
|-------|---------|-------|
| Twelve Labs Marengo (cloud) | 0.9696 | Video-native, captures temporal dynamics |
| EfficientNet-B0 (edge) | ~0.85 | Spatial features only, high-recall triage |
| CLIP ViT-B/32 | 0.23 | Single-frame, no temporal context, fails |

This is why we use Twelve Labs Marengo in the cloud -- it's purpose-built for video understanding, processing temporal dynamics, object interactions, and scene context as a unified signal.

---

## Architecture Overview

The system uses a three-tier architecture designed around a simple principle: **cheap, fast triage at the edge; accurate, rich analysis in the cloud.**

```
┌──────────────────────────────────────────────────────────────────┐
│                           Dashboard                               │
│                 Next.js + WebSocket (port 4321)                   │
└──────────────────┬──────────────────────────────┬────────────────┘
                   │                              │
                   ▼                              ▼
┌──────────────────────────────────┐   ┌──────────────────────────────┐
│    Cloud Tier (Vultr GPUs)       │   │   Edge Tier (NVIDIA Jetson)   │
│                                  │   │                               │
│  NVIDIA Metropolis VSS           │   │  NVIDIA Metropolis            │
│  ├─ Twelve Labs Marengo          │   │  ├─ DeepStream (HW decode     │
│  │   (embeddings + understanding)│   │  │   + inference pipeline)    │
│  ├─ VLM captioning               │   │  ├─ Video Storage Toolkit     │
│  ├─ Audio transcription          │   │  └─ IoT Gateway (escalation)  │
│  └─ CV pipeline                  │   │                               │
│                                  │   │  Qdrant Edge (two-shard)      │
│  Qdrant Cloud                    │   │  ├─ Mutable (live writes)     │
│  (unified vector + payload)      │   │  └─ Immutable (synced HNSW)   │
│  Incident management             │   │                               │
│  Baseline governance             │   │  High-recall triage:          │
│                                  │   │  score → escalate or drop     │
└──────────────────────────────────┘   └──────────────────────────────┘
              ▲                                    │
              │       only escalated clips         │
              └────────────────────────────────────┘
```

Let me briefly explain each piece of technology:

**Edge tier**: Each camera site runs [NVIDIA Metropolis on Jetson](https://developer.nvidia.com/blog/announcing-metropolis-microservices-on-nvidia-jetson-orin-for-rapid-edge-ai-development) -- hardware-accelerated video decode and inference via DeepStream, camera management via the Video Storage Toolkit, and secure cloud transport via the IoT Gateway. **Qdrant Edge** sits alongside Metropolis, storing a two-shard local baseline for sub-millisecond kNN lookups. The edge operates as a **high-recall triage filter** -- its job is not to make the final anomaly decision but to reduce the volume of footage that reaches the cloud.

**Cloud tier**: Escalated clips flow into **NVIDIA Metropolis VSS** running on **Vultr Cloud GPUs**. [**Twelve Labs Marengo**](https://www.twelvelabs.io/) produces video embeddings for kNN anomaly scoring in Qdrant *and* rich semantic signals for incident understanding, search, and Q&A -- one model, both jobs. A centralized **Qdrant cluster** indexes all representations. Ensemble scoring (70% cloud, 30% edge), temporal smoothing, and incident formation happen here.

**Dashboard**: Next.js frontend with real-time WebSocket updates showing incidents, device status, and anomaly score timelines.

---

## Building the Twelve Labs Integration

So how do we get video embeddings that actually understand temporal dynamics? This is where Twelve Labs comes in.

**Learning Opportunity**: Twelve Labs provides two key models for our architecture. **Marengo** handles embeddings and search -- it understands *what happened* in a video at the visual and audio level. **Pegasus** handles conversational analysis -- you can ask questions about a video and get detailed, grounded answers. Together, they cover both the kNN scoring pipeline and the investigative Q&A workflow.

Let's look at how we integrate them into our backend.

### Twelve Labs Client

`/backend/twelvelabs_client.py`

```python
from twelvelabs import TwelveLabs

TWELVE_LABS_API_KEY = os.getenv("TWELVE_LABS_API_KEY", "")
MARENGO_MODEL = os.getenv("TWELVE_LABS_MARENGO_MODEL", "marengo2.7")
PEGASUS_MODEL = os.getenv("TWELVE_LABS_PEGASUS_MODEL", "pegasus1.2")

_client: Optional[TwelveLabs] = None

def get_client() -> TwelveLabs:
    global _client
    if _client is None:
        if not TWELVE_LABS_API_KEY:
            raise RuntimeError("TWELVE_LABS_API_KEY not set")
        _client = TwelveLabs(api_key=TWELVE_LABS_API_KEY)
    return _client
```

We use a singleton pattern for the client -- initialized once, reused across all requests. The two models need separate indexes in Twelve Labs:

```python
def _ensure_index(index_name: str, models: list[dict]) -> str:
    """Get or create a Twelve Labs index, return its ID."""
    client = get_client()
    indexes = client.index.list()
    for idx in indexes:
        if idx.name == index_name:
            return idx.id
    idx = client.index.create(name=index_name, models=models)
    return idx.id
```

### Upload and Embed

When an escalated clip arrives from the edge, we upload it to Twelve Labs for indexing:

```python
def upload_video(file_path: str | Path, index_type: str = "both") -> dict:
    client = get_client()
    result = {}

    if index_type in ("marengo", "both"):
        idx_id = get_marengo_index_id()
        task = client.task.create(index_id=idx_id, file=str(file_path))
        task.wait_for_done(timeout=UPLOAD_TIMEOUT)
        if task.status == "ready":
            result["marengo_video_id"] = task.video_id

    if index_type in ("pegasus", "both"):
        idx_id = get_pegasus_index_id()
        task = client.task.create(index_id=idx_id, file=str(file_path))
        task.wait_for_done(timeout=UPLOAD_TIMEOUT)
        if task.status == "ready":
            result["pegasus_video_id"] = task.video_id

    return result
```

*Notice*: Uploading to Twelve Labs handles all the heavy lifting -- chunking, embedding, indexing -- in a single API call. No local GPU required for the cloud tier.

### Semantic Search with Marengo

Once videos are indexed, semantic search becomes trivial:

```python
def search_videos(query: str, max_clips: int = 10) -> list[SearchResult]:
    client = get_client()
    idx_id = get_marengo_index_id()

    search_results = client.search.query(
        index_id=idx_id,
        search_options=["visual", "audio"],
        query_text=query,
        group_by="clip",
        threshold="medium",
        page_limit=max_clips,
        sort_option="score",
    )

    results = []
    for group in search_results.data:
        for clip in group.clips:
            results.append(SearchResult(
                video_id=clip.video_id,
                score=clip.score,
                start=clip.start,
                end=clip.end,
                confidence=clip.confidence,
            ))
    return results
```

This powers the investigative workflow: after an anomaly is detected via kNN, operators can search for similar events using natural language. "Person running near the loading dock" or "vehicle collision in parking lot" -- Marengo understands both visual and audio signals.

### Video Q&A with Pegasus

For deeper investigation, Pegasus provides conversational analysis of any indexed video:

```python
def analyze_video(video_id: str, prompt: str) -> AnalysisResult:
    client = get_client()
    t0 = time.perf_counter()

    response = client.generate.text(
        video_id=video_id,
        prompt=prompt,
        temperature=0.2,
    )

    latency_ms = (time.perf_counter() - t0) * 1000
    return AnalysisResult(
        text=response.data if hasattr(response, "data") else str(response),
        video_id=video_id,
        latency_ms=latency_ms,
    )
```

Factory owners, security teams, or compliance officers can ask questions like "What safety violations are visible in this clip?" or "Describe the sequence of events leading up to the incident" and get detailed, video-grounded answers immediately.

---

## Connecting with NVIDIA VSS

**Learning Opportunity**: Before jumping into the code, it's important to understand what NVIDIA VSS even is and the tools it provides.

VSS stands for **Video Search and Summarization**. It is an [NVIDIA AI Blueprint](https://blogs.nvidia.com/blog/ai-blueprint-video-search-and-summarization/) giving developers a quick way to deploy powerful AI agents that can understand, search, and summarize video content. It provides:

- **Vision Language Models (VLMs)**: Feed video frames into VLMs that generate rich text descriptions of each video chunk.
- **Large Language Models (LLMs)**: Text descriptions from the VLM are fed to an LLM for summarization and natural-language Q&A.
- **Retrieval-Augmented Generation (RAG)**: VSS stores generated descriptions in a vector/graph database. Questions retrieve the most relevant chunks first, leading to grounded answers.
- **GPU-Accelerated Ingestion**: High-performance pipeline for pulling in video from files or live RTSP streams, decoding, and preparing for AI models.
- **CV Pipeline Integration**: Works with object detection models like YOLO or NVIDIA DeepStream SDK for adding metadata.
- **Audio Transcription**: Processes audio tracks for speech-to-text, adding another searchable layer.

This NVIDIA VSS blueprint is incredibly powerful, but it's also a lot to build, deploy, and manage. This is precisely where Twelve Labs provides a massive accelerator -- abstracting away the VLM, audio, and reasoning complexity into a single API.

The true value is in **modularity**. Our architecture uses the Twelve Labs integration within VSS, creating a hybrid workflow where Twelve Labs handles the intelligence and VSS handles the orchestration.

### Video Chunking for VSS

The first step in the VSS pipeline is chunking. Following the pattern from the [Twelve Labs x NVIDIA VSS manufacturing sample](https://github.com/nathanchess/twelvelabs-nvidia-vss-sample), we split videos using FFmpeg's segment muxer:

`/backend/vss.py`

```python
def chunk_video(
    input_path: str | Path,
    output_dir: str | Path,
    chunk_duration_s: float | None = None,
) -> list[Path]:
    """Split a video into chunks using FFmpeg segment muxer."""
    input_path = Path(input_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Get video duration via ffprobe
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(input_path)],
        capture_output=True, text=True,
    )
    duration = float(probe.stdout.strip()) if probe.stdout.strip() else 60.0

    if chunk_duration_s is None:
        if duration < 60:
            chunk_duration_s = duration  # Don't chunk short videos
        else:
            chunk_duration_s = duration / 30  # ~30 chunks

    pattern = output_dir / f"{input_path.stem}_chunk_%04d.mp4"

    subprocess.run(
        ["ffmpeg", "-y", "-i", str(input_path),
         "-c", "copy", "-map", "0",
         "-segment_time", str(chunk_duration_s),
         "-f", "segment", "-reset_timestamps", "1",
         str(pattern)],
        capture_output=True,
    )

    return sorted(output_dir.glob(f"{input_path.stem}_chunk_*.mp4"))
```

**Learning Opportunity**: Why chunk at all? The same cost issue from the [manufacturing automation tutorial](https://www.twelvelabs.io/blog/manufacturing-automation) applies here. Processing 24 hours of raw video is expensive. Our edge tier already filters ~85% of footage, and chunking the remaining escalated clips further optimizes the cloud pipeline. Only chunks of interest flow through the full VSS stack.

### Async Upload to VSS

Chunks are uploaded to VSS in parallel using async I/O:

```python
async def upload_to_vss(file_path: str | Path) -> Optional[str]:
    """Upload a single video file to NVIDIA VSS."""
    file_path = Path(file_path)

    timeout = aiohttp.ClientTimeout(total=VSS_UPLOAD_TIMEOUT)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        data = aiohttp.FormData()
        data.add_field("file", open(file_path, "rb"),
                       filename=file_path.name, content_type="video/mp4")
        data.add_field("purpose", "vision")
        data.add_field("media_type", "video")

        async with session.post(f"{NVIDIA_VSS_BASE_URL}/files", data=data) as resp:
            if resp.status == 200:
                body = await resp.json()
                return body.get("id")
            return None


async def upload_chunks_to_vss(chunk_paths: list[Path]) -> list[str]:
    """Upload multiple chunks to VSS in parallel."""
    tasks = [upload_to_vss(p) for p in chunk_paths]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r for r in results if isinstance(r, str)]
```

The full ingestion pipeline ties it together -- chunk, upload, return results:

```python
async def ingest_video(file_path: str | Path) -> dict:
    """Full VSS ingestion pipeline: chunk video, upload all chunks."""
    if not is_enabled():
        return {"status": "disabled", "message": "VSS_ENABLED is false"}

    with tempfile.TemporaryDirectory(prefix="vss_chunks_") as tmp_dir:
        chunks = chunk_video(file_path, tmp_dir)
        file_ids = await upload_chunks_to_vss(chunks)

    return {
        "status": "ok",
        "total_chunks": len(chunks),
        "uploaded_chunks": len(file_ids),
        "vss_file_ids": file_ids,
    }
```

### Docker Compose for VSS

To deploy VSS alongside the core services, we provide an overlay compose file:

`/docker-compose.vss.yml`

```yaml
## docker compose -f docker-compose.yml -f docker-compose.vss.yml up
services:
  vss-server:
    image: nvcr.io/nvidia/metropolis/vss:1.0
    ports:
      - "8080:8080"
    environment:
      TWELVE_LABS_API_KEY: ${TWELVE_LABS_API_KEY}
      VLM_MODEL_TO_USE: twelve-labs
      DISABLE_CV_PIPELINE: "true"
      DISABLE_CA_RAG: "true"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  backend:
    environment:
      VSS_ENABLED: "true"
      NVIDIA_VSS_BASE_URL: http://vss-server:8080
    depends_on:
      - vss-server
```

*Note*: Setting `VLM_MODEL_TO_USE: twelve-labs` tells VSS to use the Twelve Labs remote deployment instead of running a local VLM. This eliminates the need for a dedicated VLM GPU -- Twelve Labs handles the intelligence via API, while VSS handles the orchestration pipeline.

---

## Qdrant's Two-Shard Edge Architecture

This is the technical heart of the system. Edge devices need to serve kNN queries with minimal latency while continuously ingesting new clips.

**Learning Opportunity**: Why can't we just run a single Qdrant collection on the edge? Two reasons: (1) Building an HNSW index is expensive and blocks reads, and (2) you can't ship the entire cloud baseline to every edge device -- it may contain hundreds of thousands of vectors.

### The Solution: Mutable + Immutable Shards

The edge collection uses two shards:

**Immutable shard** -- A pre-built HNSW index synced from the cloud. Contains a representative subset of the normal baseline selected via k-means clustering (default: 500 centroids). This shard is read-only. It provides the core "what does normal look like?" reference.

**Mutable shard** -- Receives live clip embeddings as they arrive. Unindexed (brute-force scan), optimized for fast writes. Contains recent clips from this specific camera site, capturing local context the cloud baseline may not include.

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

The edge embedding model (running as a DeepStream inference plugin on Jetson) produces lightweight spatial embeddings -- roughly ~0.85 AUC-ROC compared to the cloud's 0.97. That is a significant accuracy gap. Edge embeddings capture spatial features but miss temporal dynamics entirely.

This is fine, because the edge is not trying to detect anomalies -- it is trying to **not miss them**. The edge threshold (0.06) is set deliberately loose, optimizing for recall over precision:

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

A low cloud score suppresses a high edge score (false positive). A high cloud score confirms a high edge score (true anomaly). This is why the cloud threshold (0.038) is lower than the edge threshold (0.06) -- the cloud model is more accurate, so it can set a tighter decision boundary.

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

## Anomaly Scoring and Incident Formation

Raw kNN scores are noisy. A single unusual frame does not constitute an incident. The scoring pipeline applies three layers of processing.

### 1. Temporal Smoothing

An exponential moving average (EMA) dampens score jitter:

```python
smoothed = alpha * raw_score + (1 - alpha) * prev_smoothed  # alpha = 0.3
```

### 2. Hysteresis Thresholding

Two thresholds prevent flickering between "incident" and "normal" states:

- **t_high = 0.045**: Smoothed score must exceed this to *start* an incident
- **t_low = 0.025**: Score must drop below this to *end* an incident

### 3. Incident Formation

Contiguous windows above threshold are grouped into incidents:

```python
@dataclass
class Incident:
    incident_id: str
    start_time: float
    end_time: float
    peak_score: float         # Maximum smoothed score
    mean_score: float         # Average smoothed score
    severity: int             # 0-100 scale
    window_count: int         # Number of clips in incident
    duration_ms: int          # End - start
```

Incidents within a 20-second cooldown window are merged to prevent fragmentation.

---

## Baseline Governance

The baseline is the system's ground truth for "normal." If contaminated with anomalous clips, detection quality degrades silently. The memory governor implements three defenses.

### Quarantine

New baseline candidates must survive a quarantine period before admission:

1. **Contamination check**: Reject if the clip's anomaly score exceeds 0.025
2. **Aging**: Hold for 1 hour in quarantine
3. **Re-scoring**: After aging, re-score against the current baseline
4. **Per-scene cap**: Reject if the scene already has 500+ clips

### Baseline Scrubbing

Every hour, the governor re-evaluates existing baseline entries:

- Remove clips older than 7 days (retention window)
- Re-score all clips against the current baseline
- Remove any clip scoring above 1.5x the contamination threshold (0.0375)

### Poisoning Prevention

The per-scene cap and contamination threshold together prevent an attacker from flooding the baseline. Even if an attacker controls a camera feed, they can insert at most 500 clips per scene, and each must score below 0.025. Injecting true anomalies that score as normal is difficult because it requires them to be genuinely similar to existing normal footage.

---

## Batch Embedding with Twelve Labs

For initial baseline construction or dataset evaluation, we provide a batch embedding script that uploads clips via Twelve Labs and indexes the resulting embeddings into Qdrant:

`/scripts/embed_twelvelabs.py`

```bash
# Dry run -- list clips without uploading
uv run python scripts/embed_twelvelabs.py --input-dir data/clips --dry-run

# Full run -- embed and index
uv run python scripts/embed_twelvelabs.py \
    --input-dir data/clips \
    --collection anomaly_baseline \
    --qdrant-url http://localhost:6333
```

The script uploads each clip to Twelve Labs Marengo, retrieves the embedding, and upserts into Qdrant with metadata:

```python
for clip_path in clips:
    result = twelvelabs_client.upload_video(str(clip_path), index_type="marengo")
    video_id = result.get("marengo_video_id")
    embedding = twelvelabs_client.get_video_embedding(video_id)

    points.append(PointStruct(
        id=str(uuid.uuid4()),
        vector=embedding,
        payload={
            "source_video": clip_path.stem,
            "twelvelabs_video_id": video_id,
            "clip_filename": clip_path.name,
        },
    ))

qdrant.upsert(collection_name=collection, points=points)
```

---

## Unified Retrieval: Querying Across Time, Cameras, and Sites

The centralized Qdrant cluster is not just a scoring backend -- it is a retrieval layer that indexes every embedding the system produces. Each vector carries payload metadata: `source_video`, `scene_id`, `time_bucket`, `anomaly_type`, and device origin. This enables filterable vector search across the entire deployment.

**"Find similar incidents"** -- After an incident is confirmed, an operator queries Qdrant with the incident's embedding and filters by date range or severity. Results surface visually similar events from any camera, any site, any time period.

**"Trace patterns across locations"** -- Filter searches by `scene_id` or device group to find recurring patterns. If an anomaly appears at one entrance on Monday and a different entrance on Tuesday, the vector similarity connects them.

**"Review the lead-up to an event"** -- Query embeddings from the same camera in the time window preceding an incident. The kNN scores form a timeline showing how the scene drifted from normal.

The NVIDIA VSS pipeline enriches these workflows further with **Graph-RAG** -- a knowledge graph capturing entity relationships across all ingested video. Combined with **CA-RAG** (Context-Aware RAG), operators can ask natural-language questions like "What happened at the north entrance between 2am and 4am last week?" and get answers grounded in both vector similarity and structured graph traversal.

---

## API Endpoints

The backend exposes all functionality through REST endpoints:

```
# Core anomaly detection
POST /api/embed             Upload video, get embedding
POST /api/score             Score embedding against baseline
POST /api/detect            End-to-end: upload, embed, score
POST /api/escalate          Receive escalated clip from edge

# Twelve Labs integration
POST /api/search            Semantic video search via Marengo
POST /api/analyze           Video Q&A via Pegasus
POST /api/twelvelabs/upload Upload to Twelve Labs indexes
GET  /api/twelvelabs/status Check Twelve Labs config

# NVIDIA VSS
POST /api/vss/upload        Upload to VSS (chunk + ingest)
GET  /api/vss/health        Check VSS health

# Operations
GET  /api/escalations/stats Escalation tracker summary
GET  /api/edges             List edge devices
POST /api/edges/register    Register new edge device
GET  /api/memory/stats      Baseline governance stats
```

---

## Results

We evaluated on the [UCF-Crime dataset](https://www.crcv.ucf.edu/projects/real-world/), the standard benchmark for video anomaly detection. The dataset contains 1,900 surveillance videos across 13 anomaly categories (abuse, arson, assault, burglary, explosion, fighting, road accidents, robbery, shooting, shoplifting, stealing, vandalism) plus normal footage.

**Cloud tier (Twelve Labs Marengo, k=3):**

| Metric | Score |
|--------|-------|
| AUC-ROC | 0.9696 |
| Average Precision | 0.9987 |
| F1 (optimal threshold) | 0.9778 |

**Operating point analysis** -- At a budget of 2 false positives per hour:
- Recall: 94.2%
- This means the system catches 94% of anomalies while generating only 2 false alarms per hour per camera.

**Per-category performance** varies. Explosions and arson (dramatic visual changes) are detected reliably. Shoplifting and stealing (subtle, context-dependent) are harder -- but still detectable because they differ from normal, even if the model has never seen a shoplifting example.

---

## Deploying on Vultr Cloud GPUs

Vultr Cloud GPUs serve as the compute backbone for the entire cloud tier. NVIDIA Metropolis VSS supports deployment on A100, H100, H200, and L40S GPUs -- all available through Vultr's on-demand instances.

- **Twelve Labs via VSS**: Video embeddings for kNN scoring and semantic understanding. One call per escalated clip handles both anomaly detection and incident enrichment.
- **Full VSS stack**: Stream handler, VLM captioning, audio transcription, and CV pipeline -- all GPU-accelerated on Vultr.
- **Batch embedding**: Processing the full UCF-Crime dataset (19,380 clips) for baseline construction. Spin up, embed, tear down.

Vultr's GPU instances run alongside the Qdrant cloud cluster, minimizing network hops between embedding and indexing. The cost model is efficient: GPU compute scales with escalation volume (5-15% of footage), not total camera count.

---

## Streaming Backpressure

In production, the cloud tier must handle bursts of escalations from multiple edge devices. The streaming pipeline implements adaptive degradation:

| Queue Utilization | Mode | Behavior |
|------------------|------|----------|
| < 80% | NORMAL | Full pipeline (embed + score + incident) |
| 80-90% | SCORE_ONLY | Skip caption generation |
| 90-95% | PASSTHROUGH | Use cached embeddings |
| > 95% | SHED_LOAD | Drop oldest requests |

This ensures the system degrades gracefully under load rather than queuing unboundedly.

---

## Getting Started

```bash
# Clone and install
git clone https://github.com/thierrydamiba/video-anomaly
cd video-anomaly
uv sync

# Configure
cp .env.example .env
# Edit .env with your Qdrant URL, Twelve Labs API key, etc.

# Option 1: Run with Docker (recommended)
docker compose up

# Option 2: Run services individually
uv run uvicorn backend.main:app --port 9876    # Backend API
uv run python -m edge.main                      # Edge detector
cd frontend && pnpm dev                          # Dashboard

# Batch embed a dataset via Twelve Labs
uv run python scripts/embed_twelvelabs.py --input-dir data/clips --collection anomaly_baseline
```

---

## Conclusion

Great, thanks for reading along! You've not only built an end-to-end real-time video anomaly detection platform, but learned about how Qdrant vector search, Twelve Labs video understanding, NVIDIA Metropolis VSS, and Vultr Cloud GPUs come together to solve a problem that traditional classifiers cannot: detecting anomalies you've never seen before.

The key takeaways:

- **kNN over classifiers**: Detects novel anomalies without per-category training. The anomaly score is simply "how far from normal" -- no labels needed.
- **Qdrant two-shard edge**: Sub-millisecond kNN lookups on Jetson with a mutable shard for live context and an immutable shard synced from cloud.
- **Twelve Labs for both scoring and understanding**: Marengo embeddings power the kNN detector *and* semantic search. Pegasus adds conversational Q&A. One platform, both jobs.
- **Edge triage reduces cost ~6x**: A deliberately imperfect edge filter catches ~95% of anomalies while processing only ~15% of footage in the cloud.
- **NVIDIA VSS orchestrates the cloud pipeline**: Stream handling, VLM captioning, audio transcription, and CV pipeline -- all tied together with the Twelve Labs integration.
- **Baseline governance prevents silent degradation**: Quarantine, scrubbing, and per-scene caps keep the normal baseline clean over time.

Check out some more in-depth resources:

- **Project Repository**: [thierrydamiba/video-anomaly](https://github.com/thierrydamiba/video-anomaly)
- **NVIDIA VSS Twelve Labs Integration**: [james-le-twelve-labs/nvidia-vss](https://github.com/james-le-twelve-labs/nvidia-vss)
- **Reference: Manufacturing Automation Tutorial**: [nathanchess/twelvelabs-nvidia-vss-sample](https://github.com/nathanchess/twelvelabs-nvidia-vss-sample)
- **Twelve Labs Documentation**: [docs.twelvelabs.io](https://docs.twelvelabs.io/)
- **Qdrant Documentation**: [qdrant.tech/documentation](https://qdrant.tech/documentation/)
- **Vultr Cloud GPUs**: [vultr.com/products/cloud-gpu](https://www.vultr.com/products/cloud-gpu/)
