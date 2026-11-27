import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "https://xyz-example.qdrant.io:6333", apiKey: "<your-api-key>" }); // @hide

const venues = [
    { name: "Kaffeehaus Linden", description: "Quiet café with long tables and free Wi-Fi", lat: 52.5236, lon: 13.3989 },
    { name: "Roastery 12", description: "Specialty roastery with a calm back room", lat: 52.5189, lon: 13.4102 },
    { name: "Spree Books & Coffee", description: "Bookstore café with armchairs and tea", lat: 52.5254, lon: 13.4113 },
    { name: "Atelier Coworking", description: "Coworking space with silent rooms", lat: 52.5298, lon: 13.3984 },
    { name: "Ramen Ichi", description: "Small ramen bar with counter seating", lat: 52.5222, lon: 13.392 },
    { name: "Club Nachtschicht", description: "Loud techno club open until sunrise", lat: 52.516, lon: 13.4185 },
    { name: "Skyline Bar", description: "Rooftop bar with cocktails and live DJs", lat: 52.5232, lon: 13.416 },
    { name: "Kreuzberg Corner Café", description: "Cozy café with strong espresso and cake", lat: 52.4985, lon: 13.403 },
    { name: "Café Tempelhof", description: "Spacious café, quiet in the mornings", lat: 52.473, lon: 13.4034 },
    { name: "Charlottenburg Tea House", description: "Calm tea house with a garden terrace", lat: 52.516, lon: 13.304 },
];

await client.upsert("venues", {
    wait: true,
    points: venues.map((venue, i) => ({
        id: i,
        vector: { text: venue.description, model: "sentence-transformers/all-minilm-l6-v2" },
        payload: {
            name: venue.name,
            description: venue.description,
            location: { lat: venue.lat, lon: venue.lon },
        },
    })),
});
