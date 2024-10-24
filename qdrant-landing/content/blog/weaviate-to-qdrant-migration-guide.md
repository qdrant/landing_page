---
draft: false
title: "How to Migrate from Weaviate to Qdrant: A Step-by-Step Guide"
short_description: "How to Migrate From Weaviate to Qdrant"
description: "Discover the process of migrating from Weaviate to Qdrant. Enhance your AI application's performance and scalability with our comprehensive migration guide."
preview_image: /blog/weaviate-to-qdrant-migration-guide/images.png
date: 2024-06-27T00:04:00Z
author: Qdrant
featured: false
weight: 1006
tags:
  - Qdrant migration
  - weaviate database
  - qdrant vs weaviate
  - qdrant vs weaviate comparison
---

Vector databases have become central to modern AI applications due to their ability to efficiently store, index, and query high-dimensional vectors. By converting data into vectors—numerical representations that capture the data's features or meaning—and storing them in vector databases, powerful applications can be built in various domains, from recommendation systems and image or video recognition to [DNA sequencing](https://www.sciencedirect.com/science/article/pii/S2001037023005214) and [anomaly detection](https://qdrant.tech/data-analysis-anomaly-detection/). Vector databases are particularly useful in building applications that leverage unstructured data, which accounts for nearly [80-90% of data in enterprises](https://mitsloan.mit.edu/ideas-made-to-matter/tapping-power-unstructured-data) and is growing at three times the rate of structured data.

There are several vector database solutions available to developers today. However, not all vector databases are created equal. Each offers unique search and indexing features and differs from others in terms of performance, usage, deployment, customizability, and scalability options. Some vector databases excel in handling large-scale datasets with high query throughput, while others prioritize ease of use or provide pre-built integrations with existing systems.

