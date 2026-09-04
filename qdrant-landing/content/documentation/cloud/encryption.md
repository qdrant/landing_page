---
title: Encryption at Rest
short_description: "Use your own AWS KMS, GCP Cloud KMS, or Azure Key Vault key to encrypt Qdrant Managed Cloud storage volumes as a Premium customer."
description: "Enable customer-managed encryption keys (BYOK) for Qdrant Managed Cloud storage volumes on AWS, GCP, or Azure as a Premium customer by opening a support ticket."
weight: 27
---

# Encryption at Rest

Qdrant Managed Cloud encrypts all storage volumes at rest by default. [Premium customers](/documentation/cloud-premium/) can also use their own cloud key management service (KMS) key for additional control over their encryption. Enabling this requires opening a support ticket. Qdrant Support provides the cloud-specific identifiers and detailed setup instructions, then configures your cluster once your key is in place.

## Prerequisites

- A [Premium Managed Cloud](/documentation/cloud-premium/) subscription
- An existing cluster in Qdrant Cloud (create one before requesting encryption)
- Whether your cluster is empty or contains data (empty clusters are simpler to migrate; Qdrant Support will advise on the approach)

## Step 1: Open a Support Ticket

Open a support ticket via the [Qdrant Cloud Console](https://cloud.qdrant.io/) and include:

- Your cluster ID
- Your cloud provider (AWS, GCP, or Azure)
- Whether the cluster is empty or contains data

Qdrant Support will respond with the cloud-specific identifier you need to complete the next step:

- **AWS**: Qdrant's AWS account ID
- **GCP**: Qdrant's Compute Engine service agent email
- **Azure**: Qdrant's Entra application ID (client ID)

Support will also provide detailed setup instructions.

## Step 2: Create Your Encryption Key

Follow the instructions from Qdrant Support to complete the key setup for your cloud provider.

### AWS

In AWS KMS, create a symmetric key in the same region as your cluster and grant Qdrant's account access to it using the identifier provided by Support. Copy the resulting **Key ARN**.

### GCP

In Cloud KMS, create a key ring and symmetric encrypt/decrypt key in the same region as your cluster and grant Qdrant's service agent access to it using the identifier provided by Support. Copy the resulting **Key ID**.

### Azure

Install Qdrant's Entra application into your Azure tenant using the application ID provided by Support, create a Key Vault with an encryption key in the same region as your cluster, and grant Qdrant's service principal access to it. Copy the resulting **Key URL**.

## Step 3: Reply to the Support Ticket

Send Qdrant Support your key identifier:

- **AWS**: Key ARN
- **GCP**: Key ID
- **Azure**: Key URL

Qdrant Support will configure encryption for your cluster.
