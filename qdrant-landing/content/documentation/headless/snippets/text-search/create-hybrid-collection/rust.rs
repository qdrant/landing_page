use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, Modifier, SparseVectorParamsBuilder, SparseVectorsConfigBuilder, VectorParamsBuilder, VectorsConfigBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> { // @hide
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let mut vectors = VectorsConfigBuilder::default();
    vectors.add_named_vector_params("description-dense", VectorParamsBuilder::new(384, Distance::Cosine));

    let mut sparse = SparseVectorsConfigBuilder::default();
    sparse.add_named_vector_params("isbn-bm25", SparseVectorParamsBuilder::default().modifier(Modifier::Idf));

    client
        .create_collection(
            CreateCollectionBuilder::new("books")
                .vectors_config(vectors)
                .sparse_vectors_config(sparse),
        )
        .await?;

    Ok(())
} // @hide
