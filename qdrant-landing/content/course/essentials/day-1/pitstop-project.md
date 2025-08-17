---
title: Experiment with Chunking Methods
weight: 5
---

{{< date >}} Day 1 {{< /date >}}

# Project: Chunking Strategy Experiments

Apply your knowledge by experimenting with different chunking approaches on your own text dataset.

## Project Goals

- Compare multiple chunking strategies
- Analyze search quality with different approaches
- Understand trade-offs between methods
- Document insights and recommendations

**Estimated Time:** 60 minutes

## Your Mission

Build a text search system that demonstrates the impact of different chunking strategies on search quality and performance.

### Core Requirements

1. **Choose a text-heavy dataset** (articles, documentation, books, etc.)
2. **Implement 3+ chunking strategies** from today's lesson
3. **Generate real embeddings** using sentence-transformers
4. **Compare search quality** across strategies
5. **Document your findings** with examples and analysis

## Project Template

```python
import os
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Initialize
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

model = SentenceTransformer('all-MiniLM-L6-v2')

class ChunkingExperiment:
    def __init__(self, name, chunking_function):
        self.name = name
        self.chunking_function = chunking_function
        self.collection_name = f"chunks_{name.lower().replace(' ', '_')}"
        
    def process_documents(self, documents):
        """Process documents with this chunking strategy"""
        all_chunks = []
        
        for doc_id, document in enumerate(documents):
            chunks = self.chunking_function(document['content'])
            
            for chunk_id, chunk in enumerate(chunks):
                all_chunks.append({
                    'id': f"{doc_id}_{chunk_id}",
                    'text': chunk,
                    'doc_id': doc_id,
                    'chunk_id': chunk_id,
                    'doc_title': document.get('title', f'Document {doc_id}'),
                    'chunk_size': len(chunk)
                })
        
        return all_chunks
    
    def create_collection_and_insert(self, chunks):
        """Create Qdrant collection and insert chunks"""
        # Generate embeddings
        texts = [chunk['text'] for chunk in chunks]
        embeddings = model.encode(texts)
        
        # Create collection
        client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=embeddings.shape[1],
                distance=Distance.COSINE
            ),
        )
        
        # Insert chunks
        points = []
        for i, chunk in enumerate(chunks):
            point = PointStruct(
                id=i,
                vector=embeddings[i].tolist(),
                payload={
                    'text': chunk['text'],
                    'doc_id': chunk['doc_id'],
                    'doc_title': chunk['doc_title'],
                    'chunk_id': chunk['chunk_id'],
                    'chunk_size': chunk['chunk_size']
                }
            )
            points.append(point)
        
        client.upsert(collection_name=self.collection_name, points=points)
        return len(points)
    
    def search(self, query, limit=5):
        """Search within this chunking strategy"""
        query_embedding = model.encode([query])[0]
        
        results = client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding.tolist(),
            limit=limit
        )
        
        return results

# TODO: Add your chunking functions here
def fixed_chunking(text, size=500, overlap=50):
    # Implement fixed-size chunking
    pass

def sentence_chunking(text, max_sentences=5):
    # Implement sentence-based chunking
    pass

def paragraph_chunking(text):
    # Implement paragraph-based chunking
    pass

# TODO: Add your documents here
documents = [
    {
        'title': 'Your Document Title',
        'content': 'Your document content here...'
    }
    # Add more documents
]

# Create experiments
experiments = [
    ChunkingExperiment("Fixed Size", lambda text: fixed_chunking(text, 500, 50)),
    ChunkingExperiment("Sentence Based", sentence_chunking),
    ChunkingExperiment("Paragraph Based", paragraph_chunking),
]

# Run experiments
for experiment in experiments:
    print(f"Processing with {experiment.name} chunking...")
    chunks = experiment.process_documents(documents)
    num_chunks = experiment.create_collection_and_insert(chunks)
    print(f"Created {num_chunks} chunks")

# Compare results
test_queries = [
    "Your test query 1",
    "Your test query 2",
    "Your test query 3"
]

for query in test_queries:
    print(f"\nQuery: '{query}'")
    print("=" * 50)
    
    for experiment in experiments:
        results = experiment.search(query, limit=3)
        print(f"\n{experiment.name}:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. Score: {result.score:.3f}")
            print(f"     Text: {result.payload['text'][:100]}...")
```

## Dataset Ideas

### Option 1: News Articles
```python
# Example: Use news articles from different categories
documents = [
    {
        'title': 'Tech Innovation Report',
        'content': '''
        Artificial intelligence continues to transform industries...
        [Your article content]
        '''
    }
]
```

### Option 2: Technical Documentation
```python
# Example: API documentation or technical guides
documents = [
    {
        'title': 'Getting Started Guide',
        'content': '''
        This guide will help you understand the basics...
        [Your documentation content]
        '''
    }
]
```

### Option 3: Academic Papers
```python
# Example: Research paper abstracts and content
documents = [
    {
        'title': 'Machine Learning Research',
        'content': '''
        Abstract: This paper presents a novel approach...
        [Your paper content]
        '''
    }
]
```

## Evaluation Metrics

### 1. Chunk Quality Analysis

