---
title: Permissions Reference
weight: 3
---

# **Permissions Reference**

This document outlines the different permissions available in the system, categorized for clarity.

---

## **Identity and Access Management**  
Controls permissions related to user roles, access management, and invitations.  

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
Manages permissions for clusters, backups, API keys, and schedules.

### **API Keys**
| Permission | Description |
|------------|------------|
| `read:api_keys` | View Database API Keys for managed clusters. |
| `write:api_keys` | Create new Database API Keys. |
| `delete:api_keys` | Remove Database API Keys. |

### **Backups**
| Permission | Description |
|------------|------------|
| `read:backups` | View backups in the **Backups page** and **Cluster details > Backups tab**. |
| `write:backups` | Create backups from the **Backups page** and **Cluster details > Backups tab**. |
| `delete:backups` | Remove backups from the **Backups page** and **Cluster details > Backups tab**. |

### **Cluster**
| Permission | Description |
|------------|------------|
| `read:clusters` | View cluster details. |
| `write:clusters` | Modify cluster settings in the Cluster details page. |
| `delete:clusters` | Delete a cluster from the **Danger Zone** in the Clusters page. |

### **Backup Schedules**
| Permission | Description |
|------------|------------|
| `read:backup_schedules` | View backup schedules in the **Backups page** and **Cluster details > Backups tab**. |
| `write:backup_schedules` | Create backup schedules from the **Backups page** and **Cluster details > Backups tab**. |
| `delete:backup_schedules` | Remove backup schedules from the **Backups page** and **Cluster details > Backups tab**. |

---

## **Hybrid Cloud**  
Manages permissions for hybrid cloud infrastructure.

| Permission | Description |
|------------|------------|
| `read:hybrid_cloud_environments` | View hybrid cloud details. |
| `write:hybrid_cloud_environments` | Modify hybrid cloud settings. |
| `delete:hybrid_cloud_environments` | Remove a hybrid cloud cluster. |

---

## **Payment & Billing**  
Handles permissions related to payment methods and billing information.

| Permission | Description |
|------------|------------|
| `read:payment_information` | View payment methods and billing details. |
| `write:payment_information` | Modify or remove payment methods and billing details. |

---

## **Account Management**  
Controls permissions for managing user accounts.

| Permission | Description |
|------------|------------|
| `read:account` | View account details that the user is a part of. |
| `write:account` | Modify account details such as:<br> - Editing the account name<br> - Setting an account as default<br> - Leaving an account<br> **(Only available to Owners)** |
| `delete:account` | Remove an account from:<br> - The **Profile page** (list of user accounts).<br> - The **active account** (if the user is an owner/admin). |

---

## **Profile**  
Handles permissions for accessing and managing user profile information.

| Permission | Description |
|------------|------------|
| `read:profile` | View the user’s own profile information.<br> **(Assigned to all users by default)** |

---