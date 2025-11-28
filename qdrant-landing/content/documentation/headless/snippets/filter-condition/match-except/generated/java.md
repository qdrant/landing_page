```java
import static io.qdrant.client.ConditionFactory.matchExceptKeywords;

import java.util.List;

matchExceptKeywords("color", List.of("black", "yellow"));
```
