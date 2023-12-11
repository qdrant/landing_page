---
title: MindsDB
weight: 1100
---

# MindsDB

[MindsDB](https://mindsdb.com) is an AI automation platform for building AI/ML powered features and applications. It works by connecting any source of data with any AI/ML model or framework and automating how real-time data flows between them.

With the MindsDB-Qdrant integration, you can now select Qdrant as a database to load into and retrieve from with semantic search and filtering.

**MindsDB allows you to easily**:

- Connect to any store of data or end-user application.
- Pass data to an AI model from any store of data or end-user application.
- Plug the output of an AI model into any store of data or end-user application.
- Fully automate these workflows to build AI-powered features and applications

## Usage

To get started with Qdrant and MindsDB, the following syntax can be used.

```sql
CREATE DATABASE qdrant_test
WITH ENGINE = "qdrant",
PARAMETERS = {
    "location": ":memory:",
    "collection_config": {
        "size": 386,
        "distance": "Cosine"
    }
}
```

The available arguments for instantiating Qdrant can be found [here](https://github.com/mindsdb/mindsdb/blob/23a509cb26bacae9cc22475497b8644e3f3e23c3/mindsdb/integrations/handlers/qdrant_handler/qdrant_handler.py#L408-L468).

## Creating a new table

- Qdrant options for creating a collection can be specified as `collection_config` in the `CREATE DATABASE` parameters.
- By default, UUIDs are set as collection IDs. You can provide your own IDs under the `id` column.

```sql
CREATE TABLE qdrant_test.test_table (
   SELECT embeddings,'{"source": "bbc"}' as metadata FROM mysql_demo_db.test_embeddings
);
```

## Querying the database

#### Perform a full retrieval using the following syntax.

```sql
SELECT * FROM qdrant_test.test_table
```

By default, the `LIMIT` is set to 10 and the `OFFSET` is set to 0.

#### Perform a similarity search using your embeddings

<aside role="status">Qdrant supports <a href="https://qdrant.tech/documentation/concepts/indexing/#payload-index">payload indexing</a> that vastly improves retrieval efficiency with filters and is highly recommended. Please note that this feature currently cannot be configured via MindsDB and must be set up separately if needed.</aside>

```sql
SELECT * FROM qdrant_test.test_table
WHERE search_vector = (select embeddings from mysql_demo_db.test_embeddings limit 1)
```

#### Perform a search using filters

```sql
SELECT * FROM qdrant_test.test_table
WHERE `metadata.source` = 'bbc';
```

#### Delete entries using IDs

```sql
DELETE FROM qtest.test_table_6
WHERE id = 2
```

#### Delete entries using filters

```sql
DELETE * FROM qdrant_test.test_table
WHERE `metadata.source` = 'bbc';
```

#### Drop a table

```sql
 DROP TABLE qdrant_test.test_table;
```

## Next steps

You can find more information pertaining to MindsDB and its datasources [here](https://docs.mindsdb.com/).
