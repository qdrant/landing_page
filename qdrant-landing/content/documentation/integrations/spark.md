---
title: Apache Spark
weight: 1400
---

# Apache Spark

[Spark](https://spark.apache.org/) is a leading distributed computing framework that empowers you to work with massive datasets efficiently. When it comes to leveraging the power of Spark for your data processing needs, the [Qdrant-Spark Connector](https://github.com/qdrant/qdrant-spark) is to be considered. This connector enables Qdrant to serve as a storage destination in Spark, offering a seamless bridge between the two.

## Installation

You can set up the Qdrant-Spark Connector in a few different ways, depending on your preferences and requirements.

### GitHub Releases

The simplest way to get started is by downloading pre-packaged JAR file releases from the [Qdrant-Spark GitHub releases page](https://github.com/qdrant/qdrant-spark/releases). These JAR files come with all the necessary dependencies to get you going.

### Building from Source

If you prefer to build the JAR from source, you'll need [JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) and [Maven](https://maven.apache.org/) installed on your system. Once you have the prerequisites in place, navigate to the project's root directory and run the following command:

```bash
mvn package -P assembly
```
This command will compile the source code and generate a fat JAR, which will be stored in the `target` directory by default.

### Maven Central

For Java and Scala projects, you can also obtain the Qdrant-Spark Connector from [Maven Central](https://central.sonatype.com/artifact/io.qdrant/spark).

```xml
<dependency>
    <groupId>io.qdrant</groupId>
    <artifactId>spark</artifactId>
    <version>1.6</version>
</dependency>
```

## Getting Started

After successfully installing the Qdrant-Spark Connector, you can start integrating Qdrant with your Spark applications. Below, we'll walk through the basic steps of creating a Spark session with Qdrant support and loading data into Qdrant.

### Creating a single-node Spark session with Qdrant Support

To begin, import the necessary libraries and create a Spark session with Qdrant support. Here's how:

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.config(
        "spark.jars",
        "spark-1.0-assembly.jar",  # Specify the downloaded JAR file
    )
    .master("local[*]")
    .appName("qdrant")
    .getOrCreate()
```

```scala
import org.apache.spark.sql.SparkSession

val spark = SparkSession.builder
  .config("spark.jars", "spark-1.0-assembly.jar") // Specify the downloaded JAR file
  .master("local[*]")
  .appName("qdrant")
  .getOrCreate()
```

```java
import org.apache.spark.sql.SparkSession;

public class QdrantSparkJavaExample {
    public static void main(String[] args) {
        SparkSession spark = SparkSession.builder()
                .config("spark.jars", "spark-1.0-assembly.jar") // Specify the downloaded JAR file
                .master("local[*]")
                .appName("qdrant")
                .getOrCreate();
        ...
    }
}
```

### Loading Data into Qdrant

<aside role="status">To load data into Qdrant, you'll need to create a collection with the appropriate vector dimensions and configurations in advance.</aside>

Here's how you can use the Qdrant-Spark Connector to upsert data:

```python
<YourDataFrame>
    .write
    .format("io.qdrant.spark.Qdrant")
    .option("qdrant_url", <QDRANT_URL>)  # REST URL of the Qdrant instance
    .option("collection_name", <QDRANT_COLLECTION_NAME>)  # Name of the collection to write data into
    .option("embedding_field", <EMBEDDING_FIELD_NAME>)  # Name of the field holding the embeddings
    .option("schema", <YourDataFrame>.schema.json())  # JSON string of the dataframe schema
    .mode("append")
    .save()
```

```scala
<YourDataFrame>
    .write
    .format("io.qdrant.spark.Qdrant")
    .option("qdrant_url", QDRANT_URL) // REST URL of the Qdrant instance
    .option("collection_name", QDRANT_COLLECTION_NAME) // Name of the collection to write data into
    .option("embedding_field", EMBEDDING_FIELD_NAME) // Name of the field holding the embeddings
    .option("schema", <YourDataFrame>.schema.json()) // JSON string of the dataframe schema
    .mode("append")
    .save()

```

```java
<YourDataFrame>
    .write()
    .format("io.qdrant.spark.Qdrant")
    .option("qdrant_url", QDRANT_URL) // REST URL of the Qdrant instance
    .option("collection_name", QDRANT_COLLECTION_NAME) // Name of the collection to write data into
    .option("embedding_field", EMBEDDING_FIELD_NAME) // Name of the field holding the embeddings
    .option("schema", <YourDataFrame>.schema().json()) // JSON string of the dataframe schema
    .mode("append")
    .save();
```

## Datatype Support

Qdrant supports all the Spark data types, and the appropriate data types are mapped based on the provided schema.

## Options and Spark Types

The Qdrant-Spark Connector provides a range of options to fine-tune your data integration process. Here's a quick reference:

| Option            | Description                                                                  | DataType               | Required |
| :---------------- | :--------------------------------------------------------------------------- | :--------------------- | :------- |
| `qdrant_url`      | REST URL of the Qdrant instance                                              | `StringType`           | ✅       |
| `collection_name` | Name of the collection to write data into                                    | `StringType`           | ✅       |
| `embedding_field` | Name of the field holding the embeddings                                     | `ArrayType(FloatType)` | ✅       |
| `schema`          | JSON string of the dataframe schema                                          | `StringType`           | ✅       |
| `mode`            | Write mode of the dataframe                                                  | `StringType`           | ✅       |
| `id_field`        | Name of the field holding the point IDs. Default: A random UUID is generated | `StringType`           | ❌       |
| `batch_size`      | Max size of the upload batch. Default: 100                                   | `IntType`              | ❌       |
| `retries`         | Number of upload retries. Default: 3                                         | `IntType`              | ❌       |
| `api_key`         | Qdrant API key for authenticated requests. Default: null                     | `StringType`           | ❌       |

For more information, be sure to check out the [Qdrant-Spark GitHub repository](https://github.com/qdrant/qdrant-spark). The Apache Spark guide is available [here](https://spark.apache.org/docs/latest/quick-start.html). Happy data processing!
