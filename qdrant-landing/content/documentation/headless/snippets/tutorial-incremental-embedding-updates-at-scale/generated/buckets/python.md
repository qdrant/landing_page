```python
N_BUCKETS = 16   # use something much larger in production
GROUP_SIZE = 4   # bucket digests packed per summary point; 16 / 4 = 4 groups

def bucket(pid):
    return int(hashlib.sha256(pid.encode()).hexdigest(), 16) % N_BUCKETS

for c in prepare(CHUNKS):
    print(bucket(c["point_id"]), c["point_id"], c["section_url"])
```
