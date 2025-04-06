### Discovery search

This type of search works specially well for combining multimodal, vector-constrained searches. Qdrant already has extensive support for filters, which constrain the search based on its payload, but using discovery search, you can also constrain the vector space in which the search is performed.

![Discovery search](/docs/discovery-search.png)

The formula for the discovery score can be expressed as:

$$
\text{rank}(v^+, v^-) = \begin{cases}
    1, &\quad s(v^+) \geq s(v^-) \\\\
    -1, &\quad s(v^+) < s(v^-)
\end{cases}
$$
where $v^+$ represents a positive example, $v^-$ represents a negative example, and $s(v)$ is the similarity score of a vector $v$ to the target vector. The discovery score is then computed as:
$$
 \text{discovery score} = \text{sigmoid}(s(v_t))+ \sum \text{rank}(v_i^+, v_i^-),
$$
where $s(v)$ is the similarity function, $v_t$ is the target vector, and again $v_i^+$ and $v_i^-$ are the positive and negative examples, respectively. The sigmoid function is used to normalize the score between 0 and 1 and the sum of ranks is used to penalize vectors that are closer to the negative examples than to the positive ones. In other words, the sum of individual ranks determines how many positive zones a point is in, while the closeness hierarchy comes second.

Example:

