---
title: Chunking Strategies
weight: 3
---

{{< date >}} Day 1 {{< /date >}}

# Embedding & Chunking Strategies

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

So far we've talked about points - what they're made of, and how Qdrant compares them for approximate nearest neighbor search using distance metrics like cosine similarity, dot product, or Euclidean distance.

But none of this matters until we give Qdrant something meaningful to compare. That brings us to the real beginning of the system.

## The Real Beginning: Data Structure

Our pipeline starts with the data and how we represent what we want to search. In practice, this means thinking about the structure of the data we're storing. Most real-world data is messy:

- Text documents are long
- Product descriptions vary in length  
- User profiles have nested attributes

We need a way to break this data down into manageable chunks.

**Together, [embedding](/articles/what-are-embeddings/) and chunking define the data that Qdrant works with.**

## From Raw Text to Search-Ready

### The Problem with Whole Documents

Storing an entire document as a single vector might seem easier, but it makes search results less precise.

**Example:** Consider a multi-page Qdrant Collection Configuration Guide covering everything from HNSW to sharding and quantization.

If a user asks: *"What does the m parameter do?"*

**With whole document embedding:**
- Qdrant returns the entire guide
- The answer is buried under unrelated content  
- Language models must process unnecessary noise
- Wastes tokens and compute power

**With proper chunking:**
- Split the guide into smaller, topic-focused chunks
- Embed each chunk separately
- Qdrant returns just the relevant section about the `m` parameter
- Clear, precise answers without noise

## Why Chunking Makes All the Difference

Instead of treating documents as monolithic blocks, you break them up into paragraphs, headings, and subsections. Each chunk gets its own vector, tied to a specific idea or topic. You can add metadata to each chunk like section title, page number, original source document, and tags.

This enables:
- **Filtered retrieval** - "Only show results from this section"
- **Context-aware fragments** - Precise answers to specific queries  
- **Efficient processing** - No wasted tokens on irrelevant content

## Chunking Strategies: The Shape Matters

How you chunk affects what your embeddings capture, what your retriever can surface, and what your LLM can reason over. There's no one-size-fits-all approach. Let's explore the options:

### 1. Fixed-Size Chunking

**The Approach:** Define a number of tokens per chunk (e.g., 200) with a small overlap buffer to preserve context.

<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0;">
<strong>Example text:</strong> "The HNSW algorithm builds a multi-layer graph where each node represents a vector. The algorithm starts by inserting vectors into the bottom layer and then selectively promotes some to higher layers based on probability. This creates shortcuts that allow for faster traversal during search operations."

<br><br>
<strong>Fixed-size chunks (10 words each, with arbitrary breaks):</strong><br><br>
<span style="background-color: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 2px;">Chunk 1: "The HNSW algorithm builds a multi-layer graph where each"</span><br><br>
<span style="background-color: #f3e5f5; color: #7b1fa2; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 2px;">Chunk 2: "node represents a vector. The algorithm starts by inserting vectors"</span><br><br>
<span style="background-color: #fff3e0; color: #ef6c00; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 2px;">Chunk 3: "into the bottom layer and then selectively promotes some to"</span><br><br>
<span style="background-color: #e8f5e8; color: #2e7d32; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 2px;">Chunk 4: "higher layers based on probability. This creates shortcuts that allow"</span><br><br>
<span style="background-color: #fce4ec; color: #c2185b; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 2px;">Chunk 5: "for faster traversal during search operations."</span>
</div>

Notice how each chunk has exactly 10 words, but this breaks sentences arbitrarily.

**Pros:**
- Simple to implement
- Consistent chunk sizes
- Predictable processing

**Cons:**
- Ignores natural language boundaries
- May split mid-sentence or mid-thought
- No semantic awareness

**Best for:** Documents lacking consistent formatting, initial prototyping

```python
def fixed_size_chunk(text, chunk_size=200, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks
```

### 2. Sentence-Based Chunking

**The Approach:** Break documents into sentences using a tokenizer, then group sentences into chunks under a specified word count.

<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0;">
<strong>Example text:</strong> "The HNSW algorithm builds a multi-layer graph. Each node represents a vector in the collection. The algorithm creates shortcuts between layers for faster search. This hierarchical structure enables efficient approximate nearest neighbor queries."

