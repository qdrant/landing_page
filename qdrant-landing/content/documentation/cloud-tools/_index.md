---
title: Infrastructure Tools
weight: 235
partition: deploy
---

# Infrastructure Tools

Qdrant Cloud can be managed as code using standard infrastructure-as-code (IaC) tools. The [Qdrant Terraform Provider](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest) exposes Qdrant Cloud resources — clusters, API keys, and account configuration — so you can version, review, and automate your deployments alongside the rest of your infrastructure.

Both Terraform and Pulumi are supported. Pulumi generates a typed SDK from the Qdrant Terraform Provider, so you can manage Qdrant Cloud resources in Python, TypeScript, Go, and other languages Pulumi supports.

## What you can manage

- **Clusters** — Create, configure, and destroy Qdrant Cloud clusters across AWS, GCP, and Azure regions.
- **API keys** — Provision and rotate database API keys as part of your infrastructure lifecycle.
- **Node configuration** — Select instance packages and set the number of nodes per cluster.
- **Service settings** — Enable features such as JWT RBAC at provisioning time.

## Authentication

Both tools authenticate using a Qdrant Cloud Management API key. Generate one from the Qdrant Cloud console and pass it to your provider configuration. See [Qdrant Cloud API](/documentation/cloud-api/) for details.

## Tools

- [Terraform](/documentation/cloud-tools/terraform/) — Define Qdrant Cloud resources in HCL configuration files. Uses the native Qdrant Terraform Provider.
- [Pulumi](/documentation/cloud-tools/pulumi/) — Manage Qdrant Cloud resources in your preferred programming language, using a Pulumi SDK generated from the Qdrant Terraform Provider.
