---
draft: false
id: 4
title: Single node filtered search benchmark
description: We proceeded our benchmarks and this time measured how most popular open-source search engines perform filtered search. We chose the same configuration for each engine and tested them on different datasets. These datasets include both synthetic and real-world data with various filters from exact match to presence in geo area or float range.

date: 2023-02-13
weight: 3
---

### Setup and hardware
Setup is exactly the [same](/benchmarks/single-node-speed-benchmark/#hardware) as it was with Single node speed benchmark.
The only difference is that client's machine RAM was increased to 32GB due to cloud provider offers.

### Configuration
We chose the following params for the engines:
m = 16, ef = 128, ef_construct = 128
We parallelized uploading with 16 processes and made search in 8 parallel processes. 

### Datasets

We've generated synthetic datasets to reproduce an isolated environment to check engines under specific conditions.
Their names include type of filter and vector's dimensionality.
E.g. `keyword-100`, means that filter is `keyword match` and dimensionality is `100`, such datasets contains 1,000,000 records.
Not to be cut off from the real world, we also measured performance on datasets from the wild.
They are `arxiv-384` and `h-n-m-2048`.

### Synthetic datasets

> For the sake of brevity, only 100-dimensional datasets were considered in this article
> To look at 2048-dimensional datasets visit [link]().
#### Match keyword or integer

Matching exact value is considered to be a simple filter. 
Nevertheless, not every engine handles it properly.
Looking at `keyword-100` and `int-100` results, we can notice, that Redis and Milvus RPS ratio (filtered search/regular search) is extremely low and fluctuate around 0.01.

<div class="table-responsive">
<h5>keyword-100</h5>

| Engines       | No filters precision | Precision | No filters RPS | RPS  | Precision ratio (Filter/No filter) | RPS ratio (Filter/No filter) |
|---------------|----------------------|-----------|----------------|------|------------------------------------|------------------------------|
| Qdrant        | 0,60                 | 1,0       | 1247           | 1402 | 1,67                               | 1,12                         |
| Weaviate      | 0,35                 | 0,99      | 1060           | 1135 | 2,83                               | 1,07                         |
| Milvus        | 0,44                 | 0,99      | 775            | 20   | 2,25                               | 0,03                         |
| Redis         | 0,35                 | 0,83      | 1510           | 10   | 2,37                               | 0,01                         |
| ElasticSearch | 0,92                 | 0,99      | 81             | 559  | 1,08                               | 6,90                         |

</div>

<div class="table-responsive">
<h5>int-100</h5>

| Engines       | No filters precision | Precision | No filters RPS | RPS  | Precision ratio (Filter/No filter) | RPS ratio (Filter/No filter) |
|---------------|----------------------|-----------|----------------|------|------------------------------------|------------------------------|
| Qdrant        | 0,59                 | 0,99      | 1245           | 1098 | 1,68                               | 0,88                         |
| Weaviate      | 0,35                 | 0,99      | 1014           | 403  | 2,83                               | 0,40                         |
| Milvus        | 0,5                  | 0,95      | 649            | 25   | 1,90                               | 0,04                         |
| Redis         | 0,35                 | 0,99      | 1443           | 171  | 2,83                               | 0,12                         |
| ElasticSearch | 0,92                 | 0,99      | 79             | 223  | 1,08                               | 2,82                         |

</div>

Another interesting dataset is `keyword-100-small-vocab`.
This dataset differs from `keyword-100` by a number of unique payload values.
`keyword-100` contains 10,000 keyword values, thus every filter splits the data into chunks of ~1,000 values.
`keyword-100-small-vocab` contains only `10` unique values, and after filtering, engine need to deal with ~100,000 records.

<div class="table-responsive">
<h5>keyword-100-small-vocab</h5>

| Engines       | No filters precision | Precision | No filters RPS | RPS | Precision ratio (Filter/No filter) | RPS ratio (Filter/No filter) |
|---------------|----------------------|-----------|----------------|-----|------------------------------------|------------------------------|
| Qdrant        | 0,45                 | 0,81      | 678            | 265 | 1,80                               | 0,39                         |
| Weaviate      | 0,19                 | 0,57      | 787            | 282 | 3,00                               | 0,36                         |
| Milvus        | 0,37                 | 0,76      | 406            | 71  | 2,05                               | 0,17                         |
| Redis         | 0,19                 | 0,65      | 922            | 46  | 3,42                               | 0,05                         |
| ElasticSearch | 0,91                 | 0,99      | 18             | 21  | 1,09                               | 1,17                         |

</div>

Overall filtered search precision is lower for this dataset, than it is for `keyword-100`.
It is also fair regular search, thus it is caused by the randomness of the data.
Still, speed ratio degradation for Qdrant and Weaviate is more severe, than it was.
It reflects the need to estimate filter separation ability to make your search app fast and accurate.    

> It might seem that filtered search is more precise than regular one, but we’d like to avoid such conclusion.<br>
> HNSW algorithm might have some difficulties dealing with randomly generated vectors, what can affect precision results.

#### Float range filters

Let's now move to more complex filters.
One of such filters is a float range filter.
These filters allow you to find values which belong to some interval, e.g. (-42.0;42.0).
It is tricky to properly implement float filters and in Qdrant we made **TRICK**. 

<div class="table-responsive">
<h5>range-100</h5>

| Engines       | No filters precision | Precision    | No filters RPS | RPS          | Precision ratio (Filter/No filter) | RPS ratio (Filter/No filter) |
|---------------|----------------------|--------------|----------------|--------------|------------------------------------|------------------------------|
| Qdrant        | 0,59                 | 0,66         | 1261           | 341          | 1,12                               | 0,27                         |
| Weaviate      | 0,35                 | Not finished | 1051           | Not finished | NaN                                | NaN                          |
| Milvus        | 0,44                 | 0.60         | 773            | 120          | 1.36                               | 0.16                         |
| Redis         | 0,35                 | 0,32         | 1386           | 5            | 0.91                               | 0,004                        |
| ElasticSearch | 0,92                 | 0,32         | 77             | 66           | 0.35                               | 0.86                         |

</div>

What a complex filter it is!
Firstly, we decided to interrupt Weaviate search, because after 1 hour of waiting, ETA was ~9hrs.
In addition, Redis decreased its RPS to 0.4% of its no-filter search RPS!
And no wonder why, but ElasticSearch, which usually is more precise with filtered search, lost 0.6 of precision points!
These results demonstrate that despite the importance of float filters, they haven't been properly implemented in most engines.
Among the others, only Qdrant and Milvus showed tolerable results.

#### Geo filters

Another complex filter, which might be not that popular, as float range, is geo radius filter.
This kind of filters allows finding records in your data which are in a vicinity of some geo point.
To add geo filtering support developers encounter similar problems which they have with float range filters.
In Qdrant we made a **TRICK**

<div class="table-responsive">
<h5>geo-radius-100</h5>

| Engines       | No filters precision | Precision     | No filters RPS | RPS           | Precision ratio (Filter/No filter) | RPS ratio (Filter/No filter) |
|---------------|----------------------|---------------|----------------|---------------|------------------------------------|------------------------------|
| Qdrant        | 0,59                 | 0,99          | 1221           | 146           | 1,68                               | 0,12                         |
| Weaviate      | 0,35                 | 0,22          | 1062           | 172           | 0.63                               | 0,16                         |
| Milvus        | 0,44                 | Not supported | 785            | Not supported | NaN                                | NaN                          |
| Redis         | 0,35                 | 0,83          | 1557           | 5             | 2.37                               | 0,01                         |
| ElasticSearch | 0,92                 | 1.0           | 79             | 66            | 1.09                               | 1,77                         |

</div>

As we can see, results worsened with the same trend as with float range.
Only Qdrant and ElasticSearch were able to achieve max precision, however RPS for most engines leaves much to be desired.
And Milvus, in its turn, does not support geo filters at all.

### Real world datasets

#### H-and-M-2048

H-and-M dataset was taken from [H&M Kaggle competition](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations).
Embeddings were obtained by applying EfficientNet to the clothes images.
The dataset contains ~100k records, and all the filters are simple exact keyword matching.

<div class="table-responsive">
<h5>h-and-m-2048</h5>

| Engines       | No filters precision | Precision | No filters RPS | RPS | Precision ratio (Filter/No filter) | RPS ratio (Filter/No filter) |
|---------------|----------------------|-----------|----------------|-----|------------------------------------|------------------------------|
| Qdrant        | 0,99                 | 0,96      | 416            | 303 | 0.97                               | 0,73                         |
| Weaviate      | 0,99                 | 0,95      | 250            | 171 | 0.96                               | 0,68                         |
| Milvus        | 0,99                 | 0.99      | 270            | 66  | 1.00                               | 0,24                         |
| Redis         | 0,99                 | 0,48      | 764            | 208 | 0.48                               | 0,27                         |

</div>

Unfortunately, we can't measure ElasticSearch on this dataset, since it does not support indexing vectors with dimensionality higher than 1024.
Redis unexpectedly halved its precision with filtered search, the others kept high precision values.
In contrast with good precision, all engines lost RPS with filtered search, Qdrant and Weaviate by ~30%, Milvus and Redis by ~75%.

#### Arxiv-384

Another real world dataset was also downloaded from [Kaggle](https://www.kaggle.com/datasets/Cornell-University/arxiv).
It contains information about all the articles published on [arXiv](https://arxiv.org/).
We applied [all-miniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model to the titles and obtained ~2 millions records.
We provided queries with two types of filters: exact match keyword category of the paper, and float range filter to find an article which was published before or after some point of time.

<div class="table-responsive">
<h5>Arxiv-384</h5>

| Engines       | No filters precision | Precision | No filters RPS | RPS | Precision ratio (Filter/No filter) | RPS ratio (Filter/No filter) |
|---------------|----------------------|-----------|----------------|-----|------------------------------------|------------------------------|
| Qdrant        | 0,99                 | 0,93      | 917            | 601 | 0,94                               | 0,66                         |
| Weaviate      | 0,99                 | 0,99      | 808            | 6   | 1,00                               | 0,01                         |
| Milvus        | 0,99                 | 0.99      | 313            | 12  | 1,00                               | 0,04                         |
| Redis         | 0,99                 | 0,50      | 1412           | 209 | 0,51                               | 0,15                         |
| ElasticSearch | 0,63                 | 0.44      | 74             | 90  | 0,70                               | 1,22                         |

</div>

Situation is similar to the previous dataset in terms of precision: Qdrant, Weaviate and Milvus kept their high precision values, and Redis again halved its precision on real data for some unknown reasons.
ElasticSearch also achieved lower precision level. 
Nevertheless, Qdrant experienced approximately the same speed decrease ~30%, but other competitors, such as Weaviate, Milvus and Redis fell to the bottom of their speed, probably due to float range filters.


### Conclusion

Ability of vector search engines to perform filtered search is crucial in modern applications.
According to benchmarking results, there are still lots of gaps in filtered search implementations.
We can say, that at the moment the most viable option is `Qdrant`.
