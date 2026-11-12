---
title: Fine-Grained RAG Permissions with Qdrant and SpiceDB
short_description: "Add fine-grained, relationship-based permissions to a Qdrant RAG pipeline with SpiceDB, so the LLM only sees documents the user can read."
description: "Tutorial: add a SpiceDB authorization node to a LangGraph RAG pipeline on Qdrant, check retrieved documents with CheckBulkPermissions, and share or revoke access without touching the collection."
weight: 27
partition: ecosystem
date: 2026-11-12T00:00:00-08:00
goal: RAG & Agents
stack:
  - Python
  - LangGraph
  - SpiceDB
keywords:
  - spicedb
  - authzed
  - rebac
  - zanzibar
  - authorization
  - permissions
  - access control
  - rag
  - langgraph
example_resources:
  - label: Workshop Repository
    url: https://github.com/authzed/workshops/tree/main/secure-rag-pipelines
---

# Fine-Grained RAG Permissions with Qdrant and SpiceDB

| Time: 45 min | Level: Intermediate | Output: Permission-aware RAG pipeline |
| --- | --- | --- |

A standard RAG pipeline answers questions using information retrieved from your documents. Qdrant stores their embeddings and associated metadata and finds relevant documents to provide as context to the language model. But without an authorization step, any user can get an answer from any document in the collection. This could lead to data leakage as a user might see information from documents they aren't allowed to read.

