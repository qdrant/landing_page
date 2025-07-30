---
title: Permission Reference
weight: 3
---

# **Permission Reference**

This document outlines the permissions available in Qdrant Cloud.

---

> 💡 When enabling `write:*` permissions in the UI, the corresponding `read:*` permission will also be enabled and non-actionable. This guarantees access to resources after creating and/or updating them.

## **Identity and Access Management**
Permissions for users, user roles, management keys, and invitations.

| Permission | Description |
|------------|------------|
| `read:roles` | View roles in the Access Management page. |
| `write:roles` | Create and modify roles in the Access Management page. |
| `delete:roles` | Remove roles in the Access Management page. |
| `read:management_keys` | View Cloud Management Keys in the Access Management page. |
| `write:management_keys` | Create and manage Cloud Management Keys. |
| `delete:management_keys` | Remove Cloud Management Keys in the Access Management page. |
| `write:invites` | Invite new users to an account and revoke invitations. |
| `read:invites` | View pending invites in an account. |
| `delete:invites` | Remove an invitation. |
| `read:users` | View user details in the profile page. <br> - Also applicable in User Management and Role details (User tab). |
| `delete:users` | Remove users from an account. <br> - Applicable in User Management and Role details (User tab). |

---

## **Cluster**
Permissions for API Keys, backups, clusters, and backup schedules.

### **API Keys**
| Permission | Description |
|------------|------------|
| `read:api_keys` | View Database API Keys for Managed Cloud clusters. |
| `write:api_keys` | Create new Database API Keys for Managed Cloud clusters. |
| `delete:api_keys` | Remove Database API Keys for Managed Cloud clusters. |

### **Backups**
| Permission | Description |
|------------|------------|
| `read:backups` | View backups in the **Backups page** and **Cluster details > Backups tab**. |
| `write:backups` | Create backups from the **Backups page** and **Cluster details > Backups tab**. |
| `delete:backups` | Remove backups from the **Backups page** and **Cluster details > Backups tab**. |

### **Clusters**
| Permission | Description |
|------------|------------|
| `read:clusters` | View cluster details. |
| `write:clusters` | Modify cluster settings. |
| `delete:clusters` | Delete clusters. |

### **Cluster Data**
| Permission | Description |
|------------|------------|
| `read:cluster_data` | View cluster data, used for Cluster UI button. (maps to read-only JWT access) |
| `write:cluster_data` | View and Modify cluster data, used for Cluster UI button.(maps to manage JWT access) |

### **Backup Schedules**
| Permission | Description |
|------------|------------|
| `read:backup_schedules` | View backup schedules in the **Backups page** and **Cluster details > Backups tab**. |
| `write:backup_schedules` | Create backup schedules from the **Backups page** and **Cluster details > Backups tab**. |
| `delete:backup_schedules` | Remove backup schedules from the **Backups page** and **Cluster details > Backups tab**. |

---

## **Hybrid Cloud**
Permissions for Hybrid Cloud environments.

| Permission | Description |
|------------|------------|
| `read:hybrid_cloud_environments` | View Hybrid Cloud environment details. |
| `write:hybrid_cloud_environments` | Modify Hybrid Cloud environment settings. |
| `delete:hybrid_cloud_environments` | Delete Hybrid Cloud environments. |

---

## **Payment & Billing**
Permissions for payment methods and billing information.

| Permission | Description |
|------------|------------|
| `read:payment_information` | View payment methods and billing details. |
| `write:payment_information` | Modify or remove payment methods and billing details. |

---

## **Account Management**
Permissions for managing user accounts.

| Permission | Description |
|------------|------------|
| `read:account` | View account details that the user is a part of. |
| `write:account` | Modify account details such as:<br> - Editing the account name<br> - Setting an account as default<br> - Leaving an account<br> **(Only available to Owners)** |
| `delete:account` | Remove an account from:<br> - The **Profile page** (list of user accounts).<br> - The **active account** (if the user is an owner/admin). |

---

## **Profile**
Permissions for accessing personal profile information.

| Permission | Description |
|------------|------------|
| `read:profile` | View the user’s own profile information.<br> **(Assigned to all users by default)** |

---
