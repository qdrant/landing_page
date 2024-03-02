---
title: Apache Spark
weight: 1400
aliases: [ ../integrations/spark/ ]
---

# Apache Spark

[Apache Spark](https://spark.apache.org/) is a distributed computing framework designed for big data processing and analytics. This connector enables [Qdrant](https://qdrant.tech/) to be a storage destination in Spark.

## Installation

You can set up the Qdrant-Spark Connector in a few different ways, depending on your preferences and requirements.

### GitHub Releases

The simplest way to get started is by downloading pre-packaged JAR file releases from the [Qdrant-Spark GitHub releases page](https://github.com/qdrant/qdrant-spark/releases). These JAR files come with all the necessary dependencies to get you going.

### Building from Source

If you prefer to build the JAR from source, you'll need [JDK 8](https://www.azul.com/downloads/#zulu) and [Maven](https://maven.apache.org/) installed on your system. Once you have the prerequisites in place, navigate to the project's root directory and run the following command:

```bash
mvn package
```

This command will compile the source code and generate a fat JAR, which will be stored in the `target` directory by default.

### Maven Central

For use with Java and Scala projects, the package can be found [here](https://central.sonatype.com/artifact/io.qdrant/spark).

## Getting Started

After successfully installing the Qdrant-Spark Connector, you can start integrating Qdrant with your Spark applications. Below, we'll walk through the basic steps of creating a Spark session with Qdrant support and loading data into Qdrant.

### Creating a single-node Spark session with Qdrant Support

To begin, import the necessary libraries and create a Spark session with Qdrant support. Here's how:

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.config(
        "spark.jars",
        "spark-VERSION.jar",  # Specify the downloaded JAR file
    )
    .master("local[*]")
    .appName("qdrant")
    .getOrCreate()
```

```scala
import org.apache.spark.sql.SparkSession

val spark = SparkSession.builder
  .config("spark.jars", "spark-VERSION.jar") // Specify the downloaded JAR file
  .master("local[*]")
  .appName("qdrant")
  .getOrCreate()
```

```java
import org.apache.spark.sql.SparkSession;

public class QdrantSparkJavaExample {
    public static void main(String[] args) {
        SparkSession spark = SparkSession.builder()
                .config("spark.jars", "spark-VERSION.jar") // Specify the downloaded JAR file
                .master("local[*]")
                .appName("qdrant")
                .getOrCreate(); 
    }
}
```

### Loading data into Qdrant

<aside role="status">Before loading the data using this connector, a collection has to be <a href="https://qdrant.tech/documentation/concepts/collections/#create-a-collection">created</a> in advance with the appropriate vector dimensions and configurations.</aside>

The connector supports ingesting multiple named/unnamed, dense/sparse vectors.

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

You can use the `qdrant-spark` connector as a library in [Databricks](https://www.databricks.com/) to ingest data into Qdrant.

- Go to the `Libraries` section in your cluster dashboard.
- Select `Install New` to open the library installation modal.
- Search for `io.qdrant:spark:VERSION` in the Maven packages and click `Install`.

![Databricks](/documentation/frameworks/spark/databricks.png)

## Datatype Support

Qdrant supports all the Spark data types, and the appropriate data types are mapped based on the provided schema.

## Options and Spark types 🛠️

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

For more information, be sure to check out the [Qdrant-Spark GitHub repository](https://github.com/qdrant/qdrant-spark). The Apache Spark guide is available [here](https://spark.apache.org/docs/latest/quick-start.html). Happy data processing!