<br><br>
<strong>Sentence-based chunks (respecting sentence boundaries):</strong><br><br>
<span style="background-color: #e8f5e8; color: #2e7d32; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 2px;">Chunk 1: "The HNSW algorithm builds a multi-layer graph. Each node represents a vector in the collection."</span><br><br>
<span style="background-color: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 2px;">Chunk 2: "The algorithm creates shortcuts between layers for faster search. This hierarchical structure enables efficient approximate nearest neighbor queries."</span>
</div>

Each chunk contains complete sentences, preserving the logical flow. This method keeps the structure neat and maintains complete thoughts, though chunk sizes will vary.

**Implementation:**
```python
from nltk.tokenize import sent_tokenize

def sentence_chunk(text, max_words=150):
    sentences = sent_tokenize(text)
    chunks, buffer, length = [], [], 0
    
    for sent in sentences:
        count = len(sent.split())
        if length + count > max_words:
            chunks.append(" ".join(buffer))
            buffer, length = [], 0
        buffer.append(sent)
        length += count
    
    if buffer:
        chunks.append(" ".join(buffer))
    return chunks
```

**Pros:**
- Preserves complete thoughts
- Natural language boundaries
- Good semantic coherence

**Cons:**
- Irregular chunk lengths
- Sentence size varies significantly  
- May not respect topic boundaries

**Best for:** RAG systems, Q&A applications, general text processing

### 3. Paragraph-Based Chunking

**The Approach:** Split on paragraph breaks, leveraging existing document structure.

<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0;">
<strong>Example text with paragraphs:</strong><br><br>
<div style="background-color: #e8f5e8; color: #2e7d32; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Paragraph 1:</strong> "HNSW (Hierarchical Navigable Small World) is a graph-based algorithm for approximate nearest neighbor search. It builds a multi-layer structure where each layer contains a subset of the data points."
</div>

<div style="background-color: #e3f2fd; color: #1565c0; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Paragraph 2:</strong> "The algorithm works by creating connections between nearby points in each layer. Higher layers have fewer points but longer connections, creating shortcuts for faster traversal during search operations."
</div>

<div style="background-color: #fff3e0; color: #ef6c00; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Paragraph 3:</strong> "When searching, HNSW starts from the top layer and gradually moves down, using the shortcuts to quickly navigate to the target region before performing a more detailed search in the bottom layer."
</div>
</div>

Each chunk corresponds to an entire paragraph - a natural boundary where ideas tend to cohere. This approach respects the author's intended organization and keeps related concepts together.

**Implementation:**
```python
def paragraph_chunk(text):
    return [p.strip() for p in text.split("\n\n") if p.strip()]
```

**Pros:**
- Aligns with natural topic boundaries
- Semantically rich by default
- Respects author's organization

**Cons:**
- Unpredictable sizes (single line to whole page)
- May need token limits or fallback splitting
- Depends on clean document structure

**Best for:** Articles, blogs, documentation, books, emails

### 4. Sliding Window Chunking

**The Approach:** Create overlapping chunks to maintain context continuity.

<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0;">
<strong>Example text:</strong> "HNSW builds a multi-layer graph where each node represents a vector. The algorithm starts by inserting vectors into the bottom layer and then selectively promotes some to higher layers based on probability. This creates shortcuts that allow for faster traversal during search operations."

<br><br>
<strong>Sliding window (10 words per chunk, 4 words overlap):</strong><br><br>
<div style="background-color: #e8f5e8; color: #2e7d32; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Chunk 1:</strong> "HNSW builds a multi-layer graph where each node represents a"
</div>

<div style="background-color: #e3f2fd; color: #1565c0; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Chunk 2:</strong> <span style="background-color: #c8e6c9; color: #388e3c; font-style: italic;">"where each node represents a"</span> "vector. The algorithm starts by inserting vectors"
</div>

<div style="background-color: #fff3e0; color: #ef6c00; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Chunk 3:</strong> <span style="background-color: #bbdefb; color: #1976d2; font-style: italic;">"starts by inserting vectors"</span> "into the bottom layer and then selectively promotes"
</div>

