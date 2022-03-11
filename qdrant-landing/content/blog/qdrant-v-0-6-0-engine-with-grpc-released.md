---
title: Qdrant v0.6.0 engine with gRPC interface has been released
short_description: We’ve released a new engine, version 0.6.0.
description: We’ve released a new engine, version 0.6.0. The main feature of the release in the gRPC interface.
preview_image: /blog_data/qdrant-v-0-6-0-engine-with-grpc-released/upload_time.png
weight: 20
category: main
date: 2022-03-10T01:36:43+03:00
author: Alyona Kavyerina
featured: true
categories:
- News
tags:
- gRPC
- release
---
We’ve released a new engine, version 0.6.0.

The main feature of the release in the gRPC interface — it is much faster than the REST API and ensures higher app performance due to the following features:

   - re-use of connection;
   - binarity protocol;
   - separation schema from data.

This results in 3 times faster data uploading on our benchmarks:

![REST API vs gRPC upload time, sec](/blog_data/qdrant-v-0-6-0-engine-with-grpc-released/upload_time.png)

Read more about the gRPC interface and whether you should use it by this [link](https://qdrant.tech/documentation/quick_start/#grpc).

The release v0.6.0 includes several bug fixes. More information is available in a [changelog](https://github.com/qdrant/qdrant/releases/tag/v0.6.0).

New version was provided in addition to the REST API that the company keeps supporting due to its easy debugging.