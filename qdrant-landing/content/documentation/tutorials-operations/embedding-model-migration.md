---
title: Migrate to a New Embedding Model
aliases:
  - /documentation/tutorials/embedding-model-migration/
weight: 30
---

# Migrate to a New Embedding Model with Zero Downtime in Qdrant

| Time: 40 min | Level: Intermediate |
| --- | ----------- |

When building a semantic search application, you need to [choose an embedding 
model](/articles/how-to-choose-an-embedding-model/). Over time, you may want to switch to a different model for better 
quality or cost-effectiveness. If your application is in production, this must be done with zero downtime to avoid 
disrupting users. Switching models requires re-embedding all vectors in your collection, which can take time.

This tutorial will guide you step-by-step through the two options for migrating to a new model.

The code examples use [Qdrant Cloud Inference](/documentation/inference/#qdrant-cloud-inference) to generate vector embeddings. If you manage your own embedding infrastructure, you can apply the same principles, but you will need to adapt the code examples to use your embedding service.

## Two Options

The best approach to migrating to a new embedding model depends on how your collection is set up. A blue-green deployment (option 1) works with any collection type. Alternatively, if you already use named vectors, option 2 is easier, faster, and uses fewer resources.

### Option 1: Blue-Green Migration

The [blue-green migration](#blue-green-migration) approach uses two parallel collections. You create a new collection configured for the new embedding model, then enable dual writes so that every incoming upsert is written to both collections simultaneously. A background migration process scrolls through the old collection, re-embeds each point using the new model, and writes it to the new collection without overwriting points already added by the update service. Once migration is complete, you switch search traffic to the new collection and disable dual writes. This option works with any collection type, whether you use a single unnamed vector or named vectors. 

This approach has a couple of downsides:
- It duplicates payloads across both collections, while the named vectors option stores them only once. For text-heavy collections where the payload is large, this can have a significant impact.
- It only works when all writes to your collection are upserts. If you use deletes or partial updates, you need to pause those operations during the migration or implement additional logic to handle them.

### Option 2: Named Vectors

The [named vectors](#migrate-using-named-vectors) approach keeps everything in a single collection. You add the new model as an additional named vector: a schema-only operation that doesn't affect existing data. You then enable dual writes so that every incoming upsert embeds with both models. A background process scrolls through the collection and updates only the new named vector on each existing point, leaving the old vector and payload intact. Once all points are re-embedded, you switch the `using` parameter in your search queries to the new vector, then delete the old named vector.

The downside of this approach is that it only works for collections that were created with named vectors.


Compared to a blue-green migration, this approach:

- Doesn't require a second collection, a collection alias, or any data copying.
- Keeps all point IDs, payloads, and other named vectors intact throughout the migration.
- Makes rollback trivial — the old named vector stays in the collection until you explicitly delete it.

Unlike Option 1, point deletions are safe during this migration — deleting a point removes it from the collection entirely, so there's no risk of the migration process re-adding it. If you call `update_vectors` on the old named vector, make sure your dual-write logic also updates the new named vector at the same time. Updating only one will cause the two vectors to diverge.

## Blue-Green Migration

Switching the embedding model with zero downtime is possible by using a blue-green deployment with two collections. The first collection contains the old embeddings, and the second one is used to store the new embeddings. A migration process copies the data from the old collection to the new one, re-embedding vectors using the new model. During the migration, you keep searching the old collection while writing any data updates to both collections. Once all vectors are re-embedded, switch the search to use the new collection.

{{< figure src="/docs/embedding-model-migration.png" caption="Embedding model migration in blue-green deployment" width="80%" >}}

Re-embedding requires access to the original data used to create the embeddings. This data can come from a primary database, or it may be stored in the payloads of the points in Qdrant. This tutorial assumes that the necessary data is stored in the payloads. This is usually the case, as the payload often contains the text or other data that was used to generate the embeddings.

The solution outlined in this section only works for upsert operations. If you use deletes or partial updates, it is necessary to pause those operations during the migration or implement additional logic to handle them.

### Step 1: Create a New Collection

The first step is to create a new collection in Qdrant that will be used to store the new 
embeddings, compatible with the new model in terms of vector size and similarity function.

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="create-new-collection" >}}

Now is also a good moment to consider changing any other settings for the collection, like custom sharding, replication factor, etc. Switching the model may be a good opportunity to improve the performance of your search.

The newly created collection is empty and ready to be used for storing the new embeddings.


### Step 2: Enable Dual Writes

To ensure that both collections are kept up-to-date during the migration, you need to write any changes to both collections simultaneously. This way, any new data or updates to existing data are reflected in both collections.

Ideally, the data in Qdrant is updated by an update service reading from an update queue. This service is responsible for embedding the documents and writing them to Qdrant. It uses code similar to this:

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="upsert-old-collection" >}}

