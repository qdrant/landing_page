---
title: Multi‑Tenancy with JWT
weight: 3
---

{{< date >}} Day 6 {{< /date >}}

# Multi‑Tenancy with JWT

[Multitenancy](/documentation/guides/multiple-partitions/) enables you to serve multiple customers, users, or organizations from a single Qdrant cluster while maintaining complete data isolation. This guide explains how to implement secure, scalable multitenancy using payload-based partitioning and [JWT](https://jwt.io/) authentication.

## Understanding Multitenancy

### What is multitenancy?

Multitenancy allows multiple tenants (customers, users, organizations) to share the same infrastructure while keeping their data completely isolated. Instead of creating separate collections for each tenant, you store all data in a single collection with tenant identifiers in the payload.

### Why use multitenancy?

**Cost Efficiency**: One collection serves all tenants, reducing resource overhead
**Simplified Management**: Single cluster to maintain and monitor
**Better Resource Utilization**: Shared infrastructure scales more efficiently
**Operational Simplicity**: Unified backup, monitoring, and maintenance procedures

### Single Collection vs Multiple Collections

**Single Collection (Recommended)**:
- All tenants share one collection with payload-based filtering
- Lower resource overhead and better performance
- Easier to manage and scale
- **Use for**: SaaS applications, multi-user platforms

**Multiple Collections**:
- Each tenant gets their own collection
- Complete physical isolation but higher overhead
- **Use for**: Strict compliance requirements, heterogeneous data models

## Common Questions Answered

### How do I ensure complete data isolation?

Data isolation happens at three levels:

**1. Authentication Layer**: JWT tokens identify and authorize users
**2. Data Layer**: Each point includes tenant identifiers in payload
**3. Request Layer**: Every operation includes mandatory tenant filters

### Should I use payload filtering or custom sharding?

**Start with payload filtering** for most use cases:
- Simpler to implement and maintain
- Works well for most tenant sizes
- Lower operational complexity

**Add custom sharding** only when:
- You have large tenants (millions of vectors each)
- Most queries are tenant-scoped
- You measure performance benefits from reduced fan-out

### How do I handle different tenant sizes?

**Small Tenants (< 100K vectors)**:
- Use payload filtering with tenant indexes
- Share shards across multiple tenants
- Focus on efficient filtering

**Medium Tenants (100K - 1M vectors)**:
- Use payload filtering with optimized indexes
- Consider tenant-specific storage optimization
- Monitor query performance per tenant

**Large Tenants (> 1M vectors)**:
- Consider custom sharding for isolation
- Dedicated shards for performance
- Advanced monitoring and resource allocation

## Implementation Patterns

### Basic Multitenancy Setup

Start with this foundation for most applications:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://your-cluster.cloud.qdrant.io",
    api_key="your-api-key"
)

# Create collection optimized for multitenancy
client.create_collection(
    collection_name="multitenant_data",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    # Optimize for tenant-based filtering
    hnsw_config=models.HnswConfigDiff(
        m=0,         # Disable global index
        payload_m=16 # Enable per-tenant indexing
    )
)

# Create tenant index for fast filtering
client.create_payload_index(
    collection_name="multitenant_data",
    field_name="tenant_id",
    field_schema=models.PayloadSchemaType.KEYWORD,
    is_tenant=True  # Optimize storage for tenant locality
)
```

### Data Upload with Tenant Isolation

Always include tenant identifiers in your data:

```python
def upload_tenant_data(tenant_id, documents):
    """Upload documents for a specific tenant"""
    
    points = []
    for i, doc in enumerate(documents):
        vector = encode_document(doc)  # Your embedding function
        
        points.append(models.PointStruct(
            id=f"{tenant_id}_{i}",  # Tenant-prefixed IDs
            vector=vector,
            payload={
                "tenant_id": tenant_id,     # Mandatory tenant field
                "document_id": doc["id"],
                "title": doc["title"],
                "content": doc["content"],
                "created_at": doc["timestamp"]
            }
        ))
    
    client.upsert(
        collection_name="multitenant_data",
        points=points
    )
    
    return len(points)

