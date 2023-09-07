---
title: Troubleshooting
weight: 170
aliases:
  - ../tutorials/common-errors
---

# Solving common errors

## Too many files open (OS error 24)

Each collection segment needs some files to be open. At some point you may encounter the following errors in your server log:

```text
Error: Too many files open (OS error 24)
```

In such a case you may need to increase the limit of the open files. It might be done, for example, while you launch the Docker container:

```bash
docker run --ulimit nofile=10000:10000 qdrant/qdrant:latest
```

The command above will set both soft and hard limits to `10000`.

If you are not using Docker, the following command will change the limit for the current user session:

```bash
ulimit -n 10000
```

Please note, the command should be executed before you run Qdrant server.

## Collection status is always yellow

Each collection has a [status color](../../concepts/collections#collection-info).
It may happen that the status of a collection always stays yellow.

A yellow status means that the collection is optimizing. It is very likely that
your collection is still optimizing. This process can take a very long time
depending on how many points you insert and what hardware is used.

You can use [telemetry](../telemetry) data to get an insight on what the
optimizer is currently doing. The telemetry data contains a log of optimizer
events that describe its behavior. This log may be helpful to detect weird
optimizer behavior such as an optimization never finishing or an infinite loop
of optimizations. If you're experiencing problems, please always check your
Qdrant logs to see if any errors are printed.

The optimization log in telemetry output may look like this (with all other
parts trimmed), at
`result.collections.collections[].shards[].local.optimizations.log`. This lists
four optimizer events for indexing and merging. Three optimizations are `done`,
the fourth one is still `optimizing`:

```http
GET /telemetry?details_level=2

{
  "result": {
    "collections": {
      "collections": [{
        "id": "my_collection",
        "shards": [{
          "id": 0,
          "local": {
            "optimizations": {
              "log": [
                {
                  "name": "indexing",
                  "segment_ids": [12596352011983712000, 683094100406536000],
                  "status": "optimizing",
                  "start_at": "2023-09-07T15:14:05.873193961Z",
                  "end_at": null
                },
                {
                  "name": "indexing",
                  "segment_ids": [17554372345781762000, 4001657189184169500],
                  "status": "done",
                  "start_at": "2023-09-07T15:13:55.249372496Z",
                  "end_at": "2023-09-07T15:14:05.873186801Z"
                },
                {
                  "name": "merge",
                  "segment_ids": [4650893139495580000, 6657980491957345000, 14402712336633991000],
                  "status": "done",
                  "start_at": "2023-09-07T15:13:48.831599648Z",
                  "end_at": "2023-09-07T15:13:55.249370166Z"
                },
                {
                  "name": "indexing",
                  "segment_ids": [9867739984940812000],
                  "status": "done",
                  "start_at": "2023-09-07T15:13:46.616151260Z",
                  "end_at": "2023-09-07T15:13:48.825460417Z"
                }
              ]
            }
          }
        }]
      }]
    }
  }
}
```

The `status` of an event will be `error` if the optimization failed. The log
shows the latest events first. It will keep at most 16 successful events. Errors
and cancellations are always kept.

## Qdrant stuck/frozen, extract stack trace

*Available as of v1.5.0*

It might happen that Qdrant is completely stuck. Operations may hang
indefinitely or an optimization may be stuck forever. Waiting some time does not
improve the situation.

If you encounter this situation, always check the Qdrant logs first. It may give some
valuable information on what is happening.

When logs don't show any pointers to the problem, you may extract a stack trace
from the Qdrant server to report the current state of what it is doing. This can
be done by visiting [`/stacktrace`](http://localhost:6333/stacktrace) in your
browser. You can attach this stack trace to an issue report to help Qdrant
developers debug the issue.

```http
GET /stacktrace

{
  "result": {
    "threads": [
      {
        "id": 7,
        "name": "qdrant",
        "frames": [
          "",
          "",
          ":0 - qdrant::main::h6b7c98553f8d540b ",
          ":0 - std::sys_common::backtrace::__rust_begin_short_backtrace::ha4aa73ba5e009f1f "
        ]
      },
      {
        "id": 8,
        "name": "search-0",
        "frames": [
          ":0 - epoll_wait ",
          ":0 - mio::poll::Poll::poll::h91178360524c8cd2 "
        ]
      },
      {
        "id": 9,
        "name": "search-1",
        "frames": [
          ":0 - syscall ",
          ":0 - parking_lot::condvar::Condvar::wait_until_internal::h26d4f821b8427131 "
        ]
      }
    ]
  },
  "status": "ok",
  "time": 0.03003201
}
```
