---
sitemapExclude: True
---

# Question-answering system with Metric learning and Quaterion



Vast amount of tasks in modern machine learning being solved as classification ones. Some of them
are naturally classification tasks, but the others were converged to such. And when you try to
apply an approach, which does not naturally fit your task or data, you risk coming up with 
tricky or bulky solutions, or even with results worse than you could obtain. 

Imagine that you got a new task and decided to solve it with a good old classification approach. 
Firstly, you will need a labeled data. You're lucky, if it came on a plate with the task, but if it 
didn't, you might need to label it manually. And I guess you are already familiar how painful it
may be.

Let's assume you somehow labelled all required data, trained a model, it shows good performance, 
well done! But a day later e.g. your manager said you about a bunch of new data with new classes 
which have to be handled by your model too. And you repeat your pipeline again. Then, two days 
later you've been reached out one more time, you need to update a model again, and again, and 
again. Sounds tedious and expensive for me, does not it for you? But ok, it works, let's keep it as
it is.
 
Ok, that all was a bit abstract, let's come with a more realistic example. Assume your company has
some complicated products or just new clients come quite often. In such situations users have a lot 
of questions. At the beginning, F.A.Q page might be helpful, but amount of questions raises with 
growth of a product. F.A.Q either can't cover everything either become huge and hard to navigate. 
Then you probably have two solutions, bring some automation to the process or hire a support team,
or even both. With the former one, e.g. a chatbot or just smart search could be implemented. 
Obviously, you can come up with classification based decision, e.g. build a bunch of classification
models to sequentially determine question's topic, retrieve documents and extract correct answer 
from them. But as for me - it seems bulky, also it is not that easy to scale as new features and
hence classes delivered. But what if we don't want to build such a pipeline, maybe we can find the 
right answer from the very beginning? And actually we might be able to do this if we replace
classification with metric learning. 

Metric learning is a way to look at a problem from a different angle. It suggests getting rid of 
the classes and instead make decisions based on distance between objects. In our case we would like
a question, and it's answer to be the nearest objects to each other. We can't calculate distance
just between raw strings, we need some intermediate representation - embeddings. Embeddings are
high-dimensional vectors with semantic information in them. As embeddings are vectors, one can
apply simple function to calculate distances between them, like cosine or euclidean. So with metric
learning all we need to provide an answer to a question are the knowledge which answer belongs to
which question, suitable embeddings for them and some distance calculation.