# Upload data for different tenants
upload_tenant_data("company_a", company_a_documents)
upload_tenant_data("company_b", company_b_documents)
```

### Secure Search with Tenant Filtering

Every search must include tenant filtering:

```python
def search_for_tenant(tenant_id, query_text, limit=10):
    """Perform search restricted to specific tenant"""
    
    query_vector = encode_query(query_text)  # Your embedding function
    
    # Mandatory tenant filter - never skip this!
    tenant_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="tenant_id",
                match=models.MatchValue(value=tenant_id)
            )
        ]
    )
    
    response = client.query_points(
        collection_name="multitenant_data",
        query=query_vector,
        query_filter=tenant_filter,
        limit=limit,
        with_payload=True
    )
    
    return response.points

# Search for specific tenant only
results = search_for_tenant("company_a", "quarterly financial report")
```

## JWT Authentication Implementation

### JWT Token Structure

Design your JWT tokens to include tenant and access information:

```json
{
  "iss": "https://auth.yourcompany.com",
  "aud": "qdrant-api",
  "exp": 1735689600,
  "sub": "user_123",
  "tenant_id": "company_a",
  "roles": ["tenant:reader"],
  "access": [
    {
      "collection": "multitenant_data",
      "access": "r",
      "payload": {
        "tenant_id": "company_a"
      }
    }
  ]
}
```

### Token Generation

```python
import jwt
from datetime import datetime, timedelta

def generate_tenant_token(tenant_id, user_id, access_level="r", expires_in_hours=24):
    """Generate JWT token for tenant access"""
    
    payload = {
        "iss": "https://auth.yourcompany.com",
        "aud": "qdrant-api",
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours),
        "sub": user_id,
        "tenant_id": tenant_id,
        "access": [
            {
                "collection": "multitenant_data",
                "access": access_level,  # "r" for read, "rw" for read-write
                "payload": {
                    "tenant_id": tenant_id
                }
            }
        ]
    }
    
    # Sign with your secret key
    token = jwt.encode(payload, "your-secret-key", algorithm="HS256")
    return token

# Generate tokens for different access levels
read_token = generate_tenant_token("company_a", "user_123", "r")
write_token = generate_tenant_token("company_a", "admin_456", "rw")
```

### Client Authentication

```python
# Use JWT token for authentication
client = QdrantClient(
    url="https://your-cluster.cloud.qdrant.io",
    api_key=read_token  # JWT token as API key
)

# All operations automatically filtered by JWT payload claims
results = client.query_points(
    collection_name="multitenant_data",
    query=query_vector,
    limit=10
    # No need for explicit tenant filter - JWT handles it automatically
)
```

## Advanced Multitenancy Patterns

### Hierarchical Tenancy

For complex organizational structures:

```python
def upload_hierarchical_data(org_id, dept_id, user_id, documents):
    """Upload data with hierarchical tenant structure"""
    
    points = []
    for i, doc in enumerate(documents):
        points.append(models.PointStruct(
            id=f"{org_id}_{dept_id}_{user_id}_{i}",
            vector=encode_document(doc),
            payload={
                "org_id": org_id,           # Organization level
                "dept_id": dept_id,         # Department level  
                "user_id": user_id,         # User level
                "document_id": doc["id"],
                "content": doc["content"]
            }
        ))
    
    return points

# Search with hierarchical filtering
def search_department(org_id, dept_id, query_text):
    """Search within specific department"""
    
    filter_conditions = models.Filter(
        must=[
            models.FieldCondition(key="org_id", match=models.MatchValue(value=org_id)),
            models.FieldCondition(key="dept_id", match=models.MatchValue(value=dept_id))
        ]
    )
    
    return client.query_points(
        collection_name="multitenant_data",
        query=encode_query(query_text),
        query_filter=filter_conditions,
        limit=10
    )
