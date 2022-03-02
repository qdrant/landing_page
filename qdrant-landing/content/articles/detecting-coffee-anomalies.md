---
title: Lessons Learned from Detecting Anomalies in Coffee Images
short_description: How to use metric learning to detect anomalies in coffee images only with 200 labeled samples
description: Practical use of metric learning for anomaly detection to match the results of a classification-based approach with only ~0.6% of the labeled data. 
external_link: [TBA]
preview_image: TBA
small_preview_image: TBA
weight: 20
---


## Effective use of metric learning for anomaly detection


Anomaly detection is a thirsting yet challenging task that has numerous use cases across various industries.
The complexity results mainly from the fact that the task is data-scarce by definition.
Similarly, anomalies are, again by definition, subject to frequent change, and they may take unexpected forms.
For that reason, supervised classification-based approaches are:
1. data-hungry, i.e., requiring quite a number of labeled data,
2. expensive because data labeling is an expensive task itself,
3. time-consuming because you would try to obtain what is necessarily scarce,
4. and hard to maintain because you would need to re-train the model repeatedly in response to changes in the data distribution.

These are not desirable features if you want to put your model into production in a rapidly-changing environment.
And, despite all the mentioned difficulties, they do not necessarily offer superior performance compared to the alternatives.
In this post, I will detail the lessons learned from such a use case.

## Problem definition and data distribution
Coffee beans may be in undesirable states due to environmental conditions.
They may fully or partly become bug-infested, get wet, go black, be broken or chipped,
include stones, or contact various foreign matters, among others.
I should note that anomalies are very diverse, so the enumeration of all possible anomalies is a challenging task on it's own.
The task is to detect the state of coffee beans in captured images as good vs. anomaly, e.g., one of the conditions listed above.


## Metric learning approach
In this approach, we aimed to encode images in an n-dimensional vector space and then use learned similarities to label images during the inference.
The simplest way to do this is KNN classification.
The algorithm retrieves K-nearest neighbors to a given query vector and assigns a label based on the majority vote.
This idea has the following advantages:
1. We can benefit from unlabeled data, considering labeling is time-consuming and expensive.
2. The relevant metric, e.g., precision or recall, can be tuned according to changing requirements during the inference without re-training.
3. Queries labeled with a high score can be added to the KNN classifier on the fly as new data points.

It is easy to achieve the third point with Qdrant in production, and it can be converted to a fully-fledged machine learning application.

### Step 1 - Autoencoder for unlabeled data
First, we pretrained a Resnet18-like model in a vanilla autoencoder architecture by leaving the labels aside.
Autoencoder is a model architecture composed of an encoder and a decoder, with the latter trying to recreate the original input from the low-dimensional bottleneck output of the former.
There is no intuitive evaluation metric to indicate the performance in this setup, but we can evaluate the success by examining the recreated samples visually.

**SOME SAMPLES CAN BE ADDED HERE**

Then we encoded a subset of the data into 128-dimensional vectors by using the encoder,
and created a KNN classifier on top of these embeddings and associated labels.
![Metrics for the autoencoder model with KNN classifier](/articles_data/detecting-coffee-anomalies/ae_report_knn.png)
Although the results are promising, we can do even better by finetuning with metric learning.

### Step 2 - Finetuning with metric learning for higher F1 score
We started by selecting 200 labeled samples randomly without replacement.
In this step, The model was composed of the encoder part of the autoencoder with a randomly initialized projection layer stacked on top of it.
We applied transfer learning from the frozen encoder and trained only the projection layer with Triplet Loss and an online batch-all triplet mining strategy.
Unfortunately, the model overfitted quickly in this attempt.
In the next experiment, we used an online batch-hard strategy with a trick to prevent vector space from collapsing
--a separate )article will be published on this trick and Triplet Loss.
This time it converged smoothly, and our evaluation metrics also improved considerably to match the supervised classification approach.
![Metrics for the finetuned model with KNN classifier](/articles_data/detecting-coffee-anomalies/ft_report_knn.png)
We repeated this experiment with 500 and 2000 samples, but it didn't show a better improvement than a slight change.
Thus we decided to stick to 200 samples --see below for why.

## Supervised classification approach
We also wanted to compare our results with the metrics of a traditional supervised classification model.
For this purpose, a Resnet50 model was finetuned with ~30k labeled images, made available for training.
Surprisingly, the F1 score was around ~0.86.
Please note that we used only 200 labeled samples in the metric learning approach instead of ~30k in the supervised classification approach.
These numbers indicate a huge saving with no considerable compromise in the performance.

## Conclusion
We obtained results comparable to those of the supervised classification method by using only 0.66% of the labeled data with metric learning.
This approach is time-saving and resource-efficient, and that may be improved further. Possible next steps might be:
- Collect more unlabeled data and pretrain a larger autoencoder.
- Obtain high-quality labels for a small number of images instead of tens of thousands for finetuning.
- Use hyperparameter optimization and possibly gradual unfreezing in the finetuning step.

We are actively looking into these, and we will continue to publish our findings in this challenge and other use cases of metric learning.
