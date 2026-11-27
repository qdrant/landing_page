package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Snippet {
    public static void run() throws Exception {
        // @hide-start
        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                    .withApiKey("<your-api-key>")
                    .build());
        // @hide-end

        // name, description, latitude, longitude
        String[][] venues = {
            {"Kaffeehaus Linden", "Quiet café with long tables and free Wi-Fi", "52.5236", "13.3989"},
            {"Roastery 12", "Specialty roastery with a calm back room", "52.5189", "13.4102"},
            {"Spree Books & Coffee", "Bookstore café with armchairs and tea", "52.5254", "13.4113"},
            {"Atelier Coworking", "Coworking space with silent rooms", "52.5298", "13.3984"},
            {"Ramen Ichi", "Small ramen bar with counter seating", "52.5222", "13.392"},
            {"Club Nachtschicht", "Loud techno club open until sunrise", "52.516", "13.4185"},
            {"Skyline Bar", "Rooftop bar with cocktails and live DJs", "52.5232", "13.416"},
            {"Kreuzberg Corner Café", "Cozy café with strong espresso and cake", "52.4985", "13.403"},
            {"Café Tempelhof", "Spacious café, quiet in the mornings", "52.473", "13.4034"},
            {"Charlottenburg Tea House", "Calm tea house with a garden terrace", "52.516", "13.304"},
        };

        List<PointStruct> points = new ArrayList<>();
        for (int i = 0; i < venues.length; i++) {
            points.add(
                PointStruct.newBuilder()
                    .setId(id(i))
                    .setVectors(vectors(
                        Document.newBuilder()
                            .setText(venues[i][1])
                            .setModel("sentence-transformers/all-minilm-l6-v2")
                            .build()))
                    .putAllPayload(Map.of(
                        "name", value(venues[i][0]),
                        "description", value(venues[i][1]),
                        "location", value(Map.of(
                            "lat", value(Double.parseDouble(venues[i][2])),
                            "lon", value(Double.parseDouble(venues[i][3]))))))
                    .build());
        }

        client.upsertAsync("venues", points).get();
    }
}
