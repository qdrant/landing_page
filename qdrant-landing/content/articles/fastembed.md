# FastEmbed

In the ever-changing landscape of Data Science and Machine Learning, practitioners often find themselves navigating through a labyrinth of models, libraries, and frameworks. Among the plethora of choices, the need for a specialized, efficient, and easy-to-implement solution for embedding generation is increasingly evident. This is where FastEmbed (docs: [https://qdrant.github.io/fastembed/](https://qdrant.github.io/fastembed/)) comes into play—a Python library engineered for speed, efficiency, and above all, usability.


### Problem Statement

We can always make embedding by wrapping PyTorch or TF models. That forces us to make the Compute Speed vs Dev Speed tradeoff. Simple APIs save a lot of dev time, but end up costing us in latency and compute time. This is at least in part because these are built for both: model inference and improvement e.g. via fine-tuning. This makes the inference also memory and CPU/GPU intensive.


### Current Problem-Solution Framework

FastEmbed addresses these challenges with surgical precision. Designed as a lightweight library that values computational efficiency, FastEmbed eliminates the need for extraneous dependencies. We ship limited models, and only quantized model weights, which are integrated seamlessly with ONNX Runtime. FastEmbed strikes a new balance between inference time, resource utilization and performance (recall/accuracy). 


### Focus Areas

We build for _fast_ embedding creation. This is why we've started with a small set of supported models: 


<table>
  <tr>
   <td><strong>Embedding Model</strong>
   </td>
   <td><strong>Dimensions</strong>
   </td>
   <td><strong>Description</strong>
   </td>
  </tr>
  <tr>
   <td>BAAI/bge-small-en
   </td>
   <td>384
   </td>
   <td>Fast and Perfomant English model, Default in FastEmbed
   </td>
  </tr>
  <tr>
   <td>BAAI/bge-base-en
   </td>
   <td>768
   </td>
   <td>Base English model supported in FastEmbed
   </td>
  </tr>
  <tr>
   <td>sentence-transformers/all-MiniLM-L6-v2
   </td>
   <td>384
   </td>
   <td>Most Popular: Sentence Transformer model, MiniLM-L6-v2
   </td>
  </tr>
  <tr>
   <td>intfloat/multilingual-e5-large
   </td>
   <td>1024
   </td>
   <td>Multilingual model, e5-large. Recommend using this model for non-English languages. Recommend using this via Torch implementation of FastEmbed
   </td>
  </tr>
</table>


All the models we support are [quantized](https://pytorch.org/docs/stable/quantization.html) to enable even faster compute!

Suggested Illustration: Graphical for computational efficiency and accuracy metrics, contrasting FastEmbed with conventional methods.


## Key Features


### Computational Efficiency

ONNX Runtime: Examine how FastEmbed leverages ONNX Runtime for inference

Resource Utilization: Analyze the resource footprint and computational benefits arising from the lightweight nature of FastEmbed.



<p id="gdcalert1" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image1.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert2">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image1.png "image_tooltip")



### Retaining Accuracy and Recall

We support quantized models for State of the Art Embedding models e.g. those from [MTEB](https://huggingface.co/spaces/mteb/leaderboard). For FastEmbed's  DefaultEmbedding model, we give this throughput improvement without sacrificing Accuracy or Recall. 

How do we measure this? The cosine similarity between the Transformers/PyTorch implementation and our quantized model is 0.999999. 

We strongly recommend that you pin the FastEmbed version in your usage to a specific version, since the DefaultEmbedding will also be continuously updated to give a strong speed vs accuracy balance.


### Comparison Against OpenAI

For retrieval, FastEmbed does almost 3% better than OpenAI. We're also faster because there is no network latency, using smaller models which are then quantized. 

On every metric that you care about: speed, accuracy and ease of use – we do better and intend to continue to do so!



<p id="gdcalert2" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image2.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert3">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image2.png "image_tooltip")



### Light

FastEmbed sets itself apart by maintaining a lightweight footprint. It's designed to be agile and fast, a critical feature for businesses looking to integrate text embedding solutions without the cumbersome overhead typically associated with such libraries. \
 \
For FastEmbed, the list of dependencies is refreshingly brief:



* onnx: Version ^1.11 – We'll try to drop this also in the future if we can!
* onnxruntime: Version ^1.15
* tqdm: Version ^4.65
* requests: Version ^2.31
* tokenizers: Version ^0.13

This minimized list serves two purposes. First, it significantly reduces the installation time, allowing for quicker deployments. Second, it limits the amount of disk space required, making it a viable option even for environments with storage limitations.

Notably absent from the dependency list are bulky libraries like PyTorch, and there's no requirement for CUDA drivers. This is intentional. FastEmbed is engineered to deliver optimal performance right on your CPU, eliminating the need for specialized hardware or complex setups.


### Flexibility with ONNX Runtime Providers

FastEmbed leverages the ONNX Runtime, providing you with the flexibility to choose specific ONNX providers based on your operational needs – including Intel and NVIDIA/CUDA based ones. This allows for greater customization and optimization, further aligning with your specific performance and computational requirements.


## Usage

Understanding the nuances of code is crucial for leveraging the full capabilities of a library. In this section, we'll dissect an example code snippet that employs FastEmbed for generating text embeddings. We'll discuss details: the significance of text prefixes, and the structure of the output for seamless integration into your downstream applications.


### Code Walkthrough

Let's delve into this example code snippet line-by-line:

```python

from fastembed.embedding import FlagEmbedding as Embedding

```

Here, we import the `FlagEmbedding` class from FastEmbed and alias it as `Embedding`. This is the core class responsible for generating embeddings based on your chosen text model. This is also the class which you can import directly as `DefaultEmbedding` which is `BAAI/bge-small-en`

```python

documents: List[str] = [

    "passage: Hello, World!",

    "query: Hello, World!",

    "passage: This is an example passage.",

    "fastembed is supported by and maintained by Qdrant."

]

```

In this list called `documents`, we define four text strings that we want to convert into embeddings.


#### Text Prefixes

Note the use of prefixes "passage" and "query" to differentiate the types of embeddings to be generated. This is inherited from the cross-encoder implementation of the BAAI/bge series of models themselves. This is particularly useful for retrieval and we strongly recommend using this as well. 

The use of text prefixes like "query" and "passage" isn't merely syntactic sugar; it informs the algorithm on how to treat the text for embedding generation. A "query" prefix often triggers the model to generate embeddings that are optimized for similarity comparisons, while "passage" embeddings are fine-tuned for contextual understanding. If you omit the prefix, the default behavior is applied, although specifying it is recommended for more nuanced results.


#### Loading a Model

Next, we initialize the `Embedding` model with the model name "BAAI/bge-base-en" and specify a maximum token length of 512.

```python

embedding_model = Embedding(model_name="BAAI/bge-base-en", max_length=512)

```

This model strikes a balance between speed and accuracy, ideal for real-world applications.


#### Output Structure

```python

embeddings: List[np.ndarray] = list(embedding_model.embed(documents))

```

Finally, we call the `embed()` method on our `embedding_model` object, passing in the `documents` list. The method returns a Python generator, so we convert it to a list to get all the embeddings. These embeddings are NumPy arrays, optimized for fast mathematical operations.

The `embed()` method returns a list of NumPy arrays, each corresponding to the embedding of a document in your original `documents` list. The dimensions of these arrays are determined by the model you chose; for "BAAI/bge-base-en," it's a 768-dimensional vector.

You can easily parse these NumPy arrays for any downstream application—be it clustering, similarity comparison, or feeding them into a machine learning model for further analysis.


### Integration with Qdrant

Qdrant is a Vector Store, offering a comprehensive, efficient, and scalable solution for modern machine learning and AI applications. Whether you are dealing with billions of data points, require a low latency performant vector solution, or specialized quantization methods –  [Qdrant is engineered](https://qdrant.tech/documentation/overview/) to meet those demands head-on.

The fusion of FastEmbed with Qdrant's vector store capabilities enables a transparent workflow for seamless embedding generation, storage, and retrieval. This simplifies the API design — while still giving you the flexibility to make significant changes e.g. you can use FastEmbed to make your own embedding other than the DefaultEmbedding and use that with Qdrant. 

Below is a detailed guide on how to get started with FastEmbed in conjunction with Qdrant.

### Installation

Before diving into the code, the initial step involves installing the Qdrant Client along with the FastEmbed library. This can be done using pip:

```bash

pip install qdrant-client[fastembed]

```

For those using zsh as their shell, you might encounter syntax issues. In such cases, wrap the package name in quotes:

```bash

pip install 'qdrant-client[fastembed]'

```

### Initializing the Qdrant Client

After successful installation, the next step involves initializing the Qdrant Client. This can be done either in-memory or by specifying a database path:

```python

from qdrant_client import QdrantClient

# Initialize the client

client = QdrantClient(":memory:")  # or QdrantClient(path="path/to/db")

```

### Preparing Documents, Metadata, and IDs

Once the client is initialized, prepare the text documents you wish to embed, along with any associated metadata and unique IDs:

```python

docs = ["Qdrant has Langchain integrations", "Qdrant also has Llama Index integrations"]

metadata = [

    {"source": "Langchain-docs"},

    {"source": "LlamaIndex-docs"},

]

ids = [42, 2]

```

Note that the `add` method we'll use is overloaded: If you skip the `ids`, we'll generate those for you. `metadata` is obviously optional. So, you can simply use this too: 

```python

docs = ["Qdrant has Langchain integrations", "Qdrant also has Llama Index integrations"]

```

### Adding Documents to a Collection

With your documents, metadata, and IDs ready, you can proceed to add these to a specified collection within Qdrant using the `add` method:

```python

client.add(

    collection_name="demo_collection",

    documents=docs,

    metadata=metadata,

    ids=ids

)

```

Behind the scenes, Qdrant is using FastEmbed to make the text embedding, generate ids if they're missing and then adding them to the index with metadata. 



<p id="gdcalert3" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image3.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert4">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image3.png "image_tooltip")


### Performing Queries

Finally, you can perform queries on your stored documents. Qdrant offers a robust querying capability, and the query results can be easily retrieved as follows:

```python

search_result = client.query(

    collection_name="demo_collection",

    query_text="This is a query document"

)

print(search_result)

```

Behind the scenes, we first convert the `query_text` to the embedding and use that to query the vector index. 



<p id="gdcalert4" ><span style="color: red; font-weight: bold">>>>>>  gd2md-html alert: inline image link here (to images/image4.png). Store image on your image server and adjust path/filename/extension if necessary. </span><br>(<a href="#">Back to top</a>)(<a href="#gdcalert5">Next alert</a>)<br><span style="color: red; font-weight: bold">>>>>> </span></p>


![alt_text](images/image4.png "image_tooltip")


By following these steps, you effectively utilize the combined capabilities of FastEmbed and Qdrant, thereby streamlining your embedding generation and retrieval tasks. 

Qdrant is designed to handle large-scale datasets with billions of data points. Its architecture employs techniques like binary and scalar quantization for efficient storage and retrieval. When you inject FastEmbed's CPU-first design and lightweight nature into this equation, you end up with a system that can scale 

seamlessly while maintaining low latency.


## Open Source Contributions and Support

FastEmbed is a continually evolving platform that thrives on community contributions. 

If the utility of this library resonates with your organizational needs, please consider [starring the repository](https://github.com/qdrant/fastembed) as a sign of support and to stay abreast of our ongoing enhancements. 

If you'd like to request specific models or features, please consider opening an issue: [https://github.com/qdrant/fastembed/issues](https://github.com/qdrant/fastembed/issues) — that is what we use when starting our prioritization!

If you've questions, please ask them on this Discord: [https://discord.gg/Qy6HCJK9Dc](https://discord.gg/Qy6HCJK9Dc) 


Here, we've dissected the multitude of advantages that come from integrating FastEmbed with Qdrant. 

The evidence is clear: FastEmbed's computational efficiency and accuracy are second to none, thanks to its quantized models and ONNX Runtime. When coupled with Qdrant's enterprise-grade vector storage capabilities, organizations can achieve an unprecedented level of performance, scalability, and operational excellence.

We invite you to experience the operational advantages of FastEmbed and Qdrant first-hand. Your organization can quickly capitalize on this integration through two simple options:
1. Activate your Cloud trial today: [https://cloud.qdrant.io](https://cloud.qdrant.io) 
2. Download our docker container for instant deployment: [https://qdrant.tech/documentation/quick-start/](https://qdrant.tech/documentation/quick-start/)
