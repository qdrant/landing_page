---
title: Q&A with Similarity Learning
short_description: A complete guide to building a Q&A system with similarity learning.
description: A complete guide to building a Q&A system using Quaterion and SentenceTransformers.
social_preview_image: /articles_data/faq-question-answering/preview/social_preview.jpg
preview_dir: /articles_data/faq-question-answering/preview
small_preview_image: /articles_data/faq-question-answering/icon.svg
weight: 9
author: George Panchuk
author_link: https://medium.com/@george.panchuk
date: 2022-06-28T08:57:07.604Z
category: practicle-examples
# aliases: [ /articles/faq-question-answering/ ]
---

# Question-answering system with Similarity Learning and Quaterion


Many problems in modern machine learning are approached as classification tasks.
Some are the classification tasks by design, but others are artificially transformed into such.
And when you try to apply an approach, which does not naturally fit your problem, you risk coming up with over-complicated or bulky solutions.
In some cases, you would even get worse performance. 

Imagine that you got a new task and decided to solve it with a good old classification approach. 
Firstly, you will need labeled data.
If it came on a plate with the task, you're lucky, but if it didn't, you might need to label it manually.
And I guess you are already familiar with how painful it might be.

Assuming you somehow labeled all required data and trained a model. 
It shows good performance - well done!
But a day later, your manager told you about a bunch of new data with new classes, which your model has to handle.
You repeat your pipeline.
Then, two days later, you've been reached out one more time.
You need to update the model again, and again, and again.
Sounds tedious and expensive for me, does not it for you?
 
## Automating customer support

Let's now take a look at the concrete example. There is a pressing problem with automating customer support. 
The service should be capable of answering user questions and retrieving relevant articles from the documentation without any human involvement.

With the classification approach, you need to build a hierarchy of classification models to determine the question's topic. 
You have to collect and label a whole custom dataset of your private documentation topics to train that. 
And then, each time you have a new topic in your documentation, you have to re-train the whole pile of classifiers with additionally labeled data.
Can we make it easier?
 
## Similarity option

One of the possible alternatives is Similarity Learning, which we are going to discuss in this article.
It suggests getting rid of the classes and making decisions based on the similarity between objects instead.
To do it quickly, we would need some intermediate representation - embeddings.
Embeddings are high-dimensional vectors with semantic information accumulated in them.

As embeddings are vectors, one can apply a simple function to calculate the similarity score between them, for example, cosine or euclidean distance.
So with similarity learning, all we need to do is provide pairs of correct questions and answers.
And then, the model will learn to distinguish proper answers by the similarity of embeddings.

>If you want to learn more about similarity learning and applications, check out this [article](/documentation/tutorials/neural-search/) which might be an asset.

## Let's build

Similarity learning approach seems a lot simpler than classification in this case, and if you have some
doubts on your mind, let me dispel them.