```

### Custom Sharding for Large Tenants

When you have large tenants that benefit from dedicated shards:

```python
# Enable custom sharding
client.create_collection(
    collection_name="enterprise_data",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    shard_number=1,  # Shards per shard key
    sharding_method=models.ShardingMethod.CUSTOM
)

# Create dedicated shards for large tenants
client.create_shard_key("enterprise_data", "large_tenant_1")
client.create_shard_key("enterprise_data", "large_tenant_2")

# Route tenant data to specific shards
def upload_to_tenant_shard(tenant_id, documents):
    """Upload data to tenant-specific shard"""
    
    points = create_tenant_points(tenant_id, documents)
    
    client.upsert(
        collection_name="enterprise_data",
        points=points,
        shard_key_selector=f"tenant_{tenant_id}"  # Route to specific shard
    )

# Search within tenant shard for better performance
def search_tenant_shard(tenant_id, query_text):
    """Search within tenant's dedicated shard"""
    
    return client.query_points(
        collection_name="enterprise_data",
        query=encode_query(query_text),
        query_filter=models.Filter(
            must=[models.FieldCondition(key="tenant_id", match=models.MatchValue(value=tenant_id))]
        ),
        shard_key_selector=f"tenant_{tenant_id}",  # Query specific shard only
        limit=10
    )
```

## Security Best Practices

### Token Validation and Middleware

Implement proper token validation in your application layer:

```python
import jwt
from functools import wraps

def validate_tenant_access(required_access="r"):
    """Decorator to validate JWT and extract tenant context"""
    
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Extract JWT from Authorization header
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return {"error": "Missing or invalid authorization header"}, 401
            
            token = auth_header.split(" ")[1]
            
            try:
                # Validate and decode JWT
                payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])
                
                # Extract tenant information
                tenant_id = payload.get("tenant_id")
                if not tenant_id:
                    return {"error": "Missing tenant_id in token"}, 403
                
                # Validate access level
                access_claims = payload.get("access", [])
                has_access = any(
                    claim.get("collection") == "multitenant_data" and
                    claim.get("access") in [required_access, "rw"] and
                    claim.get("payload", {}).get("tenant_id") == tenant_id
                    for claim in access_claims
                )
                
                if not has_access:
                    return {"error": "Insufficient permissions"}, 403
                
                # Add tenant context to request
                request.tenant_id = tenant_id
                request.user_id = payload.get("sub")
                
                return func(request, *args, **kwargs)
                
            except jwt.ExpiredSignatureError:
                return {"error": "Token has expired"}, 401
            except jwt.InvalidTokenError:
                return {"error": "Invalid token"}, 401
        
        return wrapper
    return decorator

# Use in your API endpoints
@validate_tenant_access("r")
def search_endpoint(request):
    """API endpoint with automatic tenant validation"""
    
    query = request.json.get("query")
    results = search_for_tenant(request.tenant_id, query)
    
    return {"results": results}
```

### Token Revocation

Implement token revocation using the `value_exists` claim:

```python
def create_revocable_token(tenant_id, user_id, role="user"):
    """Create token that can be revoked by changing user status"""
    
    payload = {
        "exp": datetime.utcnow() + timedelta(hours=24),
        "sub": user_id,
        "tenant_id": tenant_id,
        "value_exists": {
            "collection": "user_status",
            "matches": [
                {"key": "user_id", "value": user_id},
                {"key": "status", "value": "active"},
                {"key": "role", "value": role}
            ]
        },
        "access": [
            {
                "collection": "multitenant_data",
                "access": "r" if role == "user" else "rw",
                "payload": {"tenant_id": tenant_id}
            }
        ]
    }
    
    return jwt.encode(payload, "your-secret-key", algorithm="HS256")

