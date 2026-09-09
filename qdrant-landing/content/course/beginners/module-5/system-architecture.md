---
title: "System Architecture"
short_description: "Module 5 of the Beginner Course: four stages mapped to the Qdrant primitives behind them."
description: "The capstone has four stages: ingest, embed, store, then cluster and query. See how each maps to Qdrant primitives you already know."
weight: 2
isLesson: true
---

{{< date >}} Module 5 {{< /date >}}

# System Architecture

The system has four stages. Each maps to Qdrant primitives you already know.

1. **Ingest**: collect the day's signals from news APIs, image feeds, and transcript files. Chunk anything longer than a paragraph.
2. **Embed**: hand each part of a signal to the model for its modality, producing named vectors: `text_dense`, `text_sparse`, `image`.
3. **Store**: upsert each signal as one `PointStruct` carrying every vector it has, plus a payload: supplier, source type, country, publication date, risk score.
4. **Cluster and Query**: a daily batch tags signals with a `cluster_id`; on demand, analysts run hybrid and image queries against the same collection.

![The four capstone stages stacked top to bottom: ingest, embed, store, then cluster and query, each labeled with the Qdrant primitive it maps to.](/courses/beginners/module-5/four-stage.png)

### Collection Schema

One collection holds every modality. Named vectors let you query by text or by image from the same point. Every field an analyst filters on is indexed, exactly as you designed in Module 4.

```yaml
collection: supplier_signals

named_vectors:
  text_dense:  { model: all-MiniLM-L6-v2, size: 384, distance: Cosine }
  text_sparse: { model: Qdrant/bm25, modifier: IDF }
  image:       { model: Qdrant/clip-ViT-B-32-vision, size: 512, distance: Cosine }

payload_fields:
  supplier_id:  { type: keyword,  indexed: true }
  source_type:  { type: keyword,  indexed: true, values: [news, satellite, audio, filing, social] }
  language:     { type: keyword,  indexed: true }
  country:      { type: keyword,  indexed: true }
  facility_id:  { type: keyword,  indexed: true }
  published_at: { type: datetime, indexed: true }
  risk_score:   { type: float,    indexed: true, range: "0.0 to 1.0" }
  cluster_id:   { type: integer,  indexed: true, note: assigned after ingestion }
  summary:      { type: text,     indexed: false, note: short excerpt or caption }
```

Three named vectors, not five. A transcript is text once it has been transcribed, and a video frame is an image once it has been sampled, so neither needs a space of its own. [Signal Sources and Embedding Models](/course/beginners/module-5/signal-sources-and-embedding-models/) comes back to that.
