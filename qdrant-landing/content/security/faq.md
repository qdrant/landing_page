---
title: FAQs
questions:
- question: Does Qdrant access my data on Qdrant Managed Cloud?
  answer: On Qdrant Cloud, every storage volume is encrypted at rest. Qdrant does not access any data stored in Qdrant clusters. API keys are stored securely as hashes. The data isolation guarantee covering the database, stored data, API keys, backups, and cluster logs applies to Hybrid Cloud and Private Cloud. Contact Qdrant if your requirements call for that level of isolation.
- question: Which controls does a Premium tier account provide?
  answer: PrivateLink (private VPC connectivity), enterprise SSO, and customer-managed encryption keys (BYOK) are all available to Premium tier customers. Contact Qdrant to enable any of these for your account.
- question: Which identity providers does Qdrant Cloud SSO support?
  answer: Qdrant Cloud enterprise SSO supports Active Directory/LDAP, ADFS, Azure Active Directory Native, Google Workspace, OpenID Connect, Okta, PingFederate, and SAML. SSO is available as an add-on for Premium tier customers.
- question: How do API keys work and can I scope them to specific collections?
  answer: Api keys default to cluster-wide manage/write permissions, with a read-only option also available. To restrict a key to a subset of collections, select the Collections tab and choose the relevant collections. Set an expiration in days (default is 90) and rotate keys regularly.
- question: How does Hybrid Cloud address data residency requirements?
  answer: Hybrid Cloud provides a similar developer and ops experience to Qdrant Managed Cloud through the Qdrant Cloud console, while keeping the data plane inside your own infrastructure. Qdrant sees only infrastructure metrics in this mode; the database, stored data, API keys, backups, and cluster logs remain inside your infrastructure.
- question: What certifications does Qdrant hold?
  answer: Qdrant holds SOC 2 Type 2 and HIPAA certifications. Pull reports from the Trust Center. For certifications or frameworks not listed there, contact Qdrant directly.
- question: Can Qdrant sign a BAA for PHI workloads?
  answer: Qdrant is HIPAA certified and Business Associate Agreement is available for Qdrant Managed Cloud. For specific PHI handling requirements, contact Qdrant to discuss your situation.
sitemapExclude: true
---