For simple cases, there are coarse-grained techniques of adding access control such as [a department field in the payload](/documentation/manage-data/multitenancy/#partition-by-payload), and then using [payload filtering](/documentation/search/filtering/). But this breaks down in real-world scenarios when access gets more specific. For example:

- Engineering shares **one** architecture document with Sales.
- A contractor can read two engineering guides and nothing else.
- An executive needs a one-off exception for a document outside their department.

You could add pseudo-departments, copy allow-lists into every point's payload, or write `if-else` checks in application code. Each of these gets harder to maintain with every new rule, and none of them is easy to audit. In fact, the [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) lists this kind of leak as Sensitive Information Disclosure.

In this tutorial, you'll use SpiceDB to:

1. Model users, departments, and documents as a SpiceDB schema and relationships.
2. Add an authorization node that checks every retrieved document with `CheckBulkPermissions` before it reaches the LLM. The LLM can't skip it.
3. Grant and revoke access to a document without touching your Qdrant collection.

You can follow this tutorial, complete with a chatbot UI, in this self-guided [repository](https://github.com/authzed/workshops/tree/main/secure-rag-pipelines). Qdrant and SpiceDB run locally in Docker, and embeddings run locally with FastEmbed, so the only key you need is for any chat model (for example Claude, OpenAI, or Qwen)

## What's Relationship-Based Access Control?

**Relationship-Based Access Control (ReBAC)** decides access from the relationships between subjects (users, agents, groups) and resources (documents, folders, photos, or maps). It was popularized by Google's 2019 paper, [Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/), which describes the authorization system behind Calendar, Drive, Maps, Photos, YouTube, and other Google services. If you've used any of these services (chances are that you have!), you've gone through the Zanzibar authorization system.

In ReBAC, relationships form a graph, and every authorization decision answers one question:

*Is this **actor** allowed to perform this **action** on this **resource**?*

To answer it, the system checks whether a path exists in the graph between the resource and the actor.

Take a document in Google Docs. When `user:alice` creates `document:somedocument`, Zanzibar records that Alice is a `writer` of the document as a **relationship tuple**:

```text
document:somedocument#writer@user:alice
```

When Alice shares the document with `user:bob` as a reader, Zanzibar writes another tuple:

```text
document:somedocument#reader@user:bob
```

The system also has a rule that every writer is also a reader. Together, the tuples and the rule form this graph:

{{< island path="content/documentation/headless/fine-grained-permissions-spicedb/relationship-graph" width="340" ratio="340 / 360" title="Fig. 1: Relationship graph for `somedocument`. Every `writer` is also a `reader`." >}}
![The document somedocument has a reader relation, which points to Bob and Carol, and a writer relation, which points to Alice. A dashed edge shows that reader includes writer.](/documentation/tutorials-build-essentials/fine-grained-rag-permissions-qdrant-spicedb/relationship-graph-mobile.png)
{{< /island >}}

When Alice tries to read `somedocument`, Zanzibar looks for a path from the document's `reader` relation to Alice. There's no direct `reader` edge for Alice, but `reader` includes `writer`, and Alice is a writer, so she can read the document.

{{< island path="content/documentation/headless/fine-grained-permissions-spicedb/relationship-path" width="340" ratio="340 / 360" title="Fig. 2: The path that lets Alice read `somedocument`: `reader` includes `writer`, and Alice is a `writer`." >}}
![The same graph with the path highlighted from somedocument to its reader relation, through the includes edge to writer, and on to Alice. Bob and Carol are dimmed.](/documentation/tutorials-build-essentials/fine-grained-rag-permissions-qdrant-spicedb/relationship-path-mobile.png)
{{< /island >}}

If no path exists, access is denied. So in this example Bob can't write to the document as there's no path from `somedocument` to `bob` via `writer`.

The same model works for RAG. Per-document sharing, cross-department access, and one-off exceptions are all relationships that can be written to the system. Compare this to traditional authorization methods such as Role-Based Access Control or scoped tokens. Neither handles them without a new role or token for every exception.

This tutorial uses [SpiceDB](https://github.com/authzed/spicedb), an open source implementation of Zanzibar, to store those relationships and answer permission checks. (Fun fact: SpiceDB is named in homage to Dune. "The spice must flow.") SpiceDB is used by Reddit, Netflix, OpenAI, Calendly, Zoom, and many more companies for authorization.

## Setup

This tutorial runs the RAG pipeline on your local machine. Check the [Prepare for Production](#prepare-for-production) section for how to host and scale your RAG pipeline.

### Prerequisites

- **Docker**
- **Python 3.11+**
- An **API key for a chat model**

### Start Qdrant and SpiceDB

[Clone the repository](https://github.com/authzed/workshops/tree/main/secure-rag-pipelines), configure your chat model, and start both services:

```bash
git clone https://github.com/authzed/workshops.git
cd workshops/secure-rag-pipelines/starter

# Set LLM_API_KEY. For anything other than OpenAI, also set LLM_BASE_URL and LLM_MODEL.
cp .env.example .env

docker compose up -d --wait

python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Docker Compose starts two containers: Qdrant on ports 6333 and 6334, and SpiceDB on port 50051 with an in-memory datastore and the preshared key `devtoken`.

### Load the Data

Load the sample data into both systems:

```bash
python examples/setup_environment.py
```

The [corpus](https://github.com/authzed/workshops/tree/main/secure-rag-pipelines/starter/data/documents) is 45 synthetic documents owned by four departments (engineering, sales, HR, and finance), plus five public documents that everyone can read. Here are the complicated permission requirements for this corpus:

| User | Department | Can view |
| :--- | :--- | :--- |
| `alice` | Engineering | All engineering documents, `sales-guide-005` (cross-department share), and `sales-proposal-001` (individual exception) |
| `bob` | Sales | All sales documents, `engineering-architecture-001` (cross-department share), and `engineering-guide-006` (individual exception) |
| `hr_manager` | HR | All HR documents |
| `finance_manager` | Finance | All finance documents, `hr-policy-001` (cross-department share), and `hr-policy-002` (individual exception) |
| `dana` | None (contractor) | `engineering-guide-006` and `engineering-guide-007` |

On the Qdrant side, the script creates a `Documents` collection, embeds every document locally, and uploads each one as a point:

```python
from qdrant_client.models import Distance, PointStruct, VectorParams

qdrant.create_collection(
    collection_name="Documents",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)

points = [
    PointStruct(
        id=i,
        vector=embedding.tolist(),
        payload={
            "doc_id": doc["doc_id"],
            "title": doc["title"],
            "content": doc["content"],
            "department": doc["department"],
            "classification": doc["classification"],
        },
    )
    for i, (doc, embedding) in enumerate(zip(documents, embeddings))
]

qdrant.upload_points(
    collection_name="Documents",
    points=points,
    batch_size=64,
    max_retries=3,
    wait=True,
)
```

Each point's payload includes a `doc_id`, like `engineering-architecture-001`. Qdrant point IDs must be unsigned integers or UUIDs, so the human-readable ID goes in the payload instead. SpiceDB uses the same ID for its `document` resources, and that shared ID is what connects the two systems. In this tutorial, each document is a single point. If you split documents into chunks, give every chunk its parent's `doc_id`, and the permission check stays the same.

On the SpiceDB side, the script writes a schema and the relationships between users, departments, and documents. You'll look at both in [Review the Permission Model](#review-the-permission-model).

## Explore the Pipeline

The pipeline is a LangGraph state machine in `agentic_rag/graph.py`. It runs three nodes in order:

1. **`retrieve`** embeds the query and runs a vector search against Qdrant.
2. **`authorize`** checks every retrieved document before the LLM sees it.
3. **`generate`** asks the chat model for an answer, using only the authorized documents.

{{< island path="content/documentation/headless/fine-grained-permissions-spicedb/pipeline" width="340" ratio="340 / 360" title="Fig. 3: The pipeline. Every retrieved document passes the authorization step before generation." >}}
![The application sends the query to retrieval in Qdrant, then to authorization in SpiceDB, then to generation by the LLM. The authorization step is highlighted.](/documentation/tutorials-build-essentials/fine-grained-rag-permissions-qdrant-spicedb/pipeline-mobile.png)
{{< /island >}}

The retrieval node, in `agentic_rag/nodes/retrieval_node.py`, runs a plain vector search:

```python
response = qdrant.query_points(
    collection_name="Documents",
    query=embed(state["query"]),
    limit=5,
    with_payload=True,
    score_threshold=config.score_threshold,
)
```

The query has no permission logic. Qdrant ranks documents by how relevant they are to the question, so any document in the collection can come back for any user. The `authorize` node is where access gets enforced, and in the starter code it passes every retrieved document straight to the LLM. You'll replace it in [Write the Authorization Node](#write-the-authorization-node).

## Review the Permission Model

Before you write the authorization node, look at the permission model that the setup script loaded into SpiceDB. It has two parts which make up a working permissions system: a schema and relationships.

### Schema

A SpiceDB **schema** defines the types of objects in your application, how they relate to one another, and the permissions computed from those relations. Here's `data/schema.zed`:

```text
definition user {}

definition department {
    relation member: user
}

definition document {
    relation owner: user
    relation viewer: user | department#member

    permission view = viewer + owner
    permission edit = owner
}
```

It defines:

- Three object types: `user`, `department`, and `document`.
- A `member` relation between a `department` and a `user`.
- `owner` and `viewer` relations between a `document` and a `user`. A `viewer` can be a specific user, *or* every `member` of a department (`department#member`).
- A `view` permission for anyone who's a `viewer` or the `owner`, and an `edit` permission for the `owner` only.

### Relationships

A **relationship** is a specific instance of a relation. The setup script wrote relationships for each access pattern from the introduction:

| Access pattern | Example relationship |
| :--- | :--- |
| Department membership | `department:sales#member@user:bob` |
| Department documents | `document:engineering-architecture-002#viewer@department:engineering#member` |
| Cross-department share | `document:engineering-architecture-001#viewer@department:sales#member` |
| Individual exception | `document:sales-proposal-001#viewer@user:alice` |
| Contractor | `document:engineering-guide-006#viewer@user:dana` |

Every user also has a direct `viewer` relationship to each of the five public documents.

To check whether Bob, who's in sales, can view `engineering-architecture-001`, SpiceDB walks the graph from the document to Bob. In this case he *does* have permission to view the doc.

{{< island path="content/documentation/headless/fine-grained-permissions-spicedb/permission-check" width="340" ratio="340 / 356" title="Fig. 4: Two checks for `user:bob`. SpiceDB finds a path to Bob from `engineering-architecture-001`, but not from `engineering-architecture-002`." >}}
![Two permission checks for user bob. For engineering-architecture-001, the path goes through viewer to the sales department and through member to bob, so the result is PERMISSIONSHIP_HAS_PERMISSION. For engineering-architecture-002, the path goes through viewer to the engineering department, but its member relation does not reach bob, so the result is PERMISSIONSHIP_NO_PERMISSION.](/documentation/tutorials-build-essentials/fine-grained-rag-permissions-qdrant-spicedb/permission-check-mobile.png)
{{< /island >}}

There's no path from `engineering-architecture-002` to Bob, so he can't view it. Your application asks SpiceDB these questions with the `CheckPermission` API, or `CheckBulkPermissions` to check many documents at once.

## Write the Authorization Node

{{< island path="content/documentation/headless/fine-grained-permissions-spicedb/architecture" width="340" ratio="340 / 640" title="Fig. 5: Where SpiceDB sits. The application checks the documents Qdrant returns before it sends any of them to the LLM." >}}
![The user sends a query to the application. The application gets the embedded query from the embedding model, sends it to Qdrant, and receives relevant chunks. It checks those chunks with SpiceDB, then sends the query, context, and prompt to the LLM and returns the response to the user.](/documentation/tutorials-build-essentials/fine-grained-rag-permissions-qdrant-spicedb/architecture-mobile.png)
{{< /island >}}

The authorization node runs after retrieval and before generation, and drops every document the user can't view. This pattern is called **post-filter authorization**: retrieve first, then filter. The check has to happen **before** the LLM, because anything that reaches the model can end up in its answer and that's the security boundary you want to maintain.

The node checks all five documents with a single `CheckBulkPermissions` request instead of five `CheckPermission` calls. Replace the contents of `agentic_rag/nodes/authorization_node.py` with this:

```python
"""Authorization node: the deterministic security boundary."""

from langchain_core.messages import SystemMessage
from authzed.api.v1 import (
    CheckBulkPermissionsRequest,
    CheckBulkPermissionsRequestItem,
    CheckPermissionResponse,
    ObjectReference,
    SubjectReference,
)

from ..state import AgenticRAGState
from ..config import get_config
from ..logging_config import get_logger
from ..grpc_helpers import get_spicedb_client

logger = get_logger("nodes.authorization")

HAS_PERMISSION = CheckPermissionResponse.PERMISSIONSHIP_HAS_PERMISSION


async def authorization_node(state: AgenticRAGState) -> dict:
    """Keep only the documents the subject is allowed to view.

    This node ALWAYS runs and the agent cannot route around it.
    """
    retrieved = state["retrieved_documents"]

    config = get_config()
    spicedb = get_spicedb_client(config.spicedb_endpoint, config.spicedb_token)
    subject = SubjectReference(
        object=ObjectReference(object_type="user", object_id=state["subject_id"])
    )

    allowed_ids = set()
    if retrieved:
        response = spicedb.CheckBulkPermissions(
            CheckBulkPermissionsRequest(
                items=[
                    CheckBulkPermissionsRequestItem(
                        resource=ObjectReference(
                            object_type="document", object_id=doc.metadata["doc_id"]
                        ),
                        permission="view",
                        subject=subject,
                    )
                    for doc in retrieved
                ]
            )
        )
        # A check that errors comes back without an item, so it counts as denied.
        allowed_ids = {
            pair.request.resource.object_id
            for pair in response.pairs
            if pair.item.permissionship == HAS_PERMISSION
        }

    authorized = [d for d in retrieved if d.metadata["doc_id"] in allowed_ids]
    denied_ids = [
        d.metadata["doc_id"] for d in retrieved if d.metadata["doc_id"] not in allowed_ids
    ]

    logger.info(
        "Authorization results",
        extra={
            "subject_id": state["subject_id"],
            "authorized": len(authorized),
            "denied": len(denied_ids),
            "denied_doc_ids": denied_ids,
        },
    )
    return {
        "authorized_documents": authorized,
        "denied_count": len(denied_ids),
        "authorization_passed": len(authorized) > 0,
        "messages": [
            SystemMessage(
                content=f"Authorization: {len(authorized)}/{len(retrieved)} documents authorized"
            )
        ],
    }
```

Each check uses the `doc_id` from the Qdrant payload as the resource ID. The node **fails closed**: a check that errors counts as a denial, and if SpiceDB can't be reached, the pipeline stops before generation, so an outage can't leak a document.

### Run a Query

From the `starter` folder, run a question through the pipeline as Bob:

```python
import asyncio

from agentic_rag.graph import run_agentic_rag_async

result = asyncio.run(
    run_agentic_rag_async(
        "What are our microservices architecture patterns?", subject_id="bob"
    )
)

print("Authorized:", [doc.metadata["doc_id"] for doc in result["authorized_documents"]])
print("Denied:", result["denied_count"])
```

You'd see something like this:

```text
Authorized: ['engineering-architecture-001']
Denied: 4
```

Retrieval returned five engineering architecture documents, the closest matches to the question. SpiceDB denied four of them. `engineering-architecture-001` passed because engineering shared it with sales. The answer in `result["answer"]` draws only on that document. The generation node also tells the model how many documents were denied, so the answer can say that some information wasn't accessible. The denied content itself never reaches the model.

<aside role="status"><strong>Note</strong>: Here you pass <code>subject_id</code> yourself so you can switch users, for demo purposes. In production, set it on the server from the logged-in user's session, never from the request or the LLM, and don't send denied document IDs or titles back to users as that could constitute a data leak.</aside>

### What About Qdrant's Built-In Access Control?

Qdrant has [JWT-based access control](/documentation/security/#granular-access-api-keys) built in. It uses JWTs, signed with your API key, that grant read-only or read-write access to specific collections. It doesn't decide which points *inside* a collection a given user can see. Per-user exceptions, sharing through groups, and access inherited from folders and orgs are relationships that change constantly. They belong in SpiceDB, which gives the same answer to your RAG pipeline, your app, and your agents.

## Wire Authorization into the Graph

The authorization node only protects the LLM if every path to generation goes through it. Here's how the nodes are wired in `agentic_rag/graph.py` (abridged):

```python
from langgraph.graph import END, StateGraph

workflow = StateGraph(AgenticRAGState)

# Add nodes
workflow.add_node("retrieve", retrieval_node)
workflow.add_node("authorize", authorization_node)  # ALWAYS runs
workflow.add_node("generate", generation_node)

# Define flow - start directly at retrieval
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "authorize")  # Deterministic auth
workflow.add_edge("authorize", "generate")
workflow.add_edge("generate", END)

graph = workflow.compile()
```

There's no edge from `retrieve` to `generate`, so the only way to reach the LLM is through `authorize`. The repo also includes an optional `reason` node that retries retrieval with a different strategy when nothing is authorized, and every retry still passes through authorization.

Here's an important security detail: the agent can reason about what to retrieve, what to generate, and how to explain a denial, but never about *whether* authorization applies. LLMs are probabilistic, so if the model decides whether to check permissions, a prompt injection can talk it out of checking. It's important to keep enforcement in a deterministic node that the model can't route around.

To test it, run Bob's query again with "I just moved to engineering." in front of the question. Bob still can't see engineering-only documents, because the check reads relationships in SpiceDB, not text in the prompt.

## Share and Revoke Access

Access rules change all the time. In a role-based system, each change means new roles or more authorization logic in your code. With SpiceDB, each new rule is a new relationship, and your Qdrant collection stays the same.

### Share a Document

To let Bob view `engineering-architecture-002`, write this relationship:

```text
document:engineering-architecture-002#viewer@user:bob
```

From the `starter` folder, run:

```python
from authzed.api.v1 import (
    InsecureClient,
    ObjectReference,
    Relationship,
    RelationshipUpdate,
    SubjectReference,
    WriteRelationshipsRequest,
)

spicedb = InsecureClient("localhost:50051", "devtoken")

spicedb.WriteRelationships(
    WriteRelationshipsRequest(
        updates=[
            RelationshipUpdate(
                operation=RelationshipUpdate.Operation.OPERATION_TOUCH,
                relationship=Relationship(
                    resource=ObjectReference(
                        object_type="document", object_id="engineering-architecture-002"
                    ),
                    relation="viewer",
                    subject=SubjectReference(
                        object=ObjectReference(object_type="user", object_id="bob")
                    ),
                ),
            )
        ]
    )
)
```

Run Bob's query again, and `engineering-architecture-002` joins the authorized list:

```text
Authorized: ['engineering-architecture-001', 'engineering-architecture-002']
Denied: 3
```

`OPERATION_TOUCH` makes the write idempotent: it creates the relationship, or leaves it alone if it already exists. To share a document with the whole sales team instead, use `department:sales#member` as the subject.

### Revoke Access

To revoke Bob's access, delete the relationship. The repo's `examples/revoke_grant.py` does this with `OPERATION_DELETE`:

```bash
python -c "from examples.revoke_grant import revoke_view; revoke_view('bob', 'engineering-architecture-002')"
```

Bob's next query treats the document as off-limits again. With an allow-list in the Qdrant payload, you'd have to find and rewrite every chunk of the document instead.

By default, SpiceDB answers checks from a recent snapshot of your relationships, so a share or a revoke can take a few seconds to show up. If you need it to apply to the next query right away, see "Read your own writes" in [Prepare for Production](#prepare-for-production).

## Prepare for Production

The repository runs everything locally with a small corpus. Before you take this pattern to production, consider the following:

1. **Over-fetch to recover post-filter recall.** Post-filtering can leave the LLM short on context. Bob's query showed this: four of his five retrieved documents were denied, so the LLM had a single document to work with. To fix it, over-fetch: retrieve *k* × *N* candidates (where *k* is how many documents you want and *N* is a multiplier you tune), run the permission check, and keep the first *k* that survive. In Qdrant, that means raising `limit`. `CheckBulkPermissions` keeps the extra checks to one round trip.

2. **Add a coarse-grained metadata filter.** You may also want to restrict results by department, recency, or classification. A Qdrant `query_filter` applies those conditions during the vector search, so you don't waste top-*k* slots on documents you'd throw away. SpiceDB still makes the fine-grained call afterwards:

   ```python
   from qdrant_client.models import FieldCondition, Filter, MatchAny

   response = qdrant.query_points(
       collection_name="Documents",
       query=query_embedding,
       limit=5,
       # Coarse pre-filter: this assistant never retrieves confidential docs
       query_filter=Filter(
           must=[FieldCondition(key="classification", match=MatchAny(any=["public", "internal"]))]
       ),
   )
   ```

   On a related note, when a user can see only a small slice, most retrieved documents get thrown away. In these use cases you could do a pre-filter authorization by calling SpiceDB's `LookupResources` API to list every document the user can view, and pass those IDs to Qdrant as a payload filter on `doc_id`. Part 3 of the workshop, [Pre-filter with LookupResources](https://github.com/authzed/workshops/blob/main/secure-rag-pipelines/3-pre-filter.md), has the full code.

   To keep these filters fast, create a [payload index](/documentation/manage-data/indexing/#payload-index) on each field you filter on: `classification` for the coarse filter, and `doc_id` if you pre-filter with `LookupResources`. Qdrant can filter on any payload field, but an index lets its query planner estimate how selective a filter is and pick the fastest search strategy:

   ```python
   from qdrant_client.models import PayloadSchemaType

   for field in ["classification", "doc_id"]:
       qdrant.create_payload_index(
           collection_name="Documents",
           field_name=field,
           field_schema=PayloadSchemaType.KEYWORD,
       )
   ```

3. **Keep relationships in sync with the source of truth.** In the repo, a setup script seeds the relationships. In production, they come from wherever access is managed, like your document system, HR directory, or identity provider. Write a relationship when a document is shared or someone joins a team, and delete it when access is revoked. Because permissions live in SpiceDB and not in the payload, none of this touches your Qdrant collection.

4. **Read your own writes.** Every write to SpiceDB returns a [ZedToken](https://authzed.com/docs/spicedb/concepts/consistency#consistency-in-spicedb), an opaque token that marks the point in time of that write. Pass it as `at_least_as_fresh` consistency on the next check, and a share or revoke you just made is guaranteed to apply, without paying for `fully_consistent` on every query.

5. **Run SpiceDB and Qdrant in production.** SpiceDB needs a persistent datastore like PostgreSQL. You can self-host the open source version, or use [AuthZed Cloud](https://authzed.com/products/authzed-cloud) or [AuthZed Dedicated](https://authzed.com/products/authzed-dedicated) for a managed deployment. On the Qdrant side, the same client code works against a managed cluster on [Qdrant Cloud](/cloud/).

## Conclusion

You added fine-grained permissions to a RAG pipeline on Qdrant with SpiceDB:

- **Qdrant finds, SpiceDB decides.** Qdrant ranks documents by relevance, SpiceDB decides who can see them, and a `doc_id` in the payload connects the two.
- **The check lives in a node, not a prompt.** A deterministic authorization node sits between retrieval and generation, and nothing reaches the LLM without passing through it.
- **Access changes are writes, not reindexes.** Sharing or revoking a document is one relationship in SpiceDB, and your collection never changes.

The full repository, including a chatbot UI, is [on GitHub](https://github.com/authzed/workshops/tree/main/secure-rag-pipelines). If distributed systems are your thing, check out the annotated Zanzibar paper at [zanzibar.tech](https://zanzibar.tech).
