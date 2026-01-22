---
title: Migrate to a New Embedding Model
aliases:
  - /documentation/tutorials/embedding-model-migration/
weight: 191
---

# Migrate to a New Embedding Model with Zero Downtime

When building a semantic search application, you need to [choose an embedding 
model](/articles/how-to-choose-an-embedding-model/). Over time, you may want to switch to a different model for better 
quality or cost-effectiveness. If your application is in production, this must be done with zero downtime to avoid 
disrupting users. Switching models requires re-embedding all vectors in your collection, which can take time. If your 
data doesn't change, you can re-embed everything and switch to the new embeddings. However, in systems with frequent 
updates, stopping the search service to re-embed is not an option.

This tutorial will guide you step-by-step through the process of migrating to a new model, including the changes you have to make in your project. The examples all use the Python SDK, but the same principles apply to other languages as well.

## The Solution

Switching the embedding model with zero downtime is possible by using a blue-green deployment with two collections. The first collection contains the old embeddings, and the second one is used to store the new embeddings. A migration process copies the data from the old collection to the new one, re-embedding vectors using the new model. During the migration, you keep searching the old collection while writing any data updates to both collections. Once all vectors are re-embedded, switch the search to use the new collection.

{{< figure src="/docs/embedding-model-migration.png" caption="Embedding model migration in blue-green deployment" width="80%" >}}

Re-embedding requires access to the original data used to create the embeddings. This data can come from a primary database, or it may be stored in the payloads of the points in Qdrant. This tutorial assumes that the necessary data is stored in the payloads. This is usually the case, as the payload often contains the text or other data that was used to generate the embeddings.

The solution outlined in this tutorial only works for upsert operations. If you use deletes or partial updates, it is necessary to pause those operations during the migration or implement additional logic to handle them.

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


## Step 2: Enable Dual Writes

To ensure that both collections are kept up-to-date during the migration, you need to write any changes to both collections simultaneously. This way, any new data or updates to existing data are reflected in both collections.

Ideally, the data in Qdrant is updated by an update service reading from an update queue. This service is responsible for embedding the documents and writing them to Qdrant. It uses code similar to this:

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
```

To update the new collection, deploy a second service that updates the new collection in parallel with the existing one. This service uses the new embedding model to encode the documents and writes them to the new collection:

```python
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

If instead of update services, you have a monolithic application, you need to modify your application code to write to both collections simultaneously during the transition period. In your code, where you handle the embedding of the documents, you should add the logic to write to both collections.

Note that the method outlined in this tutorial only works for `upsert` operations. For example, a `delete` operation would fail on the new collection if a point does not exist yet, and that point would later be erroneously added by the migration process. If you use one of the following methods to modify points in your collection, you will need to pause those operations during the migration or implement additional logic to handle them:

- `.delete` - removing specified points from the collection
- `.update_vectors` - updating specified vectors on points
- `.delete_vectors` - deleting specified vectors from points
- `.set_payload` - setting payload values for specified points
- `.overwrite_payload` - overwriting the entire payload of a specified point with a new payload
- `.delete_payload` - deleting a specified key payload for points
- `.clear_payload` - removing the entire payload for specified points
- `.batch_update_points` - making batch updates to points, including their respective vectors and payloads

Please refer to the [documentation of the SDK you are using](/documentation/interfaces/), or the 
[HTTP](https://api.qdrant.tech/api-reference)/[gRPC](https://api.qdrant.tech/api-reference) definitions, for the exact method names, as they may vary between languages.

After making these changes, you will be in a **dual-write mode**, where any change is written to both the old and new collection. This allows you to keep both collections up-to-date during the migration process.

## Step 3: Migrate the Existing Points into the New Collection

Now that you're in dual-write mode, it is time to migrate the existing points from the old collection to the new one. This can be done in a separate process that runs
in parallel with the regular upsert services. 

The migration process reads the points from the old collection, re-embeds them using the new model, and writes them to the new collection, making sure not to overwrite existing points inserted by the update service. Here's an example of what the code for such a migration process could look like:

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
                # Only insert the point if a point with this ID does not already exist.
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

Breaking down this code step by step:

- Data is read from the old collection in batches of 100 points using a [scroll](/documentation/concepts/points/#scroll-points). The `last_offset` variable keeps track of the scroll position in the collection.
- For each batch of points, the process re-embeds the vectors using the new embedding model. It assumes that the original text used for embedding is stored in the payload under the key `text`.
- With the re-embedded vectors, it prepares [conditional upsert operations](/documentation/concepts/points/#conditional-updates) for the new collection, keeping the original IDs and payloads. The conditional upserts use a filter condition to ensure that a point is only inserted if it does not already exist in the new collection. The filter checks whether a point with the given ID already exists. A point is only upserted if the ID does not exist in the new collection. This prevents overwriting newer updates from the regular update service.
- Finally, the process uses a [batch update](/documentation/concepts/points/#batch-update) to upsert the re-embedded points into the new collection. Note that it uses `batch_update_points` instead of `upsert`, because `batch_update_points` allows you to specify an update condition per upsert operation.

This kind of migration process can take some time, and the offset can be stored in a persistent way, so you can resume the migration process in case of a failure. You can use a database, a file, or any other persistent storage to keep track of the last offset. Having said that, because the conditional upserts would not overwrite any points in the new collection, you could safely restart the migration process from the beginning if needed.

## Step 4: Change the Collection and Embedding Model for Searches

Once the migration process is complete, and all the points from the old collection are re-embedded and stored in the new collection, you can roll out a configuration change of the backend application. There are two key changes you have to make:

1. **The collection name**. Switch this from the old collection to the new collection. If you're using a [collection alias](/documentation/concepts/collections/#collection-aliases), switch the alias to point to the new collection.
2. **The embedding model**. Switch this from the old embedding model to the new embedding model.

If these values are hardcoded in your application, you will need to change them directly in the code and deploy a new version of your application. For example, if your current search code looks like this:

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

## Step 5: Wrapping Up

Once your application has switched to the new collection, disable the dual-write mode you implemented in Step 2. From now on, the application should only write to the new collection.

All searches are now performed using the new embeddings. If the old collection is no longer needed, you can safely delete it. To ensure you can roll back if necessary, keep a snapshot of the old collection.
