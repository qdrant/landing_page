---
title: DeepEval
---

# DeepEval

[DeepEval](https://docs.confident-ai.com) by Confident AI is an open-source framework for testing large language model systems. Similar to Pytest but designed for LLM outputs, it evaluates metrics like G-Eval, hallucination, answer relevancy, and RAGAS using local NLP models.

DeepEval can be integrated with Qdrant to evaluate RAG pipelines — ensuring your LLM applications return relevant, grounded, and faithful responses based on retrieved vector search context.

## How it works

A test case is a blueprint provided by DeepEval to unit test LLM outputs. There are two types of test cases in DeepEval:

`LLMTestCase`: Used to evaluate a single input-output pair, such as RAG responses or agent actions.

`ConversationalTestCase`: A sequence of LLMTestCase turns representing a back-and-forth interaction with an LLM system. This is especially useful for chatbot or assistant testing.

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

You can scale this process with a dataset (e.g. from Hugging Face) and evaluate multiple test cases at once by looping through question-answer pairs, querying Qdrant for context, and scoring with DeepEval metrics.

All evaluations performed using DeepEval can be viewed on the [Confident AI Dashboard](https://app.confident-ai.com).

## Further Reading

- [End-to-end Evalutation Example](https://github.com/qdrant/qdrant-rag-eval/blob/master/workshop-rag-eval-qdrant-deepeval/notebook/rag_eval_qdrant_deepeval.ipynb)
- [Confident AI documentation](https://docs.confident-ai.com)
