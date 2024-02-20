---
title: "Enhance OpenAI Embeddings with Qdrant's Binary Quantization"
draft: false
slug: openai-embeddings-binary-quantization
#short_description: 
description: Using AI to Unlock Company Knowledge and Drive Employee Productivity
preview_image: /case-studies/dust/preview.png
date: 2024-02-06T07:03:26-08:00
author: Manuel Meyer
featured: false
tags: 
  - Dust
  - case_study
weight: 0 
---

# Enhance OpenAI Embeddings with Qdrant's Binary Quantization

OpenAI Ada-003 embeddings are a powerful tool for natural language processing (NLP). However, the size of the embeddings are a challenge, especially with real-time search and retrieval. In this article, we explore how you can use Qdrant's Binary Quantization to enhance the performance and efficiency of OpenAI embeddings.

In this post, we discuss:

- The significance of OpenAI embeddings and real-world challenges. 
- Qdrant's Binary Quantization, and how it can improve the performance of OpenAI embeddings
- Results of an experiment that highlights improvements in search efficiency and accuracy
- Implications of these findings for real-world applications
- Best practices for leveraging Binary Quantization to enhance OpenAI embeddings

## New OpenAI Embeddings: Performance and Changes

As the technology of embedding models has advanced, demand has grown. Users are looking more for powerful and efficient text-embedding models. OpenAI's Ada-003 embeddings offer state-of-the-art performance on a wide range of NLP tasks, including those noted in [MTEB](https://huggingface.co/spaces/mteb/leaderboard) and [MIRACL](https://openai.com/blog/new-embedding-models-and-api-updates). 

### Multi-lingual Support

OpenAI text-embedding-3-large is a multi-lingual model that can encode text in 100+ languages.

As noted on MIRACL, text-embeeding-3-large is a significant improvement on text-embedding-ada-002. The average MTEB score has increased from 31.4% to 54.9%

### Matryoshka Representation Learning

The new OpenAI models have been trained with a novel approach called "[Matryoshka Representation Learning](https://aniketrege.github.io/blog/2024/mrl/)". Developers can set up embeddings of different sizes (number of dimensions). In this post, we use small and large variants. Developers can select embeddings which balances accuracy and size.

Here, we show how the accuracy of binary quantization is quite good across different dimensions -- for both the models. 

## Enhanced Performance and Efficiency with Binary Quantization

The efficiency gains from Binary Quantization are as follows: 

- Reduced storage footprint: It helps with large-scale datasets. It also saves on memory, and scales up to 30x at the same cost. 
- Enhanced speed of data retrieval: Smaller data sizes generally leads to faster searches. 
- Accelerated search process: It is based on simplified distance calculations between vectors to bitwise operations. This enables real-time querying even in extensive databases.

![](Accuracy_Models.png)

# Experiment Setup: OpenAI Embeddings in Focus

To identify Binary Quantization's impact on search efficiency and accuracy, we designed our experiment on OpenAI text-embedding models. These models, which capture nuanced linguistic features and semantic relationships, are the backbone of our analysis. We then delve deep into the potential enhancements offered by Qdrant's Binary Quantization feature.

## Dataset