```python
def analyze_chunk_quality(experiment):
    """Analyze the quality of chunks produced"""
    chunks = client.scroll(
        collection_name=experiment.collection_name,
        limit=100
    )[0]
    
    sizes = [len(chunk.payload['text']) for chunk in chunks]
    
    return {
        'total_chunks': len(chunks),
        'avg_chunk_size': sum(sizes) / len(sizes),
        'min_chunk_size': min(sizes),
        'max_chunk_size': max(sizes),
        'size_variance': max(sizes) - min(sizes)
    }

# Analyze each experiment
for experiment in experiments:
    stats = analyze_chunk_quality(experiment)
    print(f"\n{experiment.name} Statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
```

### 2. Search Relevance Comparison

```python
def compare_search_relevance(query, experiments):
    """Compare search relevance across chunking strategies"""
    print(f"\nSearching for: '{query}'")
    print("=" * 60)
    
    all_results = {}
    for experiment in experiments:
        results = experiment.search(query, limit=5)
        all_results[experiment.name] = results
        
        print(f"\n{experiment.name}:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. Score: {result.score:.3f} | Size: {result.payload['chunk_size']}")
            print(f"     Doc: {result.payload['doc_title']}")
            print(f"     Text: {result.payload['text'][:80]}...")
    
    return all_results

# Test with your queries
for query in test_queries:
    compare_search_relevance(query, experiments)
```

### 3. Performance Metrics

```python
import time

def measure_performance(experiment, queries):
    """Measure search performance"""
    start_time = time.time()
    
    for query in queries:
        experiment.search(query, limit=5)
    
    end_time = time.time()
    avg_time = (end_time - start_time) / len(queries)
    
    return {
        'avg_search_time': avg_time,
        'total_time': end_time - start_time
    }

# Performance comparison
print("\nPerformance Comparison:")
for experiment in experiments:
    perf = measure_performance(experiment, test_queries)
    print(f"{experiment.name}: {perf['avg_search_time']:.3f}s per query")
```

## Deliverables

### 1. Complete Implementation
- [ ] Working code with 3+ chunking strategies
- [ ] Real document dataset (5+ documents)
- [ ] Proper embedding generation
- [ ] Search functionality for all strategies

### 2. Analysis Report

Create a document covering:

**Dataset Description:**
- What type of content you used
- Why you chose this dataset
- Number and length of documents

**Chunking Strategy Results:**
```
Strategy: Fixed Size (500 chars, 50 overlap)
- Total chunks: 127
- Average chunk size: 485 characters
- Search quality: Good for specific facts
- Issues: Splits sentences mid-word

Strategy: Sentence-based (5 sentences)
- Total chunks: 89
- Average chunk size: 623 characters  
- Search quality: Better semantic coherence
- Issues: Variable sizes, some very long

Strategy: Paragraph-based
- Total chunks: 45
- Average chunk size: 1,247 characters
- Search quality: Best for context
- Issues: Some chunks too large for embedding
```

**Search Quality Analysis:**
- Which strategy gave most relevant results?
- Examples of good vs poor search results
- Impact of chunk size on relevance

**Performance Insights:**
- Speed differences between strategies
- Memory usage implications
- Trade-offs observed

### 3. Recommendations

Based on your experiments, provide recommendations:
- Best strategy for your content type
- When to use each chunking approach
- Optimal parameters discovered
- Lessons learned

## Advanced Challenges

### Challenge 1: Hybrid Chunking
Combine multiple strategies based on content structure:

```python
def smart_chunking(text):
    """Use different strategies based on content structure"""
    if '\n##' in text:  # Has headers
        return section_based_chunking(text)
    elif len(text) > 2000:  # Long text
        return sentence_chunking(text)
    else:  # Short text
        return [text]  # Keep as single chunk
```

### Challenge 2: Quality Scoring
Implement a scoring system for chunk quality:

```python
def score_chunk_quality(chunk):
    """Score chunk quality based on various factors"""
    score = 100
    
    # Penalize very short chunks
    if len(chunk) < 100:
        score -= 20
    
    # Penalize chunks that don't end with punctuation
    if not chunk.strip().endswith(('.', '!', '?')):
        score -= 10
    
    # Bonus for complete sentences
    if chunk.count('.') >= 1:
        score += 5
    
    return max(0, score)
```

### Challenge 3: Adaptive Overlap
Dynamically adjust overlap based on content complexity:

```python
def adaptive_overlap_chunking(text, base_size=500):
    """Adjust overlap based on content complexity"""
    # Measure complexity (sentence length variance, vocabulary diversity)
    complexity = calculate_text_complexity(text)
    
    if complexity > 0.8:  # High complexity
        overlap = int(base_size * 0.3)
    elif complexity > 0.5:  # Medium complexity
        overlap = int(base_size * 0.2)
    else:  # Low complexity
        overlap = int(base_size * 0.1)
    
    return fixed_chunking(text, base_size, overlap)
```

## What You'll Learn

This project will teach you:
- How chunking strategy impacts search quality
- Trade-offs between different approaches
- Real-world considerations for text processing
- Performance implications of design choices
- How to evaluate and compare vector search systems

## Submission

Share your results in Discord with:
- Brief description of your dataset
- Key findings from chunking comparison
- Most surprising insight
- Code repository link (optional)

Great work on completing Day 1! You now understand embeddings, distance metrics, and chunking strategies - the foundation of effective text search systems. 