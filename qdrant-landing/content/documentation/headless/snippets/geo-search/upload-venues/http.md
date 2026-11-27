```http
PUT /collections/venues/points?wait=true
{
  "points": [
    {
      "id": 0,
      "vector": {
        "text": "Quiet café with long tables and free Wi-Fi",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Kaffeehaus Linden",
        "description": "Quiet café with long tables and free Wi-Fi",
        "location": { "lat": 52.5236, "lon": 13.3989 }
      }
    },
    {
      "id": 1,
      "vector": {
        "text": "Specialty roastery with a calm back room",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Roastery 12",
        "description": "Specialty roastery with a calm back room",
        "location": { "lat": 52.5189, "lon": 13.4102 }
      }
    },
    {
      "id": 2,
      "vector": {
        "text": "Bookstore café with armchairs and tea",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Spree Books & Coffee",
        "description": "Bookstore café with armchairs and tea",
        "location": { "lat": 52.5254, "lon": 13.4113 }
      }
    },
    {
      "id": 3,
      "vector": {
        "text": "Coworking space with silent rooms",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Atelier Coworking",
        "description": "Coworking space with silent rooms",
        "location": { "lat": 52.5298, "lon": 13.3984 }
      }
    },
    {
      "id": 4,
      "vector": {
        "text": "Small ramen bar with counter seating",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Ramen Ichi",
        "description": "Small ramen bar with counter seating",
        "location": { "lat": 52.5222, "lon": 13.392 }
      }
    },
    {
      "id": 5,
      "vector": {
        "text": "Loud techno club open until sunrise",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Club Nachtschicht",
        "description": "Loud techno club open until sunrise",
        "location": { "lat": 52.516, "lon": 13.4185 }
      }
    },
    {
      "id": 6,
      "vector": {
        "text": "Rooftop bar with cocktails and live DJs",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Skyline Bar",
        "description": "Rooftop bar with cocktails and live DJs",
        "location": { "lat": 52.5232, "lon": 13.416 }
      }
    },
    {
      "id": 7,
      "vector": {
        "text": "Cozy café with strong espresso and cake",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Kreuzberg Corner Café",
        "description": "Cozy café with strong espresso and cake",
        "location": { "lat": 52.4985, "lon": 13.403 }
      }
    },
    {
      "id": 8,
      "vector": {
        "text": "Spacious café, quiet in the mornings",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Café Tempelhof",
        "description": "Spacious café, quiet in the mornings",
        "location": { "lat": 52.473, "lon": 13.4034 }
      }
    },
    {
      "id": 9,
      "vector": {
        "text": "Calm tea house with a garden terrace",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "payload": {
        "name": "Charlottenburg Tea House",
        "description": "Calm tea house with a garden terrace",
        "location": { "lat": 52.516, "lon": 13.304 }
      }
    }
  ]
}
```
