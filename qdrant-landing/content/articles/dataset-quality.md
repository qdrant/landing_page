---
title: Finding errors in datasets with Similarity Search
short_description: Finding errors datasets with distance-based methods
description: Improving quality of text-and-images datasets on the online furniture marketplace example.
preview_image: /articles_data/dataset-quality/preview.png
small_preview_image: /articles_data/dataset-quality/icon.svg
weight: 9
author: George Panchuk
author_link: https://medium.com/@george.panchuk
date: 2022-07-13T013:00:00.000Z
---


Nowadays, people create a huge number of applications of various types and solve problems in different areas.
Despite such diversity, they have something in common - they need to process data.
Real-world data is a living structure, it grows day by day, changes a lot and becomes harder to work with.
In some cases, you need to categorize or label your data, which can be a tough problem given its scale.
The process of splitting or labelling is error-prone and these errors can be very costly.
Imagine that you failed to achieve the desired quality of the model due to inaccurate labels.
Worse, your users are faced with a lot of irrelevant items, unable to find what they need and getting annoyed by it.
Thus, you get poor retention, and it directly impacts company revenue.
It is really important to avoid such errors in your data.

Tabular, univariate or low-dimensional data, which has interpretable features, is usually easier to analyze.
That’s the kind of data we used to in classic machine learning algorithms.
We already have some tricks and techniques for detecting errors in such datasets.
For instance, we can calculate some statistics and compare one with another.
In general, we know how to treat such results.

But currently, solving a problem involving texts or images you will probably stick with deep learning models and most likely obtain better results. 
Neural networks produce features on their own, and it is much more difficult to make any assumptions about their meaning and desired distribution. 
Therefore, classical approaches don’t work for them.

## Furniture web-marketplace

Let’s say you work on an online furniture marketplace. 
In this case, to ensure a good user experience, you need to split items into different categories: tables, chairs, beds, etc.
One can arrange all the items manually, get reliable results and spend a lot of money and time on this.
There is another way: train a classification or similarity model and rely on it.
Such a model can be wrong, some mistakes can be caught by analysing most uncertain predictions, but the others will still leak to the site.

When you are sure that there are not many objects placed in the wrong category, they can be considered outliers or anomalies.
Thus, you can train a model or a bunch of models capable of looking for anomalies, e.g. autoencoder and a classifier on it.
However, this is again a resource-intensive task, both in terms of time and manual labour, since labels have to be provided for classification.
On the contrary, if the proportion of out-of-place elements is high enough, outlier search methods are likely to be useless.

### Similarity search

An alternative approach would be to use a pre-trained model to produce embeddings for your data and then measure the distances between them.
The idea is to find the objects that are farthest from the anchor.
Assume we want to search for anything other than a single bed in «Single beds».

{{< figure src=https://storage.googleapis.com/demo-dataset-quality-public/article/similarity_search.png caption="Similarity search" >}}

Then our pipeline will look like this:
- Take the name of the category as an anchor and calculate the anchor embedding.
- Calculate embeddings for images of each object placed into this category.
- Compare obtained anchor and object embeddings.
- Find the furthest.

For instance, we can do it with the [CLIP](https://huggingface.co/sentence-transformers/clip-ViT-B-32-multilingual-v1) model.

{{< figure src=https://storage.googleapis.com/demo-dataset-quality-public/article/category_vs_image_transparent.png caption="Category vs. Image" >}}

We can also calculate embeddings for titles instead of images, or even for both of them to find more errors.

{{< figure src=https://storage.googleapis.com/demo-dataset-quality-public/article/category_vs_name_and_image_transparent.png caption="Category vs. Title and Image" >}}

As you can see, different approaches can find new errors or the same ones. 
Stacking several techniques or even the same techniques with different models may provide better coverage. 
Hint: Caching embeddings for the same models and reusing them among different methods can significantly speed up your lookup.

### Diversity search

Since pre-trained models have only general knowledge about the data, they can still leave some misplaced items undetected.
You might find yourself in a situation when the model focuses on non-important features, selects a lot of irrelevant elements, and fails to find genuine errors. 
To mitigate this issue, you can perform a diversity search.

{{< figure src=https://storage.googleapis.com/demo-dataset-quality-public/article/diversity_transparent.png caption="Diversity search" >}}

Diversity search utilizes the very same embeddings, and you can reuse them.
If your data is huge and does not fit into memory, vector search engines like [Qdrant](https://qdrant.tech/) might be helpful.

Although the described methods can be used independently. But they are simple to combine and improve detection capabilities.
If the quality remains insufficient, you can fine-tune the models using a similarity learning approach (e.g. with [Quaterion](https://quaterion.qdrant.tech) both to provide a better representation of your data and pull apart dissimilar objects in space.

## Conclusion

In this article, we enlightened distance-based methods to find errors in categorized datasets.
Showed how to find incorrectly placed items in the furniture web store.
I hope these methods will help you catch sneaky samples leaked into the wrong categories in your data, and make your users` experience more enjoyable.

Poke the [demo](https://dataset-quality.qdrant.tech).

Stay tuned :)