# Revoke access by changing user status
def revoke_user_access(user_id):
    """Revoke user access by updating their status"""
    
    client.upsert(
        collection_name="user_status",
        points=[
            models.PointStruct(
                id=user_id,
                vector=[0.0] * 384,  # Dummy vector
                payload={
                    "user_id": user_id,
                    "status": "revoked",  # This invalidates the token
                    "revoked_at": datetime.utcnow().isoformat()
                }
            )
        ]
    )
```

## Performance Optimization

### Tenant Indexing for Fast Filtering

Optimize storage for tenant-based queries:

```python
# Create optimized tenant index
client.create_payload_index(
    collection_name="multitenant_data",
    field_name="tenant_id",
    field_schema=models.PayloadSchemaType.KEYWORD,
    is_tenant=True  # Enables tenant-specific storage optimizations
)

# Additional indexes for common filter fields
client.create_payload_index(
    collection_name="multitenant_data",
    field_name="created_at",
    field_schema=models.PayloadSchemaType.DATETIME
)

client.create_payload_index(
    collection_name="multitenant_data",
    field_name="document_type",
    field_schema=models.PayloadSchemaType.KEYWORD
)
```

### Filterable HNSW Configuration

For heavy filtering workloads, optimize the [HNSW](https://qdrant.tech/articles/filtrable-hnsw/) index:

```python
client.create_collection(
    collection_name="multitenant_data",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    hnsw_config=models.HnswConfigDiff(
        m=0,         # Disable global index for better tenant isolation
        payload_m=16 # Build per-tenant indexes for better recall under filtering
    )
)
```

### Query Optimization Strategies

```python
def optimized_tenant_search(tenant_id, query_text, filters=None):
    """Optimized search with proper filtering and indexing"""
    
    # Build comprehensive filter
    must_conditions = [
        models.FieldCondition(key="tenant_id", match=models.MatchValue(value=tenant_id))
    ]
    
    # Add additional filters if provided
    if filters:
        if filters.get("document_type"):
            must_conditions.append(
                models.FieldCondition(
                    key="document_type",
                    match=models.MatchValue(value=filters["document_type"])
                )
            )
        
        if filters.get("date_range"):
            must_conditions.append(
                models.FieldCondition(
                    key="created_at",
                    range=models.DatetimeRange(
                        gte=filters["date_range"]["start"],
                        lte=filters["date_range"]["end"]
                    )
                )
            )
    
    tenant_filter = models.Filter(must=must_conditions)
    
    response = client.query_points(
        collection_name="multitenant_data",
        query=encode_query(query_text),
        query_filter=tenant_filter,
        limit=10,
        with_payload=True
    )
    
    return response.points
```

## Role-Based Access Control (RBAC)

### Define Access Levels

Create different access patterns for various user roles:

```python
def create_role_based_token(tenant_id, user_id, role):
    """Create JWT with role-based access control"""
    
    # Define access patterns by role
    access_patterns = {
        "viewer": {
            "access": "r",
            "allowed_operations": ["search", "retrieve"]
        },
        "editor": {
            "access": "rw", 
            "allowed_operations": ["search", "retrieve", "upsert", "update"]
        },
        "admin": {
            "access": "rw",
            "allowed_operations": ["search", "retrieve", "upsert", "update", "delete"]
        }
    }
    
    if role not in access_patterns:
        raise ValueError(f"Invalid role: {role}")
    
    pattern = access_patterns[role]
    
    payload = {
        "exp": datetime.utcnow() + timedelta(hours=24),
        "sub": user_id,
        "tenant_id": tenant_id,
        "role": role,
        "access": [
            {
                "collection": "multitenant_data",
                "access": pattern["access"],
                "payload": {"tenant_id": tenant_id}
            }
        ]
    }
    
    return jwt.encode(payload, "your-secret-key", algorithm="HS256")

