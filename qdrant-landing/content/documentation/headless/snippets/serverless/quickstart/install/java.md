```java
// Build the client from its development branch and publish it to your local Maven repository:
// git clone --branch feat/serverlessa https://github.com/qdrant/java-client
// cd java-client && ./gradlew publishToMavenLocal -x signMavenJavaPublication

// build.gradle
repositories {
    mavenLocal()
}

dependencies {
    implementation("io.qdrant:client:1.20.0")
}
```
