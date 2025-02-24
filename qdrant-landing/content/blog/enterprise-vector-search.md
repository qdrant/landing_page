---
draft: false
title: "Introducing Qdrant Cloud’s New Enterprise-Ready Vector Search"
short_description: "Enterprise-grade features for secure vector search at scale."
description: "Discover Qdrant Cloud's enterprise features including RBAC, SSO, granular API keys, and advanced monitoring for secure deployments."
preview_image: /blog/enterprise-vector-search/social_preview.jpg
social_preview_image: /blog/enterprise-vector-search/social_preview.jpg
date: 2025-02-25T00:00:00Z
author: Daniel Azoulai
featured: false
tags:
- vector search
- enterprise
- monitoring
- RBAC
- observability
---
# Introducing Qdrant Cloud’s New Enterprise-Ready Vector Search

We are excited to introduce Qdrant Cloud’s new suite of enterprise features. Using Cloud RBAC, Single Sign-On (SSO), Granular API Keys, and Advanced Monitoring, you now have the control and visibility they need to operate at scale.

## More Ways to Secure and Scale Your AI Workloads

Enterprise AI applications demand more than just a powerful vector database—they require robust security, access control, and monitoring to ensure compliance, performance, and scalability. Qdrant’s new enterprise features address these needs, giving your team the tools to simplify authentication, enforce access policies, gain deep visibility into performance, and reduce operational overhead.

### New Cloud Features:

* Enterprise-Grade Access Controls – Fine-tune permissions with **Cloud RBAC** to ensure the right users can manage clusters, billing, and deployments.  
* Streamlined Authentication – Simplify access across teams with **Single Sign-On (SSO)** via Okta, Google Workspace, Azure Active Directory (Entra ID), and more.  
* **Granular API Access** – Restrict API keys that can be scoped per cluster or collection, with expiration and revocation controls.  
* **Advanced Monitoring** – Implement real-time observability with Prometheus/OpenMetrics integrations, helping teams track latency, resource usage, and query performance.

## How Each Feature Works

### Cloud RBAC (Role-Based Access Control)

With Cloud RBAC, you can define granular permissions for managing cloud clusters, hybrid deployments, and billing. This ensures that your organization can prevent unauthorized access while enabling teams to collaborate securely.

**Why it matters:** RBAC enables your organization to implement zero-trust security models and streamlined compliance management as teams scale by enabling fine-grained control over access.

*Coming soon: [Sign up](https://share-eu1.hsforms.com/1H5vI2Xx6TbCjwfyARUwQaA2b46ng) to receive email notice when GA*

### Single Sign-On (SSO)

By supporting Okta, Google Workspace, Azure Active Directory (Entra ID), LDAP, SAML, and more, Qdrant solves credential sprawl and unifies authentication.

**SSO** is integrated into the [Qdrant Cloud Account Setup](https://cloud.qdrant.io/signup), allowing you to authenticate users across multiple services while maintaining strict security policies. Your users can sign in via approved authentication providers, ensuring compliance and ease of access management.

**Why it matters:** SSO **simplifies the login experience** for growing teams while ensuring security policies are enforced consistently.

*Only available for [Premium Tier](https://qdrant.tech/documentation/cloud/premium/) customers. [Learn more about SSO](https://qdrant.tech/documentation/cloud/qdrant-cloud-setup/#enterprise-single-sign-on-sso).*

<iframe width="560" height="315" src="https://www.youtube.com/embed/EtUcA-MCZJM?si=RhI1zEP59ssoRojA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe> 

**Database API Keys**

You can now **control API access** at a highly detailed level— using specific API keys, enforcing expiration policies, and revoking credentials.

API keys with granular access control use JWTs (JSON Web Tokens), which start with 'eyJhb' and allow fine-tuned permissions.

The Qdrant Cloud API provides controls over **API key creation, management, and deletion.** You can generate API keys directly in the [Qdrant Cloud Console](https://login.cloud.qdrant.io/u/signup/identifier?state=hKFo2SAxeFNkY0JxeTMwUmpsRk15SFRUR2dFbmFYcjJUdnpHc6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFpOOTQ4S21uUEVlM3o1WUx1QnMzSUlrMmlIR1NtV1JCo2NpZNkgckkxd2NPUEhPTWRlSHVUeDR4MWtGMEtGZFE3d25lemc), define their scope (cluster-wide, per collection and/or by payload filters), and automate workflows. And with the [Qdrant Terraform Provider](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest), you can define and automate cluster provisioning using Infrastructure-as-Code (IaC) best practices.

**Why it matters: Reduce security risks** by limiting API key access **only to necessary workloads** while maintaining operational flexibility. Also, speed up setup, keep deployments across cloud consistent, and scale easily with **Terraform**. 

<iframe width="560" height="315" src="https://www.youtube.com/embed/3c-8tcBIVdQ?si=QxR_W7ax9WYtMg91" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

[Read more about Database API keys](https://qdrant.tech/documentation/cloud/authentication/).

**Advanced Monitoring**

With Prometheus/OpenMetrics support, you can have real-time visibility into Qdrant’s performance. You can easily integrate with your preferred monitoring stacks like [Datadog](https://qdrant.tech/documentation/observability/datadog/), [Grafana](https://qdrant.tech/documentation/cloud/cluster-monitoring/#grafana-dashboard), and other [enterprise observability tools](https://qdrant.tech/documentation/observability/).

Qdrant provides **comprehensive cluster monitoring**, including detailed telemetry and logs, accessible through the [Qdrant Cloud Console](https://login.cloud.qdrant.io/u/signup/identifier?state=hKFo2SAxeFNkY0JxeTMwUmpsRk15SFRUR2dFbmFYcjJUdnpHc6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFpOOTQ4S21uUEVlM3o1WUx1QnMzSUlrMmlIR1NtV1JCo2NpZNkgckkxd2NPUEhPTWRlSHVUeDR4MWtGMEtGZFE3d25lemc) (see the **Metrics** and **Requests** sections of the **Cluster** **Details** page). You can track database health, set up automated alerts for memory and storage thresholds, and integrate metrics into their existing monitoring infrastructure.

**Why it matters: Proactively address your infrastructure issues** before they impact AI workloads by tracking query performance and detecting anomalies.

<iframe width="560" height="315" src="https://www.youtube.com/embed/pKPP-tL5_6w?si=EmR0R3WrQQlpDVJC" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe> 

[Read more about advanced monitoring](https://qdrant.tech/documentation/cloud/cluster-monitoring/).

## A Fully Integrated Enterprise Cloud Solution

By combining Qdrant's high-performance vector search engine for billion-scale use cases with Qdrant Cloud's enterprise-grade security, observability, and automation features, your organization can efficiently manage their vector search infrastructure with enhanced control and compliance. That’s why Qdrant is the enterprise vector database of choice—no matter the deployment (cloud, hybrid cloud, or private), and no matter the scale. 

## Come Build with Us 

[Contact Sales](https://qdrant.tech/contact-us/) to enable enterprise features for your team, or [start prototyping with a free Qdrant cluster](https://login.cloud.qdrant.io/u/signup/identifier?state=hKFo2SAxeFNkY0JxeTMwUmpsRk15SFRUR2dFbmFYcjJUdnpHc6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFpOOTQ4S21uUEVlM3o1WUx1QnMzSUlrMmlIR1NtV1JCo2NpZNkgckkxd2NPUEhPTWRlSHVUeDR4MWtGMEtGZFE3d25lemc).