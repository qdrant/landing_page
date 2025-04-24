---
title: DeepEval
---

# DeepEval

[DeepEval](https://deepeval.com) by Confident AI is an open-source framework for testing large language model systems. Similar to Pytest but designed for LLM outputs, it evaluates metrics like G-Eval, hallucination, answer relevancy.

DeepEval can be integrated with Qdrant to evaluate RAG pipelines — ensuring your LLM applications return relevant, grounded, and faithful responses based on retrieved vector search context.

## How it works

A test case is a blueprint provided by DeepEval to unit test LLM outputs. There are two types of test cases in DeepEval:

`LLMTestCase`: Used to evaluate a single input-output pair, such as RAG responses or agent actions.

`ConversationalTestCase`: A sequence of `LLMTestCase` turns representing a back-and-forth interaction with an LLM system. This is especially useful for chatbot or assistant testing.

## Metrics Overview

DeepEval offers a suite of metrics to evaluate various aspects of LLM outputs, including:

- **Answer Relevancy**: Measures how relevant the LLM's output is to the given input query.
- **Faithfulness**: Assesses whether the LLM's response is grounded in the provided context, ensuring factual accuracy.
- **Contextual Precision**: Determines whether the most relevant pieces of context are ranked higher than less relevant ones.
- **G-Eval**: A versatile metric that uses LLM-as-a-judge with chain-of-thought reasoning to evaluate outputs based on custom criteria.
- **Hallucination**: Detects instances where the LLM generates information not present in the source context.
- **Toxicity**: Assesses the presence of harmful or offensive content in the LLM's output.
- **Bias**: Evaluates the output for any unintended biases.
- **Summarization**: Measures the quality and accuracy of generated summaries.

For a comprehensive list and detailed explanations of all available metrics, please refer to the [DeepEval metrics reference](https://deepeval.com/docs/metrics-introduction).

## Using Qdrant with DeepEval

Install the client libraries.

```bash
$ pip install deepeval qdrant-client

$ deepeval login
```

You can use Qdrant to power your RAG system by retrieving relevant documents for a query, feeding them into your prompt, and evaluating the generated output using DeepEval.

```python
from deepeval.test_case import LLMTestCase, ConversationalTestCase
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric, ...

# 1. Query context from Qdrant
context = qdrant_client.query_points(...)

# 2. Construct prompt using query + retrieved context
prompt = build_prompt(query, context)

# 3. Generate response from your LLM
response = llm.generate(prompt)

# 4. Create a test case for evaluation
test_case = LLMTestCase(
    input=query,
    actual_output=response,
    expected_output=ground_truth_answer,
    retrieval_context=context
)

# 5. Evaluate the output using DeepEval
evaluate(
    test_cases=[test_case],
    metrics=[
        AnswerRelevancyMetric(),
        FaithfulnessMetric(),
        ContextualPrecisionMetric(),
        ...
    ],
)
```

All evaluations performed using DeepEval can be viewed on the [Confident AI Dashboard](https://app.confident-ai.com).

You can scale this process with a dataset (e.g. from Hugging Face) and evaluate multiple test cases at once by looping through question-answer pairs, querying Qdrant for context, and scoring with DeepEval metrics.

## Further Reading

- [End-to-end Evalutation Example](https://github.com/qdrant/qdrant-rag-eval/blob/master/workshop-rag-eval-qdrant-deepeval/notebook/rag_eval_qdrant_deepeval.ipynb)
- [DeepEval documentation](https://deepeval.com)
