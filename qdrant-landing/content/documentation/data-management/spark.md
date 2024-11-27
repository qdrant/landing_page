---
title: Apache Spark
aliases: [ ../integrations/spark/, ../frameworks/spark/ ]
---

# Apache Spark

[Spark](https://spark.apache.org/) is a distributed computing framework designed for big data processing and analytics. The [Qdrant-Spark connector](https://github.com/qdrant/qdrant-spark) enables Qdrant to be a storage destination in Spark.

## Installation

You can set up the Qdrant-Spark Connector in a few different ways, depending on your preferences and requirements.

### GitHub Releases

You can download the packaged JAR file from the [GitHub releases](https://github.com/qdrant/qdrant-spark/releases). It comes with all the required dependencies.

### Building from Source

To build the JAR from source, you'll need [JDK 8](https://www.azul.com/downloads/#zulu) and [Maven](https://maven.apache.org/) installed on your system. Once you have those in place, navigate to the project's root directory and run the following command:

```bash
mvn package -DskipTests
```

This will compile the source code and generate a fat JAR, which will be stored in the `target` directory by default.

### Maven Central

The package can be found [here](https://central.sonatype.com/artifact/io.qdrant/spark).

## Usage

Below, we'll walk through the steps of creating a Spark session and ingesting data into Qdrant.

To begin, import the necessary libraries and create a Spark session with Qdrant support:

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.config(
        "spark.jars",
        "spark-VERSION.jar",  # Specify the path to the downloaded JAR file
    )
    .master("local[*]")
    .appName("qdrant")
    .getOrCreate()
```

```scala
import org.apache.spark.sql.SparkSession

val spark = SparkSession.builder
  .config("spark.jars", "spark-VERSION.jar") // Specify the path to the downloaded JAR file
  .master("local[*]")
  .appName("qdrant")
  .getOrCreate()
```

```java
import org.apache.spark.sql.SparkSession;

public class QdrantSparkJavaExample {
    public static void main(String[] args) {
        SparkSession spark = SparkSession.builder()
                .config("spark.jars", "spark-VERSION.jar") // Specify the path to the downloaded JAR file
                .master("local[*]")
                .appName("qdrant")
                .getOrCreate(); 
    }
}
```

<aside role="status">Before loading the data using this connector, a collection has to be <a href="/documentation/concepts/collections/#create-a-collection">created</a> in advance with the appropriate vector dimensions and configurations.</aside>

The connector supports ingesting multiple named/unnamed, dense/sparse vectors.

_Click each to expand._

<details>
  <summary><b>Unnamed/Default vector</b></summary>

```python
  <pyspark.sql.DataFrame>
   .write
   .format("io.qdrant.spark.Qdrant")
   .option("qdrant_url", <QDRANT_GRPC_URL>)
   .option("collection_name", <QDRANT_COLLECTION_NAME>)
   .option("embedding_field", <EMBEDDING_FIELD_NAME>)  # Expected to be a field of type ArrayType(FloatType)
   .option("schema", <pyspark.sql.DataFrame>.schema.json())
   .mode("append")
   .save()
```

</details>

<details>
  <summary><b>Named vector</b></summary>

```python
  <pyspark.sql.DataFrame>
   .write
   .format("io.qdrant.spark.Qdrant")
   .option("qdrant_url", <QDRANT_GRPC_URL>)
   .option("collection_name", <QDRANT_COLLECTION_NAME>)
   .option("embedding_field", <EMBEDDING_FIELD_NAME>)  # Expected to be a field of type ArrayType(FloatType)
   .option("vector_name", <VECTOR_NAME>)
   .option("schema", <pyspark.sql.DataFrame>.schema.json())
   .mode("append")
   .save()
```

> #### NOTE
>
> The `embedding_field` and `vector_name` options are maintained for backward compatibility. It is recommended to use `vector_fields` and `vector_names` for named vectors as shown below.

</details>

<details>
  <summary><b>Multiple named vectors</b></summary>

```python
  <pyspark.sql.DataFrame>
   .write
   .format("io.qdrant.spark.Qdrant")
   .option("qdrant_url", "<QDRANT_GRPC_URL>")
   .option("collection_name", "<QDRANT_COLLECTION_NAME>")
   .option("vector_fields", "<COLUMN_NAME>,<ANOTHER_COLUMN_NAME>")
   .option("vector_names", "<VECTOR_NAME>,<ANOTHER_VECTOR_NAME>")
   .option("schema", <pyspark.sql.DataFrame>.schema.json())
   .mode("append")
   .save()
```

</details>

<details>
  <summary><b>Sparse vectors</b></summary>

```python
  <pyspark.sql.DataFrame>
   .write
   .format("io.qdrant.spark.Qdrant")
   .option("qdrant_url", "<QDRANT_GRPC_URL>")
   .option("collection_name", "<QDRANT_COLLECTION_NAME>")
   .option("sparse_vector_value_fields", "<COLUMN_NAME>")
   .option("sparse_vector_index_fields", "<COLUMN_NAME>")
   .option("sparse_vector_names", "<SPARSE_VECTOR_NAME>")
   .option("schema", <pyspark.sql.DataFrame>.schema.json())
   .mode("append")
   .save()
```

</details>

<details>
  <summary><b>Multiple sparse vectors</b></summary>

```python
  <pyspark.sql.DataFrame>
   .write
   .format("io.qdrant.spark.Qdrant")
   .option("qdrant_url", "<QDRANT_GRPC_URL>")
   .option("collection_name", "<QDRANT_COLLECTION_NAME>")
   .option("sparse_vector_value_fields", "<COLUMN_NAME>,<ANOTHER_COLUMN_NAME>")
   .option("sparse_vector_index_fields", "<COLUMN_NAME>,<ANOTHER_COLUMN_NAME>")
   .option("sparse_vector_names", "<SPARSE_VECTOR_NAME>,<ANOTHER_SPARSE_VECTOR_NAME>")
   .option("schema", <pyspark.sql.DataFrame>.schema.json())
   .mode("append")
   .save()
```

</details>

<details>
  <summary><b>Combination of named dense and sparse vectors</b></summary>

```python
  <pyspark.sql.DataFrame>
   .write
   .format("io.qdrant.spark.Qdrant")
   .option("qdrant_url", "<QDRANT_GRPC_URL>")
   .option("collection_name", "<QDRANT_COLLECTION_NAME>")
   .option("vector_fields", "<COLUMN_NAME>,<ANOTHER_COLUMN_NAME>")
   .option("vector_names", "<VECTOR_NAME>,<ANOTHER_VECTOR_NAME>")
   .option("sparse_vector_value_fields", "<COLUMN_NAME>,<ANOTHER_COLUMN_NAME>")
   .option("sparse_vector_index_fields", "<COLUMN_NAME>,<ANOTHER_COLUMN_NAME>")
   .option("sparse_vector_names", "<SPARSE_VECTOR_NAME>,<ANOTHER_SPARSE_VECTOR_NAME>")
   .option("schema", <pyspark.sql.DataFrame>.schema.json())
   .mode("append")
   .save()
```

</details>

<details>
  <summary><b>No vectors - Entire dataframe is stored as payload</b></summary>

```python
  <pyspark.sql.DataFrame>
   .write
   .format("io.qdrant.spark.Qdrant")
   .option("qdrant_url", "<QDRANT_GRPC_URL>")
   .option("collection_name", "<QDRANT_COLLECTION_NAME>")
   .option("schema", <pyspark.sql.DataFrame>.schema.json())
   .mode("append")
   .save()
```

</details>

## Databricks

<aside role="status">
    <p>Check out our <a href="/documentation/send-data/databricks/" target="_blank">example</a> of using the Spark connector with Databricks.</p>
</aside>

You can use the `qdrant-spark` connector as a library in [Databricks](https://www.databricks.com/).

- Go to the `Libraries` section in your Databricks cluster dashboard.
- Select `Install New` to open the library installation modal.
- Search for `io.qdrant:spark:VERSION` in the Maven packages and click `Install`.

![Databricks](/documentation/frameworks/spark/databricks.png)

## Datatype Support

Qdrant supports most Spark data types, and the appropriate data types are mapped based on the provided schema.

## Configuration Options

| Option                       | Description                                                         | Column DataType               | Required |
| :--------------------------- | :------------------------------------------------------------------ | :---------------------------- | :------- |
| `qdrant_url`                 | GRPC URL of the Qdrant instance. Eg: <http://localhost:6334>        | -                             | ✅       |
| `collection_name`            | Name of the collection to write data into                           | -                             | ✅       |
| `schema`                     | JSON string of the dataframe schema                                 | -                             | ✅       |
| `embedding_field`            | Name of the column holding the embeddings                           | `ArrayType(FloatType)`        | ❌       |
| `id_field`                   | Name of the column holding the point IDs. Default: Random UUID      | `StringType` or `IntegerType` | ❌       |
| `batch_size`                 | Max size of the upload batch. Default: 64                           | -                             | ❌       |
| `retries`                    | Number of upload retries. Default: 3                                | -                             | ❌       |
| `api_key`                    | Qdrant API key for authentication                                   | -                             | ❌       |
| `vector_name`                | Name of the vector in the collection.                               | -                             | ❌       |
| `vector_fields`              | Comma-separated names of columns holding the vectors.               | `ArrayType(FloatType)`        | ❌       |
| `vector_names`               | Comma-separated names of vectors in the collection.                 | -                             | ❌       |
| `sparse_vector_index_fields` | Comma-separated names of columns holding the sparse vector indices. | `ArrayType(IntegerType)`      | ❌       |
| `sparse_vector_value_fields` | Comma-separated names of columns holding the sparse vector values.  | `ArrayType(FloatType)`        | ❌       |
| `sparse_vector_names`        | Comma-separated names of the sparse vectors in the collection.      | -                             | ❌       |
| `shard_key_selector`         | Comma-separated names of custom shard keys to use during upsert.    | -                             | ❌       |

For more information, be sure to check out the [Qdrant-Spark GitHub repository](https://github.com/qdrant/qdrant-spark). The Apache Spark guide is available [here](https://spark.apache.org/docs/latest/quick-start.html). Happy data processing!
