---
title: Administration
weight: 21
---

Qdrant exposes administration tools which enable to modify at runtime the behavior of a qdrant instance without changing its configuration manually.

## Locking

A locking API enables users to restrict the possible operations on a qdrant process.
It is important to mention that:
- The configuration is not persistent therefore it is necessary to lock again following a restart.
- Locking applies to a single node only. It is necessary to call lock on all the desired nodes in a distributed deployment setup.

Lock request sample:

```http
POST /locks
{
    "error_message": "write is forbidden",
    "write": true
}
```

Write flags enables/disables write lock.
If the write lock is set to true, qdrant doesn't allow creating new collections or adding new data to the existing storage.
However deletion operations or updates are not forbidden under the write lock.
This feature enables administrators to prevent a qdrant process from using more disk space while permitting users to search and delete unnecessary data.

You can optionally provide the error message that should be used for error responses to users.
