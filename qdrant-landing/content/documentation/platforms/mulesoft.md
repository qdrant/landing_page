---
title: Salesforce Mulesoft
---

# Salesforce Mulesoft

[MuleSoft Anypoint](https://www.salesforce.com/in/mulesoft/anypoint-platform/) is an integration platform to connect applications, data, and devices across on-premises and cloud environments. It provides a unified platform to build, manage, and secure APIs and integrations, making digital transformation smoother and more scalable.

[MAC Project](https://mac-project.ai) is an open-source initiative to bring AI capabilities into the MuleSoft ecosystem. It provides connectors to add AI capabilities to an Anypoint project by integrating LLMs, vector databases including Qdrant.

## Setup

To use Qdrant with Anypoint, you can install the [Mulesoft Vectors connector](https://mac-project.ai/docs/ms-vectors). Paste the following Maven Dependency into your Mule application pom file.

```xml
<dependency>
    <groupId>io.github.mulesoft-ai-chain-project</groupId>
    <artifactId>mule4-vectors-connector</artifactId>
    <version>0.3.0</version>
    <classifier>mule-plugin</classifier>
</dependency>
```

The project will now rebuild with the connector. You also need to install the optional dependencies for the Qdrant connector.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="..." >
 
...
 
<build>
 <plugins>
  ...
  <plugin>
   <groupId>org.mule.tools.maven</groupId>
   <artifactId>mule-maven-plugin</artifactId>
   <version>4.3.0</version>
   <extensions>true</extensions>
   <configuration>
    <additionalPluginDependencies>
     <plugin>
      <groupId>io.github.mulesoft-ai-chain-project</groupId>
      <artifactId>mule4-vectors-connector</artifactId>
      <additionalDependencies>
       <!-- QDRANT CONNECTOR DEPENDENCY -->
       <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-qdrant</artifactId>
        <version>0.35.0</version>
       </dependency>
       <!-- QDRANT CONNECTOR DEPENDENCY -->
      </additionalDependencies>
     </plugin>
    </additionalPluginDependencies>
   </configuration>
  </plugin>
 </plugins>
</build>
...
</project>
```

## Usage

The MuleSoft Vectors connector is shipped with 3 different categories of operations: Document, Embedding and Store. For each category a dedicated configuration must be defined.

The store configuration allows to pick-up the right vector store option among the available ones. When configuring the connection to a specific vector store it's also possible to test it.

Go to the `Global Elements` in your MuleSoft project, and create a new configuration. In the `Connector Configuration`, you will find the `MuleSoft Vectors Connector Store` config.

Upon selecting `Qdrant`, you'll be presented with the following parameters to set up the connection to a Qdrant instance.

![Qdrant Connection](/documentation/platforms/mulesoft/qdrant-connection.png)

Once a connection is set up, you can now use the following Qdrant operations in your workflows.

### Store Add

The Add operation adds a document or text to a collection.

![Qdrant Add](/documentation/platforms/mulesoft/qdrant-add.png)

### Store List

The List sources operation lists all entries in a collection.

![Qdrant List](/documentation/platforms/mulesoft/qdrant-list.png)

### Store Query

The Query operation retrieves information from a collection based on a query a embedding and an optional filter.

![Qdrant Query](/documentation/platforms/mulesoft/qdrant-query.png)

### Store Remove

The Remove operation remove all entries from a collection based on a filter.

![Qdrant Add](/documentation/platforms/mulesoft/qdrant-remove.png)

## Further reading

- [Mulesoft Anypoint Studio](https://docs.mulesoft.com/studio/latest/)
- [MAC Project](https://mac-project.ai)