# Generate tokens for different roles
viewer_token = create_role_based_token("company_a", "user_123", "viewer")
admin_token = create_role_based_token("company_a", "admin_456", "admin")
```

### API Gateway Integration

Implement tenant validation at the API gateway level:

```python
class TenantAwareAPI:
    """API wrapper that enforces tenant isolation"""
    
    def __init__(self, qdrant_client):
        self.client = qdrant_client
    
    def validate_and_extract_tenant(self, jwt_token):
        """Validate JWT and extract tenant information"""
        
        try:
            payload = jwt.decode(jwt_token, "your-secret-key", algorithms=["HS256"])
            return {
                "tenant_id": payload.get("tenant_id"),
                "user_id": payload.get("sub"),
                "role": payload.get("role"),
                "access_level": payload.get("access", [])
            }
        except jwt.InvalidTokenError:
            raise ValueError("Invalid or expired token")
    
    def search(self, jwt_token, query_text, additional_filters=None):
        """Tenant-aware search endpoint"""
        
        # Validate token and extract tenant
        auth_info = self.validate_and_extract_tenant(jwt_token)
        tenant_id = auth_info["tenant_id"]
        
        # Perform tenant-scoped search
        return search_for_tenant(tenant_id, query_text, additional_filters)
    
    def upsert(self, jwt_token, documents):
        """Tenant-aware upsert endpoint"""
        
        # Validate token and check write permissions
        auth_info = self.validate_and_extract_tenant(jwt_token)
        tenant_id = auth_info["tenant_id"]
        
        # Check if user has write access
        has_write_access = any(
            access.get("access") == "rw" 
            for access in auth_info["access_level"]
        )
        
        if not has_write_access:
            raise PermissionError("Insufficient permissions for write operations")
        
        # Upload data with tenant isolation
        return upload_tenant_data(tenant_id, documents)

# Use the tenant-aware API
api = TenantAwareAPI(client)
results = api.search(user_token, "find quarterly reports")
```

## Testing and Validation

### Isolation Testing

Verify that tenant isolation works correctly:

```python
def test_tenant_isolation():
    """Test that tenants cannot access each other's data"""
    
    # Upload test data for two different tenants
    tenant_a_docs = [{"id": "doc1", "content": "Company A confidential data"}]
    tenant_b_docs = [{"id": "doc2", "content": "Company B confidential data"}]
    
    upload_tenant_data("company_a", tenant_a_docs)
    upload_tenant_data("company_b", tenant_b_docs)
    
    # Test that Company A cannot see Company B's data
    company_a_results = search_for_tenant("company_a", "confidential")
    company_b_results = search_for_tenant("company_b", "confidential")
    
    # Verify isolation
    assert len(company_a_results) == 1
    assert len(company_b_results) == 1
    assert company_a_results[0].payload["tenant_id"] == "company_a"
    assert company_b_results[0].payload["tenant_id"] == "company_b"
    
    print("✓ Tenant isolation test passed")

def test_jwt_access_control():
    """Test JWT-based access control"""
    
    # Create read-only token
    read_token = create_role_based_token("company_a", "user_123", "viewer")
    
    # Create client with read-only token
    read_client = QdrantClient(
        url="https://your-cluster.cloud.qdrant.io",
        api_key=read_token
    )
    
    # Test that read operations work
    try:
        results = read_client.query_points(
            collection_name="multitenant_data",
            query=[0.1] * 384,
            limit=5
        )
        print("✓ Read access test passed")
    except Exception as e:
        print(f"✗ Read access test failed: {e}")
    
    # Test that write operations are blocked
    try:
        read_client.upsert(
            collection_name="multitenant_data",
            points=[models.PointStruct(id=999, vector=[0.1] * 384)]
        )
        print("✗ Write access test failed - should have been blocked")
    except Exception:
        print("✓ Write access properly blocked")

