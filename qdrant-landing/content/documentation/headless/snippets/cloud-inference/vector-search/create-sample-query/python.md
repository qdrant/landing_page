query_text = "What is relapsing polychondritis?"

dense_doc = Document(
    text=query_text,
    model=dense_model
)

sparse_doc = Document(
    text=query_text,
    model=bm25_model
)