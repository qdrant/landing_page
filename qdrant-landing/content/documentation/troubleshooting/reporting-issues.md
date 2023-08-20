---
title: Reporting issues
weight: 1
---

# Reporting issues on Discord

This document outlines the basic steps required to report any general issue on Discord. We also have dedicated instructions for [**database optimization**](../database-tuning) tips or [**server connection issues**](../server-hanging). 

Before you create a report, first check whether a similar issue has already been brought up by someone else. Go to the [GitHub issue search](https://github.com/qdrant/qdrant/issues) and look through open and closed issues. If the issue has been fixed, try to reproduce it using the latest master branch in the repository.

When requesting assistance, please provide as much detail as possible. We need to know about your environment, the actions you took and the results you got. In some cases, it is helpful to provide and diagnostics as support. This will ensure we are able to triage the issue quickly and efficiently.

## Required information

1. **Summarize the issue.** Describe what you are trying to do and how you are being blocked. Let us know what should have been the result.
2. Are you using Qdrant in **local mode, with Docker or Qdrant Cloud?** If you are using Qdrant Cloud, please provide the cluster id.
3. **Which Qdrant version are you running?** Sometimes the issue happens because you are not running the latest version.
4. **How are you connecting to Qdrant?** Are you using a client?
5. **Provide your current database configuration.** What are the current collection settings? How many vectors in a collection? In case of a distributed setup, describe shards, replication factor etc.
6. **What is your server configuration?** If your question is related to performance, we need to know the operating system version, CPU, RAM size and storage details.
7. **Is there anything showing in the server logs?** Also, provide screenshots of monitoring or log excerpts that illustrate the issue.

## Reproduce the issue

1. **We need reproducible code** or a script that demonstrates the problem. Please give us step-by-step instructions to recreate the situation. For errors or problems with queries:
* Show the exact code of the query or the request.
* Paste the exact output of the response or the error message you are getting back. 

2. **Try to recreate the problem in a controlled environment.** This helps you confirm that the issue is consistent. If possible, identify the specific conditions that trigger the problem.

3. **What were you doing when the error happened?** Is there a common pattern?

4. **Have you attempted any workarounds?**

## Limitations

* Please keep in mind that we can’t debug self-hosted deployments without direct access. If possible, reproduce the problem using Qdrant Cloud. 

* In case your version is older, we guarantee only compatibility between two consecutive minor versions.

* While we will assist with break/fix troubleshooting of issues and errors specific to our products, Qdrant is not accountable for reviewing, writing (or rewriting), or debugging custom code. 

* This includes any customer specific code or 3rd party tools you may be using with our products. Furthermore, we do not support any technologies or configurations that are not listed as supported in our product documentation. Our team will do their best in pointing you to available documentation online to assist you with the best path forward.
