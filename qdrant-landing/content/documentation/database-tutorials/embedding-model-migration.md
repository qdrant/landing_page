---
title: Migrate to a New Embedding Model
aliases:
  - /documentation/tutorials/embedding-model-migration/
weight: 191
---

# Migrate to a New Embedding Model With Zero Downtime

When building a semantic search application, you need to [choose an embedding 
model](/articles/how-to-choose-an-embedding-model/). Over time, you may want to switch to a different model for better 
quality or cost-effectiveness. If your application is in production, this must be done with zero downtime to avoid 
disrupting users. Switching models requires re-embedding all vectors in your collection, which can take time. If your 
data doesn't change, you can re-embed everything and switch to the new embeddings. However, in systems with frequent 
updates, stopping the search service to re-embed is not an option.

This tutorial will guide you step-by-step through the process of migrating to a new model, including the changes you have to make in your project. The examples all use the Python SDK, but the same principles apply to other languages as well.

## The Solution

Switching the embedding model with zero downtime is possible by using a blue-green deployment with two collections. The first collection
contains the old embeddings, and the second one is used to store the new embeddings. During the migration, you will
keep both collections available for the search and then switch the search to use the new collection once all the
vectors are re-embedded. **That operation requires some changes in your application code and cannot be done using
the Qdrant APIs only.**

Re-embedding requires access to the original data used to create the embeddings. This data can come from a primary database, or it may be stored in the payloads of the points in Qdrant. This tutorial assumes that the necessary data is stored in the payloads. This is usually the case, as the payload often contains the text or other data that was used to generate the embeddings.

## Step 1: Create a New Collection

