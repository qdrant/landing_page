---
title: Search Relevance
weight: 52
---

# Search Relevance

By default, Qdrant ranks search results based on vector similarity scores. However, you may wish to consider additional factors when ranking results. Qdrant offers several tools to help you accomplish this.

## Score Boosting

_Available as of v1.14.0_

When introducing vector search to specific applications, sometimes business logic needs to be considered for ranking the final list of results.

A quick example is [our own documentation search bar](https://github.com/qdrant/page-search).
It has vectors for every part of the documentation site. If one were to perform a search by "just" using the vectors, all kinds of elements would be equally considered good results.
However, when searching for documentation, we can establish a hierarchy of importance:

`title > content > snippets`

One way to solve this is to weight the results based on the kind of element.
For example, we can assign a higher weight to titles and content and keep snippets unboosted.

Pseudocode would be something like:

`score = score + (is_title * 0.5) + (is_content * 0.25)`

The Query API can rescore points with custom formulas based on:

- Dynamic payload values
- Conditions
- Scores of prefetches

To express the formula, the syntax uses objects to identify each element.
Taking the documentation example, the request would look like this:

{{< code-snippet path="/documentation/headless/snippets/query-points/score-boost-tags/" >}}

There are multiple expressions available. Check the [API docs for specific details](https://api.qdrant.tech/v-1-14-x/api-reference/search/query-points#request.body.query.Query%20Interface.Query.Formula%20Query.formula).

- **constant** - A floating point number. e.g. `0.5`.
- `"$score"` - Reference to the score of the point in the prefetch. This is the same as `"$score[0]"`.
- `"$score[0]"`, `"$score[1]"`, `"$score[2]"`, ... - When using multiple prefetches, you can reference specific prefetch with the index within the array of prefetches.
- **payload key** - Any plain string will refer to a payload key. This uses the jsonpath format used in every other place, e.g. `key` or `key.subkey`. It will try to extract a number from the given key.
- **condition** - A filtering condition. If the condition is met, it becomes `1.0`, otherwise `0.0`.
- **mult** - Multiply an array of expressions.
- **sum** - Sum an array of expressions.
- **div** - Divide an expression by another expression.
- **abs** - Absolute value of an expression.
- **pow** - Raise an expression to the power of another expression.
- **sqrt** - Square root of an expression.
- **log10** - Base 10 logarithm of an expression.
- **ln** - Natural logarithm of an expression.
- **exp** - Exponential function of an expression (`e^x`).
- **geo distance** - Haversine distance between two geographic points. Values need to be `{ "lat": 0.0, "lon": 0.0 }` objects.
- **decay** - Apply a decay function to an expression, which clamps the output between 0 and 1. Available decay functions are **linear**, **exponential**, and **gaussian**. [See more](#decay-functions).
- **datetime** - Parse a datetime string (see formats [here](/documentation/concepts/payload/#datetime)), and use it as a POSIX timestamp in seconds.
- **datetime key** - Specify that a payload key contains a datetime string to be parsed into POSIX seconds.

It is possible to define a default for when the variable (either from payload or prefetch score) is not found. This is given in the form of a mapping from variable to value.
If there is no variable and no defined default, a default value of `0.0` is used.

<aside role="status">

**Considerations when using formula queries:**

- Formula queries can only be used as a rescoring step.
- Formula results are always sorted in descending order (bigger is better). **For Euclidean scores, make sure to negate them** to sort closest to farthest.
- If a score or variable is not available and there is no default value, it will return an error.
- If a value is not a number (or the expected type), it will return an error.
- To leverage payload indices, single-value arrays are considered the same as the inner value. For example, `[0.2]` is the same as `0.2`, but `[0.2, 0.7]` will be interpreted as `[0.2, 0.7]`
- Multiplication and division are lazily evaluated, meaning that if a 0 is encountered, the rest of the operations don't execute (for example, `0.0 * condition` won't check the condition).
- Payload variables used within the formula also benefit from having payload indices. Please try to always have a payload index set up for the variables used in the formula for better performance.
</aside>

### Decay Functions

Decay functions enable you to modify the score based on how far a value is from a target using a linear, exponential, or Gaussian decay function. For all decay functions, these are the available parameters:

| Parameter  | Default | Description                                                                                                                                                                                       |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x`        | N/A     | The value to decay                                                                                                                                                                                |
| `target`   | 0.0     | The value at which the decay will be at its peak. For distances, it is usually set at 0.0, but can be set to any value.                                                                            |
| `scale`    | 1.0     | The value at which the decay function will be equal to `midpoint`. This is in terms of `x` units. For example, if `x` is in meters, `scale` of 5000 means 5km. Must be a non-zero positive number. |
| `midpoint` | 0.5     | Output is `midpoint` when `x` equals `target` ± `scale`. Must be in the range (0.0, 1.0), exclusive.                                                                                                          |

![Decay functions.](/docs/decay-function.png)

The [formula for each decay function](https://www.desmos.com/calculator/idv5hknwb1) is as follows:

<br>
    
| Decay Function | Range | Formula |
|----------------|-------|-------|---------|
| **`lin_decay`** | `[0, 1]` | $\text{lin_decay}(x) = \max\left(0,\ -\frac{(1-m_{idpoint})}{s_{cale}}\cdot {abs}(x-t_{arget})+1\right)$ |
| **`exp_decay`** | `(0, 1]` | $\text{exp_decay}(x) = \exp\left(\frac{\ln(m_{idpoint})}{s_{cale}}\cdot {abs}(x-t_{arget})\right)$ | 
| **`gauss_decay`** | `(0, 1]` | $\text{gauss_decay}(x) = \exp\left(\frac{\ln(m_{idpoint})}{s_{cale}^{2}}\cdot (x-t_{arget})^{2}\right)$ |

#### Boost Points Closer to User

An example of decay functions is to combine the score with how close a result is to a user.

Considering each point has an associated geo location, we can calculate the distance between the point and the request's location.

Assuming we have cosine scores in the prefetch, we can use a helper function to clamp the geographical distance between 0 and 1, by using a decay function. Once clamped, we can sum the score and the distance together. Pseudocode:

`score = score + gauss_decay(distance)`

In this case, we use a **gauss_decay** function.

{{< code-snippet path="/documentation/headless/snippets/query-points/score-boost-closer-to-user/" >}}

#### Time-Based Score Boosting

Or combine the score with the information on how "fresh" the result is. It's applicable to (news) articles and, in general, many other different types of searches (think of the "newest" filter you use in applications).

To implement time-based score boosting, you'll need each point to have a datetime field in its payload, e.g., when the item was uploaded or last updated. Then we can calculate the time difference in seconds between this payload value and the current time, our `target`.

With an exponential decay function, perfect for use cases with time, as freshness is a very quickly lost quality, we can convert this time difference into a value between 0 and 1, then add it to the original score to prioritize fresh results.

`score = score + exp_decay(current_time - point_time)`

That's how it will look for an application where, after 1 day, results start being only half-relevant (so get a score of 0.5):

{{< code-snippet path="/documentation/headless/snippets/query-points/score-boost-time/" >}}

## Maximal Marginal Relevance (MMR)

_Available as of v1.15.0_

[Maximal Marginal Relevance (MMR)](https://www.cs.cmu.edu/~jgc/publication/The_Use_MMR_Diversity_Based_LTMIR_1998.pdf) is an algorithm to improve the diversity of the results. It excels when the dataset has many redundant or very similar points for a query.

MMR selects candidates iteratively, starting with the most relevant point (higher similarity to the query). For each next point, it selects the one that hasn't been chosen yet which has the best combination of relevance and higher separation to the already selected points.

$$
MMR = \arg \max_{D_i \in R\setminus S}[\lambda sim(D_i, Q) - (1 - \lambda)\max_{D_j \in S}sim(D_i, D_j)]
$$

<figcaption align="center">Where $R$ is the candidates set, $S$ is the selected set, $Q$ is the query vector, $sim$ is the similarity function, and $\lambda = 1 - diversity$.</figcaption>

<br>
    
This is implemented in Qdrant as a parameter of a nearest neighbors query. You define the vector to get the nearest candidates, and a `diversity` parameter which controls the balance between relevance (0.0) and diversity (1.0).

{{< code-snippet path="/documentation/headless/snippets/query-points/hybrid-mmr/" >}}

**Caveat:** Since MMR ranks one point at a time, the scores produced by MMR in Qdrant refer to the similarity to the query vector. This means that the response will not be ordered by score, but rather by the order of selection of MMR.

## Relevance Feedback

*Available as of 1.17*

Relevance feedback distills signals from current search results into the next retrieval iteration to surface more relevant documents.

Qdrant provides a subtype of relevance feedback-based retrieval, where feedback is given by any model (relevance oracle) in a granular fashion: it rescores top retrieved results by their relative relevance to the query. A detailed overview of relevance feedback methods can be found in [Relevance Feedback in Information Retrieval](/articles/search-feedback-loop).

To use relevance feedback-based retrieval, two components are required:

1. A collection of vectors to search through.
2. An oracle to determine the relevance of search results.

---

The idea behind using relevance feedback-based retrieval is the following:

1. Run a basic nearest neighbors search. Let's call its results **Retriever Similarity** and the algorithm behind this search -- **retriever**. 
2. Use any **feedback model** to assign a relevance score to the top X search results (X is not expected to be large, 3-5 is a good option). Let's call these scores **Feedback Score**.
3. Through analyzing the Feedback Score for the top results, determine if the feedback model agrees with the retriever, or if retrieval can be improved.
4. If it can be improved, use feedback to modify retrieval (vector space traversal) to account for the discrepancies between the feedback model and the retriever.

For example, in this set of retrieved results:

| Point ID | Retriever Similarity | Feedback Score |
| --- | --- | --- |
| 111 | 0.89 | 0.68 |
| 222 | 0.81 | 0.72 | 
| 333 | 0.77 | 0.61 |

The feedback model considers the second result with ID 222 to be the most relevant, which is a discrepancy with retriever's ranking. Hence, this feedback can potentially help make the next iteration of retrieval better.

---

To leverage the feedback in search across the entire collection, Qdrant provides a query interface that requires:

1. The original query (`target`), which can be a point ID, an inference object, or a raw vector.
2. A short list of initial retrieval results and their relevance score (`feedback`). Each feedback item consists of:
   - `example`, which can be point ID, an inference object, or a raw vector used by the retriever.
   - `score`, the feedback score.
3. A definition of the formula that modifies retrieval based on the feedback (`strategy`).

{{< code-snippet path="/documentation/headless/snippets/query-points-explore/relevance-feedback-naive/" >}}

Internally, Qdrant combines the feedback list into pairs, based on the relevance scores, and then uses these pairs in a formula that modifies vector space traversal during retrieval (changes the strategy of retrieval). This relevance feedback-based retrieval considers not only the similarity of candidates to the query but also to each feedback pair. For a more detailed description of how it works, refer to the article [Relevance Feedback in Qdrant](/articles/relevance-feedback).

The `a`, `b`, and `c` parameters of the [`naive` strategy](#naive-strategy) need to be customized for each triplet of retriever, feedback model, and collection. To get these 3 weights adapted to your setup, use [our open source Python package](https://github.com/qdrant/relevance-feedback).

<aside role="alert">When using point IDs for <code>target</code> or <code>example</code>, these points are excluded from the search results. To include them, convert them to raw vectors first and use the raw vectors in the query.</aside>

### Naive Strategy

For now, `naive` is the only available strategy.
<details>
<summary> <span style="background-color: gray; color: black;"> Naive Strategy </span> </summary> 

$$
score = a * sim(query, candidate) + \sum_{pair \in pairs}{(confidence_{pair})^b * c * delta_{pair}} \\\\
$$
\begin{align}
\text{where} \\\\
confidence_{pair} &= relevance_{positive} - relevance_{negative} \\\\
delta_{pair} &= sim(positive, candidate) - sim(negative, candidate) \\\\
\end{align}

</details>