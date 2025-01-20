---
title: Running with GPU
weight: 10
---

# Running with GPU

Starting from version v1.13.0, Qdrant offers support for GPU acceleration. 

However, GPU support is not included in the default Qdrant binary due to additional dependencies and libraries. Instead, you will need to use dedicated Docker images with GPU support.


## Configuration

Qdrant includes a number of configuration options to control GPU usage. The following options are available:

```yaml
gpu:
    # Enable GPU indexing.
    indexing: false
    # Force half precision for `f32` values while indexing.
    # `f16` conversion will take place 
    # only inside GPU memory and won't affect storage type.
    force_half_precision: false
    # Used vulkan "groups" of GPU. 
    # In other words, how many parallel points can be indexed by GPU.
    # Optimal value might depend on the GPU model.
    # Proportional, but doesn't necessary equal
    # to the physical number of warps.
    # Do not change this value unless you know what you are doing.
    # Default: 512
    groups_count: 512
    # Filter for GPU devices by hardware name. Case insensitive.
    # Comma-separated list of substrings to match 
    # against the gpu device name.
    # Example: "nvidia"
    # Default: "" - all devices are accepted.
    device_filter: ""
    # List of explicit GPU devices to use.
    # If host has multiple GPUs, this option allows to select specific devices
    # by their index in the list of found devices.
    # If `device_filter` is set, indexes are applied after filtering.
    # By default, all devices are accepted.
    devices: null
    # How many parallel indexing processes are allowed to run.
    # Default: 1
    parallel_indexes: 1
    # Allow to use integrated GPUs.
    # Default: false
    allow_integrated: false
    # Allow to use emulated GPUs like LLVMpipe. Useful for CI.
    # Default: false
    allow_emulated: false
```

It is not recommended to change these options unless you are familiar with the Qdrant internals and the Vulkan API.


## Standalone GPU Support

For standalone usage, you can build Qdrant with GPU support by running the following command:

```bash
cargo build --release --features gpu
```

Ensure your device supports Vulkan API v1.3. This enables compatibility with Apple Silicon, Intel GPUs, and CPU emulators.

## NVIDIA GPUs

### Prerequisites

To use Docker with NVIDIA GPU support, ensure the following are installed on your host:
- Latest NVIDIA drivers
- [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)

Most AI or CUDA images on Amazon/GCP come pre-configured with the NVIDIA container toolkit.

### Docker images with NVidia GPU support

Docker images with NVIDIA GPU support use the tag suffix `gpu-nvidia`, e.g., `qdrant/qdrant:v1.13.0-gpu-nvidia`. These images include all necessary dependencies.

To enable GPU support, use the `--gpus=all` flag with Docker settings. Example:

```bash
# `--gpus=all` flag says to Docker that we want to use GPUs.
# `-e QDRANT__GPU__indexing=1` flag says to QDrant that we want to use GPUs for indexing.
docker run \
	--rm \
	--gpus=all \
	-p 6333:6333 \
	-p 6334:6334 \
	-e QDRANT__GPU__indexing=1 \
	qdrant/qdrant:gpu-nvidia-latest
```

To ensure that the GPU was initialized correctly, you may check it in logs. First Qdrant prints all found GPU devices without filtering and then prints list of all created devices:

```
2025-01-13T11:58:29.124087Z  INFO gpu::instance: Foung GPU device: NVIDIA GeForce RTX 3090    
2025-01-13T11:58:29.124118Z  INFO gpu::instance: Foung GPU device: llvmpipe (LLVM 15.0.7, 256 bits)    
2025-01-13T11:58:29.124138Z  INFO gpu::device: Create GPU device NVIDIA GeForce RTX 3090    
```

In this example logs you may see that 2 devices were found: RTX 3090 and llvmpipe (a CPU-emulated GPU which is included into docker image). And later you may see that only RTX was initialized.

This concludes the setup. Now, you can start using this Qdrant instance.

### Troubleshooting NVIDIA GPUs

If your GPU is not detected in Docker, make sure your driver and `nvidia-container-toolkit` are up-to-date. 

Verify Vulkan API visibility in the Docker container using:


```
docker run --rm --gpus=all qdrant/qdrant:gpu-nvidia-latest vulkaninfo --summary
```

You may find an error message with an explanation of why the NVidia device is not visible.
If your NVidia GPU is not visible in Docker, Docker image cannot use libGLX_nvidia.so.0 on your host. Example of an error message:

```
ERROR: [Loader Message] Code 0 : loader_scanned_icd_add: Could not get `vkCreateInstance` via `vk_icdGetInstanceProcAddr` for ICD libGLX_nvidia.so.0
WARNING: [Loader Message] Code 0 : terminator_CreateInstance: Failed to CreateInstance in ICD 0. Skipping ICD.
```

To fix it, try to change the config:

```
sudo nano /etc/nvidia-container-runtime/config.toml
```

Set `no-cgroups=false`, save the configuration, and restart Docker:

```
sudo systemctl restart docker
```

## AMD GPUs

AMD docker images have the same tag as qdant but with `gpu-amd` suffix, for example `qdrant/qdrant:v1.13.0-gpu-amd`.
This docker image contains all required dependencies to run Qdrant with GPU support.

To enable GPU for docker, you need an additional `--device /dev/kfd --device /dev/dri` flags. To enable GPU for Qdrant you need to set enable flag. Example of starting Qdrant with AMD GPU support:

```bash
# `--device /dev/kfd --device /dev/dri` flags say to Docker that we want to use GPUs.
# `-e QDRANT__GPU__indexing=1` flag says to QDrant that we want to use GPUs for indexing.
docker run \
	--rm \
	--device /dev/kfd --device /dev/dri \
	-e QDRANT__log_level=debug \
	-p 6333:6333 \
	-p 6334:6334 \
	-e QDRANT__GPU__indexing=1 \
	qdrant/qdrant:gpu-amd-latest
```

Check logs to confirm GPU initialization. Example log output:

```text
2025-01-10T11:56:55.926466Z  INFO gpu::instance: Foung GPU device: AMD Radeon Graphics (RADV GFX1103_R1)
2025-01-10T11:56:55.926485Z  INFO gpu::instance: Foung GPU device: llvmpipe (LLVM 17.0.6, 256 bits) 
2025-01-10T11:56:55.926504Z  INFO gpu::device: Create GPU device AMD Radeon Graphics (RADV GFX1103_R1)
```

This concludes the setup. In a basic scenario, you won't need to configure anything else.


## Known limitations

* **Platform Support:** Only Linux x86_64 is supported. Windows, macOS, ARM, and other platforms are not supported.

* **Memory Limits:** Each GPU can process up to 16GB of vector data per indexing iteration. 

Due to this limitation, you should not create segments where either original vectors OR quantized vectors are larger than 16GB.

For example, the collection with 1536d vectors and scalar quatization can have at most

```text
16Gb / 1536 ~= 11 million vectors per segment
```

And without quantization

```text
16Gb / 1536 * 4 ~= 2.7 million vectors per segment
```

Maximal size of the segment can be configured in collection settings.

```http
PATCH collections/{collection_name}
{
  "optimizers_config": {
    "max_segment_size": 1000000
  }
}
```

Note, that `max_segment_size` is specified in KiloBytes.

