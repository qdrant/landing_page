---
title: Search for outliers
short_description: Finding outliers with distance-based methods
description: Finding outliers in the furniture online marketplace with distance-based methods.
preview_image: /articles_data/dataset-quality/preview.png
small_preview_image: /articles_data/dataset-quality/icon.svg
weight: 9
author: George Panchuk
author_link: https://medium.com/@george.panchuk
date: 2022-07-13T013:00:00.000Z
---

Real world data is a living structure.
It grows day by day, changes a lot, it becomes harder and harder to maintain.
All this leads to appearance of outliers in our datasets, which in some cases can be very undesirable and spoil the predictive ability of our model.
However, the data is not only a source for training, but also the result of our model, which is also capable of producing outliers.
These outliers are more important to handle as our clients encounter them when using applications.

Tabular, univariate or low-dimensional  data, which has interpretable features, is usually easier to analyze. 
That’s the kind of data we used to in classic machine learning algorithms.
There are plenty of methods you can use to find outliers, from simple sorting, applying statistical tests, calculating percentiles, etc.

Nowadays, solving a problem involving text or image data you will probably stick with deep learning models and more likely obtain better results. 
Neural networks produce features on their own and it is much more difficult to make any assumptions about their meaning and desired distribution. 
Therefore, classical approaches don’t work for them.

Let’s say you work on an online furniture marketplace. 
In this case, to ensure a good user experience, you need to split items into different categories: tables, chairs, beds, etc. 
Obviously, one can arrange all the items manually, get reliable results and spend a lot of money and time on this.
There is another way: train a classification or similarity model and rely on it. 
Such a model can be wrong, some mistakes can be caught by analysing most uncertain predictions, but the others will still leak to the site. 

Objects placed in a wrong category may be considered outliers or anomalies. 
Of course you can train a model or a bunch of models capable of looking for anomalies, e.g. autoencoder and a classifier on it.
However, this is again a resource intensive task, both in time and manual labour, since you need to label data for classification.

An alternative approach would be to use a pre-trained model capable of producing embeddings for your data and measure the distances between them. 
The idea is to find the objects that are farthest from the anchor. 
Assume we want to search for anything other than a single bed in «Single beds». 
We can take the name of the category as an anchor, calculate anchor embedding. 
Calculate embeddings for images of every object placed into this category. 
Compare obtained anchor and objects embeddings. 
For instance, we can do it with [CLIP](sentence-transformers/clip-ViT-B-32-multilingual-v1) model.

{{< figure src=https://storage.googleapis.com/demo-dataset-quality-public/article/category_vs_image.png caption="Category vs. Image" >}}

We can also calculate embeddings for titles instead of images, or even for both of them to find more outliers.

{{< figure src=https://storage.googleapis.com/demo-dataset-quality-public/article/category_vs_name_and_image.png caption="Category vs. Title and Image" >}}

As you can see, different approaches can find new outliers, or the same ones. 
Stacking several techniques or even same techniques with different models may provide a better results. 
Caching embeddings for the same models and reusing them among different methods can really speed up your lookup.

Since pretrained models have only general knowledge about the data, they can still leave some outliers undetected. 
You might find yourself in a situation when the model focuses on non-important features, selects a lot of irrelevant items, and fails to find genuine outliers. 
To mitigate this issue, you can perform a diversity search.

{{< figure src=https://storage.googleapis.com/demo-dataset-quality-public/article/diversity_search.png caption="Diversity search" >}}

Diversity search utilizes the very same embeddings, and you can reuse them.
If your data is really huge and does not fit into a memory, vector search engines like [Qdrant](https://qdrant.tech/) might be helpful.

Although the described methods can be used alone, their combination is simple to implement and has more capabilities. 
If the quality remains insufficient, you can fine-tune the models using a similarity learning approach (e.g. with [Quaterion](https://quaterion.qdran.tech), both to provide a better representation of your data and pull apart dissimilar objects in space.

I hope the highlighted methods will help you get rid of outliers in your data and make your users experience more enjoyable.

Poke the [demo](https://dataset-quality.qdrant.tech).
Checkout the [source code](https://github.com/qdrant/demo-dataset-quality/tree/master/experiments) with methods implementation.

Stay tuned :)