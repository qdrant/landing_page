---
title: "Final Project: Multi-Modal Document Search with ColPali"
description: Build a production-ready multi-modal search system using ColPali embeddings, MUVERA optimization, and multi-stage retrieval to search across PDFs, images, and text with visual understanding.
weight: 7
---

{{< date >}} Module 3 {{< /date >}}

# Final Project: Multi-Modal Document Search with ColPali

<div class="video">
<iframe
  src="https://www.youtube.com/embed/xK9mV7zR4pL"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

---

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course-multi-vector-search/module-3/final-project.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

---

## Your Mission

It's time to bring together everything you've learned about multi-vector search, multi-modal embeddings, and production optimization. You'll build a sophisticated document retrieval system that can search across PDFs, images, and text using visual understanding - not just text extraction.

Your search engine will understand document layouts, visual elements, tables, charts, and formatting. When someone searches for "bar chart showing quarterly revenue," your system should find the exact page with that visualization, even if the words "quarterly revenue" never appear in the OCR text.

This mirrors real-world challenges in enterprise search, research libraries, and knowledge management where documents contain critical information in visual form. You'll implement the complete pipeline: multi-modal embedding with ColPali, memory-efficient storage with quantization or pooling, and optimized retrieval with multi-stage search.

**Estimated Time:** 4 hours

## What You'll Build

- A multi-modal search system using ColPali embeddings (or variant)
- Memory optimization using quantization, pooling, and/or MUVERA indexing
- Multi-stage retrieval pipeline with candidate generation and late-interaction reranking
- Evaluation framework measuring recall, precision, and latency
- Production-ready implementation with documented design decisions

## Setup

### Prerequisites
* Qdrant Cloud cluster (URL + API key) or local Qdrant instance
* Python 3.9+ (or Google Colab)
* GPU recommended for embedding generation (Colab provides free T4)
* Packages: `qdrant-client`, `fastembed`

### Models

Choose based on your use case and memory constraints.

TODO: list FastEmbed available models

### Dataset

**Document Types:** Mix of PDFs, images, scanned documents, presentations, or screenshots

**Suggested Sources:**
- Research papers with figures and tables (ArXiv PDFs)
- Product documentation with diagrams
- Financial reports with charts
- Slide decks with visual layouts
- Infographics and data visualizations
- Scanned paper documents

**Dataset Size:** 100-500 documents for meaningful evaluation (adjust based on memory)

**Fields to Track:**
- `document_id`: Unique identifier
- `page_number`: Page or slide number
- `file_path` or `source_url`: Original location
- `metadata`: Author, date, category, tags
- `thumbnail_path`: (optional) Visual preview for results display

**Payload Example:**
```python
payload = {
    "document_id": "arxiv_2305_12345",
    "page_number": 7,
    "source_url": "https://arxiv.org/pdf/2305.12345.pdf",
    "metadata": {
        "title": "Multi-Vector Representations for Document Retrieval",
        "authors": ["Smith, J.", "Doe, A."],
        "category": "machine_learning",
        "tags": ["transformers", "retrieval", "embeddings"],
    },
    "thumbnail_path": "/thumbnails/arxiv_2305_12345_p7.jpg"
}
```

## Build Steps

TODO: write the project plan

---

## What You've Accomplished

By completing this project, you've built a production-ready multi-modal search system that:

* **Understands visual content** beyond just text extraction
* **Scales efficiently** using quantization, pooling, or optimized indexing
* **Delivers fast results** through multi-stage retrieval and HNSW optimization
* **Measures quality** with comprehensive evaluation metrics
* **Documents trade-offs** between accuracy, speed, and memory

You've mastered the full pipeline from multi-vector embeddings to production optimization - skills directly applicable to enterprise search, document management, research platforms, and AI-powered knowledge systems.

**Next:** Continue your learning journey by exploring advanced topics like fine-tuning ColPali models for domain-specific documents, or building Retrieval Augmented Generation with Vision Language Models to derive insights from your scanned documents without even parsing them to text.
