### Context search

Conversely, in the absence of a target, a rigid integer-by-integer function doesn't provide much guidance for the search when utilizing a proximity graph like HNSW. Instead, context search employs a function derived from the [triplet-loss](/articles/triplet-loss/) concept, which is usually applied during model training. For context search, this function is adapted to steer the search towards areas with fewer negative examples.

![Context search](/docs/context-search.png)

We can directly associate the score function to a loss function, where 0.0 is the maximum score a point can have, which means it is only in positive areas. As soon as a point exists closer to a negative example, its loss will simply be the difference of the positive and negative similarities.

$$
\text{context score} = \sum \min(s(v^+_i) - s(v^-_i), 0.0)
$$

Where $v^+_i$ and $v^-_i$ are the positive and negative examples of each pair, and $s(v)$ is the similarity function.

Using this kind of search, you can expect the output to not necessarily be around a single point, but rather, to be any point that isn’t closer to a negative example, which creates a constrained diverse result. So, even when the API is not called [`recommend`](#recommendation-api), recommendation systems can also use this approach and adapt it for their specific use-cases.

Example:

