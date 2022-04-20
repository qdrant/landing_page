# Question-answering system with Metric learning and Quaterion

There are vast amount of tasks in modern machine learning which are being decided as classification 
tasks. Some of them are naturally classification tasks and some of them were converged to such, it 
is not a rare case. Seeing a new problem, the most of us start with an endeavour to solve it with 
an approach we already applied to other tasks? It is a well-known way, it probably might be 
implemented with less effort and so on. The main drawback of such an approach is that it is a part 
of supervised learning.

Supervised learning assumes that in our dataset besides data objects themselves we also have labels
determining to which class our objects belong to. There are more unlabelled data in the wild, 
rather labelled one and data labelling might be a really time-consuming and expensive task, since 
modern models requires huge amount of data.

Well, today we are going to solve a problem without a classification approach. We will build a 
question-answering system which makes its decisions based on distances between questions and 
answers. A technique which solves problems by analysing distances between objects is metric 
learning.

Metric learning might be used both in supervised and unsupervised learning. Today we are going to 
work with the latter one. Our dataset contains questions and answers downloaded from F.A.Q. pages 
of popular cloud providers, such as AWS, GCP, etc.

It's a common practice in NLP to represent texts as a collection of high-dimensional vectors, also 
called _embeddings_. And to measure distance between embeddings one can just compute cosine or 
euclidean distances. Then nothing prevents us from training a model which is capable of placing 
embeddings from the same question-answer pair close in space and embeddings from different pairs 
far from each other. Then the nearest to question embedding will be it's right answer. 
And that's it! Also, we don't need any classes and might be able to add new questions and answers 
without re-training.

We haven't discussed yet how to obtain embeddings and how to train a model.

As embeddings is not a novel technique in NLP, there are already plenty of algorithms and models 
which can provide suitable representations. There are two general ways to train a model with 
embeddings. One  is when  you use them as features:  apply some model, get embeddings and use them 
as input for your model with a task-specific architecture to emit whatever output you want. This is 
so called _feature-based_ approach, and some of well-known algorithms used here are Word2Vec, GloVe, 
ELMo.

Quaterion, however, encourages another approach &ndash; _fine-tuning_. In fine-tuning you take a 
model pre-trained on another task (e.g. to achieve a general language understanding), apply a 
couple of layers on top of it and tune parameters which you need during training. In such an 
approach you don't need to generate embeddings explicitly, model's hidden states could be used as 
ones. You also don't need to build a task-specific architecture. In our case we usually just apply 
some linear layers and train model with a metric learning loss to be able to measure distance 
between model's outputs.

One of the most known and easy to understand losses is a Contrastive Loss.
Contrastive loss formula is straightforward:

![contrastive_loss_formula](https://gist.githubusercontent.com/joein/f8318cac8ea1d205ac3533c7d313f459/raw/3f6e754f53fc0b544b36b9f4359b0edcdc0411dd/contrastive_loss_formula.png)
Contrastive loss (http://yann.lecun.com/exdb/publis/pdf/hadsell-chopra-lecun-06.pdf)

It makes similar objects to be close to each other (left part) and pushes away objects marked as 
dissimilar (right part). When distance between dissimilar objects is greater than (m)argin, loss 
stops to push them away, and focuses on similar objects. On the picture you can see how it works. 
After training, the green circles were attracted to each other, the blue one remained at the same 
distance, and the orange circle repelled from the green ones.

![contrastive_loss_image](https://gist.githubusercontent.com/joein/f8318cac8ea1d205ac3533c7d313f459/raw/f3e8049ef5180c8a8fc391edf79641005672be67/contrastive_loss_image.png)
Contrastive loss example

With contrastive loss you need to set which objects are similar and which are not. But in our case 
we have only positive pairs: question and its answer, why would we need to label negative examples?
There is a loss, called multiple negative ranking loss, and it treats all other sentences in a 
batch as negative examples, and it is exactly what we need here.

Having all this theory in mind, let's start practising!

During this tutorial we will need a couple of _utils_ scripts. They  can be found in the repository. 

- `train_val_split.py` - to split data into train and val parts.

- `download_data.sh` - to download data from storage, create data folder and apply train_val_split.

- `config.py` - for universal path usage.

Let's begin with data acquisition. To download and split data you need to
launch `download_data.sh` (don't forget to make it executable with `chmod +x download_data.sh` ).

After data downloading you should see 3 files: `cloud_faq_dataset.jsonl`, 
`train_cloud_faq_dataset.jsonl`, `val_cloud_faq.jsonl`.
Our dataset is pretty imbalanced, but according to experiments, it is not a severe problem for us. 
Let's take a look at a pie plot of our data.


![dataset_pie_plot](https://gist.githubusercontent.com/joein/f8318cac8ea1d205ac3533c7d313f459/raw/f3e8049ef5180c8a8fc391edf79641005672be67/dataset_pie_plot.png)
Cloud providers F.A.Q dataset distribution

A regular record from our datasets will be a JSON object contains four fields:

- source - name of cloud provider to which this particular record belongs to (might be useful in 
experiments, won't be used in this tutorial)

- filename - if F.A.Q is divided into several sections, it is a section name (also won't be used in 
this tutorial)
- question - question in lower case
- answer - answer in lower case

Notices about questions and answers:
may contain unicode characters
joint length of question and its answer does not exceed 384 (just a feature of the data)

As Quaterion suggests usage of fine-tuning approach, a common model built via it will consist of an 
encoder(s) and a head attached upon it. Let's make our one then.

The main entity in Quaterion is `TrainableModel`. It is a class to make model building process fast 
and convenient.

`TrainableModel` is a wrapper around `pytorch_lightning.LightningModule`. Lightning handles all the 
training process complexities, like training loop, device managing, etc. and saves user from a 
necessity to implement all this routine manually. Also Lightning's modularity is worth to be 
mentioned. Modularity improves separation of responsibilities, makes code more readable, robust and
easy to write. And these are exactly the features we tried to provide in our metric learning 
framework.

First, we need to create a package to store our scripts. Let's call it `faq`.
Then we should take a closer look at `TrainableModel`.

`TrainableModel` is an abstract class whose methods need to be overridden to perform training. 
Mandatory methods are `configure_loss`, `configure_encoders`, `configure_head`, 
`configure_optimizers`.
The majority of these methods are quite easy to realise, you'll probably need a couple of imports 
to do that. But `configure_encoders` requires some code:)

Let's create a  `model.py` with model's template and a blank space instead of `configure_encoders` at 
the moment.

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

P.S. all required dependencies can be found in `pyproject.toml` in the repository. If you are not 
familiar with poetry, you can just run this script in your project root:

```shell
#!/bin/bash
python3 -m venv venv  # creates new virtual environment
source venv/bin/activate  # activates virtual environment
pip3 install poetry  # install poetry
poetry install  # install dependencies listed in pyproject.toml
```

- `configure_optimizers` is a method provided by Lightning. An eagle-eye of you could notice mysterious
`self.model` in our implementation, it is actually a `quaterion_models.MetricModel` instance. We will 
cover it later.
- `configure_loss` is a loss function to be used during training. You can choose a ready loss class 
from already implemented in Quaterion.
However, since Quaterion's purpose is not to cover all possible losses, or other entities and 
features of metric learning, but to provide a convenient framework to build and use such models, 
there might not be a desired loss. In this case it is possible to use `PytorchMetricLearningWrapper` 
to bring required loss from `pytorch-metric-learning` library, which has more rich collection of 
losses. Also, you can implement a desired loss yourself.
By default, `MultipleNegativesRankingLoss` use cosine to measure distance under the hood, but it is
a configurable parameter. Quaterion provides several objects to calculate similarities or 
distances. You can find available ones at `quaterion.distances`.
- `configure_head` - model built via Quaterion is a combination of encoders and a top layer - head.
As with losses, some ready head implementations are provided. They can be found at 
`quaterion_models.heads`.

Having our methods described, we can return to `configure_encoders`:)

There is a base class for encoders in quaterion_models - `Encoder`.
Similar to `TrainableModel`, `Encoder` has some methods and properties which have to be 
implemented. Two properties - `trainable` and `embedding_size` and one method - `forward` are 
required. The other methods have no strict requirement to be overridden, but it's up to you and 
depends on particular task.

Our encoder should have noticeable general language understanding to provide embeddings for our 
questions and answers. A nice choice might be to use one of presented in `sentence-transformers`. 
In  our case we will use `all-MiniLM-L6-v2`, as it was trained on a dataset combined from different 
sources with contrastive objective, so it might work well for the task.

Having all this, we can create our first encoder in `encoder.py`:

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

- `get_collate_fn` is a tricky one. Here you should return a method which prepares a batch of raw data 
into encoder suitable input. If `get_collate_fn` is not overridden, then default implementation 
will be used. The default one is `default_collate` from `torch.utils.data._utils.collate`.

The remaining methods are considered self-describing:)

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

Currently, Quaterion assumes two kind of data representation - pairs and groups. In pairs, you 
should label if a couple of objects are similar or dissimilar, for example, it is a suitable input 
for _ContrastiveLoss_. And the groups format assumes that all objects split into groups of similar 
objects. All objects inside one group are similar, and all other objects outside this group 
considered dissimilar to them.

In our case we have a collection of questions and answers. We can use here both approaches, but 
pairs seems more intuitive for this case.

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

Up to this point pairs might look like an absolutely separated entities which can't have any 
relation between them. That's where subgroup came into a play: we can union some pairs into a 
subgroup, so other objects from the same subgroup can't be considered as negative examples, but 
objects from the others subgroups can. By default, all objects are in the same subgroup, so we 
consider only explicitly set links between points.

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


We assign a unique subgroup for each question-answer pair, so all other objects which do not belong 
to a particular pair will be considered as negative examples.

We are already able to train our model, but at the moment the only obvious way to measure its 
performance is loss observations. To make any additional evaluations on embeddings, e.g. perform 
metrics calculation, one should override `process_results` method of `TrainableModel`.

Quaterion has some popular retrieval metrics such as _retrieval precision @ k_ or _retrieval 
reciprocal rank_ implemented, they can be found in `quaterion.eval` module. But there is quite a 
few of metrics, it is assumed that desirable ones will be made by user or taken from another 
libraries. You will probably need to inherit from `PairMetric` or `GroupMetric` to implement a new 
one.

Let's bring it all together and add some visibility and control to our training process. 
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

All ready to use code can be found here: some awesome repo

Stay tuned!:)