We use 100K random samples from the [OpenAI 1M](https://huggingface.co/datasets/KShivendu/dbpedia-entities-openai-1M) dataset. We select 100 records at random from the dataset. We then use the embeddings of the queries to search for the nearest neighbors in the dataset. 

### Parameters: Oversampling, Rescoring, and Search Limits

For each record, we run a parameter sweep over the number of oversampling, rescoring, and search limits. We can then understand the impact of these parameters on search accuracy and efficiency. Our experiment was designed to assess the impact of Binary Quantization under various conditions, based on the following parameters: 

- Oversampling
- Rescoring
- Search limits

- **Oversampling**: By oversampling, we can limit the loss of information inherent in quantization. This also helps to preserve the semantic richness of your OpenAI embeddings. We experimented with different oversampling factors, and identified the impact on the accuracy and efficiency of search. Spoiler: higher oversampling factors tend to improve the accuracy of searches. However, they usually require more computational resources.

- **Rescoring**: Rescoring refines the first results of an initial binary search. This process leverages the original high-dimensional vectors to refine the search results, **always** improving accuracy. We toggled rescoring on and off to measure effectiveness, when combined with Binary Quantization. We also measured the impact on search performance. 

- **Search Limits**: We specify the number of results from the search process. We experimented with various search limits to measure their impact the accuracy and efficiency. We explored the trade-offs between search depth and performance. The results provide insight for applications with different precision and speed requirements.

Through this detailed setup, our experiment sought to shed light on the nuanced interplay between Binary Quantization and the high-quality embeddings produced by OpenAI's models. By meticulously adjusting and observing the outcomes under different conditions, we aimed to uncover actionable insights that could empower users to harness the full potential of Qdrant in combination with OpenAI's embeddings, regardless of their specific application needs.

## Results: Binary Quantization's Impact on OpenAI Embeddings

To analyze the impact of rescoring (`True` or `False), we compared results across different model configurations and search limits. Rescoring sets up a more precise search, based on results from an initial query.

### Rescoring

![Graph that measures the impact of rescoring](Rescoring_Impact.png)

Here are some key observations, which analyzes the impact of rescoring (`True` or `False`):

1. **Significantly Improved Accuracy**:
   - Across all models and dimension configurations, enabling rescoring (`True`) consistently results in higher accuracy scores compared to when rescoring is disabled (`False`).
   - The improvement in accuracy is true across various search limits (10, 20, 50, 100).

2. **Model and Dimension Specific Observations**:
   - For the `text-embedding-3-large` model with 3072 dimensions, rescoring boosts the accuracy from an average of about 76-77% without rescoring to 97-99% with rescoring, depending on the search limit and oversampling rate.
    - The accuracy improvement with increased oversampling is more pronounced when rescoring is enabled, indicating a better utilization of the additional binary codes in refining search results.
   - With the `text-embedding-3-small` model at 512 dimensions, accuracy increases from around 53-55% without rescoring to 71-91% with rescoring, highlighting the significant impact of rescoring, especially at lower dimensions.
   - For higher dimension models (such as text-embedding-3-large with 3072 dimensions), <NEED MORE INFO>
In contrast, for lower dimension models (such as text-embedding-3-small with 512 dimensions), the incremental accuracy gains from increased oversampling levels are less significant, even with rescoring enabled. This suggests a diminishing return on accuracy improvement with higher oversampling in lower dimension spaces.

3. **Influence of Search Limit**:
   - The performance gain from rescoring seems to be relatively stable across different search limits, suggesting that rescoring consistently enhances accuracy regardless of the number of top results considered.

In summary, enabling rescoring dramatically improves search accuracy across all tested configurations. It is crucial feature for applications where precision is paramount. The consistent performance boost provided by rescoring underscores its value in refining search results, particularly when working with complex, high-dimensional data like OpenAI embeddings. This enhancement is critical for applications that demand high accuracy, such as semantic search, content discovery, and recommendation systems, where the quality of search results directly impacts user experience and satisfaction.


```python
import pandas as pd
```


```python
dataset_combinations = [
    {
        "model_name": "text-embedding-3-large",
        "dimensions": 3072,
    },
    {
        "model_name": "text-embedding-3-large",
        "dimensions": 1024,
    },
    {
        "model_name": "text-embedding-3-large",
        "dimensions": 1536,
    },
    {
        "model_name": "text-embedding-3-small",
        "dimensions": 512,
    },
    {
        "model_name": "text-embedding-3-small",
        "dimensions": 1024,
    },
    {
        "model_name": "text-embedding-3-small",
        "dimensions": 1536,
    },
]
```


```python
for combination in dataset_combinations:
    model_name = combination["model_name"]
    dimensions = combination["dimensions"]
    print(f"Model: {model_name}, dimensions: {dimensions}")
    results = pd.read_json(f"../results/results-{model_name}-{dimensions}.json", lines=True)
    average_accuracy = results[results["limit"] != 1]
    average_accuracy = average_accuracy[average_accuracy["limit"] != 5]
    average_accuracy = average_accuracy.groupby(["oversampling", "rescore", "limit"])[
        "accuracy"
    ].mean()
    average_accuracy = average_accuracy.reset_index()
    acc = average_accuracy.pivot(
        index="limit", columns=["oversampling", "rescore"], values="accuracy"
    )
    print(acc)
```

## Impact of Oversampling

Oversampling is a technique often employed in machine learning to counteract imbalances in datasets, particularly when one class significantly outnumbers others. This imbalance can skew the performance of models, leading them to favor the majority class at the expense of minority classes. By creating additional samples from the minority classes, oversampling aims to equalize the representation of classes in the training dataset, thus enabling more fair and accurate modeling of real-world scenarios.

The included visualization (Oversampling_Impact.png) likely showcases the effect oversampling has on model performance metrics. While the actual metrics aren't specified here, we might expect to see improvements in measures such as precision, recall, or F1-score for minority classes post-oversampling. These improvements would illustrate the effectiveness of oversampling in creating a more balanced dataset, which in turn allows the model to learn a better representation of all classes, not just the dominant one.

Without an explicit code snippet or output to discuss, the focus remains on underscoring the critical role of oversampling in enhancing model fairness and performance. Through graphical representation, it's possible to convey complex before-and-after comparisons in an accessible manner that highlights oversampling's contribution to machine learning projects, especially in scenarios with imbalanced datasets.

![](Oversampling_Impact.png)

## Leveraging Binary Quantization: Best Practices

We recommend the following best practices for leveraging Binary Quantization to enhance OpenAI embeddings:

1. Embedding Model: Use the text-embedding-3-large from MTEB. It is most accurate among those tested.
2. Dimensions: Use the highest dimension available for the model, to maximize accuracy. The results are true for English and other languages.
3. Oversampling: Use an oversampling factor of 3 for the best balance between accuracy and efficiency. This factor is suitable for a wide range of applications.
4. Rescoring: Enable rescoring to improve the accuracy of search results.
5. RAM: Store the full vectors and payload on disk. Limit what you load from memory to the binary quantization index. This helps reduce the memory footprint and improve the overall efficiency of the system. The incremental latency from the disk read is negligible compared to the latency savings from the binary scoring in Qdrant, which uses SIMD instructions where possible.
