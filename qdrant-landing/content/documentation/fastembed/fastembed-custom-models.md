---
title: Working with Custom Models
weight: 6
---

# Using Custom Models with FastEmbed: A Comprehensive Guide
*By Rohith Jeevanantham | Mentored by David Myriel*

FastEmbed is a powerful vectorization package that supports various embedding models out of the box. However, there might be cases where you want to use your own custom models or integrate models that aren't currently supported. In this tutorial, we'll walk through the process of integrating two different custom models with FastEmbed: EfficientNet and BLIP.

## Why Use Qdrant with FastEmbed?

Qdrant seamlessly integrates with vectorization solutions like FastEmbed, offering a high-performance, distributed vector search engine. Combining Qdrant's scalable infrastructure with custom models enhances:
- Personalized search experiences
- Real-time recommendations
- Advanced semantic understanding for niche domains


## Why Custom Models?

While FastEmbed provides excellent support for common embedding models, you might want to use custom models for several reasons:
- Specialized domain requirements
- Better performance for specific use cases
- Integration with existing workflows
- Access to newer model architectures

## Prerequisites

Before we begin, make sure you have the following installed:
```bash
pip install fastembed torch torchvision onnx onnxruntime transformers pillow
```

## Part 1: Integrating EfficientNet with FastEmbed

We'll start by integrating EfficientNet-B0, a powerful and efficient image classification model, as a custom embedding model.

### Step 1: Convert the Model to ONNX

First, we need to convert the PyTorch model to ONNX format for better inference performance:

```python
import torch
import onnx
import onnxruntime
import torchvision.models as models
import json
import os

def convert_efficientnet_to_onnx(output_dir='./efficientnet_custom'):
    # Load pre-trained EfficientNet
    model = models.efficientnet_b0(pretrained=True)
    model.eval()
    
    # Prepare output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Prepare dummy input
    dummy_input = torch.randn(1, 3, 224, 224)
    
    # ONNX model path
    onnx_path = os.path.join(output_dir, 'model.onnx')
    
    # Remove the classification head to get embedding
    embedding_model = torch.nn.Sequential(*(list(model.children())[:-1]))
    
    # Export to ONNX
    torch.onnx.export(
        embedding_model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    return output_dir
```

### Step 2: Create a Custom Embedding Class

Next, we'll create a custom class that inherits from `ImageEmbeddingBase`:

```python
from fastembed.image.image_embedding_base import ImageEmbeddingBase
from fastembed.image.image_embedding import ImageEmbedding
from typing import List, Dict, Any, Optional, Sequence
import numpy as np
from PIL import Image
import torchvision.transforms as transforms

class CustomEfficientNetONNXEmbedding(ImageEmbeddingBase):
    def __init__(
        self, 
        model_name: str, 
        cache_dir: str = None,
        model_path: str = None,
        threads: Optional[int] = None,
        providers: Optional[Sequence[str]] = None,
        cuda: bool = False,
        device_ids: Optional[List[int]] = None,
        lazy_load: bool = False,
        **kwargs
    ):
        super().__init__(model_name, cache_dir)
        
        # Prepare model and config paths
        if cache_dir is None:
            cache_dir = './efficientnet_custom'
        
        # If model path not provided, assume it's in cache_dir
        if model_path is None:
            model_path = os.path.join(cache_dir, 'model.onnx')
        
        # Create cache directory if it doesn't exist
        os.makedirs(cache_dir, exist_ok=True)
        
        # Load ONNX model
        providers = providers or ['CPUExecutionProvider']
        self.session = onnxruntime.InferenceSession(model_path, providers=providers)
        
        # Preprocessing transforms
        self.transform = transforms.Compose([
            transforms.Resize(224),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406], 
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        # Save configuration files
        self._save_config_files(cache_dir)

    def _save_config_files(self, cache_dir):
        """Save configuration and preprocessor configuration files."""
        config = {
            "model": "efficientnet-b0-custom",
            "dim": 1280,
            "description": "Custom EfficientNet-B0 Image Embedding",
            "license": "apache-2.0",
            "size_in_GB": 0.4,
            "sources": {"hf": "rjeeva/efficientnet-custom"},
            "model_file": "model.onnx"
        }
        
        preprocessor_config = {
            "image_size": 224,
            "center_crop": True,
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        }
        
        # Save config files
        with open(os.path.join(cache_dir, 'config.json'), 'w') as f:
            json.dump(config, f, indent=2)
        
        with open(os.path.join(cache_dir, 'preprocessor_config.json'), 'w') as f:
            json.dump(preprocessor_config, f, indent=2)

    def embed(
        self, 
        images: List[str], 
        batch_size: int = 16, 
        parallel: int = None,
        **kwargs
    ) -> List[np.ndarray]:
        """Embed images using ONNX runtime."""
        embeddings = []
        
        for i in range(0, len(images), batch_size):
            batch = images[i:i+batch_size]
            
            # Preprocess batch
            processed_images = [self._preprocess_image(img) for img in batch]
            
            # Stack images
            input_tensor = np.concatenate(processed_images, axis=0)
            
            # Run inference
            ort_inputs = {self.session.get_inputs()[0].name: input_tensor}
            batch_embeddings = self.session.run(None, ort_inputs)[0]
            
            # Extend embeddings list
            embeddings.extend(batch_embeddings)
        
        return embeddings

    def _preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for ONNX model."""
        image = Image.open(image_path).convert('RGB')
        tensor = self.transform(image)
        return tensor.unsqueeze(0).numpy()

    @classmethod
    def list_supported_models(cls) -> List[Dict[str, Any]]:
        return [
            {
                "model": "efficientnet-b0-custom",
                "dim": 1280,
                "description": "Custom EfficientNet-B0 Image Embedding",
                "license": "apache-2.0",
                "size_in_GB": 0.4,
                "sources": {"hf": "rjeeva/efficientnet-custom"},
                "model_file": "model.onnx"
            }
        ]
```

