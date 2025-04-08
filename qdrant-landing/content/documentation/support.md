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

When creating a support ticket, please provide as much information as possible to help us understand your issue.

This includes but is not limited to:

* The ID of your Qdrant Cloud cluster, if it's not filled out by the UI automatically. You can find the ID on your cluster's detail page.
* Which collection(s) are affected
* Code examples on how you are interacting with the Qdrant API
* Logs or error messages from your application
* Relevant telemetry from your application

You can also choose a severity, when creating a ticket. This helps us prioritize your issue correctly. Please refer to the [Qdrant Cloud SLA](https://qdrant.to/sla/) for a definition of these severity levels and their corresponding response time SLA for your respective [support tier](/documentation/cloud/premium/).

If you are opening a ticket for a Hybrid Cloud or Private Cloud environment, we may ask for additional information about your environment, such as detailed logs of the Qdrant databases or operator and the state of your Kubernetes cluster.

We have prepared a support bundle script that can help you with collecting all this information. A support bundle will not contain any user data or sensitive information like api keys. It will contain the names and configuration of Qdrant collections though. For more information see the [support bundle documentation](https://github.com/qdrant/qdrant-cloud-support-tools/tree/main/support-bundle). We recommend creating one and attaching it to your support ticket, so that we can help you faster.
