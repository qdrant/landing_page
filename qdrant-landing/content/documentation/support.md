---
title: Support
weight: 35
partition: cloud
aliases:
    - /documentation/cloud/support/
---

# Qdrant Cloud Support and Troubleshooting

## Community Support

All Qdrant Cloud users are welcome to join our [Discord community](https://qdrant.to/discord/).

![Discord](/documentation/cloud/discord.png)

## Qdrant Cloud Support

Paying customers have access to our Support team. Links to the support portal are available in the Qdrant Cloud Console.

![Support Portal](/documentation/cloud/support-portal.png)

Support is handled via **Jira Service Management (JSM)**. When creating a support ticket, you will be asked to select a request type and provide information to help us understand and prioritize your issue.

### Request Type

The form allows you to specify what your ticket is about:

- **Information** – Questions, analysis, or troubleshooting
- **Incidents** – Reporting bugs or disruptions in service
- **Billing** – Issues or questions related to charges, invoices, or payment
- **Features** – Suggestions or requests for product enhancements

### Ticket Information

Please provide as much detail as possible when submitting your request. This helps us help you faster.

This includes but is not limited to:

- The ID of your Qdrant Cloud cluster (auto-filled if possible)
- Which collection(s) are affected
- Code examples showing how you're interacting with the Qdrant API
- Logs or error messages from your application
- Relevant telemetry or traces from your system

If you're submitting a ticket for a **Hybrid Cloud** or **Private Cloud** environment, we may also ask for:

- Logs from Qdrant components (database, operator)
- Kubernetes environment state (e.g., node/resource usage, pod status)

To streamline this, we recommend using our [support bundle script](https://github.com/qdrant/qdrant-cloud-support-tools/tree/main/support-bundle). It collects environment metadata (but **no user data or API keys**) and helps us troubleshoot more efficiently. The bundle includes collection names and configuration details.

Please attach it to your ticket if applicable.

### Priority & SLA

You will also be asked to select a **severity level**, which determines how your ticket is prioritized. The severity should reflect the impact on your system or customers.

- **Severity 1** – Critical impact: full service outage or data loss
- **Severity 2** – Major impact: degraded performance or partial outage
- **Severity 3** – Moderate impact: bugs with workarounds or degraded UX
- **Severity 4** – Minor issues: cosmetic bugs, general questions

> Please refer to the [Qdrant Cloud SLA](https://qdrant.to/sla/) for full definitions of severity levels and guaranteed response times per your [support tier](/documentation/cloud/premium/).