Two of the leading open-source vector databases currently available are Qdrant and Weaviate. Both provide flexibility in deployment, advanced similarity search metrics, and capabilities like hybrid search. Among open-source vector databases, [Qdrant](https://qdrant.tech/) consistently excels in performance [benchmarks](https://qdrant.tech/benchmarks/), offering the highest requests per second (RPS) and the lowest latency. These performance advantages, along with other features discussed below, make Qdrant the preferred choice for developers looking to leverage vector search for large-scale enterprise AI applications.

In this article, we will examine both these solutions and explore some of the reasons why developers may choose Qdrant. Additionally, for those considering a migration from Weaviate to Qdrant, we will provide the steps to achieve this transition smoothly.

## **Weaviate**

Weaviate is an open-source vector database built in Go. It offers the key features that developers expect from vector databases, such as multiple similarity search metrics, hybrid search, flexible deployment options, and integration with many of the top frameworks. Weaviate supports horizontal scaling through sharding and replication.

In Weaviate, the core data objects are stored in class-based collections that adhere to a schema. Each JSON-structured data object can incorporate an ID, properties, vectors, and other metadata. Properties are designed to hold data in various types such as text, integers, geo-coordinates, and objects.

A unique aspect of Weaviate is that it offers internal modules like Vectorizers that generate vector embeddings, Rerankers to rank search results, and Generative Search for Retrieval-Augmented Generation (RAG) functionality. Weaviate also supports the GraphQL query language, in addition to RESTful APIs.

## **Qdrant**

Qdrant is an open-source vector database written in [Rust](https://qdrant.tech/articles/why-rust/), a language famed for its performance, memory efficiency, and the absence of a garbage collector. It is highly performant, and has the ability to handle large-scale datasets with billions of data points. Qdrant offers multiple [similarity search](https://qdrant.tech/documentation/concepts/search/) metrics, supports hybrid search, provides a range of deployment options including [Hybrid Cloud](https://qdrant.tech/hybrid-cloud/), and integrates with the top frameworks. Additionally, Qdrant supports both horizontal and vertical scaling.

In Qdrant, vectors with additional JSON-structured payloads are called [points](https://qdrant.tech/documentation/concepts/points/). A named set of points is stored in a collection and can be searched through. The payload can store any JSON-formatted data, and can be used to filter search results. It offers [advanced search](https://qdrant.tech/documentation/concepts/explore/) capabilities to find similar or dissimilar vectors, or search based on positive and negative examples.

Qdrant is highly customizable and scalable, and handles enterprise use cases particularly well. For instance, it has advanced [security](https://qdrant.tech/documentation/guides/security/) features such as support for JWT tokens, and enables developers to create fine-grained security layers through Role-Based Access Control (RBAC), a feature particularly useful in enterprise scenarios. It has support for vector [quantization](https://qdrant.tech/documentation/guides/quantization/), offers a number of [optimizers](https://qdrant.tech/documentation/concepts/optimizer/), and allows developers to configure the database according to their use case. Additionally, it provides an embedding library called [FastEmbed,](https://github.com/qdrant/fastembed) which provides support for various vector embedding models.

## **Why Migrate from Weaviate to Qdrant**

Both Weaviate and Qdrant offer a number of compelling features. However, some of Qdrant’s capabilities make it easier for developers to build enterprise applications. Here are some of the reasons why one might consider migrating from Weaviate to Qdrant:

**Better Performance**

Qdrant is highly performant. As [benchmarks](https://qdrant.tech/benchmarks/) show, Qdrant achieves the highest requests per second (RPS) and the lowest latency in almost all scenarios tested. It also achieves the highest RPS for filtered search due to the use of advanced query planning strategies.

The benchmarks are [open-source](https://github.com/qdrant/vector-db-benchmark), and are updated on a regular basis.

**Advanced Security Features**

Qdrant supports granular access control using JSON Web Tokens (JWT) along with API and read-only API authentication. This allows you to implement [Role-Based Access Control (RBAC)](https://qdrant.tech/articles/data-privacy/), where you can define user permissions and restrict access to sensitive data.

Qdrant also supports [TLS](https://qdrant.tech/documentation/guides/security/#tls) encryption of connections.

**Flexible Deployment**

Qdrant can be deployed locally using a single Docker command, and also offers a managed cloud option to developers. Additionally, Qdrant features [Hybrid Cloud](https://qdrant.tech/documentation/hybrid-cloud/), which integrates Kubernetes clusters from any setting—cloud, on-premises, or edge—into a unified managed service. It allows you to manage your database clusters via Qdrant Cloud’s UI while keeping all operations and resources within your network. Qdrant has a large number of partners for its Hybrid Cloud offering, such as AWS, Google Cloud, Azure, DigitalOcean, Linode, among others.

**Advanced Search Features**

Qdrant allows setting conditions for [filtering](https://qdrant.tech/documentation/concepts/filtering/) during searches, supporting complex criteria on payloads and point IDs. You can combine logical operations (AND, OR, NOT) into nested clauses for advanced, customizable search queries based on your specific specific requirements.

For enhancing search performance, Qdrant also offers a variety of indexing methods: Dense Vector Index using HNSW, Sparse Vector Index for sparse vectors, Payload Indexing for fast payload-based filtering, Parametrized Indexing for fine-tuning integer filters, and Full-Text Indexing for text searches.

## **How to Prepare for the Migration to Qdrant**

Migrating from Weaviate to Qdrant might offer several advantages, particularly in scalability, higher performance, and in incorporating advanced search features. If you choose to migrate, we recommend the following initial steps:

**Step 1**: First, familiarize yourself with the Qdrant ecosystem, including its [concepts](https://qdrant.tech/documentation/concepts/) and [APIs](https://api.qdrant.tech/api-reference). Learn how to create collections, add points, and perform queries.

**Step 2**: Next, inspect the Weaviate collections, their schema, data objects, corresponding vectors, properties, and any associated metadata.

Use the following code to do so:

```python
client = weaviate.Client(url=os.getenv("WCD_URL"),
                           auth_client_secret= weaviate.auth.AuthApiKey(os.getenv("WCD_API_KEY")))
client.schema.get()
```
You need to have the following values in your .env file.

WCD_URL: Weaviate Cloud URL

WCD_API_KEY: Weaviate API Key

To retrieve collection definitions from Weaviate, you can use the following:
```python
resp = client.collections.list_all(simple=False)
print(resp)

```

To read the data objects, properties, and vectors, you can use this:

```python
collection = client.collections.get("{Collection_Name}")

for item in collection.iterator(
   include_vector=True
):
   print(item.properties)
   print(item.vector)

```

Create a parallel setup where you have integrated your application with Qdrant using a small subset of data in a test collection.

**Step 3**: Keep your parallel setup with Qdrant ready for testing after the data migration is completed. This will allow you to test your application without disrupting ongoing operations on Weaviate. If the migration looks good, you can simply decide to switch off your previous stack.

**Step 4**: Before you follow the steps below, ensure that you have stopped creating new collections or data objects, or modifying existing data in Weaviate. You can also create a backup of your Weaviate database to ensure you don’t lose any data in the process.

## **Weaviate to Qdrant Migration Process**

In Weaviate, data is stored as objects in JSON format, each with an ID (or UUID), properties, and vectors. Properties can hold information as key-value pairs in a dictionary format.

Our approach will be to first export all data in a Weaviate collection to a JSON file. Once the export is complete, we can import the data into Qdrant in batches.

This export function must account for multi-tenancy in the collection. If enabled, it will add tenant information to the properties dictionary, which will be imported as a payload into Qdrant for multi-tenancy support.

For simplicity, we will assume that we will showcase the steps using Weaviate Cloud and [Qdrant Cloud](https://cloud.qdrant.io/) in the code below.

First, let’s install the necessary libraries:

```bash
pip install weaviate-client

pip install qdrant-client

```

### **Step 1: Export Data from Weaviate**

Now, let’s write the export function.

```python
import weaviate 
import weaviate.classes as wvc  
import os  
import json 

def export_weaviate(collection_name, cluster_url, api_key, export_file):
    """
    Export data from a Weaviate collection to a JSON file.

    Args:
    - collection_name (str): The name of the collection to export.
    - cluster_url (str): The URL of the Weaviate cluster.
    - api_key (str): The API key for authentication.
    - export_file (str): The path to the file where the data will be exported.
    """

    # Connect to the Weaviate cloud instance using the provided cluster URL and API key for authentication
    client = weaviate.connect_to_weaviate_cloud(
        cluster_url=cluster_url,
        auth_credentials=weaviate.auth.AuthApiKey(api_key),
    )

    # Retrieve the collection object using the specified collection name
    collection = client.collections.get(collection_name)

    # Initialize an empty list to store the data items
    items_data = []

    # Check if the collection has multi-tenancy enabled
    if collection.config.get().multi_tenancy_config.enabled:
        # Retrieve the list of tenants from the collection
        tenants = collection.tenants.get()
        
        # Iterate over each tenant
        for tenant in tenants:
            # Iterate over each item in the collection for the current tenant, including vectors
            for item in collection.with_tenant(tenant).iterator(include_vector=True):
                # Create a dictionary with the item's properties, vector, and UUID
                item_data = {
                    'properties': {**item.properties, **{'tenant': tenant}},  # Merge properties with tenant info
                    'vector': item.vector,  # Include the item's vector
                    'uuid': item.uuid.urn.replace('urn:uuid:', ''),  # Extract and clean up the UUID
                }
                # Append the item data to the items_data list
                items_data.append(item_data)
    else:
        # If multi-tenancy is not enabled, iterate over each item in the collection
        for item in collection.iterator(include_vector=True):
            # Create a dictionary with the item's properties, vector, and UUID
            item_data = {
                'properties': item.properties,  # Include the item's properties
                'vector': item.vector,  # Include the item's vector
                'uuid': item.uuid.urn.replace('urn:uuid:', ''),  # Extract and clean up the UUID
            }
            items_data.append(item_data)

    # Write the collected items data to the specified JSON file
    with open(export_file, 'w') as json_file:
        json.dump(items_data, json_file, indent=4)

```

The above function will create a file that contains all the exported data from one specific collection in Weaviate.

### **Step 2: Import Data into Qdrant**

The following function imports the data into the Qdrant database. As discussed, we will use Qdrant Cloud for simplicity.

```python
from qdrant_client import QdrantClient, models  

def import_qdrant(url, api_key, collection_name, exported_file, distance_metric):
    """
    Import data into a Qdrant collection from a JSON file.

    Args:
    - url (str): The URL of the Qdrant instance.
    - api_key (str): The API key for authentication.
    - collection_name (str): The name of the collection to import data into.
    - exported_file (str): The path to the JSON file containing the exported data.
    - distance_metric (str): The distance metric to use for the collection (e.g., 'cosine', 'dot', 'l2-squared', 'manhattan').
    """

    # Open and load the JSON file containing the exported data
    with open(exported_file, 'r') as json_file:
        items_data = json.load(json_file)

    # Extract properties, vectors, and UUIDs from the loaded data
    properties_list = [item['properties'] for item in items_data]
    vector_default_list = [item['vector']['default'] for item in items_data]
    uuid_list = [item['uuid'] for item in items_data]

    # Determine the dimensionality of the vectors
    vector_dim = len(vector_default_list[0])

    # Define a mapping from Weaviate distance metrics to Qdrant distance models
    distance_mapping = {
        'cosine': models.Distance.COSINE,
        'dot': models.Distance.DOT,
        'l2-squared': models.Distance.EUCLID,
        'manhattan': models.Distance.MANHATTAN
    }

    # Initialize the Qdrant client with the provided URL and API key
    client = QdrantClient(url=url, api_key=api_key)

    # Recreate the collection with the specified configuration (vector size and distance metric)
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(size=vector_dim, distance=distance_mapping.get(distance_metric))
    )

    # Define the batch size for upserting data
    batch_size = 1000

    # Iterate over the data in batches and upsert into the collection
    for i in range(0, len(uuid_list), batch_size):
        # Slice the data into batches
        batch_uuids = uuid_list[i:i + batch_size]
        batch_properties = properties_list[i:i + batch_size]
        batch_vectors = vector_default_list[i:i + batch_size]

        # Upsert the batch into the Qdrant collection (column-oriented)
        client.upsert(
            collection_name=collection_name,
            points=models.Batch(
                ids=batch_uuids,        # The list of UUIDs for the batch
                payloads=batch_properties,  # The list of properties for the batch
                vectors=batch_vectors,  # The list of vectors for the batch
            ),
        )


```

To migrate all the data from a Weaviate database to Qdrant, you can run the following code. Here, we will assume you have the following in your .env file:

WCD_URL: Weaviate Cloud URL

WCD_API_KEY: Weaviate API Key

QDRANT_URL: Qdrant Cloud Cluster URL

QDRANT_API_KEY: Qdrant Cloud API Key
```python
import os 
import weaviate 
from qdrant_client import QdrantClient, models  

# Connect to the Weaviate instance using environment variables for URL and API key
client = weaviate.Client(
    url=os.getenv("WCD_URL"),
    auth_client_secret=weaviate.auth.AuthApiKey(os.getenv("WCD_API_KEY"))
)

# Create a list of dictionaries with collection name and distance metric
collection_info = [
    {
        'collection_name': schema['class'],
        'distance_metric': schema['vectorIndexConfig']['distance']
    }
    for schema in client.schema.get()['classes']
]

# Iterate over each collection info dictionary
for info in collection_info:
    # Generate the export file name based on the collection name
    export_file_name = info['collection_name'] + '.json'

    # Export the collection data from Weaviate to a JSON file
    export_weaviate(
        collection_name=info['collection_name'],
        cluster_url=os.getenv("WCD_URL"),
        api_key=os.getenv("WCD_API_KEY"),
        export_file=export_file_name
    )

    # Import the exported data into Qdrant
    import_qdrant(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY"),
        collection_name=info['collection_name'],
        exported_file=export_file_name,
        distance_metric=info['distance_metric']
    )
```

We can now check the Qdrant Cloud dashboard to verify the migration of the data.

![Qdrant Cloud dashboard](/blog/weaviate-to-qdrant-migration-guide/points.png)

## **Testing Your Data After Migration**

After importing data into Qdrant, you can check the status of a collection, the vector count, dimensions, indexing, optimizer configuration, and other parameters.
```python
client.get_collection(collection_name="{collection_name}") 
```

Additionally, you can use the [Scroll points](https://qdrant.tech/documentation/concepts/points/#scroll-points) API in Qdrant to inspect the vectors after migration. This will return all points (vectors) in a page-by-page manner, including the payload data. You can then inspect the data and cross-check it with the collections and data objects you have on Weaviate.

To search for specific vectors using a filter and inspect them, you can use Qdrant’s filtered search.
```python
client.scroll(
    collection_name="collection_name",
    scroll_filter=models.Filter(
        should=[
            models.FieldCondition(
                key="key_value",
                match=models.MatchText(text="sample_text"),
            ),
        ]
    )
)
```

The filter will return points that have the text ‘sample_text’ in the ‘key_value’ key of the payload. This method can be useful if you have a large dataset.

## How to Troubleshoot Migration Issues

During the migration process, there are a few things you need to watch out for:

1. First, ensure that you have paused the creation of new data objects in the Weaviate collection before starting the migration.
2. Second, make sure that you are using the same similarity metric in Weaviate and Qdrant for that collection.
3. Weaviate uses JSON-structured data objects, where vectors are part of the schema. Qdrant also uses JSON-structured payloads, but vectors are stored separately. When the migration completes, compare the schema and data objects in the Weaviate collection with the payload in the Qdrant collection, while comparing the vectors separately.
4. If you have a large dataset and want to improve performance during the bulk upload of vectors into Qdrant, use the techniques described [here](https://qdrant.tech/documentation/tutorials/bulk-upload/).

### Accessing Support Resources and Community Help

To get help from the community, jump onto our [Discord](https://discord.com/invite/tdtYvXjC4h) channel. You can also browse through our [documentation](https://qdrant.tech/documentation/), [API Reference](https://api.qdrant.tech/master/api-reference), or [reach out](https://qdrant.tech/contact-us/) to our team.

## **Final Words**

Migrating from Weaviate to Qdrant can offer significant performance benefits, higher customizability, and advanced search features. By leveraging Qdrant, you can better tailor your vector search engine to your specific needs.

To get started with Qdrant, sign up for [Qdrant Cloud](https://cloud.qdrant.io/) (or [Hybrid Cloud](https://qdrant.tech/hybrid-cloud/)), or [get in touch](https://qdrant.tech/contact-us/) with us today.

References:

- [Weaviate Documentation](https://weaviate.io/developers/weaviate)
- [Qdrant Documentation](https://qdrant.tech/documentation/)

## **Frequently Asked Questions**

**What are the main benefits of migrating from Weaviate to Qdrant?**

Migrating from Weaviate to Qdrant offers several benefits, such as higher performance, advanced security features, and more flexibility. Qdrant consistently achieves higher requests per second (RPS) and lower latency in benchmarks. It supports advanced security features like Role-Based Access Control (RBAC) using JSON Web Tokens (JWT). Additionally, Qdrant offers flexible deployment options, including hybrid cloud setups, that allow you to manage database clusters across cloud, on-premises, and edge environments seamlessly. These benefits make Qdrant a powerful choice for enterprise-grade applications.

**What prerequisites and preparations are needed before starting the migration?**

Before starting the migration, ensure you are familiar with the Qdrant ecosystem. Inspect your Weaviate collections, including their schema, data objects, corresponding vectors, properties, and any associated metadata.

Create a parallel setup in Qdrant similar to your Weaviate deployment. It is also advisable to create a backup of your Weaviate data to prevent any data loss.

Before you start the data migration process, ensure that no new collections or data objects are being created in Weaviate.

**What are the detailed steps involved in migrating from Weaviate to Qdrant?**

The following are the steps involved in migrating from Weaviate to Qdrant:

1. **Familiarize with Qdrant:** Understand Qdrant's APIs, how to create collections, add points, and perform queries.
2. **Set Up Qdrant:** Prepare your Qdrant environment.
3. **Export Data from Weaviate:** Use a script to export data objects, properties, and vectors from Weaviate to collection-specific JSON files.
4. **Import Data to Qdrant:** Use a script to import the exported JSON files into Qdrant collections.
5. **Test Migration:** Verify data integrity by comparing the imported data in Qdrant with the original data in Weaviate.
6. **Finalize Migration:** Once testing is successful, switch over to the new Qdrant setup and deprecate the Weaviate environment.

**How can I ensure data integrity and minimal downtime during the migration?**

To ensure data integrity, pause any new data creation or modification in Weaviate during the migration. Perform a thorough verification of the exported and imported data by comparing schemas, data objects, and vectors. Use parallel setups to test the Qdrant environment without disrupting ongoing operations in Weaviate. Implement batch processing during the import phase to handle large datasets efficiently and minimize downtime.

**What common issues might arise during the migration, and how can they be resolved?**

Common issues include mismatches in schema or vector data, performance bottlenecks during bulk uploads, difference in cluster configurations, and discrepancies in similarity metrics. To resolve these:

- **Schema Mismatches:** Ensure both Weaviate and Qdrant use compatible schemas and data structures.
- **Performance Bottlenecks:** Use Qdrant’s batch processing capabilities and optimize the import script for efficiency.
- **Metric Discrepancies:** Align similarity metrics used in both databases to ensure consistent search results post-migration.
- **Cluster Setup Differences**: There are performance differences in both the vector databases. Setup your initial cluster to reflect what you have in Weaviate, and then optimize it further for Qdrant.

**Where can I find additional resources and support for using Qdrant?**

For additional resources and support, you can refer to the [Qdrant Documentation](https://qdrant.tech/documentation/) and [Weaviate Documentation](https://weaviate.io/developers/weaviate). You can also join the Qdrant community on platforms like [Discord](https://discord.com/invite/tdtYvXjC4h), or browse through the [Qdrant GitHub repository](https://github.com/qdrant) for examples and support. If needed, you can reach out to the Qdrant team for professional assistance and support.
