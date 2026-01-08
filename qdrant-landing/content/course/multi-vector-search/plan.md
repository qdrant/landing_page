# Qdrant Multi-Vector Search Course

This document is a proposal for another Qdrant course. I suggest covering both text and multi-modal multi-vector representations, focusing on making them usable in Qdrant.

# Outline

1. **Module 0:** Setting up dependencies
2. **Module 1:** Multi-vector representations for textual data  
   * ColBERT basics  
   * Comparison to regular dense embedding models  
   * Examples when multi-vectors may work better than single vectors  
   * MaxSim distance  
3. **Module 2:** Multi-vector representations for multi-modal data (image \+ text)  
   * ColPali family  
   * Inner workings of the ColPali models  
   * Visual interpretability of ColPali representations  
   * Setting up Qdrant for multi-vector embeddings  
4. **Module 3:** Scalability issues caused by multi-vector representations  
   * The implications of high memory usage and ways to solve it  
     * Vector quantization: scalar, binary, \+1.5/2-bit  
     * Pooling techniques: row/column pooling, hierarchical token pooling  
   * Incompatibility with HNSW due to MaxSim asymmetry  
     * MUVERA  
   * Combining multiple optimizations in multi-stage retrieval via Universal Query API  
   * Evaluating different search pipelines in terms of cost and latency

## Project

I suggest having just one project. It should start with a set of PDFs or even scanned documents for which the participants are supposed to create a two-stage ColPali retrieval system using both MUVERA for fast retrieval and some memory optimization (or multiple ones, like SQ \+ token pooling) for reduced memory usage.

## Supplementary content

To keep the momentum, I suggest publishing a few related blog posts in the upcoming weeks:

1. **The asymmetry of MaxSim**  
   We suggest disabling HNSW for MaxSim, but it is never discussed why it doesn’t make sense. It’s not worth an article, but a short explanation with some examples would make things clearer.  
2. **A review of modern multi-vector retrievers for visual data**  
   There’s been a lot of excitement around ModernVBERT, so it would make sense to present how to use it with Qdrant, even though we don’t support it in FastEmbed.  
3. **FastEmbed: implementation of different pooling techniques for multi-vectors**  
   E.g., row/column pooling (if possible), hierarchical token pooling. Techniques might be implemented in the library itself, but we should also create a blog post about it.
