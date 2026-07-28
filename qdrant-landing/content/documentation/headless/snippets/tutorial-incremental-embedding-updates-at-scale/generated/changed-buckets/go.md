```go
latest := prepare(LATEST)
source := computeDigests(latest) // digests of the edited source
stored := readMeta()             // digests Qdrant currently holds

var changedBuckets []int
for b := 0; b < N_BUCKETS; b++ {
	if source[b] != stored[b] {
		changedBuckets = append(changedBuckets, b)
	}
}

fmt.Println(changedBuckets)
```
