---
draft: false
title: "Introducing Qdrant Cloud’s New Enterprise-Ready Vector Search"
short_description: "Enterprise-grade features for secure vector search at scale."
description: "Discover Qdrant Cloud's enterprise features: RBAC, SSO, granular API keys, advanced monitoring/observability."
preview_image: /blog/enterprise-vector-search/Social_preview_V2.jpg
social_preview_image: /blog/enterprise-vector-search/Social_preview_V2.jpg
date: 2025-03-04T00:00:00Z
author: Daniel Azoulai
featured: false
tags:
- vector search
- enterprise
- monitoring
- RBAC
- observability
---

At Qdrant, we enable developers to power AI workloads - not only securely, but at any scale. That’s why we are excited to introduce Qdrant Cloud’s new suite of enterprise-grade features. With **our Cloud API, Cloud RBAC**, **Single Sign-On (SSO)**, granular **Database API Keys**, and **Advanced Monitoring & Observability**, you now have the control and visibility needed to operate at scale.

## Securely Scale Your AI Workloads

Your enterprise-grade AI applications demand more than just a powerful vector database—they need to meet compliance, performance, and scalability requirements. To do that, you need simplified management, secure access & authentication, and real-time monitoring & observability. Now, Qdrant’s new enterprise-grade features address these needs, giving your team the tools to reduce operational overhead, simplify authentication, enforce access policies, and have deep visibility into performance.

## Our New Qdrant Cloud Capabilities:

* **Cloud API for Simplified Management →** Automate and scale with **API-driven control** and **Terraform support**. 
* **Secure Access & Authentication** → Control who gets in and what they can do with **Cloud RBAC**, **SSO**, and granular **Database API Keys**. 
* **Advanced Monitoring & Observability** → Stay ahead of issues with **Prometheus/OpenMetrics**, **Datadog**, **Grafana**, and other third-party integrations.

## Ok, now for the good part…

### Cloud API for Simplified Management

