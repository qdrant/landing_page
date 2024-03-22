---
title: Pandas-AI
weight: 2900
---

# Pandas-AI

PandasAI is a Python library that uses a generative AI model to interpret natural language queries and translate them into python code to interact with the data and return the results to the user.

## Installation

```console
pip install pandasai[qdrant]
```

## Usage

You can begin a conversation by instantiating an `Agent` instance based on your Pandas dataframe. The default Pandas-AI LLM requires an [API key](https://pandabi.ai.).

You can find the list of all supported LLM's [here](https://docs.pandas-ai.com/en/latest/LLMs/llms/)

```python
import os
import pandas as pd
from pandasai import Agent

# Sample DataFrame
sales_by_country = pd.DataFrame(
    {
        "country": [
            "United States",
            "United Kingdom",
            "France",
            "Germany",
            "Italy",
            "Spain",
            "Canada",
            "Australia",
            "Japan",
            "China",
        ],
        "sales": [5000, 3200, 2900, 4100, 2300, 2100, 2500, 2600, 4500, 7000],
    }
)

os.environ["PANDASAI_API_KEY"] = "YOUR_API_KEY"

agent = Agent(sales_by_country)
agent.chat("Which are the top 5 countries by sales?")
# OUTPUT: China, United States, Japan, Germany, Australia
```

## Qdrant support

You can train Pandas-AI to understand your data better and to improve its performance.

Qdrant can be configured as a vectorstore to ingest training data and retrieve semantically relevant content.

```python
from pandasai.ee.vectorstores.qdrant import Qdrant

qdrant = Qdrant(
    collection_name="<SOME_COLLECTION>",
    embedding_model="sentence-transformers/all-MiniLM-L6-v2",
    location="http://localhost:6334",
    prefer_grpc=True
)

agent = Agent(df, vector_store=qdrant)

# Train with custom information
agent.train(docs="The fiscal year starts in April")

# Train the q/a pairs of code snippets
query = "What is the total sales for the current fiscal year?"
response = """
import pandas as pd

df = dfs[0]

# Calculate the total sales for the current fiscal year
total_sales = df[df['date'] >= pd.to_datetime('today').replace(month=4, day=1)]['sales'].sum()
result = { "type": "number", "value": total_sales }
"""
agent.train(queries=[query], codes=[response])

# # The model will use the information provided in the training to generate a response

```

## Further reading

- [Getting Started with Pandas-AI](https://pandasai-docs.readthedocs.io/en/latest/getting-started/)
- [Pandas-AI Reference](https://pandasai-docs.readthedocs.io/en/latest/)
