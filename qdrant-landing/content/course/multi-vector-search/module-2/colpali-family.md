---
title: "ColPali Family Overview"
description: Explore the ColPali model family and their capabilities for multi-modal document understanding and retrieval.
weight: 2
---

{{< date >}} Module 2 {{< /date >}}

# ColPali Family Overview

The ColPali is not only the name of a model. Still, it is also often used to refer to an entire family of models that convert images and text into multi-vector representations, based on Vision Language Models. 

Let's explore what the options are and which model to choose depending on the data you work with.

---

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

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course-multi-vector-search/module-2/colpali-family.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

---

The ColPali family includes several model variants. When selecting a model for your application, you'll need to consider factors like model size, supported languages, computational requirements, and licensing constraints - each variant offers different trade-offs along these dimensions.

## Model Size

While the original ColPali model delivers good performance, its multi-billion parameter size can be challenging for resource-constrained environments, demos, or CPU-only deployments. Fortunately, smaller alternatives maintain competitive performance while dramatically reducing computational requirements.

### ColSmol: Efficient Small-Scale Models

The **[ColSmol](https://huggingface.co/vidore/colSmol-256M)** family offers compact variants built on SmolVLM, available in [256M](https://huggingface.co/vidore/colSmol-256M) and [500M](https://huggingface.co/vidore/colSmol-500M) parameter sizes that achieve 80.1 and 82.3 nDCG@5 respectively on the ViDoRe benchmark. These Apache 2.0 licensed models generate ColBERT-style multi-vector representations while being small enough for browser-based applications, edge computing, and resource-constrained environments.

### ColFlor: Ultra-Compact Retrieval

**[ColFlor](https://huggingface.co/ahmed-masry/ColFlor)** pushes efficiency even further with only 174 million parameters, achieving performance 17× smaller and up to 9.8× faster than ColPali with only a 1.8% drop in accuracy on text-rich English documents. Built on Florence-2's architecture, ColFlor is particularly attractive for demo environments, educational purposes, and scenarios where computational efficiency outweighs marginal performance differences.

## Supported Languages

Original ColPali model primarily focuses on English documents, but several multilingual alternatives have emerged that extend multi-vector capabilities across different languages.

### NVIDIA Multilingual Models

The **[NVIDIA Llama-NeMoRetriever-ColEmbed-3B-v1](https://huggingface.co/nvidia/llama-nemoretriever-colembed-3b-v1)** was among the leading multilingual visual document retrieval models when it was released. Built on top of Google's SigLIP-2 vision encoder and Meta's Llama 3.2-3B language model, this late interaction embedding model demonstrated strong performance on multilingual retrieval benchmarks including ViDoRe and MIRACL-VISION.

However, **potential users should be aware of licensing restrictions**. The model is available **for non-commercial and research use only** due to multiple overlapping licenses: NVIDIA's Non-Commercial License, Apache 2.0 for the SigLIP-2 component, and Meta's Llama 3.2 Community License Agreement. Organizations requiring commercial deployment should carefully review these license terms or consider alternatives.

### Open-Source Multilingual Alternative

For commercial applications, **[Nomic AI's ColNomic-Embed-Multimodal-7B](https://huggingface.co/nomic-ai/colnomic-embed-multimodal-7b)** offers a compelling fully open-source alternative. Released in early 2025, this model demonstrated competitive performance on multilingual retrieval benchmarks. The model is available under an open-source license that permits commercial use, making it suitable for production deployments without licensing concerns. Nomic AI released a complete suite including both multi-vector (ColNomic) and single-vector variants in 3B and 7B parameter sizes, giving developers flexibility in choosing the right trade-off between performance and resource requirements.

## The Impact of Bidirectional Attention

Bidirectional attention has emerged as a promising approach for multi-vector representations of multi-modal data.

The choice between **unidirectional** and **bidirectional** attention mechanisms significantly impacts model performance for embedding tasks. Understanding this distinction helps explain why certain architectures excel at retrieval while others are optimized for generation. Let's first examine unidirectional attention and its limitations, then see how bidirectional attention addresses these constraints.

### Unidirectional Attention: Designed for Generation

Most large language models (LLMs) and vision-language models (VLMs) like GPT, Llama, and the base models of [ColPali](https://huggingface.co/vidore/colpali) use **unidirectional (causal) attention**. In this approach, each token can only attend to tokens that came before it in the sequence - the model looks backward but never forward.

This design makes perfect sense for generative tasks: when predicting the next token, the model should only use past context, not future information it hasn't generated yet. However, this constraint creates limitations for embedding tasks. Token representations encode only information from previous context, missing crucial contextual information from subsequent tokens in the sequence.

<!-- TODO: Add diagram for unidirectional attention

Show:
- Sequence of tokens (T1, T2, T3, T4, T5)
- Focus on T3 as the current token being processed
- Show arrows from T3 pointing backward to T1, T2, T3
- Gray out or fade T4, T5 to show they're not accessible
- Label: "Unidirectional Attention: Only Past Context"
- Add annotation: "When processing T3, the model can only see tokens T1, T2, T3"

Use color coding:
- Blue arrows for backward attention flow
- Darker highlight on current token (T3)
- Lighter/grayed future tokens to emphasize they're hidden
-->

### Bidirectional Attention: Optimized for Embeddings

**Bidirectional attention**, as used in encoder models like BERT, allows each token to attend to the entire input sequence - both past and future tokens. This creates richer, more contextually informed representations since each token's embedding incorporates information from the complete surrounding context.

<!-- TODO: Add diagram for bidirectional attention

Show:
- Same sequence of tokens (T1, T2, T3, T4, T5)
- Focus on T3 as the current token being processed
- Show arrows from T3 pointing in BOTH directions to all tokens (T1, T2, T3, T4, T5)
- All tokens highlighted/visible to show full context available
- Label: "Bidirectional Attention: Full Context"
- Add annotation: "When processing T3, the model can see ALL tokens in both directions"

Use color coding:
- Blue arrows for backward attention (T3 → T1, T2)
- Green arrows for forward attention (T3 → T4, T5)
- Darker highlight on current token (T3)
- All tokens equally visible/highlighted to show full accessibility
- Add contrast note: "Captures richer semantic representations by seeing the entire sequence"
-->

For multi-vector retrieval tasks, this architectural choice proves crucial. Research has shown that [bidirectional encoder models are often the best option when training visual retrievers](https://arxiv.org/html/2510.01149). The [**ColModernVBERT**](https://huggingface.co/ModernVBERT/colmodernvbert) model demonstrates this advantage: despite having over 10 times fewer parameters than ColPali, it achieves performance only slightly lower on the ViDoRe benchmark.

The ModernVBERT architecture leverages bidirectional attention to create compact yet powerful visual document retrievers. By allowing full context flow in both directions, these models generate embeddings that capture nuanced semantic relationships - critical for accurate multi-modal retrieval where visual and textual information must be jointly understood.

## Benchmark Results

The **ViDoRe (Visual Document Retrieval) Benchmark** is a comprehensive evaluation framework designed to measure the performance of visual retrieval models on document understanding tasks. It evaluates models across multiple domains, languages (English, French, Spanish, and German), and realistic retrieval scenarios including cross-document and long-form queries. You can explore the latest model performance and compare different approaches on the [ViDoRe leaderboard](https://huggingface.co/spaces/vidore/vidore-leaderboard).

The benchmark uses **nDCG@5** (Normalized Discounted Cumulative Gain at 5) as its primary metric and includes challenging datasets spanning various domains - from biomedical research papers to insurance documents and ESG reports. Unlike earlier benchmarks, ViDoRe V2 emphasizes real-world complexity through blind contextual querying and human-in-the-loop evaluation, ensuring that models are tested on truly challenging retrieval tasks that mirror actual user behavior.

![Benchmark results on ViDoRe](/courses/multi-vector-search/module-2/benchmark-results.png)

***Source:** Teiletche, P., Macé, Q., Conti, M., Loison, A., Viaud, G., Colombo, P., & Faysse, M. (2025). *ModernVBERT: Towards Smaller Visual Document Retrievers*. arXiv preprint arXiv:2510.01149. https://arxiv.org/abs/2510.01149*

The chart above shows the performance of various models on the ViDoRe benchmark. Models using bidirectional attention, particularly those in the ColPali and ColQwen families, consistently demonstrate superior performance on visual document retrieval tasks.

It's important to note that **ColModernVBERT achieves competitive results with only ~250 million parameters** - significantly smaller than ColPali and ColQwen models which contain billions of parameters. This makes ModernVBERT particularly attractive for resource-constrained environments or CPU-only deployments, where the slight performance trade-off is worthwhile for the substantial efficiency gains.

## Future of Multi-Vector Representations

The multi-vector approach extends naturally to new modalities beyond images. Models like **[TomoroAI/tomoro-colqwen3-embed-8b](https://huggingface.co/TomoroAI/tomoro-colqwen3-embed-8b)**, based on ColQwen3, demonstrate this extensibility by adding support for short video retrieval. Based on preliminary findings, ColQwen3 generalizes to videos while learning from image-text retrieval tasks - it samples video clips, encodes frames, then pools frame embeddings with per-dimension max before MaxSim scoring.

While not yet fine-tuned on large-scale video retrieval datasets, this lightweight approach highlights a key strength of the multi-vector paradigm: **new modalities can be added by adapting the preprocessing pipeline** while preserving the core late interaction architecture. 

## What's next

TODO: summarize the lesson quickly and introduce the next part

Now that you know which model to use, let's learn how to interpret what ColPali "sees" in your documents.
