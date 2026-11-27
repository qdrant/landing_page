```csharp
git clone --branch feat/serverless https://github.com/qdrant/qdrant-dotnet
cd qdrant-dotnet && ./build.sh pack && cd ..
dotnet add package Qdrant.Client --prerelease --source ./qdrant-dotnet/nuget
```
