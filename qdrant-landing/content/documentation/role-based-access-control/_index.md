---
title: Role Based Access Control
weight: 15
partition: cloud
---

# Introducing Cloud RBAC: Secure Access to Qdrant Cloud

# Summary

Qdrant Cloud is introducing a new feature called Cloud RBAC (Role-Based Access Control), which enables you to manage permissions for your cloud resources with greater precision. This feature is designed to work seamlessly within the Qdrant Cloud console, ensuring that only authorized users have access to sensitive data and capabilities.

## **What does Cloud RBAC mean for me?**

Cloud RBAC ensures that every aspect of our platform is secure and governed by strict access controls. We are introducing this capability via a feature flag, allowing us to selectively enable Cloud RBAC for specific customers and sections of the cloud console before it becomes generally available. 

## What permissions can I expect?

 Cloud RBAC will be a rollout of RBAC capabilities for:

- Billing
- Identity and Access Management
- Clusters
- Hybrid Cloud
- Account Configuration

Cloud RBAC will also introduce an improved and overhauled UI for the existing Invites and User Management capabilities of Qdrant Cloud.

To learn more detailed information about the available permissions see the attached documentation.

## **The Roadmap Ahead**

Our larger plan involves delivering three key features in a controlled and phased manner:

1. **Cloud RBAC:** Cloud User Permissions (this feature)
2. **Database API Keys w/ JWT RBAC:** A separate feature that enhances the built-in database api keys, including per-collection controls, with the ability to create client credentials for programmatic access to a cluster.
3. **Automatic Dashboard Auth**: The integration of Cloud RBAC and Database API Keys to allow admins to configure per-cluster permissions for a Cloud User Identity, as well as enable automatic authentication to the Database GUI based on that user’s permissions (this feature is planned later)

Once all three features are delivered, you will enjoy seamless integration between them, ensuring secure automated access across Qdrant Cloud.