<div style="background-color: #f3e5f5; color: #7b1fa2; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Chunk 4:</strong> <span style="background-color: #ffe0b2; color: #f57c00; font-style: italic;">"and then selectively promotes"</span> "some to higher layers based on probability. This"
</div>
</div>

Sliding window chunking creates overlapping segments of consistent size. Each chunk maintains exactly the same word count (10 words) with consistent overlap (4 words), ensuring information continuity across boundaries while preserving uniform chunk sizes.

**Implementation:**
```python
def sliding_window(text, window=200, stride=100):
    words = text.split()
    chunks = []
    for i in range(0, len(words) - window + 1, stride):
        chunk = " ".join(words[i:i + window])
        chunks.append(chunk)
    return chunks
```

**Pros:**
- Maintains context at boundaries
- Higher recall potential
- Reduces information loss

**Cons:**
- Storage redundancy (typically 20-50% overhead)
- Increased processing costs
- May return duplicate information

**Best for:** Critical applications where missing information is costly, reranking systems

### 5. Recursive Chunking

**The Approach:** Use a fallback hierarchy of separators when data doesn't follow predictable structure.

Recursive splitting uses a fallback hierarchy of separators. You try to split on large blocks first - like headings or paragraph breaks. If a chunk is still too long, it falls back to smaller separators like lines or sentences. If it still doesn't fit, it continues with words or characters as a last resort.

<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0;">
<strong>Example messy text:</strong><br>
"# HNSW Overview\n\nThe HNSW algorithm builds a multi-layer graph.\nEach node represents a vector in the collection.\n\nThe algorithm creates shortcuts between layers for faster search. This hierarchical structure enables efficient approximate nearest neighbor queries.\n\n## Performance Benefits\nHNSW provides logarithmic search complexity."

<br><br>
<strong>Recursive chunking (tries paragraph breaks first, then sentences, then words):</strong><br><br>
<div style="background-color: #e8f5e8; color: #2e7d32; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Chunk 1:</strong> "# HNSW Overview\n\nThe HNSW algorithm builds a multi-layer graph.\nEach node represents a vector in the collection."
</div>

<div style="background-color: #e3f2fd; color: #1565c0; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Chunk 2:</strong> "The algorithm creates shortcuts between layers for faster search. This hierarchical structure enables efficient approximate nearest neighbor queries."
</div>

<div style="background-color: #fff3e0; color: #ef6c00; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Chunk 3:</strong> "## Performance Benefits\nHNSW provides logarithmic search complexity."
</div>
</div>

Recursive chunking tries to preserve structure. It starts with paragraphs (separated by `\n\n`). If those are too long, it drops down to sentences. If those still overflow, it cuts at word boundaries. This fallback behavior helps keep data usable even when structure is inconsistent.

**Hierarchy:**
1. Large blocks (headings `\n\n`, paragraph breaks)
2. Medium blocks (lines `\n`, sentences `.`)  
3. Small blocks (spaces ` `, characters)

**Implementation:**
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", " ", ""]
)

chunks = splitter.split_text(text)
```

**Pros:**
- Adapts to messy or inconsistent input
- Preserves semantic coherence when possible
- Handles various document formats

**Cons:**
- Heuristic-based, results may be inconsistent
- Complex logic
- May not work perfectly with all content types

**Best for:** Scraped web content, mixed formats, CMS exports

### 6. Semantic-Aware Chunking

**The Approach:** Use embeddings to detect meaning shifts and break at topic boundaries.

Everything up to this point has been about structure. But structure isn't the same as meaning. Semantic chunking uses embeddings to find meaning shifts - you detect where topics or semantic coherence changes, and break there.

<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0;">
<strong>Example text with topic shifts:</strong><br>
"HNSW is a graph-based algorithm for vector search. It builds hierarchical layers for efficient navigation. The algorithm uses probability to promote nodes between layers. Vector databases like Qdrant implement HNSW for fast similarity search. Machine learning models generate embeddings for text data. These embeddings capture semantic meaning in high-dimensional space."

<br><br>
<strong>Semantic-aware chunks (splits detected at meaning boundaries):</strong><br><br>
<div style="background-color: #e8f5e8; color: #2e7d32; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Topic 1 - HNSW Algorithm:</strong> "HNSW is a graph-based algorithm for vector search. It builds hierarchical layers for efficient navigation. The algorithm uses probability to promote nodes between layers."
</div>

<div style="background-color: #e3f2fd; color: #1565c0; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Topic 2 - Vector Databases:</strong> "Vector databases like Qdrant implement HNSW for fast similarity search."
</div>

<div style="background-color: #fff3e0; color: #ef6c00; padding: 8px 12px; border-radius: 4px; margin: 4px 0;">
<strong>Topic 3 - Machine Learning:</strong> "Machine learning models generate embeddings for text data. These embeddings capture semantic meaning in high-dimensional space."
</div>
</div>

Semantic chunking doesn't care about sentence count or fixed token limits. It looks for natural boundaries in meaning. If a definition needs multiple sentences, it keeps them together. This gives better retrieval because chunks contain complete, coherent concepts.

**Process:**
1. Embed sentences or small segments
2. Calculate similarity between consecutive segments
3. Identify topic transitions where similarity drops
4. Split at coherence boundaries

**Implementation:**
```python
from sentence_transformers import SentenceTransformer
import numpy as np

