```go
const N_BUCKETS = 16 // use something much larger in production
const GROUP_SIZE = 4 // bucket digests packed per summary point; 16 / 4 = 4 groups

bucket := func(pid string) int {
	sum := sha256.Sum256([]byte(pid))
	full := new(big.Int).SetBytes(sum[:]) // the whole 256-bit hash as one number
	return int(full.Mod(full, big.NewInt(N_BUCKETS)).Int64())
}

for _, c := range prepare(CHUNKS) {
	fmt.Println(bucket(c.PointID), c.PointID, c.SectionURL)
}
```