Skip the UI—manage Qdrant entirely through code. The [**Qdrant Cloud API**](https://qdrant.tech/documentation/qdrant-cloud-api/?) lets you automate cluster creation, updates, and scaling, ensuring repeatable, version-controlled deployments. You can also programmatically generate and revoke API keys, update configurations, and adapt infrastructure as workloads change.

You can manage the Qdrant Cloud lifecycle with Qdrant’s [**Terraform Provider**](https://qdrant.tech/documentation/cloud-tools/terraform/). With this support, you can define and automate cluster provisioning using Infrastructure-as-Code (IaC) best practices.

**Why it matters:** By automating cluster management and scaling, Qdrant helps you focus on building AI-powered applications, not maintaining infrastructure.

### Secure Access & Authentication \- Control the Who and What

#### Cloud RBAC (Role-Based Access Control) \- The Who

With **Cloud RBAC**, you can define precise **role-based permissions** for team members managing clusters, billing, and hybrid cloud deployments in Qdrant Cloud. Instead of granting broad, unrestricted access, teams can **assign permissions based on roles**, ensuring tighter security and compliance.

#### Granular Database API Keys \- The What

**Database API Keys** let applications and services **directly interact with data inside Qdrant**. You can **grant API access at the cluster, collection, or even vector level**, specifying **read-only or read/write permissions** for each key.

Unlike **Cloud RBAC**, which governs **team permissions in the [Cloud Console](https://cloud.qdrant.io/login)**, **Database API Keys** control how external applications access stored data. You can define **fine-grained API key permissions**, apply **Time-to-Live (TTL) expiration policies**, and revoke keys instantly—without requiring a database restart (**only available in Qdrant Cloud**).

To further refine access, **payload-based filters** allow you to restrict API keys to **only retrieve vectors that match specific metadata conditions**. Before finalizing an API key, you can **preview its access settings** to ensure it behaves as expected—reducing misconfigurations and improving security.

<iframe width="560" height="315" src="https://www.youtube.com/embed/3c-8tcBIVdQ?si=OoyobgPTU-DHIhee" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

#### [Read more about Database API keys](https://qdrant.tech/documentation/cloud/authentication/).

#### Single Sign-On (SSO) for Simplified Authentication

**SSO** eliminates password sprawl by allowing users to log in through **Okta, Google Workspace, Azure AD (Entra ID), SAML, PingFederate, and more**—enforcing authentication policies while reducing IT overhead. Instead of managing separate credentials, users **simply enter their company email** and are redirected to their organization’s authentication system.

**SSO setup is fully supported**—to enable it for your company, **contact Qdrant support**, and our team will guide you through the setup process. SSO also works with **multi-factor authentication (MFA)** for additional security.

*SSO is only available for [Premium Tier](https://qdrant.tech/documentation/cloud/premium/) customers. [Learn more about SSO](https://qdrant.tech/documentation/cloud/qdrant-cloud-setup/#enterprise-single-sign-on-sso).*

<iframe width="560" height="315" src="https://www.youtube.com/embed/EtUcA-MCZJM?si=-u31oU5R0FkVrspN" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

**Why it matters:** By integrating **Cloud RBAC**, granular **Database API Keys** and **SSO**, Qdrant Cloud helps your team have the right access at the right time—without unnecessary friction.

### Advanced Monitoring and Observability for Full Performance Insights

Qdrant Cloud provides **real-time visibility into database performance** with built-in **Prometheus/OpenMetrics support**. You can monitor **CPU usage, memory usage, disk space, request volumes, and query latencies** directly in the **Qdrant Cloud Console**, giving you a **live overview of system health**.

For **deeper analytics**, Qdrant lets you **integrate with your existing monitoring stack**, including [Datadog](https://qdrant.tech/documentation/observability/datadog/)**,** [Grafana](https://qdrant.tech/documentation/cloud/cluster-monitoring/#grafana-dashboard)**,** and [other enterprise observability tools](https://qdrant.tech/documentation/observability/). Every Qdrant Cloud cluster includes a **metrics endpoint**, accessible via a **read-only API key**, providing **Prometheus and OpenTelemetry compatible data** for easy ingestion into Grafana Cloud or any other supported monitoring system.

Qdrant also provides a **ready-to-use [Grafana dashboard](https://github.com/qdrant/qdrant-cloud-grafana-dashboard)** to help you **visualize key database metrics**, including historical performance data, cluster uptime, request latencies, backup schedules, and network I/O.

You can set up **customizable alerts** in [Grafana](https://qdrant.tech/documentation/cloud/cluster-monitoring/#grafana-dashboard), Prometheus, or [Datadog](https://qdrant.tech/documentation/observability/datadog/) to **track key performance indicators** such as **memory**, **storage**, and **query** **latency** thresholds.

For **historical performance tracking**, third-party integrations allow you to **analyze trends over time**, providing deeper insights into system performance and long-term optimization strategies.

**Why it matters:** With **detailed telemetry, automated alerts, and deep observability integrations**, you can troubleshoot issues faster, optimize database performance, and scale AI applications.

<iframe width="560" height="315" src="https://www.youtube.com/embed/pKPP-tL5_6w?si=ASKiG1P61m2YYk9J" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

[Read more about advanced monitoring](https://qdrant.tech/documentation/cloud/cluster-monitoring/).

## Simply put, Qdrant is Enterprise-Ready

Our high-performance vector search engine already handles billion-scale use cases. Through Qdrant Cloud, you get our Cloud API, authentication & access tools, and monitoring & observability integrations.

With this combination, you can simplify infrastructure management, implement secure access & authentication, and stay ahead of performance challenges. That’s why Qdrant is the enterprise vector database of choice—**no matter the scale**.

## Come Build with Us\!

[Contact Sales](https://qdrant.tech/contact-us/) to enable enterprise features for your team, or [start prototyping with a free Qdrant cluster](https://login.cloud.qdrant.io/u/signup/identifier?state=hKFo2SAxeFNkY0JxeTMwUmpsRk15SFRUR2dFbmFYcjJUdnpHc6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFpOOTQ4S21uUEVlM3o1WUx1QnMzSUlrMmlIR1NtV1JCo2NpZNkgckkxd2NPUEhPTWRlSHVUeDR4MWtGMEtGZFE3d25lemc).