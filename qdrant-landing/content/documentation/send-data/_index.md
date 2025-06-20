---
title: Send Data to Qdrant
weight: 25
partition: build
---

## How to Send Your Data to a Qdrant Cluster

The follwing examples show you some of the many ways you can send data to a Qdrant cluster from different sources.

If you want to migrate data from another Qdrant instance or vector database like Pinecone, Weaviate or Milvus see our [Migration Guide](/documentation/database-tutorials/migration/) for more information.

| Example                                                                   | Description                                                       | Stack                                       |   
|---------------------------------------------------------------------------------|-------------------------------------------------------------------|---------------------------------------------|
| [Stream Data to Qdrant with Kafka](/documentation/send-data/data-streaming-kafka-qdrant/)                                                                                                                          | Use Confluent to Stream Data to Qdrant via Managed Kafka.                                                 |  Qdrant, Kafka  |
| [Qdrant on Databricks](/documentation/send-data/databricks/)                                                                     | Learn how to use Qdrant on Databricks using the Spark connector     | Qdrant, Databricks, Apache Spark |
| [Qdrant with Airflow and Astronomer](/documentation/send-data/qdrant-airflow-astronomer/)                                        | Build a semantic querying system using Airflow and Astronomer       | Qdrant, Airflow, Astronomer      |
