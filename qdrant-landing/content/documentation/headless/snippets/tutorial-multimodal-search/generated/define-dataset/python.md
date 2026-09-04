```python
import base64

def image_to_base64_url(image_path: str) -> str:
    prefix = "data:image/png;base64"
    with open(image_path, "rb") as image_file:
        return prefix + "," + base64.b64encode(image_file.read()).decode("utf-8")

documents = [
    {"caption": "An image about plane emergency safety.", "image": "images/image-1.png"},
    {"caption": "An image about airplane components.", "image": "images/image-2.png"},
    {"caption": "An image about COVID safety restrictions.", "image": "images/image-3.png"},
    {"caption": "A confidential image about UFO sightings.", "image": "images/image-4.png"},
    {"caption": "An image about unusual footprints on Aralar 2011.", "image": "images/image-5.png"},
]
```
