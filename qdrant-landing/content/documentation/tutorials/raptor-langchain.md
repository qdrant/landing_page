---
title: RAPTOR with Langchain on Scaleway
weight: 22
---

| Time: 90 min | Level: Advanced |  |    |
|--------------|-----------------|--|----|
### Installation of Required Libraries

```python
!pip install -U langchain umap-learn scikit-learn langchain_community tiktoken langchain-openai langchainhub qdrant-client matplotlib pandas -qqq
```

# Advanced RAG with RAPTOR

Working with non-standard text such as code documentation, or non-English text, can be challenging. The Recursive Abstractive Processing for Tree-Organized Retrieval (RAPTOR) methodology offers a novel approach to organizing and retrieving information from such text. In this tutorial, we will implement RAPTOR with Langchain to create a powerful information retrieval system for code documentation.

Here, we use OpenAI LLM and Embedding both -- but if you cannot send data to an external service, you can use [Ollama](https://ollama.com/) to run  our own LLM model on our premises, using [Scaleway](https://www.scaleway.com/en/) as a cloud provider. Qdrant, acting in this setup as a knowledge base providing the relevant pieces of documents for a given query, will also be hosted in the Hybrid Cloud mode on Scaleway. The last missing piece, the Langchain application will be also running in the same environment.

# RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval

The RAPTOR methodology introduces a novel approach to document indexing and retrieval. It organizes documents or text chunks into a hierarchical structure that mimics a tree. Starting with the initial documents, referred to as `leafs`, the process involves embedding these documents and clustering them based on similarities. 
These clusters are then abstracted into higher-level summaries, encapsulating the essence of the documents within each cluster. This recursive abstraction continues, moving from the concrete details found in the `leafs` to increasingly abstract summaries at higher levels of the tree.

![RAPTOR Outline](/documentation/tutorials/raptor-langchain/outline.png)

The implementation of RAPTOR discussed here is based on the [Langchain Cookbook](https://github.com/langchain-ai/langchain/blob/master/cookbook/RAPTOR.ipynb), which provides practical examples and code for applying this approach to real-world data.

```python
from typing import Dict, List, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import tiktoken
import umap
from bs4 import BeautifulSoup as Soup
from langchain import hub
from langchain.prompts import ChatPromptTemplate
from langchain_community.document_loaders.recursive_url_loader import RecursiveUrlLoader
from langchain_community.vectorstores import Qdrant
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sklearn.mixture import GaussianMixture
```

### Tokenization of Documentation Texts

This section demonstrates the process of tokenizing documentation texts from two sources: Qdrant's Quick Start guide and Langchain's documentation on Qdrant integrations. The `num_tokens_from_string` function is used to calculate the number of tokens in each document, utilizing a specific encoding (`cl100k_base`). The documents are fetched using a `RecursiveUrlLoader`, which retrieves the text content from the specified URLs. After combining and tokenizing the texts from both sources, the distribution of token counts is visualized through a histogram.

```python
def num_tokens_from_string(string: str, encoding_name: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens


# QuickStart docs
url = "https://qdrant.tech/documentation/quick-start/"
loader = RecursiveUrlLoader(
    url=url, max_depth=20, extractor=lambda x: Soup(x, "html.parser").text
)
docs = loader.load()

## Langchain docs
url = "https://python.langchain.com/docs/integrations/vectorstores/qdrant/"
loader = RecursiveUrlLoader(
    url=url, max_depth=20, extractor=lambda x: Soup(x, "html.parser").text
)
docs_langchain = loader.load()

# Doc texts
docs = docs + docs_langchain
docs_texts = [d.page_content for d in docs]

# Calculate the number of tokens for each document
counts = [num_tokens_from_string(d, "cl100k_base") for d in docs_texts]

# Plotting the histogram of token counts
plt.figure(figsize=(10, 6))
plt.hist(counts, bins=30, color="blue", edgecolor="black", alpha=0.7)
plt.title("Histogram of Token Counts")
plt.xlabel("Token Count")
plt.ylabel("Frequency")
plt.grid(axis="y", alpha=0.75)

# Display the histogram
plt.show
```


Next, documents are first sorted based on their metadata source and then reversed. The content from these documents is concatenated into a single string, with triple newlines and a separator `---` between each document's content. The total number of tokens in the concatenated content is calculated using the OpenAI tokenizer (`cl100k_base`). The output indicates that the concatenated content comprises 8054 tokens, demonstrating the process of preparing and analyzing text data for further processing or analysis.

```python
# Doc texts concat
d_sorted = sorted(docs, key=lambda x: x.metadata["source"])
d_reversed = list(reversed(d_sorted))
concatenated_content = "\n\n\n --- \n\n\n".join(
    [doc.page_content for doc in d_reversed]
)
print(
    "Num tokens in all context: %s"
    % num_tokens_from_string(concatenated_content, "cl100k_base")
)
```

### Doc texts split

In this section, the process of splitting a large text document into smaller chunks is demonstrated. The `RecursiveCharacterTextSplitter` class from a text processing library is utilized, configured with a `chunk_size` of 2000 tokens and `chunk_overlap` of 0. This configuration means that the text will be divided into segments each containing up to 2000 tokens without any overlap between consecutive chunks. The `split_text` method is then called on a variable `concatenated_content`, which presumably contains the text to be split. This operation is essential for handling large texts that need to be processed in smaller, more manageable pieces, especially in contexts where processing limitations or performance considerations are a concern.

```python
# Doc texts split

chunk_size_tok = 2000
text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=chunk_size_tok, chunk_overlap=0
)
texts_split = text_splitter.split_text(concatenated_content)
```

## Models

```python
embd = OpenAIEmbeddings()
model = ChatOpenAI(temperature=0, model="gpt-4-1106-preview")
```

It is here that we configure both the Embeddings and LLM. You can replace this with your own models using Ollama or other services. Scaleway has some great [GPU Instances](https://www.scaleway.com/en/gpu-instances/) too - including H100 on the higher end, and soon L4 for everything small.

## Tree Construction

The clustering approach in tree construction includes a few interesting ideas.

**GMM (Gaussian Mixture Model)** 

- Model the distribution of data points across different clusters
- Optimal number of clusters by evaluating the model's Bayesian Information Criterion (BIC)

**UMAP (Uniform Manifold Approximation and Projection)** 

- Supports clustering
- Reduces the dimensionality of high-dimensional data
- UMAP helps to highlight the natural grouping of data points based on their similarities

**Local and Global Clustering** 

- Used to analyze data at different scales
- Both fine-grained and broader patterns within the data are captured effectively

**Thresholding** 

- Apply in the context of GMM to determine cluster membership
- Based on the probability distribution (assignment of data points to ≥ 1 cluster)

Code for GMM and thresholding is from Sarthi et al, as noted in the below two sources:
 
* [Origional repo](https://github.com/parthsarthi03/raptor/blob/master/raptor/cluster_tree_builder.py)
* [Minor tweaks](https://github.com/run-llama/llama_index/blob/main/llama-index-packs/llama-index-packs-raptor/llama_index/packs/raptor/clustering.py)

Full credit to both authors.

```python

RANDOM_SEED = 224  # Fixed seed for reproducibility

### --- Code from citations referenced above (added comments and docstrings) --- ###


def global_cluster_embeddings(
    embeddings: np.ndarray,
    dim: int,
    n_neighbors: Optional[int] = None,
    metric: str = "cosine",
) -> np.ndarray:
    """
    Perform global dimensionality reduction on the embeddings using UMAP.

    Parameters:
    - embeddings: The input embeddings as a numpy array.
    - dim: The target dimensionality for the reduced space.
    - n_neighbors: Optional; the number of neighbors to consider for each point.
                   If not provided, it defaults to the square root of the number of embeddings.
    - metric: The distance metric to use for UMAP.

    Returns:
    - A numpy array of the embeddings reduced to the specified dimensionality.
    """
    if n_neighbors is None:
        n_neighbors = int((len(embeddings) - 1) ** 0.5)
    return umap.UMAP(
        n_neighbors=n_neighbors, n_components=dim, metric=metric
    ).fit_transform(embeddings)


def local_cluster_embeddings(
    embeddings: np.ndarray, dim: int, num_neighbors: int = 10, metric: str = "cosine"
) -> np.ndarray:
    """
    Perform local dimensionality reduction on the embeddings using UMAP, typically after global clustering.

    Parameters:
    - embeddings: The input embeddings as a numpy array.
    - dim: The target dimensionality for the reduced space.
    - num_neighbors: The number of neighbors to consider for each point.
    - metric: The distance metric to use for UMAP.

    Returns:
    - A numpy array of the embeddings reduced to the specified dimensionality.
    """
    return umap.UMAP(
        n_neighbors=num_neighbors, n_components=dim, metric=metric
    ).fit_transform(embeddings)


def get_optimal_clusters(
    embeddings: np.ndarray, max_clusters: int = 50, random_state: int = RANDOM_SEED
) -> int:
    """
    Determine the optimal number of clusters using the Bayesian Information Criterion (BIC) with a Gaussian Mixture Model.

    Parameters:
    - embeddings: The input embeddings as a numpy array.
    - max_clusters: The maximum number of clusters to consider.
    - random_state: Seed for reproducibility.

    Returns:
    - An integer representing the optimal number of clusters found.
    """
    max_clusters = min(max_clusters, len(embeddings))
    n_clusters = np.arange(1, max_clusters)
    bics = []
    for n in n_clusters:
        gm = GaussianMixture(n_components=n, random_state=random_state)
        gm.fit(embeddings)
        bics.append(gm.bic(embeddings))
    return n_clusters[np.argmin(bics)]


def GMM_cluster(embeddings: np.ndarray, threshold: float, random_state: int = 0):
    """
    Cluster embeddings using a Gaussian Mixture Model (GMM) based on a probability threshold.

    Parameters:
    - embeddings: The input embeddings as a numpy array.
    - threshold: The probability threshold for assigning an embedding to a cluster.
    - random_state: Seed for reproducibility.

    Returns:
    - A tuple containing the cluster labels and the number of clusters determined.
    """
    n_clusters = get_optimal_clusters(embeddings)
    gm = GaussianMixture(n_components=n_clusters, random_state=random_state)
    gm.fit(embeddings)
    probs = gm.predict_proba(embeddings)
    labels = [np.where(prob > threshold)[0] for prob in probs]
    return labels, n_clusters


def perform_clustering(
    embeddings: np.ndarray,
    dim: int,
    threshold: float,
) -> List[np.ndarray]:
    """
    Perform clustering on the embeddings by first reducing their dimensionality globally, then clustering
    using a Gaussian Mixture Model, and finally performing local clustering within each global cluster.

    Parameters:
    - embeddings: The input embeddings as a numpy array.
    - dim: The target dimensionality for UMAP reduction.
    - threshold: The probability threshold for assigning an embedding to a cluster in GMM.

    Returns:
    - A list of numpy arrays, where each array contains the cluster IDs for each embedding.
    """
    if len(embeddings) <= dim + 1:
        # Avoid clustering when there's insufficient data
        return [np.array([0]) for _ in range(len(embeddings))]

    # Global dimensionality reduction
    reduced_embeddings_global = global_cluster_embeddings(embeddings, dim)
    # Global clustering
    global_clusters, n_global_clusters = GMM_cluster(
        reduced_embeddings_global, threshold
    )

    all_local_clusters = [np.array([]) for _ in range(len(embeddings))]
    total_clusters = 0

    # Iterate through each global cluster to perform local clustering
    for i in range(n_global_clusters):
        # Extract embeddings belonging to the current global cluster
        global_cluster_embeddings_ = embeddings[
            np.array([i in gc for gc in global_clusters])
        ]

        if len(global_cluster_embeddings_) == 0:
            continue
        if len(global_cluster_embeddings_) <= dim + 1:
            # Handle small clusters with direct assignment
            local_clusters = [np.array([0]) for _ in global_cluster_embeddings_]
            n_local_clusters = 1
        else:
            # Local dimensionality reduction and clustering
            reduced_embeddings_local = local_cluster_embeddings(
                global_cluster_embeddings_, dim
            )
            local_clusters, n_local_clusters = GMM_cluster(
                reduced_embeddings_local, threshold
            )

        # Assign local cluster IDs, adjusting for total clusters already processed
        for j in range(n_local_clusters):
            local_cluster_embeddings_ = global_cluster_embeddings_[
                np.array([j in lc for lc in local_clusters])
            ]
            indices = np.where(
                (embeddings == local_cluster_embeddings_[:, None]).all(-1)
            )[1]
            for idx in indices:
                all_local_clusters[idx] = np.append(
                    all_local_clusters[idx], j + total_clusters
                )

        total_clusters += n_local_clusters

    return all_local_clusters



def embed(texts):
    """
    Generate embeddings for a list of text documents.

    This function assumes the existence of an `embd` object with a method `embed_documents`
    that takes a list of texts and returns their embeddings.

    Parameters:
    - texts: List[str], a list of text documents to be embedded.

    Returns:
    - numpy.ndarray: An array of embeddings for the given text documents.
    """
    text_embeddings = embd.embed_documents(texts)
    text_embeddings_np = np.array(text_embeddings)
    return text_embeddings_np


def embed_cluster_texts(texts):
    """
    Embeds a list of texts and clusters them, returning a DataFrame with texts, their embeddings, and cluster labels.

    This function combines embedding generation and clustering into a single step. It assumes the existence
    of a previously defined `perform_clustering` function that performs clustering on the embeddings.

    Parameters:
    - texts: List[str], a list of text documents to be processed.

    Returns:
    - pandas.DataFrame: A DataFrame containing the original texts, their embeddings, and the assigned cluster labels.
    """
    text_embeddings_np = embed(texts)  # Generate embeddings
    cluster_labels = perform_clustering(
        text_embeddings_np, 10, 0.1
    )  # Perform clustering on the embeddings
    df = pd.DataFrame()  # Initialize a DataFrame to store the results
    df["text"] = texts  # Store original texts
    df["embd"] = list(text_embeddings_np)  # Store embeddings as a list in the DataFrame
    df["cluster"] = cluster_labels  # Store cluster labels
    return df


def fmt_txt(df: pd.DataFrame) -> str:
    """
    Formats the text documents in a DataFrame into a single string.

    Parameters:
    - df: DataFrame containing the 'text' column with text documents to format.

    Returns:
    - A single string where all text documents are joined by a specific delimiter.
    """
    unique_txt = df["text"].tolist()
    return "--- --- \n --- --- ".join(unique_txt)


def embed_cluster_summarize_texts(
    texts: List[str], level: int
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Embeds, clusters, and summarizes a list of texts. This function first generates embeddings for the texts,
    clusters them based on similarity, expands the cluster assignments for easier processing, and then summarizes
    the content within each cluster.

    Parameters:
    - texts: A list of text documents to be processed.
    - level: An integer parameter that could define the depth or detail of processing.

    Returns:
    - Tuple containing two DataFrames:
      1. The first DataFrame (`df_clusters`) includes the original texts, their embeddings, and cluster assignments.
      2. The second DataFrame (`df_summary`) contains summaries for each cluster, the specified level of detail,
         and the cluster identifiers.
    """

    # Embed and cluster the texts, resulting in a DataFrame with 'text', 'embd', and 'cluster' columns
    df_clusters = embed_cluster_texts(texts)

    # Prepare to expand the DataFrame for easier manipulation of clusters
    expanded_list = []

    # Expand DataFrame entries to document-cluster pairings for straightforward processing
    for index, row in df_clusters.iterrows():
        for cluster in row["cluster"]:
            expanded_list.append(
                {"text": row["text"], "embd": row["embd"], "cluster": cluster}
            )

    # Create a new DataFrame from the expanded list
    expanded_df = pd.DataFrame(expanded_list)

    # Retrieve unique cluster identifiers for processing
    all_clusters = expanded_df["cluster"].unique()

    print(f"--Generated {len(all_clusters)} clusters--")

    # Summarization
    template = """Here is a sub-set of LangChain Expression Langauge doc. 
    
    LangChain Expression Langauge provides a way to compose chain in LangChain.
    
    Give a detailed summary of the documentation provided.
    
    Documentation:
    {context}
    """
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | model | StrOutputParser()

    # Format text within each cluster for summarization
    summaries = []
    for i in all_clusters:
        df_cluster = expanded_df[expanded_df["cluster"] == i]
        formatted_txt = fmt_txt(df_cluster)
        summaries.append(chain.invoke({"context": formatted_txt}))

    # Create a DataFrame to store summaries with their corresponding cluster and level
    df_summary = pd.DataFrame(
        {
            "summaries": summaries,
            "level": [level] * len(summaries),
            "cluster": list(all_clusters),
        }
    )

    return df_clusters, df_summary


def recursive_embed_cluster_summarize(
    texts: List[str], level: int = 1, n_levels: int = 3
) -> Dict[int, Tuple[pd.DataFrame, pd.DataFrame]]:
    """
    Recursively embeds, clusters, and summarizes texts up to a specified level or until
    the number of unique clusters becomes 1, storing the results at each level.

    Parameters:
    - texts: List[str], texts to be processed.
    - level: int, current recursion level (starts at 1).
    - n_levels: int, maximum depth of recursion.

    Returns:
    - Dict[int, Tuple[pd.DataFrame, pd.DataFrame]], a dictionary where keys are the recursion
      levels and values are tuples containing the clusters DataFrame and summaries DataFrame at that level.
    """
    results = {}  # Dictionary to store results at each level

    # Perform embedding, clustering, and summarization for the current level
    df_clusters, df_summary = embed_cluster_summarize_texts(texts, level)

    # Store the results of the current level
    results[level] = (df_clusters, df_summary)

    # Determine if further recursion is possible and meaningful
    unique_clusters = df_summary["cluster"].nunique()
    if level < n_levels and unique_clusters > 1:
        # Use summaries as the input texts for the next level of recursion
        new_texts = df_summary["summaries"].tolist()
        next_level_results = recursive_embed_cluster_summarize(
            new_texts, level + 1, n_levels
        )

        # Merge the results from the next level into the current results dictionary
        results.update(next_level_results)

    return results
```

### Collapsed Tree Retrieval for Enhanced Performance

The concept of `collapsed tree retrieval` is highlighted as a superior method for information retrieval, according to the paper. This method simplifies the search process by converting a hierarchical tree structure into a single layer, facilitating a more efficient k-nearest neighbors (kNN) search across all nodes. Instead of employing a traditional brute-force approach for kNN, the example utilizes Qdrant Vector Store, known for its rapid retrieval capabilities. The process involves building a tree from document texts (`leaf_texts`), then recursively embedding, clustering, and summarizing these texts across three levels.

```python
# Build tree
leaf_texts = docs_texts
results = recursive_embed_cluster_summarize(leaf_texts, level=1, n_levels=3)
```

### Using the Flattened, Indexed Tree in a RAG Chain

The process involves initializing a collection named `all_texts` with the content from `leaf_texts`. This collection is then expanded by iterating through the results obtained from a hierarchical structure, where summaries from each level are extracted and appended to `all_texts`. These summaries represent condensed information at various levels of the hierarchy, providing a comprehensive dataset that includes both detailed leaf-level texts and their higher-level summaries.

Subsequently, this enriched dataset is used to build a vector store using Qdrant, a powerful vector search engine. The `from_texts` method is employed to transform the texts into vectors using an embedding model referred to as `embd`, and these vectors are stored in-memory for efficient retrieval. The collection is named "lcel", indicating a specific use case or dataset.

Finally, a retriever is created from the vector store, enabling efficient search and retrieval of information based on vector similarity. This setup is particularly useful in applications requiring quick access to relevant information from a large, hierarchically structured dataset, such as document summarization, information retrieval, and question-answering systems.

```python
# Initialize all_texts with leaf_texts
all_texts = leaf_texts.copy()

# Iterate through the results to extract summaries from each level and add them to all_texts
for level in sorted(results.keys()):
    # Extract summaries from the current level's DataFrame
    summaries = results[level][1]["summaries"].tolist()
    # Extend all_texts with the summaries from the current level
    all_texts.extend(summaries)

# Now, use all_texts to build the vectorstore with Chroma
vectorstore = Qdrant.from_texts(all_texts, embd, location=":memory:", collection_name="lcel")
retriever = vectorstore.as_retriever()
```

## Trying it out

```python

# Prompt
prompt = hub.pull("rlm/rag-prompt")


# Post-processing
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


# Chain
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | model
    | StrOutputParser()
)

# Question
rag_chain.invoke("How to use Qdrant with LangChain? Give a Python code snippet.")
```

## Deploying the Langchain Application on Scaleway
Scaleway has serverless [Functions](https://www.scaleway.com/en/serverless-functions/) and serverless [Jobs](https://www.scaleway.com/en/serverless-jobs/) -- ideal for embedding creation when doing a bulk operation.

Their French deployment regions e.g. France are excellent for network latency and data sovereignty. Need a GPU? [Render with P100](https://www.scaleway.com/en/gpu-render-instances/) is there for you.