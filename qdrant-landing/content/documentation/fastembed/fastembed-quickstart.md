---
title: "Quickstart" 
weight: 2
---

# How to Generate Text Embedings with FastEmbed

## Install FastEmbed
```python
pip install fastembed
```
Just for demo purposes, you will use Lists and NumPy to work with sample data.
```python
from typing import List
import numpy as np
```

## Load default model

In this example, you will use the default text embedding model, `BAAI/bge-small-en-v1.5`. 
```python
from fastembed import TextEmbedding
```

## Add sample data

Now, add two sample documents. Your documents must be in a list, and each document must be a string
```python
documents: List[str] = [
    "FastEmbed is lighter than Transformers & Sentence-Transformers.",
    "FastEmbed is supported by and maintained by Qdrant.",
]
```
Download and initialize the model. Print a message to verify the process.

```python
embedding_model = TextEmbedding()
print("The model BAAI/bge-small-en-v1.5 is ready to use.")
```
## Embed data

Generate embeddings for both documents. 
```python
embeddings_generator = embedding_model.embed(documents)
embeddings_list = list(embeddings_generator)
len(embeddings_list[0])  
```
Here is the sample document list. The default model creates vectors with 384 dimensions.

```bash
Document: This is built to be faster and lighter than other embedding libraries e.g. Transformers, Sentence-Transformers, etc.
Vector of type: <class 'numpy.ndarray'> with shape: (384,)
Document: fastembed is supported by and maintained by Qdrant.
Vector of type: <class 'numpy.ndarray'> with shape: (384,)
```

## Verify embedding shape
Next, take the embeddings and convert them into a NumPy array.
Then, check the shape of this array to confirm the dimensions of the generated embeddings.

```python
embeddings_list = np.array(list(embedding_model.embed(documents)))
embeddings_list.shape
```
The shape will be a tuple indicating the number of documents and the dimensions of the embeddings. For example, if there are 2 documents and each embedding has 384 dimensions, the shape will be (2, 384).
```python
(2, 384)
```

## See the embeddings
```python
print("Embeddings:\n", embeddings_list)
```
The embeddings don't look too interesting, but here is a visual.

```bash
Embeddings:
 [[-0.11154681  0.00976555  0.00524559  0.01951888 -0.01934952  0.02943449
  -0.10519084 -0.00890122  0.01831438  0.01486796 -0.05642502  0.02561352
  -0.00120165  0.00637456  0.02633459  0.0089221   0.05313658  0.03955453
  -0.04400245 -0.02929407  0.04691846 -0.02515868  0.00778646 -0.05410657
  -0.04362096  0.01275103 -0.02304643 -0.02250824  0.01992303 -0.19920594
   0.01895355 -0.02651559  0.08252289 -0.02281932 -0.05781299 -0.01367694
  -0.0357074   0.05386209 -0.10155275  0.02097272  0.00652704  0.03738071
  -0.03508432 -0.00091192  0.03425014 -0.02445892 -0.00739993 -0.03084338
  -0.03605132 -0.02814267  0.01547157 -0.0215851   0.0254423   0.02438808
  -0.02049713 -0.02665791  0.03727325  0.08809511  0.02471923 -0.0085119
  -0.0201654   0.05734601 -0.05127536  0.02370393 -0.02993909 -0.02091447
  -0.03927833 -0.02315613  0.00927736  0.07043561  0.02359607 -0.01002697
   0.04758466  0.00795123  0.00199829  0.05515845  0.01843713 -0.00297784
  -0.01339653 -0.00348842  0.07951678 -0.06366211 -0.01295009 -0.00558423
  -0.02937807 -0.03242922  0.03339408  0.01734223  0.01248069  0.06825151
  -0.08455556 -0.04574722 -0.0095825   0.05233807 -0.00915513 -0.06187493
  -0.01228709  0.033805    0.03197376  0.35104704 -0.06548341 -0.00566747
   0.05857922 -0.05616153  0.01007555 -0.03780003  0.04616216 -0.01843753
  -0.09301556 -0.02079745 -0.04339451 -0.02648945 -0.02158683  0.02083867
   0.02295375  0.01272577 -0.03758859  0.00559671 -0.06286892  0.04843555
   0.00935006  0.01959503  0.00112758 -0.01437079  0.01551349  0.03026596
   0.04408653  0.0547558   0.0532619   0.07697894 -0.01663396  0.01228552
  -0.01277487  0.03190343  0.02996432  0.04491728 -0.02979672 -0.0327898
   0.01730017 -0.00223152 -0.04579118  0.11361726  0.01470178 -0.04264669
...
  -0.00243012 -0.01820582  0.02938612  0.02108984 -0.02178085  0.02971899
  -0.00790564  0.03561783  0.0652488  -0.04371546 -0.05550042  0.02651665
  -0.01116153 -0.01682246 -0.05976734 -0.03143916  0.06522726  0.01801389
  -0.02611006  0.01627177 -0.0368538   0.03968835  0.027597    0.03305927]]
```