>If you are not familiar with metric learning, we have an 
[article](https://blog.qdrant.tech/neural-search-tutorial-3f034ab13adc) which might be an asset.

Metric learning approach seems a lot simpler than classification in this case, and if you have some
doubts on your mind, let me dispel them. We haven't any resource with exhaustive F.A.Q. which might 
serve as a dataset, so we've scrapped it from sites of popular cloud providers such as AWS, GCP, 
Azure, IBM, Hetzner and YandexCloud. Our dataset consists of almost 8.5k pairs of question and 
answers, you can take a closer look at it [here](https://github.com/qdrant/demo-cloud-faq)

Well, we have data, we need to obtain embeddings for it, but how to do this? It is not a novel
technique in NLP to represent texts as embeddings, thus there are plenty of algorithms and models
to make them. You could hear of Word2Vec, GloVe, ELMo, BERT, all these models can provide text
embeddings. However, it is better to produce embeddings with a model trained for semantic
similarity tasks. For instance, we can find such models at 
[sentence-transformers](https://www.sbert.net/docs/pretrained_models.html). Authors claim that 
`all-mpnet-base-v2` provides the best quality, but let's pick `all-MiniLM-L6-v2` for our tutorial
as it 5x faster and still offers good quality. 

Having all this, we can test our approach. We won't take all our dataset at the moment, but only
a part of it. To measure model's performance we will use two metrics -
[mean reciprocal rank](https://en.wikipedia.org/wiki/Mean_reciprocal_rank) and 
[precision@1](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Precision_at_k).
We have a [ready script](https://github.com/qdrant/demo-cloud-faq/blob/experiments/faq/baseline.py)
for this experiment, let's just launch it now.


| precision@1    | mean_reciprocal_rank |
|----------------|----------------------|
| AWESOME RESULT | MORE AWESOME RESULT  |

That's already quite decent quality, but maybe we can do better?

Actually, we can. Model we used has a good natural language understanding, but it has never seen
our data. Nowadays in such situations usually being applied an approach called `fine-tuning`. In 
fine-tuning you don't need to design a task-specific architecture, but take a model pre-trained on 
another task (e.g. to achieve a general language understanding), apply a couple of layers on top of
it and tune parameters which you need during training. Sounds good, but as metric learning is not
as traditional as classification, it might be a bit inconvenient to build fine-tune a model.
For this reason we built our framework - Quaterion. Quaterion provides a user-friendly interface to
fine-tune metric learning models and use them for serving after all. Let us not be unfounded and 
prepare a model with you.

Before we start, let's create our project and call it `faq`. 

> All project dependencies, utils scripts not covered in the tutorial can be found in the
> [repository](https://github.com/qdrant/demo-cloud-faq/tree/tutorial). 

The main entity in Quaterion is `TrainableModel`. It is a class to make model's building process 
fast and convenient.

`TrainableModel` is a wrapper around `pytorch_lightning.LightningModule`. Lightning handles all the 
training process complexities, like training loop, device managing, etc. and saves user from a 
necessity to implement all this routine manually. Also Lightning's modularity is worth to be 
mentioned. Modularity improves separation of responsibilities, makes code more readable, robust and
easy to write. And these are exactly the features we tried to provide in our metric learning 
framework.

`TrainableModel` is an abstract class whose methods need to be overridden to perform training. 
Mandatory methods are `configure_loss`, `configure_encoders`, `configure_head`, 
`configure_optimizers`. Encoders task is to emit embeddings, usually they are pre-trained models.
Head is a collection of layers we apply on top of the model.
The majority of mentioned methods are quite easy to realise, you'll probably need a couple of 
imports to do that. But `configure_encoders` requires some code:)

Let's create a  `model.py` with model's template and a blank space instead of `configure_encoders` 
at the moment.

```python
from typing import Union, Dict, Optional, Any

from torch import Tensor
from torch.optim import Adam

from quaterion import TrainableModel
from quaterion.loss import MultipleNegativesRankingLoss, SimilarityLoss
from quaterion_models.encoders import Encoder
from quaterion_models.heads import EncoderHead
from quaterion_models.heads.skip_connection_head import SkipConnectionHead


class FAQModel(TrainableModel):
    def __init__(self, lr=10e-2, *args, **kwargs):
        self.lr = lr
        super().__init__(*args, **kwargs)
        
    def configure_optimizers(self):
        return Adam(self.model.parameters(), lr=self.lr)
    
    def configure_loss(self) -> SimilarityLoss:
        return MultipleNegativesRankingLoss(symmetric=True)
    
    def configure_encoders(self) -> Union[Encoder, Dict[str, Encoder]]:
        ...
        
    def configure_head(self, input_embedding_size: int) -> EncoderHead:
        return SkipConnectionHead(input_embedding_size)
```

- `configure_optimizers` is a method provided by Lightning. An eagle-eye of you could notice 
mysterious `self.model` in our implementation, it is actually a `quaterion_models.MetricModel` 
instance. We will cover it later.
- `configure_loss` is a loss function to be used during training. You can choose a ready loss class 
from already implemented in Quaterion.
However, since Quaterion's purpose is not to cover all possible losses, or other entities and 
features of metric learning, but to provide a convenient framework to build and use such models, 
there might not be a desired loss. In this case it is possible to use `PytorchMetricLearningWrapper` 
to bring required loss from `pytorch-metric-learning` library, which has more rich collection of 
losses. Also, you can implement a desired loss yourself.
- `configure_head` - model built via Quaterion is a combination of encoders and a top layer - head.
As with losses, some ready head implementations are provided. They can be found at 
`quaterion_models.heads`.

Here we use `MultipleNegativesRankingLoss`. It is a loss especially good for retrieval tasks. It 
assumes that we pass only positive pairs (similar objects) and considers all other objects outside 
a pair being considered as negative examples. `MultipleNegativesRankingLoss` use cosine to measure 
distance under the hood, but it is a configurable parameter. Quaterion provides several objects to 
calculate similarities or distances. You can find available ones at `quaterion.distances`.

Having our methods described, we can return to `configure_encoders`:)

There is a base class for encoders in quaterion_models - `Encoder`. 
Similar to `TrainableModel`, `Encoder` has some methods and properties which have to be 
implemented. Two properties - `trainable` and `embedding_size` and one method - `forward` are 
required. The other methods have no strict requirement to be overridden, but it's up to you and 
depends on particular task.

We will use the model used in baseline as encoder - `all-MiniLM-L6-v2` from `sentence-transformers`.

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
- In `__init__` we need to register our layers, as `Encoder` is actually `torch.nn.Module` heir.

- `trainable` defines whether current `Encoder` layers should change during training or not. If 
trainable is False, then all layers will be frozen. Quaterion also can cache frozen encoders 
output.

- `embedding_size` is a size of encoder's output, it is required for proper head configuration.

- `get_collate_fn` is a tricky one. Here you should return a method which prepares a batch of raw 
data into encoder suitable input. If `get_collate_fn` is not overridden, then the default 
implementation will be used. The default one is `default_collate` from 
`torch.utils.data._utils.collate`.

The remaining methods are considered self-describing.

As our encoder is ready, we now are able to fill `configure_encoders`. Just insert the following code 
into `model.py`:
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

Ok, we have a model, we have raw data, we know how to prepare input for encoders, we don't know yet
how to pass this data to our model and how it has to look like.


Currently, Quaterion assumes two kind of data representation - pairs and groups. 
In pairs, you should take two objects and label if they are similar or not. It is a suitable input 
for example for _ContrastiveLoss_ or _MultipleNegativesRankingLoss_. 
The groups format assumes that all objects split into groups of similar objects. All objects inside
one group are similar, and all other objects outside this group considered dissimilar to them.

We can apply any of the approaches with our data, but pairs one seems more intuitive.

To represent pairs we have `SimilarityPairSample` in `quaterion.dataset.similarity_samples`. Let's take
a look at it:

```python
@dataclass
class SimilarityPairSample:
    obj_a: Any
    obj_b: Any
    score: float = 1.0
    subgroup: int = 0
```

Here might occur some questions: why `score` is float and what is a `subgroup`?

Well, `score` is a measure of samples similarity, generally it is just being converted into _bool_ - 
_0.0_ into _False_ and all other values into _True_. But you also can make your own implementations
to tune impact of particular pairs on a loss function.

What if we don't use `MultipleNegativesRankingLoss` to take care of negative samples? Then we have
2 ways of feeding our model with negative examples: 
1. construct negative pairs explicitly
2. use subgroups

All objects outside a `subgroup` will be considered as negative examples in loss, and thus it 
provides a way to set negative examples implicitly.

After this introduction we can create our `Dataset` class in `dataset.py` to feed our model:
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

We assigned a unique subgroup for each question-answer pair, so all other objects which do not 
belong to a particular pair will be considered as negative examples.

We still haven't added any metrics to the model. To make any additional evaluations on embeddings, 
we should override `process_results` method of `TrainableModel`.

Quaterion has some popular retrieval metrics such as _precision @ k_ or _mean reciprocal rank_ 
implemented, they can be found in `quaterion.eval` module. But there is quite a few of metrics, it 
is assumed that desirable ones will be made by user or taken from another libraries. You will 
probably need to inherit from `PairMetric` or `GroupMetric` to implement a new one.

Let's add mentioned metrics to our `FAQModel`.
Add this code to `model.py`:

```python
...
from quaterion.utils.enums import TrainStage
from quaterion.eval.pair import RetrievalPrecision, RetrievalReciprocalRank


class FAQModel(TrainableModel):
    def __init__(self, lr=10e-5, *args, **kwargs):
        self.lr = lr
        super().__init__(*args, **kwargs)
        self.retrieval_precision = RetrievalPrecision(k=1)
        self.retrieval_reciprocal_rank = RetrievalReciprocalRank()
    
    ...
    def process_results(
        self,
        embeddings: Tensor,
        targets: Dict[str, Any],
        batch_idx: int,
        stage: TrainStage,
        **kwargs,
    ):
        device = embeddings.device

        self.retrieval_reciprocal_rank.update(
            embeddings, 
            **targets, 
            device=device
        )

        self.log(
            f"{stage}.rrk",
            self.retrieval_reciprocal_rank.compute().mean(),
            prog_bar=True,
            on_step=False,
            on_epoch=True
        )
        self.retrieval_reciprocal_rank.reset()

        self.retrieval_precision.update(
            embeddings,
            **targets, 
            device=device
        )
        self.log(
            f"{stage}.rp@1",
            self.retrieval_precision.compute().mean(),
            on_step=False,
            on_epoch=True,
            prog_bar=True,
        )

        self.retrieval_precision.reset()
```

When we calculate metrics like this, they can fluctuate a lot depending on a batch size. It might 
be useful to calculate metrics not among batch but among whole available dataset, similar to a real
application. Unfortunately, it is not always possible to send a whole dataset inside one batch:)
Raw data may consume a huge amount of memory, but embeddings most probably will consume less. 
Quaterion metrics are designed to accumulate embeddings across batches (via `update` call) and then 
`compute` them, when you want, e.g. before validation starts or right after its end (you can 
override callback).

However, in this particular `process_result` implementation, we calculate new values per-batch.

Quaterion has one more cherry on top of the cake when it comes to non-trainable encoders. If 
encoders are frozen, they are deterministic and emits exactly the same embeddings for the same 
input data each epoch. So why not to avoid repeated embeddings calculations and reduce training 
time? Actually, Quaterion has a cache exactly for this purpose.

Before training starts, cache runs one epoch to calculate all embeddings from frozen encoders and 
then store them on a device you chose (currently CPU or GPU). Everything you need to do is to 
define which encoders are trainable and which are not and set cache settings. And that's it: 
everything else Quaterion will handle for you.

To configure cache you need override `configure_cache` method in `TrainableModel`. This method 
should return instance of `CacheConfig` object, in most of the situations it will just point to 
device on which you want to store calculated embeddings and set `batch_size` to be used during 
caching.

Let's add cache to our model:
```python
...
from quaterion.train.cache import CacheConfig, CacheType
...
class FAQModel(TrainableModel):
    ...
    def configure_caches(self) -> Optional[CacheConfig]:
        return CacheConfig(CacheType.AUTO, batch_size=1024)
    ...
```

`CacheType` determines device to store embeddings, `AUTO` chooses GPU if it is available, else CPU.
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
`SimilarityPairSample` objects, and `Quaterion` as an entry point to training process.

As you could already notice, Quaterion framework is split into two separate libraries: Quaterion 
and Quaterion-models. The former one contains training related stuff like losses, cache, 
`pytorch-lightning` dependency, etc. While the latter one contains only necessary for serving 
modules: encoders, heads and `MetricModel` itself. The most important benefits here are:
- less amount of entities you need to operate in a production environment
- reduced memory footprint. (Memory footprint is important, because there are plenty of libraries in 
the wild which make you download all auxiliary modules and dependencies due to their architecture 
decisions and cause your project or your docker images to blow up and lead to e.g. significance 
growth of deployment time.)

The very last row of `train.py` - `faq_model.save_servable(...)` saves encoders and model in a 
fashion eliminating all Quaterion dependencies and storing only the most necessary data to run a 
model in a production.
At this point we should train our model, I do it via `python3 -m faq.train`.

|epoch|train_precision@1|train_reciprocal_rank|val_precision@1|val_reciprocal_rank|
|-----|-----------------|---------------------|---------------|-------------------|
|0    |0.650            |0.732                |0.659          |0.741              |
|100  |0.665            |0.746                |0.673          |0.754              |
|200  |0.677            |0.757                |0.682          |0.763              |
|300  |0.686            |0.765                |0.688          |0.768              |
|400  |0.695            |0.772                |0.694          |0.773              |
|500  |0.701            |0.778                |0.700          |0.777              |


After training all the metrics have been increased. Of course one can say, that growth is 
insignificant, but all this training was done in 3 minutes on a single gpu! There is no overfitting
and the results are steadily growing, although I think there is still room for improvement and 
experimentation.

The only remaining part is serving. It's time to sort it out.

As we got rid of Quaterion dependency, we need a new means to supply our model with data. We can 
just create a new dataset and dataloader dependent only on torch for it:

```python
import os 
import json
from typing import List

import torch
from torch.utils.data import DataLoader, Dataset


class ServeFAQDataset(Dataset):
    "Dataset class to process .jsonl files with FAQ from popular cloud providers"""
    def __init__(self, dataset_path):
        self.dataset: List[str] = self.read_dataset(dataset_path)
            
    def __getitem__(self, index) -> str:
        return self.dataset[index]
    
    def __len__(self):
        return len(self.dataset)
    
    @staticmethod
    def read_dataset(dataset_path) -> List[str]:
        with open(dataset_path) as fd:
            return [json.loads(json_line)["answer"] for json_line in fd]
```

It is our new dataset, it looks pretty concise and brief for me, doesn't it for you?

Nevertheless, we are ready for serving, let's extend our `serve.py` and finish this extensive 
tutorial:)

```python
...
from quaterion_models.model import MetricModel
from quaterion.distances import Distance
from faq.config import DATA_DIR, ROOT_DIR
...

if __name__ == "__main__":
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    model = MetricModel.load(os.path.join(ROOT_DIR, "servable"))
    model.to(device)
    path = os.path.join(DATA_DIR, "val_cloud_faq_dataset.jsonl")
    dataset = ServeFAQDataset(path)
    dataloader = DataLoader(dataset)
    
    # everything is ready, let's encode our answers
    answer_embeddings = torch.Tensor().to(device)
    for batch in dataloader:
        answer_embeddings = torch.cat(
            [answer_embeddings, model.encode(batch, to_numpy=False)]
        )
        
    # probably it's worthwhile to index your vectors and search among them with some kind of vector search engine like Qdrant :)
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
        print("A:", dataset[a_ind], end='\n\n')
        assert (
            dataset[a_ind] == ground_truth_answers[q_ind]
        ), f"<{dataset[a_ind]}> != <{ground_truth_answers[q_ind]}>"
```

We stored our collection of answer embeddings in memory and perform search directly in Python. 
For production purposes, it's probably better to use some sort of vector search engine like Qdrant 
to get durability, speed boost, and a bunch of other features.

So far, we've implemented a whole training process, prepared model for serving and even applied a 
trained model today with Quaterion.

Thank you for being with us. I hope you enjoyed this huge tutorial and will use Quaterion for your 
metric learning projects.

All ready to use code can be found [here](https://github.com/qdrant/demo-cloud-faq/tree/tutorial). 

Stay tuned!:)