def semantic_chunking(text, similarity_threshold=0.5):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    sentences = text.split('.')
    embeddings = model.encode(sentences)
    
    chunks = []
    current_chunk = [sentences[0]]
    
    for i in range(1, len(sentences)):
        # Calculate cosine similarity between consecutive sentences
        similarity = np.dot(embeddings[i-1], embeddings[i]) / (
            np.linalg.norm(embeddings[i-1]) * np.linalg.norm(embeddings[i])
        )
        
        if similarity < similarity_threshold:
            chunks.append('. '.join(current_chunk))
            current_chunk = [sentences[i]]
        else:
            current_chunk.append(sentences[i])
    
    chunks.append('. '.join(current_chunk))
    return chunks
```

The trade-off is computational cost. You're embedding the full document upfront just to decide where to split it - before you even store anything. It's slower and more expensive, but each chunk carries coherent ideas.

**Pros:**
- High semantic precision
- Each chunk carries coherent ideas
- Optimal for complex documents

**Cons:**
- Computationally expensive (requires embedding entire document)
- Requires additional model inference
- Slower processing pipeline

**Best for:** Legal documents, research papers, critical applications requiring high precision

## Chunking Strategy Comparison

| Method | Strength | Trade-off | Best For |
|--------|----------|-----------|----------|
| **Fixed-Size** | Simple, predictable chunks | Ignores structure, breaks meaning | Raw or unstructured text |
| **Sentence** | Preserves complete thoughts | Inconsistent sizes | RAG, Q&A systems |
| **Paragraph** | Aligns with semantic units | Large variance in length | Docs, manuals, instructional content |
| **Sliding Window** | Maintains full context | Redundant, compute-heavy | Reranking, high-recall retrieval |
| **Recursive** | Flexible, handles messy input | Heuristic, sometimes brittle | Scraped web content, mixed sources |
| **Semantic** | High-quality, meaning-aware | Slower, resource-intensive | Legal, research, critical QA |

## Adding Meaning with Metadata

Chunks by themselves are just fragments of text. They don't tell you where they came from, what they belong to, or how to control what gets retrieved.

**That's where metadata comes in.**

In Qdrant, this metadata lives in the **payload** - a JSON object attached to each vector that carries real structure. You can use it to store anything you need to identify or organize your chunks.

### Essential Metadata Fields

```json
{
  "document_id": "collection-config-guide",
  "document_title": "What is a Vector Database",
  "section_title": "What Is a Vector",
  "chunk_index": 7,
  "chunk_count": 15,
  "url": "https://qdrant.tech/documentation/concepts/collections/",
  "tags": ["qdrant", "vector database", "point", "vector", "payload"],
  "source_type": "documentation", 
  "created_at": "2025-01-15T10:00:00Z",
  "content": "There are three key elements that define a vector in a vector database: the ID, the dimensions, and the payload. These components work together to represent a vector effectively within the system...",
  "word_count": 45,
  "char_count": 287
}
```

### What Metadata Enables

**1. Filtered Search**
```python
# Only show results from this article
filter = models.Filter(
    must=[models.FieldCondition(key="document_id", match=models.MatchValue(value="collection-config-guide"))]
)
```

**2. Grouped Results**
```python
# Top result per document - get the most relevant chunk from each source
group_by = "document_id"
```

**3. Rich Result Display**
- Original content with source attribution
- Section context for better understanding
- Direct links to full documents
- Creation timestamps for freshness

**4. Permission Control**
```python
# Filter by user permissions
filter = models.Filter(
    must=[models.FieldCondition(key="access_level", match=models.MatchValue(value="public"))]
)
```

## Practical Implementation

### Complete Chunking Pipeline

```python
import json
from datetime import datetime
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