# Run isolation tests
test_tenant_isolation()
test_jwt_access_control()
```

## Production Deployment Checklist

### Security Checklist

- ✅ JWT tokens have reasonable expiration times (1-24 hours)
- ✅ Secret keys are stored securely and rotated regularly
- ✅ All API endpoints validate tokens before processing
- ✅ Tenant filters are mandatory and cannot be bypassed
- ✅ Token revocation mechanism is implemented and tested
- ✅ Access logs include tenant and user identification

### Performance Checklist

- ✅ Tenant fields are indexed with `is_tenant=True`
- ✅ HNSW configuration optimized for filtering (`payload_m` > 0)
- ✅ Common filter fields have payload indexes
- ✅ Query patterns are tenant-scoped to avoid global scans
- ✅ Large tenants use custom sharding when beneficial

### Operational Checklist

- ✅ Monitoring includes per-tenant metrics
- ✅ Backup procedures account for tenant data
- ✅ Disaster recovery plans include tenant restoration
- ✅ Capacity planning considers tenant growth patterns
- ✅ Documentation includes tenant onboarding procedures

## Common Pitfalls and Solutions

### Forgetting Tenant Filters

**Problem**: Accidentally performing global queries without tenant filters
**Solution**: 
- Always use wrapper functions that include tenant filters
- Implement middleware that automatically adds tenant filters
- Use JWT payload claims for automatic filtering

### Poor Index Performance

**Problem**: Slow queries due to inefficient filtering
**Solution**:
- Create tenant indexes with `is_tenant=True`
- Use `payload_m` configuration for better filtering performance
- Monitor query latency per tenant

### Token Management Complexity

**Problem**: Difficult to manage token lifecycle and revocation
**Solution**:
- Implement centralized token management service
- Use `value_exists` claims for revocation
- Automate token rotation and cleanup

### Uneven Tenant Resource Usage

**Problem**: Large tenants affecting small tenant performance
**Solution**:
- Monitor resource usage per tenant
- Use custom sharding for large tenants
- Implement rate limiting and resource quotas

## Monitoring and Observability

### Key Metrics to Track

**Per-Tenant Metrics**:
- Query latency and throughput
- Storage usage and growth rate
- Error rates and failed requests
- Active users and session patterns

**System-Wide Metrics**:
- Filter performance and index utilization
- Memory usage for tenant indexes
- JWT validation success/failure rates
- Cross-tenant query attempts (security violations)

### Alerting Strategies

```python
def setup_tenant_monitoring():
    """Configure monitoring for multitenant deployment"""
    
    monitoring_config = {
        "tenant_metrics": {
            "query_latency_p95": {"threshold": "100ms", "per_tenant": True},
            "storage_growth": {"threshold": "10GB/day", "per_tenant": True},
            "error_rate": {"threshold": "1%", "per_tenant": True}
        },
        "security_metrics": {
            "invalid_tokens": {"threshold": "10/hour", "alert": "immediate"},
            "cross_tenant_attempts": {"threshold": "1", "alert": "immediate"},
            "token_expiry_rate": {"threshold": "high", "alert": "daily"}
        },
        "performance_metrics": {
            "filter_efficiency": {"threshold": "degraded", "alert": "hourly"},
            "index_utilization": {"threshold": "low", "alert": "daily"}
        }
    }
    
    return monitoring_config
```

## Best Practices Summary

**Architecture Design**:
- Use single collection with payload-based partitioning
- Implement JWT authentication with proper claims
- Design hierarchical tenant structures when needed
- Plan for tenant growth and scaling patterns

**Security Implementation**:
- Never skip tenant filters in any operation
- Validate JWT tokens at the application boundary
- Implement token revocation mechanisms
- Log all access attempts with tenant context

**Performance Optimization**:
- Create tenant indexes with `is_tenant=True`
- Use `payload_m` for better filtering performance
- Monitor and optimize query patterns per tenant
- Consider custom sharding for large tenants only when measured benefits exist

**Operational Excellence**:
- Monitor per-tenant metrics and resource usage
- Implement proper backup and recovery procedures
- Plan for tenant onboarding and offboarding
- Document security and access control procedures 