To update the new collection, deploy a second service that updates the new collection in parallel with the existing one. This service uses the new embedding model to encode the documents and writes them to the new collection:

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="upsert-new-collection" >}}

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

Refer to the [documentation of the SDK you are using](/documentation/interfaces/), or the 
[HTTP](https://api.qdrant.tech/api-reference)/[gRPC](https://api.qdrant.tech/api-reference) definitions, for the exact method names, as they may vary between languages.

After making these changes, you will be in a **dual-write mode**, where any change is written to both the old and new collection. This allows you to keep both collections up-to-date during the migration process.

### Step 3: Migrate the Existing Points into the New Collection

Now that you're in dual-write mode, it is time to migrate the existing points from the old collection to the new one. This can be done in a separate process that runs
in parallel with the regular upsert services. 

The migration process reads the points from the old collection, re-embeds them using the new model, and writes them to the new collection, making sure not to overwrite existing points inserted by the update service. Here's an example of what the code for such a migration process could look like:

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="migrate-points" >}}

Breaking down this code step by step:

- Data is read from the old collection in batches of 100 points using a [scroll](/documentation/manage-data/points/#scroll-points). The `last_offset` variable keeps track of the scroll position in the collection.
- For each batch of points, the process re-embeds the vectors using the new embedding model. It assumes that the original text used for embedding is stored in the payload under the key `text`.
- With the re-embedded vectors, it upserts the points into the new collection, keeping the original IDs and payloads. The upserts use [insert-only mode](/documentation/manage-data/points/#update-mode) to ensure that a point is only inserted if it does not already exist in the new collection. This prevents overwriting newer updates from the regular update service.

This kind of migration process can take some time, and the offset can be stored in a persistent way, so you can resume the migration process in case of a failure. You can use a database, a file, or any other persistent storage to keep track of the last offset. Having said that, because the conditional upserts would not overwrite any points in the new collection, you could safely restart the migration process from the beginning if needed.

### Step 4: Change the Collection and Embedding Model for Searches

Once the migration process is complete, and all the points from the old collection are re-embedded and stored in the new collection, you can roll out a configuration change of the backend application. There are two key changes you have to make:

1. **The collection name**. Switch this from the old collection to the new collection. If you're using a [collection alias](/documentation/manage-data/collections/#collection-aliases), switch the alias to point to the new collection.
2. **The embedding model**. Switch this from the old embedding model to the new embedding model.

If these values are hardcoded in your application, you will need to change them directly in the code and deploy a new version of your application. For example, if your current search code looks like this:

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="search-old-collection" >}}

You need to change it in the following way:

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="search-new-collection" >}}

### Step 5: Wrapping Up

Once your application has switched to the new collection, disable the dual-write mode you implemented in Step 2. From now on, the application should only write to the new collection.

All searches are now performed using the new embeddings. If the old collection is no longer needed, you can safely delete it. To ensure you can roll back if necessary, keep a snapshot of the old collection.

---

## Migrate Using Named Vectors

If your collection uses [named vectors](/documentation/manage-data/points/#named-vectors/), you can migrate to a new embedding model without creating a second collection. Instead, you add the new model as an additional named vector on the same collection, re-embed points in the background, switch the `using` parameter in your search queries, then delete the old named vector.

 It only works when your collection was created with named vectors. If you use a single unnamed vector, migrate using a [blue-green migration](#blue-green-migration) instead.

### Step 1: Add the New Named Vector

Add the new model's vector schema to the existing collection. This is a schema-only operation: no segments are rebuilt and no existing point data is modified. The new vector is queryable immediately, but it returns no results until points are populated with values for it.

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="add-named-vector" >}}

### Step 2: Enable Dual Writes

Update your upsert service to embed each document with both models and write both named vectors on every upsert:

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="upsert-both-vectors" >}}

From this point on, every new or updated point carries both embeddings.

### Step 3: Re-Embed Existing Points

Run a background process that scrolls through the collection and updates only the new named vector on each existing point. Because `update_vectors` is used rather than `upsert`, the old named vector and the payload on each point are left unchanged.

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="re-embed-existing" >}}

Unlike Option 1, no insert-only guard is needed here. The upsert service and the migration process both derive the new vector from the same payload text using the same model, so if they process a point concurrently they produce the same result.

### Step 4: Switch Search to the New Vector

Once all points have a value for the new named vector, change the `using` parameter in your search queries. No collection rename or alias switch is required.

Before:

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="search-with-old-vector" >}}

After:

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="search-with-new-vector" >}}

### Step 5: Disable Dual Writes and Delete the Old Named Vector

Once all search traffic uses the new vector, update your upsert service to write only `NEW_VECTOR` going forward, then delete the old named vector from the collection:

{{< code-snippet path="/documentation/headless/snippets/tutorial-model-migration/" block="delete-old-named-vector" >}}

The old vector's storage is reclaimed after the next optimizer run. All point IDs, payloads, and the new named vector remain intact.
