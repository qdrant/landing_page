---
title: Qdrant on Databricks
weight: 36
---

# Qdrant on Databricks

| Time: 30 min | Level: Intermediate |  |    |
| --- | ----------- | ----------- |----------- |

Databricks is a unified analytics platform for working with big data and AI. It's built around Apache Spark, a powerful open-source distributed computing system that's particularly well-suited for processing large-scale data sets and performing complex analytics tasks.

Apache Spark provides a fast and general-purpose cluster computing framework for big data processing. It's known for its in-memory computing capabilities, which allow it to process data much faster than traditional disk-based systems. It is designed to scale horizontally, meaning it can handle expensive operations like embeddings generation by distributing computation across a cluster of machines. This scalability is crucial when dealing with large datasets.

In this example, we will demonstrate how to vectorize a dataset with both dense and sparse embeddings using Qdrant's [FastEmbed](https://qdrant.github.io/fastembed/) library. We will then load this vectorized data into a Qdrant cluster using the Spark connector on Databricks.

### Setting up a Databricks project

- Set up a **[Databricks cluster](https://docs.databricks.com/en/compute/configure.html)** following the official documentation guidelines.

- Install the **[Qdrant Spark connector](https://qdrant.tech/documentation/frameworks/spark/)** as a library:
  - Navigate to the `Libraries` section in your cluster dashboard.
  - Click on `Install New` at the top-right to open the library installation modal.
  - Search for `io.qdrant:spark:VERSION` in the Maven packages and click on `Install`.

    ![Install the library](/documentation/examples/databricks/library-install.png)

- Create a new **[Databricks notebook](https://docs.databricks.com/en/notebooks/index.html)** on your cluster to begin working with your data and libraries.

### Download a dataset

- **Install the required dependencies:**

```python
%pip install fastembed datasets
```

- **Download the dataset:**

```python
from datasets import load_dataset

dataset_name = "tasksource/med"
dataset = load_dataset(dataset_name, split="train")
# We'll use the first 100 entries from this dataset and exclude some unused columns.
dataset = dataset.select(range(100)).remove_columns(["gold_label", "genre"])
```

- **Convert the dataset into a Spark dataframe:**

```python
dataset.to_parquet("/dbfs/pq.pq")
dataset_df = spark.read.parquet("file:/dbfs/pq.pq")
```

### Vectorizing the data

In this section, we'll be generating both dense and sparse vectors for our data using [FastEmbed](https://qdrant.github.io/fastembed/). We'll create a user-defined function (UDF) to handle this step.

#### Creating the vectorization function

Let's start by defining a function `vectorize` that generates dense and sparse vectors for each row of our dataset.

```python
from fastembed import TextEmbedding, SparseTextEmbedding

def vectorize(partition_data):
    # Initialize dense and sparse models
    dense_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    sparse_model = SparseTextEmbedding(model_name="prithivida/Splade_PP_en_v1")

    for row in partition_data:
        # Generate dense and sparse vectors
        dense_vector = next(dense_model.embed(row.sentence1))
        sparse_vector = next(sparse_model.embed(row.sentence2))

        yield [
            row.sentence1,  # 1st column: original text
            row.sentence2,  # 2nd column: original text
            dense_vector.tolist(),  # 3rd column: dense vector
            sparse_vector.indices.tolist(),  # 4th column: sparse vector indices
            sparse_vector.values.tolist(),  # 5th column: sparse vector values
        ]
```

We're using the [BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5) model for dense embeddings and [prithivida/Splade_PP_en_v1](https://huggingface.co/prithivida/Splade_PP_en_v1) for sparse embeddings.

#### Applying the UDF on our dataframe

Next, let's apply our `vectorize` UDF on our Spark dataframe to generate embeddings.

```python
embeddings = dataset_df.rdd.mapPartitions(vectorize)
```

The `mapPartitions()` method returns a [Resilient Distributed Dataset (RDD)](https://www.databricks.com/glossary/what-is-rdd) which can then be converted to a Spark dataframe along with the specified schema.

#### Building the new Spark dataframe with the vectorized data

We'll now create a new Spark dataframe (`embeddings_df`) with the vectorized data using the specified schema.

```python
from pyspark.sql.types import StructType, StructField, StringType, ArrayType, FloatType, IntegerType

# Define the schema for the new dataframe
schema = StructType([
    StructField("sentence1", StringType()),
    StructField("sentence2", StringType()),
    StructField("dense_vector", ArrayType(FloatType())),
    StructField("sparse_vector_indices", ArrayType(IntegerType())),
    StructField("sparse_vector_values", ArrayType(FloatType()))
])

# Create the new dataframe with the vectorized data
embeddings_df = spark.createDataFrame(data=embeddings, schema=schema)
```

### Uploading the data to Qdrant

- **Create a Qdrant collection:**
  - [Follow the documentation](https://qdrant.docs.buildwithfern.com/api-reference/collections/create-collection) to create a collection with the appropriate configurations. Here's an example request to support both dense and sparse vectors:

  ```json
  PUT /collections/{collection_name}
  {
    "vectors": {
      "dense": {
        "size": 384,
        "distance": "Cosine"
      }
    },
    "sparse_vectors": {
      "sparse": {}
    }
  }
  ```

- **Upload the dataframe to Qdrant:**

```python
embeddings_df.write.format("io.qdrant.spark.Qdrant").option(
    "qdrant_url",
    "<QDRANT_GRPC_URL>",
).option("api_key", "<QDRANT_API_KEY>").option(
    "collection_name", "<QDRANT_COLLECTION_NAME>"
).option(
    "vector_fields", "dense_vector"
).option(
    "vector_names", "dense"
).option(
    "sparse_vector_value_fields", "sparse_vector_values"
).option(
    "sparse_vector_index_fields", "sparse_vector_indices"
).option(
    "sparse_vector_names", "sparse"
).option(
    "schema", embeddings_df.schema.json()
).mode(
    "append"
).save()
```

Ensure to replace the placeholder values (`<QDRANT_GRPC_URL>`, `<QDRANT_API_KEY>`, `<QDRANT_COLLECTION_NAME>`) with your actual values.

The command output you should see is similar to:

```console
Command took 40.37 seconds -- by xxxxx90@xxxxxx.com at 4/17/2024, 12:13:28 PM on fastembed
```

### Gist

That wraps up our tutorial! Feel free to explore more functionalities and experiments with different models, parameters, and features available in Databricks, Spark, and Qdrant.

Happy data engineering!