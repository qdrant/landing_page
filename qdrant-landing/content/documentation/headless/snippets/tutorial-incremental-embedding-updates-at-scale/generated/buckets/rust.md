```rust
const N_BUCKETS: usize = 16; // use something much larger in production
const GROUP_SIZE: usize = 4; // bucket digests packed per summary point; 16 / 4 = 4 groups

fn bucket(pid: &str) -> usize {
    // reduce the whole 256-bit hash modulo N_BUCKETS, one byte at a time
    Sha256::digest(pid.as_bytes())
        .iter()
        .fold(0usize, |acc, byte| (acc * 256 + *byte as usize) % N_BUCKETS)
}

for c in prepare(&chunks) {
    println!("{} {} {}", bucket(&c.point_id), c.point_id, c.section_url);
}
```
