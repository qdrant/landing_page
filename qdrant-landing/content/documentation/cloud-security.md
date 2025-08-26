---
title: Security
weight: 36
partition: cloud
aliases:
    - /documentation/cloud/security/
---

# Qdrant Cloud Security

## Compliance and Certifications

Qdrant is committed to maintaining high standards of security and compliance. We are both SOC2 Type 2 and HIPAA certified, ensuring that our systems and processes meet rigorous security criteria. You can find our compliance reports in our [Trust Center](https://qdrant.to/trust-center). The trust center also contains our internal security policies and procedures, so you can learn how we manage data protection, vulnerabilities, disaster recovery, incident responses, and more.

## Security Considerations

### Managed Cloud

All Qdrant clusters running in Qdrant Managed Cloud are isolated from each other in hardened, unprivileged containers. Each cluster is sealed off with strict network policies, ensuring that no other customer can access your data, and outbound network access is restricted to prevent data exfiltration.  Paid clusters are running on their own dedicated resources to ensure stable performance and further security.

All storage volumes are encrypted at rest. [Premium customers](/documentation/cloud-premium/) can also bring their own encryption keys for storage volumes. 

Data in transit is protected with TLS. It is possible to restrict the [IP ranges](/cloud/configure-cluster/#client-ip-restrictions) that are allowed to access a cluster.

Infrastructure access is restricted and audited according to the policies described in our [Trust Center](https://qdrant.to/trust-center). All infrastructure components are regularly patched and updated to ensure up to date security.

Access to Qdrant Cloud accounts can be configured with granular [Role-Based Access Control](/documentation/cloud-rbac/). [Premium customers](/documentation/cloud-premium/) can also enable Single Sign-On (SSO) with their identity provider.

[API keys](/cloud/authentication/) can be configured with granular access controls and rotated at any time. API Keys are never stored in plaintext.

We recommend configuring an expiration date and rotating your API keys regularly as a security best practice.

### Hybrid Cloud

For Qdrant Hybrid Cloud, the same security considerations as Managed Cloud apply. The key difference is that since the data plane is running in your own infrastructure, you as the customer are responsible for the security of the underlying infrastructure.

Qdrant Hybrid Cloud was built for security minded organizations where being "air gapped" is not a hard requirement, but there may be complex compliance and security controls that require you to operate your own infrastructure. It provides a similar developer and ops experience in the Qdrant Cloud Console to Managed Cloud, while allowing organizations to adhere to overarching security requirements with the data plane.

Please refer to our [Hybrid Cloud documentation](/documentation/hybrid-cloud/) for more details.

Qdrant clusters in Hybrid Cloud also run in hardened, unprivileged containers with strict network policies. Clusters run entirely on your own infrastructure, within your network, with your own controlled storage. Qdrant does not have any access to the database, any stored data, API keys, backups or database logs. Telemetry data and details such as the cluster configuration are shared with Qdrant to allow the Qdrant Cloud Console to be used for administration.

### Private Cloud

In Qdrant Private Cloud, Qdrant clusters run completely isolated and air-gapped within your infrastucture without any connection to the Qdrant Cloud Console. 

Since there is no connection or communication with Qdrant, you are fully responsible for the security of the entire Qdrant Private Cloud installation. This also means that you do not benefit from the integrated management and observability features of Qdrant Managed Cloud and Hybrid Cloud.

Please refer to our [Private Cloud documentation](/documentation/private-cloud/) for more details. As Private Cloud is completely isolated from the Qdrant Cloud Console, we encourage you to assess your security requirements against Hybrid Cloud before considering Private Cloud for the best experience.

With Private Cloud, Qdrant has no access to the database, any stored data, API keys, backups or the cluster logs. Compared to Hybrid Cloud, telemetry data is not shared with Qdrant and it is not possible to use the Qdrant Cloud Console to manage your clusters.

## Software Bill of Materials (SBOM) and Container Image Security

We provide a Software Bill of Materials (SBOM) for all Qdrant clusters and Qdrant Cloud components running on your infrastructure in Qdrant Hybrid Cloud and Qdrant Private Cloud. An SBOM is attached to every released container image. You can inspect it with the tool of your choice, e.g.:

```bash
docker buildx imagetools inspect registry.cloud.qdrant.io/qdrant/operator:latest --format "{{ json .SBOM }}"
```

All of our container images are scanned for vulnerabilities using [Trivy](https://trivy.dev/).

All of our container images and helm charts are signed using [Cosign](https://docs.sigstore.dev/). You can verify the signature of an image with `cosign`:

```bash
cosign verify registry.cloud.qdrant.io/qdrant/operator:latest --certificate-oidc-issuer=https://token.actions.githubusercontent.com --certificate-identity-regexp='https://github.com/qdrant/.*'
```

## Terms of Service and Data Processing Agreement

By using Qdrant Cloud, you agree to our [Terms of Service](https://cloud.qdrant.io/service-agreement) and [Privacy Policy](https://cloud.qdrant.io/privacy-policy). For customers subject to GDPR, we also offer a [Data Processing Agreement (DPA)](https://cloud.qdrant.io/dpa) that outlines our commitments regarding data protection and privacy.
