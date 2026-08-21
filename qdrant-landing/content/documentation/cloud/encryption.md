---
title: Encryption at Rest
short_description: "Use your own AWS KMS, GCP Cloud KMS, or Azure Key Vault key to encrypt Qdrant Managed Cloud storage volumes as a Premium customer."
description: "Enable customer-managed encryption keys (BYOK) for Qdrant Managed Cloud storage volumes on AWS, GCP, or Azure as a Premium customer by opening a support ticket."
weight: 27
---

# Encryption at Rest

Qdrant Managed Cloud encrypts all storage volumes at rest by default. [Premium customers](/documentation/cloud-premium/), can also use their own cloud key management service (KMS) key for additional control over their encryption. To enable this, complete the key setup described on this page and open a support ticket.

## Prerequisites

- A [Premium Managed Cloud](/documentation/cloud-premium/) subscription
- An existing cluster in Qdrant Cloud (create one before requesting encryption)
- Whether your cluster is empty or contains data (empty clusters are simpler to migrate; Qdrant Support will advise on the approach when you open your ticket)

## Create Your Encryption Key

Complete the steps for your cloud provider before continuing to the next section.

### AWS

1. In the AWS KMS console, create a new **Symmetric** key with key usage **Encrypt and Decrypt**. Create it in the same region as your Qdrant cluster, or use a multi-regional key if you need it across regions.
2. In the **Define key usage permissions** step, add an external AWS account and enter `337975577518` (Qdrant's AWS account ID).
3. Confirm that the resulting key policy grants `arn:aws:iam::337975577518:root` the following actions:
   - `kms:Encrypt`, `kms:Decrypt`, `kms:ReEncrypt*`, `kms:GenerateDataKey*`, `kms:DescribeKey`
   - `kms:CreateGrant`, `kms:ListGrants`, `kms:RevokeGrant` (with condition `kms:GrantIsForAWSResource: true`)
4. Copy the Key ARN. You'll need it when you open your support ticket.

> Scoping the key grant to a specific IAM role isn't currently supported. The grant must cover the full Qdrant account (`arn:aws:iam::337975577518:root`).

### GCP

1. In Cloud KMS, create a key ring in the same region as your Qdrant cluster.
2. Create a key in the key ring with these settings:
   - **Protection level**: Software
   - **Purpose**: Symmetric encrypt/decrypt
   - **Rotation period**: None
3. Grant the role `roles/cloudkms.cryptoKeyEncrypterDecrypter` on that key to Qdrant's Compute Engine service agent: `service-936711710023@compute-system.iam.gserviceaccount.com`.
4. Copy the Key ID. You'll need it when you open your support ticket.

### Azure

Azure setup requires Qdrant's Entra application ID, which Qdrant Support provides. [Contact support](#open-a-support-ticket) first to get the Application ID (client ID), then complete the following steps.

1. Install Qdrant's multi-tenant Entra application into your Azure tenant using the Application ID provided by Qdrant Support. This creates a service principal in your tenant. You need one of the following roles: Global Administrator, Cloud Application Administrator, or Application Administrator.

   ```bash
   az ad sp create --id <application-id>
   ```
2. Create an Azure Key Vault in the same region as your Qdrant cluster with these settings enabled (requires the **Key Vault Contributor** role):
   - **Purge protection**
   - **Azure role-based access control (RBAC) authorization**
3. Create an encryption key in the Key Vault (requires the **Key Vault Crypto Officer** role).
4. Assign the **Key Vault Crypto Service Encryption User** role to Qdrant's service principal on the Key Vault.
5. Copy the Key URL. You'll need it when you open your support ticket.

## Open a Support Ticket

With your key set up, open a support ticket via the [Qdrant Cloud Console](https://cloud.qdrant.io/) and include the following:

- Your cluster ID
- Your cloud provider (AWS, GCP, or Azure)
- Whether the cluster is empty or contains data
- Your key identifier: Key ARN (AWS), Key ID (GCP), or Key URL (Azure)

Qdrant Support will configure encryption for your cluster.

