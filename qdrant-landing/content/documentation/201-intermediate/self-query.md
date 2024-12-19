---
notebook_path: 201-intermediate/self-query/self-query.ipynb
reading_time_min: 17
title: Loading and cleaning data
---

```python
import os
import warnings
import pandas as pd
from qdrant_client import models, QdrantClient
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

warnings.filterwarnings("ignore")
encoder = SentenceTransformer("all-MiniLM-L6-v2")
load_dotenv()

client = QdrantClient(os.getenv("QDRANT_HOST"), api_key=os.getenv("QDRANT_API_KEY"))
```

# Loading and cleaning data

This [dataset](https://www.kaggle.com/datasets/zynicide/wine-reviews) contains approximately 130k reviews from the Wine Enthusiast

Once cleaned we will have around 120k.

```python
df = pd.read_csv("winemag-data-130k-v2.csv")
```

<hr />

```python
wines = df.copy()
wines = wines.drop(
    [
        "Unnamed: 0",
        "designation",
        "province",
        "region_1",
        "region_2",
        "taster_name",
        "taster_twitter_handle",
        "winery",
    ],
    axis=1,
)
wines = wines.dropna(subset=["country", "price", "variety"])
```

<hr />

```python
wines.head()
```

<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

```
.dataframe tbody tr th {
    vertical-align: top;
}

.dataframe thead th {
    text-align: right;
}
```

</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>country</th>
      <th>description</th>
      <th>points</th>
      <th>price</th>
      <th>title</th>
      <th>variety</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>1</th>
      <td>Portugal</td>
      <td>This is ripe and fruity, a wine that is smooth...</td>
      <td>87</td>
      <td>15.0</td>
      <td>Quinta dos Avidagos 2011 Avidagos Red (Douro)</td>
      <td>Portuguese Red</td>
    </tr>
    <tr>
      <th>2</th>
      <td>US</td>
      <td>Tart and snappy, the flavors of lime flesh and...</td>
      <td>87</td>
      <td>14.0</td>
      <td>Rainstorm 2013 Pinot Gris (Willamette Valley)</td>
      <td>Pinot Gris</td>
    </tr>
    <tr>
      <th>3</th>
      <td>US</td>
      <td>Pineapple rind, lemon pith and orange blossom ...</td>
      <td>87</td>
      <td>13.0</td>
      <td>St. Julian 2013 Reserve Late Harvest Riesling ...</td>
      <td>Riesling</td>
    </tr>
    <tr>
      <th>4</th>
      <td>US</td>
      <td>Much like the regular bottling from 2012, this...</td>
      <td>87</td>
      <td>65.0</td>
      <td>Sweet Cheeks 2012 Vintner's Reserve Wild Child...</td>
      <td>Pinot Noir</td>
    </tr>
    <tr>
      <th>5</th>
      <td>Spain</td>
      <td>Blackberry and raspberry aromas show a typical...</td>
      <td>87</td>
      <td>15.0</td>
      <td>Tandem 2011 Ars In Vitro Tempranillo-Merlot (N...</td>
      <td>Tempranillo-Merlot</td>
    </tr>
  </tbody>
</table>
</div>

```python
wines.info()
```

```
<class 'pandas.core.frame.DataFrame'>
Index: 120915 entries, 1 to 129970
Data columns (total 6 columns):
 #   Column       Non-Null Count   Dtype  
---  ------       --------------   -----  
 0   country      120915 non-null  object 
 1   description  120915 non-null  object 
 2   points       120915 non-null  int64  
 3   price        120915 non-null  float64
 4   title        120915 non-null  object 
 5   variety      120915 non-null  object 
dtypes: float64(1), int64(1), object(4)
memory usage: 6.5+ MB
```

# Create a collection

```python
client.create_collection(
    collection_name="wine_reviews",
    vectors_config=models.VectorParams(
        size=encoder.get_sentence_embedding_dimension(),
        distance=models.Distance.COSINE,
    ),
)
```

<hr />

```python
# Document class to structure data
class Document:
    def __init__(self, page_content, metadata):
        self.page_content = page_content
        self.metadata = metadata


# Convert DataFrame rows into Document objects
def df_to_documents(df):
    documents = []
    for _, row in df.iterrows():
        metadata = {
            "country": row["country"],
            "points": row["points"],
            "price": row["price"],
            "title": row["title"],
            "variety": row["variety"],
        }
        document = Document(page_content=row["description"], metadata=metadata)
        documents.append(document)
    return documents


docs = df_to_documents(wines)
```

<hr />

```python
points = [
    models.PointStruct(
        id=idx,
        vector=encoder.encode(doc.page_content).tolist(),
        payload={"metadata": doc.metadata, "page_content": doc.page_content},
    )
    for idx, doc in enumerate(docs)
]
```

<hr />

```python
client.upload_points(
    collection_name="wine_reviews",
    points=points,
)
```

# Test search

```python
hits = client.search(
    collection_name="wine_reviews",
    query_vector=encoder.encode("Quinta dos Avidagos 2011").tolist(),
    limit=3,
)

for hit in hits:
    print(hit.payload["metadata"]["title"], "score:", hit.score)
```

```
Aveleda 2010 Follies Quinta da Agueira Touriga Nacional (Beiras) score: 0.46982175
Quinta da Romaneira 2013 Sino da Romaneira Red (Douro) score: 0.43031913
Quinta da Romaneira 2013 Sino da Romaneira Red (Douro) score: 0.43031913
```

# Test filtering

```python
# query filter
hits = client.search(
    collection_name="wine_reviews",
    query_vector=encoder.encode("Night Sky").tolist(),
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="metadata.country", match=models.MatchValue(value="US")
            ),
            models.FieldCondition(
                key="metadata.price", range=models.Range(gte=15.0, lte=30.0)
            ),
            models.FieldCondition(
                key="metadata.points", range=models.Range(gte=90, lte=100)
            ),
        ]
    ),
    limit=3,
)

for hit in hits:
    print(
        hit.payload["metadata"]["title"],
        "\nprice:",
        hit.payload["metadata"]["price"],
        "\npoints:",
        hit.payload["metadata"]["points"],
        "\n\n",
    )
```

```
Ballentine 2010 Fig Tree Vineyard Petite Sirah (St. Helena) 
price: 28.0 
points: 91 


Seven Angels 2012 St. Peter of Alcantara Vineyard Zinfandel (Paso Robles) 
price: 29.0 
points: 92 


Jamieson Canyon 1999 Cabernet Sauvignon (Napa Valley) 
price: 20.0 
points: 91 
```

# Self-querying with LangChain

```python
from langchain.chains.query_constructor.base import AttributeInfo
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.callbacks.tracers import ConsoleCallbackHandler
from langchain_openai import ChatOpenAI
from langchain_qdrant import Qdrant

handler = ConsoleCallbackHandler()
llm = ChatOpenAI(temperature=0, model="gpt-4o")
# llm = OpenAI(temperature=0)

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Qdrant(client, collection_name="wine_reviews", embeddings=embeddings)
```

<hr />

```python
metadata_field_info = [
    AttributeInfo(
        name="country",
        description="The country that the wine is from",
        type="string",
    ),
    AttributeInfo(
        name="points",
        description="The number of points WineEnthusiast rated the wine on a scale of 1-100",
        type="integer",
    ),
    AttributeInfo(
        name="price",
        description="The cost for a bottle of the wine",
        type="float",
    ),
    AttributeInfo(
        name="variety",
        description="The grapes used to make the wine",
        type="string",
    ),
]

document_content_description = "Brief description of the wine"

retriever = SelfQueryRetriever.from_llm(
    llm, vectorstore, document_content_description, metadata_field_info
)
```

<hr />

```python
response = retriever.invoke(
    "Which US wines are priced between 15 and 30 and have points above 90?"
)
response
```

```
[Document(page_content='An outstanding value, the latest release of this wine dazzles with bold, black cherry and chocolate mocha flavors. The focus and definition throughout are exceptional also. This is a gem at a more than fair tariff.', metadata={'country': 'US', 'points': 91, 'price': 28.0, 'title': 'Dobbes Family Estate 2014 Grand Assemblage Pinot Noir (Willamette Valley)', 'variety': 'Pinot Noir', '_id': 10604, '_collection_name': 'wine_reviews'}),
 Document(page_content='This is an amazingly fresh and fruity tank-fermented wine, imparting a subtle hint of grass before unleashing sublime layers of melon and apricot alongside measured, zesty acidity. New winemaker Chris Kajani is taking things in a refreshing, aim-for-the-top direction with this bottling.', metadata={'country': 'US', 'points': 92, 'price': 30.0, 'title': "Bouchaine 2013 Chêne d'Argent Estate Vineyard Chardonnay (Carneros)", 'variety': 'Chardonnay', '_id': 102251, '_collection_name': 'wine_reviews'}),
 Document(page_content="A streak of confectionary nougat and lemony acidity combine for a smooth, well-integrated wine, full bodied in style, that's lip-smacking in apple-cider juiciness on the finish.", metadata={'country': 'US', 'points': 92, 'price': 25.0, 'title': 'Conn Creek 2014 Chardonnay (Carneros)', 'variety': 'Chardonnay', '_id': 100685, '_collection_name': 'wine_reviews'}),
 Document(page_content='Rick Longoria shows increasing mastery over this popular variety, lifting it into true complexity. After an outstanding 2010 vintage, his 2011 is even better, showing the same crisp acidity and savory orange, apricot and honey flavors, but with even greater elegance.', metadata={'country': 'US', 'points': 91, 'price': 19.0, 'title': 'Longoria 2011 Pinot Grigio (Santa Barbara County)', 'variety': 'Pinot Grigio', '_id': 105297, '_collection_name': 'wine_reviews'})]
```

```python
for resp in response:
    print(
        resp.metadata["title"],
        "\n price:",
        resp.metadata["price"],
        "points:",
        resp.metadata["points"],
        "\n\n",
    )
```

```
Dobbes Family Estate 2014 Grand Assemblage Pinot Noir (Willamette Valley) 
 price: 28.0 points: 91 


Bouchaine 2013 Chêne d'Argent Estate Vineyard Chardonnay (Carneros) 
 price: 30.0 points: 92 


Conn Creek 2014 Chardonnay (Carneros) 
 price: 25.0 points: 92 


Longoria 2011 Pinot Grigio (Santa Barbara County) 
 price: 19.0 points: 91 
```

# Tracing to see filters in action

```python
retriever.invoke(
    "Which US wines are priced between 15 and 30 and have points above 90?",
    {"callbacks": [handler]},
)
```

````
[32;1m[1;3m[chain/start][0m [1m[retriever:Retriever > chain:query_constructor] Entering Chain run with input:
[0m{
  "query": "Which US wines are priced between 15 and 30 and have points above 90?"
}
[32;1m[1;3m[chain/start][0m [1m[retriever:Retriever > chain:query_constructor > prompt:FewShotPromptTemplate] Entering Prompt run with input:
[0m{
  "query": "Which US wines are priced between 15 and 30 and have points above 90?"
}
[36;1m[1;3m[chain/end][0m [1m[retriever:Retriever > chain:query_constructor > prompt:FewShotPromptTemplate] [1ms] Exiting Prompt run with output:
[0m[outputs]
[32;1m[1;3m[llm/start][0m [1m[retriever:Retriever > chain:query_constructor > llm:ChatOpenAI] Entering LLM run with input:
[0m{
  "prompts": [
    "Human: Your goal is to structure the user's query to match the request schema provided below.\n\n<< Structured Request Schema >>\nWhen responding use a markdown code snippet with a JSON object formatted in the following schema:\n\n```json\n{\n    \"query\": string \\ text string to compare to document contents\n    \"filter\": string \\ logical condition statement for filtering documents\n}\n```\n\nThe query string should contain only text that is expected to match the contents of documents. Any conditions in the filter should not be mentioned in the query as well.\n\nA logical condition statement is composed of one or more comparison and logical operation statements.\n\nA comparison statement takes the form: `comp(attr, val)`:\n- `comp` (eq | lt | lte | gt | gte | like): comparator\n- `attr` (string):  name of attribute to apply the comparison to\n- `val` (string): is the comparison value\n\nA logical operation statement takes the form `op(statement1, statement2, ...)`:\n- `op` (and | or | not): logical operator\n- `statement1`, `statement2`, ... (comparison statements or logical operation statements): one or more statements to apply the operation to\n\nMake sure that you only use the comparators and logical operators listed above and no others.\nMake sure that filters only refer to attributes that exist in the data source.\nMake sure that filters only use the attributed names with its function names if there are functions applied on them.\nMake sure that filters only use format `YYYY-MM-DD` when handling date data typed values.\nMake sure that filters take into account the descriptions of attributes and only make comparisons that are feasible given the type of data being stored.\nMake sure that filters are only used as needed. If there are no filters that should be applied return \"NO_FILTER\" for the filter value.\n\n<< Example 1. >>\nData Source:\n```json\n{\n    \"content\": \"Lyrics of a song\",\n    \"attributes\": {\n        \"artist\": {\n            \"type\": \"string\",\n            \"description\": \"Name of the song artist\"\n        },\n        \"length\": {\n            \"type\": \"integer\",\n            \"description\": \"Length of the song in seconds\"\n        },\n        \"genre\": {\n            \"type\": \"string\",\n            \"description\": \"The song genre, one of \"pop\", \"rock\" or \"rap\"\"\n        }\n    }\n}\n```\n\nUser Query:\nWhat are songs by Taylor Swift or Katy Perry about teenage romance under 3 minutes long in the dance pop genre\n\nStructured Request:\n```json\n{\n    \"query\": \"teenager love\",\n    \"filter\": \"and(or(eq(\\\"artist\\\", \\\"Taylor Swift\\\"), eq(\\\"artist\\\", \\\"Katy Perry\\\")), lt(\\\"length\\\", 180), eq(\\\"genre\\\", \\\"pop\\\"))\"\n}\n```\n\n\n<< Example 2. >>\nData Source:\n```json\n{\n    \"content\": \"Lyrics of a song\",\n    \"attributes\": {\n        \"artist\": {\n            \"type\": \"string\",\n            \"description\": \"Name of the song artist\"\n        },\n        \"length\": {\n            \"type\": \"integer\",\n            \"description\": \"Length of the song in seconds\"\n        },\n        \"genre\": {\n            \"type\": \"string\",\n            \"description\": \"The song genre, one of \"pop\", \"rock\" or \"rap\"\"\n        }\n    }\n}\n```\n\nUser Query:\nWhat are songs that were not published on Spotify\n\nStructured Request:\n```json\n{\n    \"query\": \"\",\n    \"filter\": \"NO_FILTER\"\n}\n```\n\n\n<< Example 3. >>\nData Source:\n```json\n{\n    \"content\": \"Brief description of the wine\",\n    \"attributes\": {\n    \"country\": {\n        \"description\": \"The country that the wine is from\",\n        \"type\": \"string\"\n    },\n    \"points\": {\n        \"description\": \"The number of points WineEnthusiast rated the wine on a scale of 1-100\",\n        \"type\": \"integer\"\n    },\n    \"price\": {\n        \"description\": \"The cost for a bottle of the wine\",\n        \"type\": \"float\"\n    },\n    \"variety\": {\n        \"description\": \"The grapes used to make the wine\",\n        \"type\": \"string\"\n    }\n}\n}\n```\n\nUser Query:\nWhich US wines are priced between 15 and 30 and have points above 90?\n\nStructured Request:"
  ]
}
[36;1m[1;3m[llm/end][0m [1m[retriever:Retriever > chain:query_constructor > llm:ChatOpenAI] [3.00s] Exiting LLM run with output:
[0m{
  "generations": [
    [
      {
        "text": "```json\n{\n    \"query\": \"\",\n    \"filter\": \"and(eq(\\\"country\\\", \\\"US\\\"), gte(\\\"price\\\", 15), lte(\\\"price\\\", 30), gt(\\\"points\\\", 90))\"\n}\n```",
        "generation_info": {
          "finish_reason": "stop",
          "logprobs": null
        },
        "type": "ChatGeneration",
        "message": {
          "lc": 1,
          "type": "constructor",
          "id": [
            "langchain",
            "schema",
            "messages",
            "AIMessage"
          ],
          "kwargs": {
            "content": "```json\n{\n    \"query\": \"\",\n    \"filter\": \"and(eq(\\\"country\\\", \\\"US\\\"), gte(\\\"price\\\", 15), lte(\\\"price\\\", 30), gt(\\\"points\\\", 90))\"\n}\n```",
            "response_metadata": {
              "token_usage": {
                "completion_tokens": 49,
                "prompt_tokens": 922,
                "total_tokens": 971
              },
              "model_name": "gpt-4o",
              "system_fingerprint": "fp_729ea513f7",
              "finish_reason": "stop",
              "logprobs": null
            },
            "type": "ai",
            "id": "run-804927ef-53b2-4236-9c22-15e4913667f5-0",
            "tool_calls": [],
            "invalid_tool_calls": []
          }
        }
      }
    ]
  ],
  "llm_output": {
    "token_usage": {
      "completion_tokens": 49,
      "prompt_tokens": 922,
      "total_tokens": 971
    },
    "model_name": "gpt-4o",
    "system_fingerprint": "fp_729ea513f7"
  },
  "run": null
}
[32;1m[1;3m[chain/start][0m [1m[retriever:Retriever > chain:query_constructor > parser:StructuredQueryOutputParser] Entering Parser run with input:
[0m[inputs]
[36;1m[1;3m[chain/end][0m [1m[retriever:Retriever > chain:query_constructor > parser:StructuredQueryOutputParser] [4ms] Exiting Parser run with output:
[0m[outputs]
[36;1m[1;3m[chain/end][0m [1m[retriever:Retriever > chain:query_constructor] [3.01s] Exiting Chain run with output:
[0m[outputs]





[Document(page_content='An outstanding value, the latest release of this wine dazzles with bold, black cherry and chocolate mocha flavors. The focus and definition throughout are exceptional also. This is a gem at a more than fair tariff.', metadata={'country': 'US', 'points': 91, 'price': 28.0, 'title': 'Dobbes Family Estate 2014 Grand Assemblage Pinot Noir (Willamette Valley)', 'variety': 'Pinot Noir', '_id': 10604, '_collection_name': 'wine_reviews'}),
 Document(page_content='This is an amazingly fresh and fruity tank-fermented wine, imparting a subtle hint of grass before unleashing sublime layers of melon and apricot alongside measured, zesty acidity. New winemaker Chris Kajani is taking things in a refreshing, aim-for-the-top direction with this bottling.', metadata={'country': 'US', 'points': 92, 'price': 30.0, 'title': "Bouchaine 2013 Chêne d'Argent Estate Vineyard Chardonnay (Carneros)", 'variety': 'Chardonnay', '_id': 102251, '_collection_name': 'wine_reviews'}),
 Document(page_content="A streak of confectionary nougat and lemony acidity combine for a smooth, well-integrated wine, full bodied in style, that's lip-smacking in apple-cider juiciness on the finish.", metadata={'country': 'US', 'points': 92, 'price': 25.0, 'title': 'Conn Creek 2014 Chardonnay (Carneros)', 'variety': 'Chardonnay', '_id': 100685, '_collection_name': 'wine_reviews'}),
 Document(page_content='Rick Longoria shows increasing mastery over this popular variety, lifting it into true complexity. After an outstanding 2010 vintage, his 2011 is even better, showing the same crisp acidity and savory orange, apricot and honey flavors, but with even greater elegance.', metadata={'country': 'US', 'points': 91, 'price': 19.0, 'title': 'Longoria 2011 Pinot Grigio (Santa Barbara County)', 'variety': 'Pinot Grigio', '_id': 105297, '_collection_name': 'wine_reviews'})]
````

```python

```