## Part 2: Integrating BLIP with FastEmbed

Now let's integrate BLIP, a powerful vision-language model, as our second custom model.

### Step 1: Convert BLIP to ONNX

```python
from transformers import BlipProcessor, BlipModel

def convert_blip_to_onnx(output_dir='./blip_custom'):
    """
    Convert BLIP image encoder to ONNX format
    """
    # Load pre-trained BLIP model
    model = BlipModel.from_pretrained("Salesforce/blip-image-captioning-base")
    processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    
    # Prepare output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Prepare dummy input
    dummy_input = torch.randn(1, 3, 224, 224)
    
    # ONNX model path
    onnx_path = os.path.join(output_dir, 'model.onnx')
    
    # Extract vision model (image encoder)
    vision_model = model.vision_model
    vision_model.eval()
    
    # Export to ONNX
    torch.onnx.export(
        vision_model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    return output_dir
```

### Step 2: Create Custom BLIP Embedding Class

The implementation is similar to EfficientNet but with BLIP-specific configurations:

```python
class CustomBlipONNXEmbedding(ImageEmbeddingBase):
    def __init__(
        self, 
        model_name: str, 
        cache_dir: str = None,
        model_path: str = None,
        threads: Optional[int] = None,
        providers: Optional[Sequence[str]] = None,
        cuda: bool = False,
        device_ids: Optional[List[int]] = None,
        lazy_load: bool = False,
        **kwargs
    ):
        super().__init__(model_name, cache_dir)
        
        if cache_dir is None:
            cache_dir = './blip_custom'
        
        if model_path is None:
            model_path = os.path.join(cache_dir, 'model.onnx')
        
        os.makedirs(cache_dir, exist_ok=True)
        
        providers = providers or ['CPUExecutionProvider']
        self.session = onnxruntime.InferenceSession(model_path, providers=providers)
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406], 
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        self._save_config_files(cache_dir)

    def _save_config_files(self, cache_dir):
        config = {
            "model": "blip-image-encoder",
            "dim": 768,
            "description": "BLIP Image Embedding Encoder",
            "license": "apache-2.0",
            "size_in_GB": 0.5,
            "sources": {"hf": "rjeeva/blip-image-embedding"},
            "model_file": "model.onnx"
        }
        
        preprocessor_config = {
            "image_size": 224,
            "center_crop": False,
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        }
        
        with open(os.path.join(cache_dir, 'config.json'), 'w') as f:
            json.dump(config, f, indent=2)
        
        with open(os.path.join(cache_dir, 'preprocessor_config.json'), 'w') as f:
            json.dump(preprocessor_config, f, indent=2)

    def embed(
        self, 
        images: List[str], 
        batch_size: int = 16, 
        parallel: int = None,
        **kwargs
    ) -> List[np.ndarray]:
        embeddings = []
        
        for i in range(0, len(images), batch_size):
            batch = images[i:i+batch_size]
            processed_images = [self._preprocess_image(img) for img in batch]
            input_tensor = np.concatenate(processed_images, axis=0)
            ort_inputs = {self.session.get_inputs()[0].name: input_tensor}
            batch_embeddings = self.session.run(None, ort_inputs)[0]
            embeddings.extend(batch_embeddings)
        
        return embeddings

    def _preprocess_image(self, image_path: str) -> np.ndarray:
        image = Image.open(image_path).convert('RGB')
        tensor = self.transform(image)
        return tensor.unsqueeze(0).numpy()

    @classmethod
    def list_supported_models(cls) -> List[Dict[str, Any]]:
        return [
            {
                "model": "blip-image-encoder",
                "dim": 768,
                "description": "BLIP Image Embedding Encoder",
                "license": "apache-2.0",
                "size_in_GB": 0.5,
                "sources": {"hf": "rjeeva/blip-image-embedding"},
                "model_file": "model.onnx"
            }
        ]
```
## Part 3: Registering and Using Custom Models

### Step 1: Modify ImageEmbedding Initialization

To ensure our custom models work smoothly with FastEmbed, we need to modify the initialization method:

```python
def modify_image_embedding_init():
    def custom_init(self, model_name, cache_dir=None, **kwargs):
        # Remove unsupported kwargs
        kwargs.pop('threads', None)
        kwargs.pop('providers', None)
        kwargs.pop('cuda', None)
        kwargs.pop('device_ids', None)
        kwargs.pop('lazy_load', None)
        
        # Find the correct embedding class
        for EMBEDDING_MODEL_TYPE in self.EMBEDDINGS_REGISTRY:
            supported_models = EMBEDDING_MODEL_TYPE.list_supported_models()
            if any(model_name.lower() == model['model'].lower() for model in supported_models):
                self.model = EMBEDDING_MODEL_TYPE(
                    model_name,
                    cache_dir,
                    **kwargs
                )
                return
        
        raise ValueError(f"Model {model_name} is not supported in ImageEmbedding.")
    
    # Monkey patch the __init__ method
    ImageEmbedding.__init__ = custom_init
```

### Step 2: Register Custom Models

```python
# Register both custom models
ImageEmbedding.EMBEDDINGS_REGISTRY.append(CustomEfficientNetONNXEmbedding)
ImageEmbedding.EMBEDDINGS_REGISTRY.append(CustomBlipONNXEmbedding)

# Apply the initialization modification
modify_image_embedding_init()
```

## Uploading Models to Hugging Face

After converting your models to ONNX format, you should upload them to Hugging Face for easier distribution:

1. Create a new repository on Hugging Face
2. Upload the following files:
   - `model.onnx`
   - `config.json` (containing model configuration)
   - `preprocessor_config.json` (containing preprocessing parameters)
   
```bash
# Example structure of your Hugging Face repo
your-repo/
├── model.onnx
├── config.json
└── preprocessor_config.json
```

## Using the Custom Models

Now you can use your custom models with FastEmbed:

```python

# Call the necessary function to get the onnx version of the model
convert_efficientnet_to_onnx()
convert_blip_to_onnx()

# Register custom models
from fastembed.image.image_embedding import ImageEmbedding

ImageEmbedding.EMBEDDINGS_REGISTRY.extend([
    CustomEfficientNetONNXEmbedding,
    CustomBlipONNXEmbedding
])

# Apply the initialization modification
modify_image_embedding_init()

# Now upload all the model related files to respective huggingface repository

# Use EfficientNet embeddings
efficientnet_embedder = ImageEmbedding(
    model_name="efficientnet-b0-custom",
    cache_dir="./efficientnet_custom"
)

# Use BLIP embeddings
blip_embedder = ImageEmbedding(
    model_name="blip-image-encoder",
    cache_dir="./blip_custom"
)

# Generate embeddings
image_paths = ["image1.jpg", "image2.jpg"]
efficientnet_embeddings = list(efficientnet_embedder.embed(image_paths))
blip_embeddings = list(blip_embedder.embed(image_paths))

# View embeddings

# Print details of efficientnet_embeddings
for i, embedding in enumerate(efficientnet_embeddings):
    print(f"Embedding {i + 1}:")
    print(f"Shape: {embedding.shape}")
    print(f"First 5 values: {embedding[:5]}")
    
# Print details of blip_embeddings
for i, embedding in enumerate(blip_embeddings):
    print(f"Embedding {i + 1}:")
    print(f"Shape: {embedding.shape}")
    print(f"First 5 values: {embedding[:5]}")

```

## Best Practices and Tips

1. **Model Selection**: Choose models that best fit your specific use case. EfficientNet is great for general image features, while BLIP excels at understanding image-text relationships.

2. **Performance Optimization**:
   - Use batch processing when embedding multiple images
   - Consider quantization for smaller model size
   - Implement proper error handling for robustness

3. **Memory Management**: Be mindful of batch sizes, especially when dealing with large images or multiple models.

4. **Version Control**: Maintain proper versioning for your models and configurations on Hugging Face.


## Practical Applications with Qdrant

By leveraging Qdrant alongside FastEmbed, businesses can unlock:
- **Intelligent Search**: Enable users to find relevant content faster.
- **Enhanced Recommendations**: Deliver tailored suggestions in e-commerce, media, and more.
- **Domain-Specific Insights**: Power unique applications in medicine, law, or academia.


## Conclusion

This tutorial demonstrated how to integrate custom models with FastEmbed using two popular image models as examples. The same principles can be applied to integrate other models based on your specific needs. Remember to properly document your models and maintain them on Hugging Face for better collaboration and distribution.

## Get Started Today

Ready to enhance your AI-powered solutions? Explore Qdrant’s capabilities and integrate it with FastEmbed for cutting-edge vector search and semantic analysis. [Learn More](https://qdrant.tech/)


## Additional Resources

- [FastEmbed Documentation](https://qdrant.github.io/fastembed/)
- [ONNX Runtime Documentation](https://onnxruntime.ai/)
- [Hugging Face Model Hub](https://huggingface.co/models)
- [EfficientNet Paper](https://arxiv.org/abs/1905.11946)
- [BLIP Paper](https://arxiv.org/abs/2201.12086)
