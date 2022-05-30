---
title: More Accurate Similar Cars Search with Fine Tuning
short_description: "How to use similarity learning to search for similar cars"
description: Learn how to train a similarity model that can retrieve similar car images in novel categories. 
preview_image: /articles_data/cars-recognition/preview.png
small_preview_image: /articles_data/cars-recognition/icon.svg
weight: 30
author: Yusuf Sarıgöz
author_link: https://medium.com/@yusufsarigoz
date: 2022-05-04T13:00:00+03:00
draft: false
---

Supervised classification is one of the most widely used training objectives in machine learning,
but not every task can be defined as such. For example,

1. Your classes may change quickly —e.g., new classes may be added over time,
2. You may not have samples from every possible category,
3. It may be impossible to enumerate all the possible classes during the training time,
4. You may have an essentially different task, e.g., search or retrieval.

All such problems may be efficiently solved with similarity learning.

N.B.: If you are new to the similarity learning concept, checkout the [awesome-metric-learning](https://github.com/qdrant/awesome-metric-learning) repo for great resources and use case examples.

However, similarity learning comes with its own difficulties such as:

1. Need for larger batch sizes usually,
2. More sophisticated loss functions,
3. Changing architectures between training and inference.

Quaterion is a fine tuning framework built to tackle such problems in similarity learning.
It uses [PyTorch Lightning](https://www.pytorchlightning.ai/) as a backend, which is advertized with the motto, "spend more time on research, less on engineering."
This is also true for Quaterion, and it includes:

1. Trainable and servable model classes,
2. Annotated built-in loss functions, and a wrapper over [pytorch-metric-learning](https://kevinmusgrave.github.io/pytorch-metric-learning/) when you need even more,
3. Sample, dataset and data loader classes to make it easier to work with similarity learning data,
4. A caching mechanism for faster iterations and less memory footprint.

## A closer look at Quaterion

Let's break down some important modules:

- `TrainableModel`: A subclass of `pl.LightNingModule` that has additional hook methods such as `configure_encoders`, `configure_head`, `configure_metrics` and others
to define objects needed for training and evaluation —see below to learn more on these.
- `SimilarityModel`: An inference-only export method to boost code transfer and lower dependencies during the inference time.
In fact, Quaterion is composed of two packages:
    1. `quaterion_models`: package that you need for inference.
    2. `quaterion`: package that defines objects needed for training and also depends on `quaterion_models`.
- `Encoder` and `EncoderHead`: Two objects that form a `SimilarityModel`.
In most of the cases, you may use a frozen pretrained encoder, e.g., ResNets from `torchvision`, or language modelling
models from `transformers`, with a trainable `EncoderHead` stacked on top of it.
`quaterion_models` offers several ready-to-use `EncoderHead` implementations,
but you may also create your own by subclassing a parent class or easily listing PyTorch modules in a `SequentialHead`.

Quaterion has other objects such as distance functions, evaluation metrics, evaluators, convenient dataset and data loader classes, but these are mostly self-explanatory.
Thus, they will not be explained in detail in this article for brevity.
However, you can always go check out the [documentation](https://quaterion.qdrant.tech) to learn more about them.

The focus of this tutorial is a step-by-step solution of a similarity learning problem with Quaterion.
This will also help us better understand how the abovementioned objects fit together in a real project.
Let's start walking through some of the important parts of the code.

If you are looking for the complete source code instead, you can find it under the [examples](https://github.com/qdrant/quaterion/tree/master/examples/cars) directory in the Quaterion repo.

## Dataset
In this tutorial, we will use the [Stanford Cars](https://pytorch.org/vision/main/generated/torchvision.datasets.StanfordCars.html) dataset.
It has 16185 images of cars from 196 classes,
and it is split into training and testing subsets with almost a 50-50% split.
To make things even more interesting, however, we will first merge training and testing subsets,
then we will split it into two again in such a way that the half of the 196 classes will be put into the training set and the other half will be in the testing set.
This will let us test our model with samples from novel classes that it has never seen in the training phase,
which is what supervised classification cannot achieve but similarity learning can.

In the following code borrowed from `data.py`:
- `get_datasets()` function performs the splitting task described above.
- `get_dataloaders()` function creates `GroupSimilarityDataLoader` instances from training and testing datasets.
- Datasets are regular PyTorch datasets that emit `SimilarityGroupSample` instances.

N.B.: Currently, Quaterion has two data types to represent samples in a dataset. To learn more about `SimilarityPairSample`, check out the [NLP tutorial](https://quaterion.qdrant.tech/)

```python
import numpy as np
import os
import tqdm
from torch.utils.data import Dataset, Subset
from torchvision import datasets, transforms
from typing import Callable
from pytorch_lightning import seed_everything

from quaterion.dataset import (
    GroupSimilarityDataLoader,
    SimilarityGroupSample,
)

# set seed to deterministically sample train and test categories later on
seed_everything(seed=42)

# dataset will be downloaded to this directory under local directory
dataset_path = os.path.join(".", "torchvision", "datasets")


def get_datasets(input_size: int):
    # Use Mean and std values for the ImageNet dataset as the base model was pretrained on it.
    # taken from https://www.geeksforgeeks.org/how-to-normalize-images-in-pytorch/
    mean = [0.485, 0.456, 0.406]
    std = [0.229, 0.224, 0.225]

    # create train and test transforms
    transform = transforms.Compose(
        [
            transforms.Resize((input_size, input_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean, std),
        ]
    )

    # we need to merge train and test splits into a full dataset first,
    # and then we will split it to two subsets again with each one composed of distinct labels.
    full_dataset = datasets.StanfordCars(
        root=dataset_path, split="train", download=True
    ) + datasets.StanfordCars(root=dataset_path, split="test", download=True)

    # full_dataset contains examples from 196 categories labeled with an integer from 0 to 195
    # randomly sample half of it to be used for training
    train_categories = np.random.choice(a=196, size=196 // 2, replace=False)

    # get a list of labels for all samples in the dataset
    labels_list = np.array([label for _, label in tqdm.tqdm(full_dataset)])

    # get a mask for indices where label is included in train_categories
    labels_mask = np.isin(labels_list, train_categories)

    # get a list of indices to be used as train samples
    train_indices = np.argwhere(labels_mask).squeeze()

    # others will be used as test samples
    test_indices = np.argwhere(np.logical_not(labels_mask)).squeeze()

    # now that we have distinct indices for train and test sets, we can use `Subset` to create new datasets
    # from `full_dataset`, which contain only the samples at given indices.
    # finally, we apply transformations created above.
    train_dataset = CarsDataset(
        Subset(full_dataset, train_indices), transform=transform
    )

    test_dataset = CarsDataset(
        Subset(full_dataset, test_indices), transform=transform
    )

    return train_dataset, test_dataset


def get_dataloaders(
    batch_size: int,
    input_size: int,
    shuffle: bool = False,
):
    train_dataset, test_dataset = get_datasets(input_size)

    train_dataloader = GroupSimilarityDataLoader(
        train_dataset, batch_size=batch_size, shuffle=shuffle
    )

    test_dataloader = GroupSimilarityDataLoader(
        test_dataset, batch_size=batch_size, shuffle=False
    )

    return train_dataloader, test_dataloader


class CarsDataset(Dataset):
    def __init__(self, dataset: Dataset, transform: Callable):
        self._dataset = dataset
        self._transform = transform

    def __len__(self) -> int:
        return len(self._dataset)

    def __getitem__(self, index) -> SimilarityGroupSample:
        image, label = self._dataset[index]
        image = self._transform(image)

        return SimilarityGroupSample(obj=image, group=label)
```
