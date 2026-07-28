```go
chunkDigest := func(pid, chash string) uint64 {
	// First 15 hex digits of the combined hash = a 60-bit number.
	// 60 bits fits Qdrant's signed 64-bit integer payload, so digests store as plain integers.
	sum := sha256.Sum256([]byte(pid + chash))
	combined := hex.EncodeToString(sum[:])
	digest, err := strconv.ParseUint(combined[:15], 16, 64)
	return digest
}

computeDigests := func(chunks []Chunk) []uint64 {
	digests := make([]uint64, N_BUCKETS)
	for _, c := range chunks {
		b := bucket(c.PointID)
		digests[b] ^= chunkDigest(c.PointID, c.ContentHash)
	}
	return digests
}

computeDigests(prepare(CHUNKS))
```