def create_chunks_with_metadata(document, strategy="sentence", max_words=150):
    """Complete chunking pipeline with metadata"""
    
    # Choose chunking strategy
    if strategy == "sentence":
        chunks = sentence_chunk(document["content"], max_words)
    elif strategy == "paragraph":
        chunks = paragraph_chunk(document["content"])
    elif strategy == "sliding_window":
        chunks = sliding_window(document["content"])
    elif strategy == "semantic":
        chunks = semantic_chunking(document["content"])
    
    # Create points with metadata
    points = []
    for i, chunk in enumerate(chunks):
        # Generate embedding (using your preferred model)
        embedding = generate_embedding(chunk)
        
        # Create rich metadata
        payload = {
            "document_id": document["id"],
            "document_title": document["title"],
            "section_title": document.get("section", ""),
            "chunk_index": i,
            "chunk_count": len(chunks),
            "url": document.get("url", ""),
            "tags": document.get("tags", []),
            "source_type": document.get("type", "text"),
            "created_at": datetime.utcnow().isoformat(),
            "content": chunk,
            "word_count": len(chunk.split()),
            "char_count": len(chunk)
        }
        
        points.append(PointStruct(
            id=f"{document['id']}_chunk_{i}",
            vector=embedding,
            payload=payload
        ))
    
    return points
```

### Search with Metadata

```python
def search_with_filters(query, document_type=None, date_range=None):
    """Search with metadata filtering"""
    
    # Build filter conditions
    filter_conditions = []
    
    if document_type:
        filter_conditions.append(
            models.FieldCondition(key="source_type", match=models.MatchValue(value=document_type))
        )
    
    if date_range:
        filter_conditions.append(
            models.FieldCondition(
                key="created_at",
                range=models.Range(gte=date_range["start"], lte=date_range["end"])
            )
        )
    
    # Execute search
    query_filter = models.Filter(must=filter_conditions) if filter_conditions else None
    
    results = client.query_points(
        collection_name="documents",
        query=generate_embedding(query),
        query_filter=query_filter,
        limit=5
    )
    
    return results
```

## Performance Considerations

### The Chunk Size Spectrum

Research and practical experience suggest optimal chunk sizes for different scenarios:

- **Small chunks (128-256 tokens)**: High precision, good for specific fact retrieval
- **Medium chunks (256-512 tokens)**: Balanced approach, suitable for most RAG applications  
- **Large chunks (512-1024 tokens)**: More context, better for complex reasoning tasks

### Token Efficiency

Consider your embedding model's token limits:
- OpenAI text-embedding-3-small: 8,191 tokens max
- Sentence Transformers (typical): 512 tokens optimal
- Always leave buffer space for special tokens and formatting

### Overlap Recommendations

- **10-20% overlap**: Good balance for most applications
- **25-50% overlap**: High-recall scenarios where missing information is costly
- **No overlap**: When storage/compute costs are primary concern

## Key Takeaways

1. **Chunking strategy directly impacts search quality** - choose based on your data and use case
2. **Smaller, focused chunks provide more precise results** than whole document embeddings  
3. **Metadata is crucial** for filtering, grouping, and result presentation
4. **Different strategies have different trade-offs** - experiment to find what works
5. **Consider computational costs** - semantic chunking is powerful but expensive
6. **Overlap helps preserve context** but increases storage requirements

## What's Next

Now that you understand how to structure and prepare your data, let's put these concepts into practice. In the next section, we'll build a complete movie recommendation system that demonstrates chunking, embedding, and metadata in action.

Remember: **Qdrant doesn't make assumptions about what your data means. It compares vectors and gives you back what's closest. But what it sees - the structure, the semantics, the context - that's entirely up to you.** 