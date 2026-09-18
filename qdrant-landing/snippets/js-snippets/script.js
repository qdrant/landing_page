import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({ url: 'http://127.0.0.1:6333' });

client.updateCollection("{collection_name}", {
    quantization_config: 'Disabled'
})