As I have no any resource with exhaustive F.A.Q. which might serve as a dataset, I've scrapped it from sites of popular cloud providers.
The dataset consists of just 8.5k pairs of question and answers, you can take a closer look at it [here](https://github.com/qdrant/demo-cloud-faq).

Once we have data, we need to obtain embeddings for it.
It is not a novel technique in NLP to represent texts as embeddings.
There are plenty of algorithms and models to calculate them.
You could have heard of Word2Vec, GloVe, ELMo, BERT, all these models can provide text embeddings.

However, it is better to produce embeddings with a model trained for semantic similarity tasks. 
For instance, we can find such models at [sentence-transformers](https://www.sbert.net/docs/pretrained_models.html).
Authors claim that `all-mpnet-base-v2` provides the best quality, but let's pick `all-MiniLM-L6-v2` for our tutorial
as it is 5x faster and still offers good results. 

Having all this, we can test our approach. We won't take all our dataset at the moment, but only
a part of it. To measure model's performance we will use two metrics -
[mean reciprocal rank](https://en.wikipedia.org/wiki/Mean_reciprocal_rank) and 
[precision@1](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Precision_at_k).
We have a [ready script](https://github.com/qdrant/demo-cloud-faq/blob/experiments/faq/baseline.py)
for this experiment, let's just launch it now.

<div class="table-responsive">

| precision@1 | reciprocal_rank |
|-------------|-----------------|
| 0.564       | 0.663           |

</div>

That's already quite decent quality, but maybe we can do better?

## Improving results with fine-tuning

Actually, we can! Model we used has a good natural language understanding, but it has never seen
our data. An approach called `fine-tuning` might be helpful to overcome this issue. With 
fine-tuning you don't need to design a task-specific architecture, but take a model pre-trained on 
another task, apply a couple of layers on top and train its parameters.

Sounds good, but as similarity learning is not as common as classification, it might be a bit inconvenient to fine-tune a model with traditional tools.
For this reason we will use [Quaterion](https://github.com/qdrant/quaterion) - a framework for fine-tuning similarity learning models.
Let's see how we can train models with it

First, create our project and call it `faq`. 

> All project dependencies, utils scripts not covered in the tutorial can be found in the
> [repository](https://github.com/qdrant/demo-cloud-faq/tree/tutorial). 

### Configure training

The main entity in Quaterion is [TrainableModel](https://quaterion.qdrant.tech/quaterion.train.trainable_model.html). 
This class makes model's building process fast and convenient.

`TrainableModel` is a wrapper around [pytorch_lightning.LightningModule](https://pytorch-lightning.readthedocs.io/en/latest/common/lightning_module.html). 

[Lightning](https://www.pytorchlightning.ai/) handles all the training process complexities, like training loop, device managing, etc. and saves user from a necessity to implement all this routine manually.
Also Lightning's modularity is worth to be mentioned. 
It improves separation of responsibilities, makes code more readable, robust and easy to write.
All these features make Pytorch Lightning a perfect training backend for Quaterion.

To use `TrainableModel` you need to inherit your model class from it.
The same way you would use `LightningModule` in pure `pytorch_lightning`.
Mandatory methods are `configure_loss`, `configure_encoders`, `configure_head`, 
`configure_optimizers`.

The majority of mentioned methods are quite easy to implement, you'll probably just need a couple of 
imports to do that. But `configure_encoders` requires some code:)

Let's create a `model.py` with model's template and a placeholder for `configure_encoders` 
for the moment.

```python
from typing import Union, Dict, Optional

from torch.optim import Adam

from quaterion import TrainableModel
from quaterion.loss import MultipleNegativesRankingLoss, SimilarityLoss
from quaterion_models.encoders import Encoder
from quaterion_models.heads import EncoderHead
from quaterion_models.heads.skip_connection_head import SkipConnectionHead


class FAQModel(TrainableModel):
    def __init__(self, lr=10e-5, *args, **kwargs):
        self.lr = lr
        super().__init__(*args, **kwargs)
        
    def configure_optimizers(self):
        return Adam(self.model.parameters(), lr=self.lr)
    
    def configure_loss(self) -> SimilarityLoss:
        return MultipleNegativesRankingLoss(symmetric=True)
    
    def configure_encoders(self) -> Union[Encoder, Dict[str, Encoder]]:
        ... # ToDo
        
    def configure_head(self, input_embedding_size: int) -> EncoderHead:
        return SkipConnectionHead(input_embedding_size)
```

- `configure_optimizers` is a method provided by Lightning. An eagle-eye of you could notice 
mysterious `self.model`, it is actually a [SimilarityModel](https://quaterion-models.qdrant.tech/quaterion_models.model.html) instance. We will cover it later.
- `configure_loss` is a loss function to be used during training. You can choose a ready-made implementation from Quaterion.
However, since Quaterion's purpose is not to cover all possible losses, or other entities and 
features of similarity learning, but to provide a convenient framework to build and use such models, 
there might not be a desired loss. In this case it is possible to use [PytorchMetricLearningWrapper](https://quaterion.qdrant.tech/quaterion.loss.extras.pytorch_metric_learning_wrapper.html) 
to bring required loss from [pytorch-metric-learning](https://kevinmusgrave.github.io/pytorch-metric-learning/) library, which has a rich collection of losses.
You can also implement a custom loss yourself.
- `configure_head` - model built via Quaterion is a combination of encoders and a top layer - head.
As with losses, some head implementations are provided. They can be found at [quaterion_models.heads](https://quaterion-models.qdrant.tech/quaterion_models.heads.html).

At our example we use [MultipleNegativesRankingLoss](https://quaterion.qdrant.tech/quaterion.loss.multiple_negatives_ranking_loss.html). 
This loss is especially good for training retrieval tasks. 
It assumes that we pass only positive pairs (similar objects) and considers all other objects as negative examples.

`MultipleNegativesRankingLoss` use cosine to measure distance under the hood, but it is a configurable parameter.
Quaterion provides implementation for other distances as well. You can find available ones at [quaterion.distances](https://quaterion.qdrant.tech/quaterion.distances.html).

Now we can come back to `configure_encoders`:)

### Configure Encoder

The encoder task is to convert objects into embeddings.
They usually take advantage of some pre-trained models, in our case `all-MiniLM-L6-v2` from `sentence-transformers`.
In order to use it in Quaterion, we need to create a wrapper inherited from the [Encoder](https://quaterion-models.qdrant.tech/quaterion_models.encoders.encoder.html) class.

Let's create our encoder in `encoder.py`

```python
import os

from torch import Tensor, nn
from sentence_transformers.models import Transformer, Pooling

from quaterion_models.encoders import Encoder
from quaterion_models.types import TensorInterchange, CollateFnType


class FAQEncoder(Encoder):
    def __init__(self, transformer, pooling):
        super().__init__()
        self.transformer = transformer
        self.pooling = pooling
        self.encoder = nn.Sequential(self.transformer, self.pooling)
        
    @property
    def trainable(self) -> bool:
        # Defines if we want to train encoder itself, or head layer only
        return False
    
    @property    
    def embedding_size(self) -> int:
        return self.transformer.get_word_embedding_dimension()
    
    def forward(self, batch: TensorInterchange) -> Tensor:
        return self.encoder(batch)["sentence_embedding"]
    
    def get_collate_fn(self) -> CollateFnType:
        return self.transformer.tokenize
    
    @staticmethod
    def _transformer_path(path: str):
        return os.path.join(path, "transformer")
    
    @staticmethod
    def _pooling_path(path: str):
        return os.path.join(path, "pooling")
    
    def save(self, output_path: str):
        transformer_path = self._transformer_path(output_path)
        os.makedirs(transformer_path, exist_ok=True)
        pooling_path = self._pooling_path(output_path)
        os.makedirs(pooling_path, exist_ok=True)
        self.transformer.save(transformer_path)
        self.pooling.save(pooling_path)
        
    @classmethod
    def load(cls, input_path: str) -> Encoder:
        transformer = Transformer.load(cls._transformer_path(input_path))
        pooling = Pooling.load(cls._pooling_path(input_path))
        return cls(transformer=transformer, pooling=pooling)
```

As you can notice, there are more methods implemented, then we've already discussed. Let's go 
through them now!
- In `__init__` we register our pre-trained layers, similar as you do in [torch.nn.Module](https://pytorch.org/docs/stable/generated/torch.nn.Module.html) descendant.

- `trainable` defines whether current `Encoder` layers should be updated during training or not. If `trainable=False`, then all layers will be frozen. 

- `embedding_size` is a size of encoder's output, it is required for proper `head` configuration.

- `get_collate_fn` is a tricky one. Here you should return a method which prepares a batch of raw 
data into the input, suitable for the encoder. If `get_collate_fn` is not overridden, then the [default_collate](https://pytorch.org/docs/stable/data.html#torch.utils.data.default_collate) will be used. 


The remaining methods are considered self-describing.

As our encoder is ready, we now are able to fill `configure_encoders`.
Just insert the following code into `model.py`:

```python
...
from sentence_transformers import SentenceTransformer
from sentence_transformers.models import Transformer, Pooling
from faq.encoder import FAQEncoder

class FAQModel(TrainableModel):
    ...
    def configure_encoders(self) -> Union[Encoder, Dict[str, Encoder]]:
        pre_trained_model = SentenceTransformer("all-MiniLM-L6-v2")
        transformer: Transformer = pre_trained_model[0]
        pooling: Pooling = pre_trained_model[1]
        encoder = FAQEncoder(transformer, pooling)
        return encoder
```

### Data preparation

Okay, we have raw data and a trainable model. But we don't know yet how to feed this data to our model.


Currently, Quaterion takes two types of similarity representation - pairs and groups. 

The groups format assumes that all objects split into groups of similar objects. All objects inside
one group are similar, and all other objects outside this group considered dissimilar to them.

But in the case of pairs, we can only assume similarity between explicitly specified pairs of objects.

We can apply any of the approaches with our data, but pairs one seems more intuitive.

The format in which Similarity is represented determines which loss can be used.
For example, _ContrastiveLoss_ and _MultipleNegativesRankingLoss_ works with pairs format.

[SimilarityPairSample](https://quaterion.qdrant.tech/quaterion.dataset.similarity_samples.html#quaterion.dataset.similarity_samples.SimilarityPairSample) could be used to represent pairs. 
Let's take a look at it:

```python
@dataclass
class SimilarityPairSample:
    obj_a: Any
    obj_b: Any
    score: float = 1.0
    subgroup: int = 0
```

Here might be some questions: what `score` and `subgroup` are?

Well, `score` is a measure of expected samples similarity. 
If you only need to specify if two samples are similar or not, you can use `1.0` and `0.0` respectively.

`subgroups` parameter is required for more granular description of what negative examples could be.
By default, all pairs belong the subgroup zero.
That means that we would need to specify all negative examples manually.
But in most cases, we can avoid this by enabling different subgroups.
All objects from different subgroups will be considered as negative examples in loss, and thus it 
provides a way to set negative examples implicitly.


With this knowledge, we now can create our `Dataset` class in `dataset.py` to feed our model:

```python
import json
from typing import List, Dict

from torch.utils.data import Dataset
from quaterion.dataset.similarity_samples import SimilarityPairSample


class FAQDataset(Dataset):
    """Dataset class to process .jsonl files with FAQ from popular cloud providers."""
    
    def __init__(self, dataset_path):
        self.dataset: List[Dict[str, str]] = self.read_dataset(dataset_path)
          
    def __getitem__(self, index) -> SimilarityPairSample:
        line = self.dataset[index]
        question = line["question"]
        # All questions have a unique subgroup
        # Meaning that all other answers are considered negative pairs
        subgroup = hash(question)
        return SimilarityPairSample(
            obj_a=question,
            obj_b=line["answer"], 
            score=1, 
            subgroup=subgroup
        )
      
    def __len__(self):
        return len(self.dataset)
      
    @staticmethod
    def read_dataset(dataset_path) -> List[Dict[str, str]]:
        """Read jsonl-file into a memory."""
        with open(dataset_path, "r") as fd:
            return [json.loads(json_line) for json_line in fd]
```

We assigned a unique subgroup for each question, so all other objects which have different question will be considered as negative examples.

### Evaluation Metric

We still haven't added any metrics to the model. For this purpose Quaterion provides `configure_metrics`.
We just need to override it and attach interested metrics.

Quaterion has some popular retrieval metrics implemented - such as _precision @ k_ or _mean reciprocal rank_. 
They can be found in [quaterion.eval](https://quaterion.qdrant.tech/quaterion.eval.html) package.
But there are just a few metrics, it is assumed that desirable ones will be made by user or taken from another libraries. 
You will probably need to inherit from `PairMetric` or `GroupMetric` to implement a new one.

In `configure_metrics` we need to return a list of `AttachedMetric`.
They are just wrappers around metric instances and helps to log metrics more easily.
Under the hood `logging` is handled by `pytorch-lightning`.
You can configure it as you want - pass required parameters as keyword arguments to `AttachedMetric`.
For additional info visit [logging documentation page](https://pytorch-lightning.readthedocs.io/en/stable/extensions/logging.html)

Let's add mentioned metrics for our `FAQModel`.
Add this code to `model.py`:

```python
...
from quaterion.eval.pair import RetrievalPrecision, RetrievalReciprocalRank
from quaterion.eval.attached_metric import AttachedMetric


class FAQModel(TrainableModel):
    def __init__(self, lr=10e-5, *args, **kwargs):
        self.lr = lr
        super().__init__(*args, **kwargs)
    
    ...
    def configure_metrics(self):
        return [
            AttachedMetric(
                "RetrievalPrecision",
                RetrievalPrecision(k=1),
                prog_bar=True,
                on_epoch=True,
            ),
            AttachedMetric(
                "RetrievalReciprocalRank",
                RetrievalReciprocalRank(),
                prog_bar=True,
                on_epoch=True
            ),
        ]
```

### Fast training with Cache

Quaterion has one more cherry on top of the cake when it comes to non-trainable encoders.
If encoders are frozen, they are deterministic and emit the exact embeddings for the same input data on each epoch. 
It provides a way to avoid repeated calculations and reduce training time.
For this purpose Quaterion has a cache functionality.


Before training starts, the cache runs one epoch to pre-calculate all embeddings with frozen encoders and then store them on a device you chose (currently CPU or GPU).
Everything you need is to define which encoders are trainable or not and set cache settings.
And that's it: everything else Quaterion will handle for you.

To configure cache you need to override `configure_cache` method in `TrainableModel`.
This method should return an instance of [CacheConfig](https://quaterion.qdrant.tech/quaterion.train.cache.cache_config.html#quaterion.train.cache.cache_config.CacheConfig).

Let's add cache to our model:
```python
...
from quaterion.train.cache import CacheConfig, CacheType
...
class FAQModel(TrainableModel):
    ...
    def configure_caches(self) -> Optional[CacheConfig]:
        return CacheConfig(CacheType.AUTO)
    ...
```

[CacheType](https://quaterion.qdrant.tech/quaterion.train.cache.cache_config.html#quaterion.train.cache.cache_config.CacheType) determines how the cache will be stored in memory.


### Training

Now we need to combine all our code together in `train.py` and launch a training process.

```python
import torch
import pytorch_lightning as pl

from quaterion import Quaterion
from quaterion.dataset import PairsSimilarityDataLoader

from faq.dataset import FAQDataset


def train(model, train_dataset_path, val_dataset_path, params):
    use_gpu = params.get("cuda", torch.cuda.is_available())
    
    trainer = pl.Trainer(
        min_epochs=params.get("min_epochs", 1),
        max_epochs=params.get("max_epochs", 500),
        auto_select_gpus=use_gpu,
        log_every_n_steps=params.get("log_every_n_steps", 1),
        gpus=int(use_gpu),
    )
    train_dataset = FAQDataset(train_dataset_path)
    val_dataset = FAQDataset(val_dataset_path)
    train_dataloader = PairsSimilarityDataLoader(
        train_dataset, batch_size=1024
    )
    val_dataloader = PairsSimilarityDataLoader(
        val_dataset, batch_size=1024
    )
    
    Quaterion.fit(model, trainer, train_dataloader, val_dataloader)
    
if __name__ == "__main__":
    import os
    from pytorch_lightning import seed_everything
    from faq.model import FAQModel
    from faq.config import DATA_DIR, ROOT_DIR
    seed_everything(42, workers=True)
    faq_model = FAQModel()
    train_path = os.path.join(
        DATA_DIR, 
        "train_cloud_faq_dataset.jsonl"
    )
    val_path = os.path.join(
        DATA_DIR,
        "val_cloud_faq_dataset.jsonl"
    )
    train(faq_model, train_path, val_path, {})
    faq_model.save_servable(os.path.join(ROOT_DIR, "servable"))
```

Here are a couple of unseen classes, `PairsSimilarityDataLoader`, which is a native dataloader for 
`SimilarityPairSample` objects, and `Quaterion` is an entry point to the training process.

### Dataset-wise evaluation

Up to this moment we've calculated only batch-wise metrics. 
Such metrics can fluctuate a lot depending on a batch size and can be misleading.
It might be helpful if we can calculate a metric on a whole dataset or some large part of it.
Raw data may consume a huge amount of memory, and usually we can't fit it into one batch.
Embeddings, on the contrary, most probably will consume less.

That's where `Evaluator` enters the scene. 
At first, having dataset of `SimilaritySample`, `Evaluator` encodes it via `SimilarityModel` and compute corresponding labels.
After that, it calculates a metric value, which could be more representative than batch-wise ones.

However, you still can find yourself in a situation where evaluation becomes too slow, or there is no enough space left in the memory.
A bottleneck might be a squared distance matrix, which one needs to calculate to compute a retrieval metric.
You can mitigate this bottleneck by calculating a rectangle matrix with reduced size. 
`Evaluator` accepts `sampler` with a sample size to select only specified amount of embeddings.
If sample size is not specified, evaluation is performed on all embeddings. 

Fewer words! Let's add evaluator to our code and finish `train.py`.
  
```python
...
from quaterion.eval.evaluator import Evaluator
from quaterion.eval.pair import RetrievalReciprocalRank, RetrievalPrecision
from quaterion.eval.samplers.pair_sampler import PairSampler
...

def train(model, train_dataset_path, val_dataset_path, params):
    ...

    metrics = {
        "rrk": RetrievalReciprocalRank(),
        "rp@1": RetrievalPrecision(k=1)
    }
    sampler = PairSampler()
    evaluator = Evaluator(metrics, sampler)
    results = Quaterion.evaluate(evaluator, val_dataset, model.model)
    print(f"results: {results}")
```

### Train Results

At this point we can train our model, I do it via `python3 -m faq.train`.

<div class="table-responsive">

|epoch|train_precision@1|train_reciprocal_rank|val_precision@1|val_reciprocal_rank|
|-----|-----------------|---------------------|---------------|-------------------|
|0    |0.650            |0.732                |0.659          |0.741              |
|100  |0.665            |0.746                |0.673          |0.754              |
|200  |0.677            |0.757                |0.682          |0.763              |
|300  |0.686            |0.765                |0.688          |0.768              |
|400  |0.695            |0.772                |0.694          |0.773              |
|500  |0.701            |0.778                |0.700          |0.777              |

</div>

Results obtained with `Evaluator`:

<div class="table-responsive">

| precision@1 | reciprocal_rank |
|-------------|-----------------|
| 0.577       | 0.675           |

</div>

After training all the metrics have been increased.
And this training was done in just 3 minutes on a single gpu!
There is no overfitting and the results are steadily growing, although I think there is still room for improvement and  experimentation.

## Model serving

As you could already notice, Quaterion framework is split into two separate libraries: `quaterion` 
and [quaterion-models](https://quaterion-models.qdrant.tech/).
The former one contains training related stuff like losses, cache, `pytorch-lightning` dependency, etc.
While the latter one contains only modules necessary for serving: encoders, heads and `SimilarityModel` itself.

The reasons for this separation are:

- less amount of entities you need to operate in a production environment
- reduced memory footprint

It is essential to isolate training dependencies from the serving environment cause the training step is usually more complicated.
Training dependencies are quickly going out of control, significantly slowing down the deployment and serving timings and increasing unnecessary resource usage. 


The very last row of `train.py` - `faq_model.save_servable(...)` saves encoders and the model in a fashion that eliminates all Quaterion dependencies and stores only the most necessary data to run a model in production.

In `serve.py` we load and encode all the answers and then look for the closest vectors to the questions we are interested in:

```python
import os
import json

import torch
from quaterion_models.model import SimilarityModel
from quaterion.distances import Distance

from faq.config import DATA_DIR, ROOT_DIR


if __name__ == "__main__":
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    model = SimilarityModel.load(os.path.join(ROOT_DIR, "servable"))
    model.to(device)
    dataset_path = os.path.join(DATA_DIR, "val_cloud_faq_dataset.jsonl")

    with open(dataset_path) as fd:
        answers = [json.loads(json_line)["answer"] for json_line in fd]
    
    # everything is ready, let's encode our answers
    answer_embeddings = model.encode(answers, to_numpy=False)
        
    # Some prepared questions and answers to ensure that our model works as intended
    questions = [
        "what is the pricing of aws lambda functions powered by aws graviton2 processors?",
        "can i run a cluster or job for a long time?",
        "what is the dell open manage system administrator suite (omsa)?",
        "what are the differences between the event streams standard and event streams enterprise plans?",
    ]
    ground_truth_answers = [
        "aws lambda functions powered by aws graviton2 processors are 20% cheaper compared to x86-based lambda functions",
        "yes, you can run a cluster for as long as is required",
        "omsa enables you to perform certain hardware configuration tasks and to monitor the hardware directly via the operating system",
        "to find out more information about the different event streams plans, see choosing your plan",
    ]
    
    # encode our questions and find the closest to them answer embeddings
    question_embeddings = model.encode(questions, to_numpy=False)
    distance = Distance.get_by_name(Distance.COSINE)
    question_answers_distances = distance.distance_matrix(
        question_embeddings, answer_embeddings
    )
    answers_indices = question_answers_distances.min(dim=1)[1]
    for q_ind, a_ind in enumerate(answers_indices):
        print("Q:", questions[q_ind])
        print("A:", answers[a_ind], end="\n\n")
        assert (
            answers[a_ind] == ground_truth_answers[q_ind]
        ), f"<{answers[a_ind]}> != <{ground_truth_answers[q_ind]}>"
```

We stored our collection of answer embeddings in memory and perform search directly in Python. 
For production purposes, it's better to use some sort of vector search engine like [Qdrant](https://github.com/qdrant/qdrant).
It provides durability, speed boost, and a bunch of other features.

So far, we've implemented a whole training process, prepared model for serving and even applied a 
trained model today with `Quaterion`.

Thank you for your time and attention! 
I hope you enjoyed this huge tutorial and will use `Quaterion` for your similarity learning projects.

All ready to use code can be found [here](https://github.com/qdrant/demo-cloud-faq/tree/tutorial). 

Stay tuned!:)