---
title: Layer Recycling and Fine-tuning Efficiency
short_description: Tradeoff between speed and performance in layer recycling
description: Learn when and how to use layer recycling to achieve different performance targets.
preview_image: /articles_data/embedding-recycling/preview.jpeg
small_preview_image: /articles_data/embedding-recycling/icon.svg
weight: 10
author: Yusuf Sarıgöz
author_link: https://medium.com/@yusufsarigoz
date: 2022-07-20T13:00:00+03:00
draft: true
---

A recent [paper](https://arxiv.org/abs/2207.04993)
by Allen AI has attracted attention in the NLP community as they cache the output of a certain intermediate layer
in the training and inference phases to achieve a speedup of ~83%
with a negligible loss in model performance.
This technique is quite similar to [the caching mechanism in Quaterion](https://quaterion.qdrant.tech/tutorials/cache_tutorial.html),
but the latter is intended for any data modalities while the former focuses only on language models
despite presenting inportant insights from their experiments.
In this post, I will share our findings combined with those,
hoping to provide the community with a wider perspective on layer recycling.

## How layer recycling works
The main idea of layer recycling is to accelerate the training (and inference)
by avoiding repeated passes of the same data object through the frozen layers.
Instead, it is possible to pass objects through those layers only once,
cache the output
and use them as inputs to the unfrozen layers in future epochs.

In the paper, they usually cache 50% of the layers, e.g., the output of the 6th multi-head self-attention block in a 12-block encoder.
However, they find out that it does not work equally for all the tasks.
For example, the question answering task suffers from a greater degradation in performance with 50% of the layers recycled,
and they choose to lower it down to 25% for this task,
so they suggest determining the level of caching based on the task at hand.
they also note that caching provides a more considerable speedup for larger models and on lower-end machines.

In layer recycling, the cache is hit for exactly the same object.
It is easy to achieve this in textual data as it is easily hashable,
but you may need more advanced tricks to generate keys for the cache
when you want to generalize this technique to any other domain.
Quaterion comes with an intelligent key extractor that may be applied any data type,
but it is also allowed to customize it with a callable passed as as an argument.
Thanks to this flexibility, we were able to run a variety of experiments in different setups,
and I believe that these findings will be helpful for your future projects.

## Experiments
We conducted different experiments to test the performance with:
1. Different numbers of layers recycled in [the similar cars search example](https://quaterion.qdrant.tech/tutorials/cars-tutorial.html).
2. Different numbers of samples in the dataset for training and fine-tuning.
3. Different numbers of layers recycled in [the question answerring example](https://quaterion.qdrant.tech/tutorials/nlp_tutorial.html).

## Easy layer recycling with Quaterion
The easiest way of caching layers in Quaterion is to compose a [TrainableModel](https://quaterion.qdrant.tech/quaterion.train.trainable_model.html#quaterion.train.trainable_model.TrainableModel)
with a frozen [Encoder](https://quaterion-models.qdrant.tech/quaterion_models.encoders.encoder.html#quaterion_models.encoders.encoder.Encoder)
and an unfrozen [EncoderHead](https://quaterion-models.qdrant.tech/quaterion_models.heads.encoder_head.html#quaterion_models.heads.encoder_head.EncoderHead).
Therefore, we modified the `TrainableModel` in the [example](https://github.com/qdrant/quaterion/blob/master/examples/cars/models.py)
as in the following:

```python
class Model(TrainableModel):
    ...


    def configure_encoders(self) -> Union[Encoder, Dict[str, Encoder]]:
        pre_trained_encoder = torchvision.models.resnet34(pretrained=True)
        self.avgpool = copy.deepcopy(pre_trained_encoder.avgpool)
        self.finetuned_block = copy.deepcopy(pre_trained_encoder.layer4)
        modules = []

        for name, child in pre_trained_encoder.named_children():
            modules.append(child)
            if name == "layer3":
                break

        pre_trained_encoder = nn.Sequential(*modules)
        
        return CarsEncoder(pre_trained_encoder)

    def configure_head(self, input_embedding_size) -> EncoderHead:
        return SequentialHead(self.finetuned_block,
        self.avgpool,
        nn.Flatten(),
        SkipConnectionHead(512, dropout=0.3, skip_dropout=0.2),
        output_size=512)
    ...
```

This trick lets us finetune one more layers from the base model as a part of the `EncoderHead`
while still benefiting from the speedup in the frozen `Encoder` provided by the cache.
