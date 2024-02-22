---
title: Testcontainers
weight: 100
---

# Testcontainers

[Testcontainers](https://testcontainers.com/) is a library that helps you to run your tests against real dependencies.

## Setup

Import the dependency:

### Java (Maven)

```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>qdrant</artifactId>
    <version>1.19.6</version>
    <scope>test</scope>
</dependency>
```

### Java (Gradle)

```
testImplementation 'org.testcontainers:qdrant:1.19.6'
```

### Go

```
go get github.com/testcontainers/testcontainers-go/modules/qdrant
```

## Usage

See [Qdrant Module](https://testcontainers.com/modules/qdrant/)

## Further reading

* https://www.testcontainers.com (Java, .NET, Go, Python, Ruby, Node.js)
* https://www.testcontainers.org (Java)
* https://www.testcontainers.org/modules/qdrant (Java)
* https://golang.testcontainers.org (Go)
* https://golang.testcontainers.org/modules/qdrant (Go)