The first step is to create a new collection in Qdrant that will be used to store the new 
embeddings, compatible with the new model in terms of vector size and similarity function.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(...)
client.create_collection(
    collection_name=NEW_COLLECTION,
    vectors_config=(
        models.VectorParams(
            size=512,  # Size of the new embedding vectors
            distance=models.Distance.COSINE  # Similarity function for the new model
        )
    )
)
```

Now is also a good moment to consider changing any other settings for the collection, like custom sharding, replication factor, etc. Switching the model may be a good opportunity to improve the performance of your search.

The newly created collection is empty and ready to be used for storing the new embeddings.

<aside role="status">
Qdrant supports <a href="/documentation/concepts/collections/#collection-aliases">collection aliases</a>, which act as 
symbolic links to collections. If you use aliases, you can simply fill the new collection with the new embeddings 
and then switch the alias to point to the new collection. This way, you can avoid changing the collection name in 
your application code. This approach may still require some changes in the code, as you also need to change the
embedding model used for encoding the vectors, but it simplifies the process of switching the search to the new 
collection.
</aside>

## Step 2: Enable Dual-Write Mode in Your Application

To ensure that both collections are kept up-to-date during the migration, you need to write to both collections simultaneously. This way, any new data or updates to existing data are reflected in both collections.

Ideally, the data in Qdrant is updated by an update service reading from an update queue. In this case, deploy a second service that updates the new collection in parallel with the existing one.

In the case of a monolithic application, you need to modify your application code to write to both 
collections simultaneously during the transition period. Somewhere in your code, where you handle the embedding of the
documents, you should add the logic to write to both collections. For example, if you are using the Python SDK, your
current code might look like this:

```python
client.upsert(
    collection_name=OLD_COLLECTION,
    points=[
        models.PointStruct(
            id=1,
            vector=encode(text="Example document", model_name=OLD_MODEL),
            payload={"text": "Example document"}
        ),
```

You need to modify it to write to both collections:

```python
client.upsert(
    collection_name=OLD_COLLECTION,
    points=[
        models.PointStruct(
            id=1,
            vector=encode(text="Example document", model_name=OLD_MODEL),
            payload={"text": "Example document"}
        )
    ]
)

client.upsert(
    collection_name=NEW_COLLECTION,
    points=[
        models.PointStruct(
            id=1,
            # Use the new embedding model to encode the document
            vector=encode(text="Example document", model_name=NEW_MODEL),
            payload={"text": "Example document"}
        )
    ]
)
```

A good practice is to always ensure that both operations succeed. Any errors need to be handled on the client side. You could store errors in a log or "dead letter queue" for later processing. Transient errors can be retried at a later time. Other errors need to be analyzed and addressed accordingly.

<aside role="status">
This example is an overly simplified version of the code, but it illustrates the idea. Practically, it makes a lot
of sense to make this process controllable from the outside, so you can choose which models and corresponding collections to 
use for each operation that modifies points in the collection. By making this effort now, you will save yourself a lot 
of trouble later, as you will be able to dynamically switch the model in the future without changing the application 
code again. 
</aside> 

Please make sure to cover all the operations that can modify the data in your collections, **including updates and
deletes**. Here are all the methods you have to modify in your application code to ensure you cover all the
operations that can modify the data in your collections:

- `.upsert` - inserting/updating specified points
- `.upload_points` - uploading points in batches (*method specific to Python SDK*)
- `.upload_records` - uploading records in batches (*method specific to Python SDK*)
- `.upload_collection` - uploading collection entries (*method specific to Python SDK*)
- `.delete` - removing specified points from the collection
- `.update_vectors` - updating specified vectors on points
- `.delete_vectors` - deleting specified vectors from points
- `.set_payload` - setting payload values for specified points
- `.overwrite_payload` - overwriting the entire payload of a specified point with a new payload
- `.delete_payload` - deleting a specified key payload for points
- `.clear_payload` - removing the entire payload for specified points
- `.batch_update_points` - making batch updates to points, including their respective vectors and payloads

Please refer to the [documentation of the SDK you are using](/documentation/interfaces/), or the 
[HTTP](https://api.qdrant.tech/api-reference)/[gRPC](https://api.qdrant.tech/api-reference) definitions, for the exact 
method names, as they may vary between languages. You are likely not using all these methods, so you only need to
modify the ones that are relevant to your application.

After making these changes, your application will be in a **dual-write mode**, where it writes to both the old and new
collections. This allows you to keep both collections up-to-date during the migration process, so the ongoing changes
to your data are reflected in both collections.

## Step 3: Migrate the Existing Points Into a New Collection

The dual-write should slowly start filling the new collection with the newly created points, but you also need to 
migrate the existing ones from the old collection to the new one. This can be done in a separate process, which can run
in parallel with your application. The migration process reads the points from the old collection, re-embeds them using the new model, and writes them to the new collection. 


As the migration process writes re-embedded points to the new collection, it can use conditional upserts to avoid overwriting any points that may have been updated by the dual-write process in the meantime. In this example, the filter condition checks if the point already exists in the new collection, and only inserts it if it does not exist. You could also use more sophisticated conditions based on timestamps or versioning, depending on your application's requirements.

{{< figure src="/docs/embedding-model-migration.png" caption="Embedding model migration in blue-green deployment" width="80%" >}}

Qdrant's Scroll API enables you to read points from the old collection in batches. Here is how to scroll through the points in the old collection until you reach the end of the collection and write re-embedded points to the new collection:

```python
last_offset = None
batch_size = 100  # Number of points to read in each batch
reached_end = False

while not reached_end:
    # Get the next batch of points from the old collection
    records, last_offset = client.scroll(
        collection_name=OLD_COLLECTION,
        limit=batch_size,
        offset=last_offset,
        # Include payloads in the response, as we need them to re-embed the vectors
        with_payload=True,
        # We don't need the old vectors, so let's save on the bandwidth
        with_vectors=False,
    )

    # Re-embed the points using the new model
    upsert_operations = [
      models.UpsertOperation(
        upsert=models.PointsList(
            points=[models.PointStruct(
              # Keep the original ID to ensure consistency
              id=record.id,
              # Use the new embedding model to encode the text from the payload,
              # assuming that was the original source of the embedding
              vector=encode(record.payload.get("text"), model_name=NEW_MODEL),
              # Keep the original payload
              payload=record.payload
            )],
            update_filter=models.Filter(
              must_not=[
                      models.HasIdCondition(has_id=[record.id]),
              ],
          )
        )
      )
      for record in records
    ]

    # Upsert the re-embedded points into the new collection
    client.batch_update_points(
        collection_name=NEW_COLLECTION,
        update_operations=upsert_operations
    )
    
    # Check if we reached the end of the collection
    reached_end = (last_offset == None)  
```

This kind of migration process can take some time, and **the offset should be stored in a persistent way, so you can resume the migration process in case of a failure**. You can use a database, a file, or any other persistent storage to keep track of the last offset. Having said that, because the conditional upserts would not overwrite any points in the new collection, you could safely restart the migration process from the beginning if needed.

## Step 4: Switch the Search to the New Collection

Once the migration process is complete, and all the points from the old collection are re-embedded and stored in
the new collection, you can roll out a new instance of backend application pointing to a new collection. You need to modify the code that performs the search to use the new collection instead
of the old one. There are three key changes you have to make:

1. **The collection name**, if you're not using an alias, so you don't search in the old collection anymore.
2. **The vector name**, if you use named vectors and the name of the vector has changed.
3. **The embedding model** that transforms the query into a vector.

If your old code looked like this:

```python
results = client.query_points(
    collection_name=OLD_COLLECTION,
    query=encode(text="my query", model_name=OLD_MODEL),  # Old query vector
    limit=10,
)
```

You need to change it in the following way:

```python
results = client.query_points(
    collection_name=NEW_COLLECTION,
    query=encode(text="my query", model_name=NEW_MODEL),  # New query vector
    limit=10,
)
```

<aside role="status">
Ideally, controlling the embedding model used for encoding the query is a part of the application logic you can 
control from outside, so you can switch the model without changing the application code. If you went the extra mile
to have it dynamic, now it's time to enjoy the benefits of that effort. It might also be achieved by spinning up a
new version of the service that uses the new model and then switching the traffic to the new service.
</aside>

## Step 5: Wrapping Up

Once your application has switched to the new collection, disable the dual-write mode you implemented in Step 2. From now on, the application should only write to the new collection.

All searches are now performed using the new embeddings. If the old collection is no longer needed, you can safely delete it. To ensure you can roll back if necessary, keep a snapshot of the old collection.
