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

All Qdrant clusters running in Qdrant Managed Cloud are running isolated from each other in hardened containers running unprivileged. Every paid cluster has its own dedicated resources ensuring stable performance and security. Every cluster is sealed off with strict network policies, ensuring that no other customer can access your data. Outbound network access is also restricted to prevent data exfiltration. 

All storage volumes are encrypted at rest. [Premium customers](/documentation/cloud-premium/) can also encrypt the storage volumes with their own encryption keys. 

Data in transit is protected with TLS. It is possible to restrict the [IP ranges](/cloud/configure-cluster/#client-ip-restrictions) that are allowed to access a cluster.

Infrastructure access is limited and audited according to the policies laied out in our [Trust Center](https://qdrant.to/trust-center). All infrastructure componets are regularly patched and updated to ensure security.

Access to Qdrant Cloud accounts can be configured with granular [Role-Based Access Control](/documentation/cloud-rbac/). [Premium customers](/documentation/cloud-premium/) can also enable Single Sign-On (SSO) with their identity provider.

[API keys](/cloud/authentication/) are not stored in plain text and can be rotated at any time. We recommend configuring an expiration and rotating your API keys regularly as a security best practice. They can also be configured with granular access control to limit their permissions to only the necessary operations.

### Hybrid Cloud

For the Qdrant Hybrid Cloud management plane, the same security considerations as for the Managed Cloud apply. However, since the data plane is running in your own infrastructure, you are responsible for the security of the underlying infrastructure. 

Hybrid Cloud was built for the most security minded organizations when "air gapped" is not a hard requirement it providers a similar developer and ops experience as Managed Cloud, while adhering to organizations overarching security protocols

Please refer to our [Hybrid Cloud documentation](/documentation/hybrid-cloud/) for more details.

Qdrant clusters in Hybrid Cloud are also running in hardened containers with strict network policies. The databases are completely running on your infrastructure, within your network using your own controlled storage. Qdrant does not have any access to the database, the data in it, API keys, backups or to the database logs. Telemetry data and management instructions are shared with the Qdrant Cloud management plane.

### Private Cloud

In Qdrant Private Cloud, Qdrant clusters run completely isolated and air-gapped within your infrastucture without any connection to the Qdrant Cloud management plane. 

Since no data or management instructions are shared with Qdrant, you are fully responsible for the security of the whole Qdrant Private Cloud installation. This also means that you do not benefit from all the integrated management and observability features of Qdrant Managed Cloud and Hybrid Cloud.

Please refer to our [Private Cloud documentation](/documentation/private-cloud/) for more details. We encourage you to weigh your security requirements against Hybrid Cloud before inquiring about Private Cloud.

Qdrant does not have any access to the database, the data in it, API keys, backups or to the database logs. No telemetry data is shared with Qdrant.

## Software Bill of Materials (SBOM) and Container Image Security

We provide a Software Bill of Materials (SBOM) for the Qdrant database and Qdrant Cloud components running on your infrastructure in Qdrant Hybrid Cloud and Qdrant Private Cloud. An SBOM is attached to every released container image. You can inspect it with the tool of your choice, e.g.:

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
