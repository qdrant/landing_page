```typescript
function imageToBase64Url(imagePath: string): string {
    const prefix = "data:image/png;base64";
    const imageBuffer = readFileSync(imagePath);
    return `${prefix},${imageBuffer.toString("base64")}`;
}

const documents = [
    { caption: "An image about plane emergency safety.", image: "images/image-1.png" },
    { caption: "An image about airplane components.", image: "images/image-2.png" },
    { caption: "An image about COVID safety restrictions.", image: "images/image-3.png" },
    { caption: "A confidential image about UFO sightings.", image: "images/image-4.png" },
    { caption: "An image about unusual footprints on Aralar 2011.", image: "images/image-5.png" },
];
```
