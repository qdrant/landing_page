package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class Snippet {
        // @hide-start
        private static List<Map<String, String>> loadDataset(String name, String split) {
                return new ArrayList<>();
        }
        // @hide-end

        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                String denseModel = "sentence-transformers/all-minilm-l6-v2";
                String bm25Model = "qdrant/bm25";
                // NOTE: loadDataset is a user-defined function.
                // Implement it to handle dataset loading as needed.
                List<Map<String, String>> dataset = loadDataset("miriad/miriad-4.4M", "train[0:100]");
                List<PointStruct> points = new ArrayList<>();

                for (Map<String, String> item : dataset) {
                  String passage = item.get("passage_text");
                  PointStruct point =
                      PointStruct.newBuilder()
                          .setId(id(UUID.randomUUID()))
                          .setVectors(
                              namedVectors(
                                  Map.of(
                                      "dense_vector",
                                      vector(
                                          Document.newBuilder().setText(passage).setModel(denseModel).build()),
                                      "bm25_sparse_vector",
                                      vector(
                                          Document.newBuilder().setText(passage).setModel(bm25Model).build()))))
                          .build();
                  points.add(point);
                }

                client.upsertAsync("{collection_name}", points).get();
        }
}
