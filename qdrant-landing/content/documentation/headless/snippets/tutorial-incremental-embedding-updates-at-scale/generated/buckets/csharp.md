```csharp
const int N_BUCKETS = 16; // use something much larger in production
const int GROUP_SIZE = 4; // bucket digests packed per summary point; 16 / 4 = 4 groups

int Bucket(string pid)
{
	// the whole 256-bit hash as one number, then modulo N_BUCKETS
	var full = new BigInteger(SHA256.HashData(Encoding.UTF8.GetBytes(pid)), isUnsigned: true, isBigEndian: true);
	return (int)(full % N_BUCKETS);
}

// The buckets printed in the tutorial come from the Python point IDs; this file derives its own.
foreach (var c in Prepare(CHUNKS))
	Console.WriteLine($"{Bucket(c.PointId)} {c.PointId} {c.SectionUrl}");
```
