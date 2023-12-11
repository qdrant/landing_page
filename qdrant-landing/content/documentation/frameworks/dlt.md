---
title: DLT
weight: 1300
---

# DLT(Data Load Tool)

[DLT](https://dlthub.com/) is an open-source library that you can add to your Python scripts to load data from various and often messy data sources into well-structured, live datasets.

With the DLT-Qdrant integration, you can now select Qdrant as a DLT destination to load data into.

**DLT Enables**

- Automated maintenance - with schema inference, alerts and short declarative code, maintenance becomes simple.
- Run it where Python runs - on Airflow, serverless functions, notebooks. Scales on micro and large infrastructure alike.
- User-friendly, declarative interface that removes knowledge obstacles for beginners while empowering senior professionals.

## Usage

To get started, install `dlt` with the `qdrant` extra.

```bash
pip install "dlt[qdrant]"
```

Configure the destination in the DLT secrets file. The file is located at `~/.dlt/secrets.toml` by default. Add the following section to the secrets file.

```toml
[destination.qdrant.credentials]
location = "https://your-qdrant-url"
api_key = "your-qdrant-api-key"
```

The location will default to `http://localhost:6333` and `api_key` is not defined - which are the defaults for a local Qdrant instance.
Find more information about DLT configurations [here](https://dlthub.com/docs/general-usage/credentials).

Define the source of the data.

```python
import dlt
from dlt.destinations.qdrant import qdrant_adapter

movies = [
    {
        "title": "Blade Runner",
        "year": 1982,
        "description": "The film is about a dystopian vision of the future that combines noir elements with sci-fi imagery."
    },
    {
        "title": "Ghost in the Shell",
        "year": 1995,
        "description": "The film is about a cyborg policewoman and her partner who set out to find the main culprit behind brain hacking, the Puppet Master."
    },
    {
        "title": "The Matrix",
        "year": 1999,
        "description": "The movie is set in the 22nd century and tells the story of a computer hacker who joins an underground group fighting the powerful computers that rule the earth."
    }
]
```

<aside role="status">
A more comprehensive pipeline would load data from some API or use one of <a href="https://dlthub.com/docs/dlt-ecosystem/verified-sources">DLT's verified sources</a>.
</aside>

Define the pipeline.

```python
pipeline = dlt.pipeline(
    pipeline_name="movies",
    destination="qdrant",
    dataset_name="movies_dataset",
)
```

Run the pipeline.

```python
info = pipeline.run(
    qdrant_adapter(
        movies,
        embed=["title", "description"]
    )
)
```

The data is now loaded into Qdrant.

To use vector search after the data has been loaded, you must specify which fields Qdrant needs to generate embeddings for. You do that by wrapping the data (or [DLT resource](https://dlthub.com/docs/general-usage/resource)) with the `qdrant_adapter` function.

## Write disposition

A DLT [write disposition](https://dlthub.com/docs/dlt-ecosystem/destinations/qdrant/#write-disposition) defines how the data should be written to the destination. All write dispositions are supported by the Qdrant destination.

## DLT Sync

Qdrant destination supports syncing of the [`DLT` state](https://dlthub.com/docs/general-usage/state#syncing-state-with-destination).

## Next steps

- The comprehensive Qdrant DLT destination documentation can be found [here](https://dlthub.com/docs/dlt-ecosystem/destinations/qdrant/).
