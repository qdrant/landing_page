# Reproduce the video and audio chunking example

This example processes NASA's 61.5-second Apollo 11 recording. It creates six
12-second video windows (the last is shorter), extracts midpoint frames, and
transcribes the audio with Whisper base.en. Text chunks end at ASR sentence
punctuation, ASR word-timestamp gaps of at least 0.8 seconds, or a 12-second duration cap.

The committed results come from an actual local run on November 18, 2026. The
viewer reads those outputs; it does not run a model in the browser. The video
windows are source-time references, not separately encoded clip files.

## Run

Requires Apple Silicon macOS, FFmpeg, and uv. From the repository root:

```sh
./qdrant-landing/content/documentation/headless/chunking/media-demo/run.py \
  --output qdrant-landing/static/guides_data/chunking/media-demo
```

The executable uv script selects Python 3.12. Its adjacent lockfile pins the
dependencies, and the model revision is pinned in the script. The script
downloads the public source recording, checks its SHA-256, and writes media,
frames, raw ASR output, and computed chunk metadata. Use `--source /path/to/apollo11.ogv`
to reuse a local copy of the exact source file.

The command overwrites generated files in the specified output directory.
The HTML, CSS, and JavaScript viewer files remain unchanged.

## Inspect and capture

The guide embeds the recording directly through the `inline-media` island.
Select one of six thumbnails to inspect its sampled video frame, then use
Play clip to replay that interval. The audio player exposes eight transcript
chunks, their timestamps, and the measured waveform. Select a numbered audio
chunk to play it; select it again to pause. Both players use the same committed
outputs and remain on the guide page. If JavaScript is disabled or the
interactive component fails, the guide provides native video controls and a
direct link to the audio recording.

The standalone viewer also supports capture and raw-output inspection:

```sh
npx --yes http-server@14.1.1 \
  qdrant-landing/static/guides_data/chunking/media-demo -a 127.0.0.1 -p 8739 -c-1
```

This server supports HTTP Range requests, which browser media seeking needs.
Open `http://127.0.0.1:8739/`. Select Video or Audio, then select a chunk to
play its source interval. The Capture view link opens the selected result
without playback controls. Direct capture URLs:

- `/?view=video&capture=1&chunk=v04`
- `/?view=audio&capture=1&chunk=a04`
- `/?view=audio&capture=1&chunk=a02,a03` to inspect the incomplete phrase split.

Capture views are optional exports. The guide renders interactive media rather
than embedding screenshots of this viewer.

## What the output means

- `results.json` includes source/model provenance, parameters, boundaries,
  frame timestamps, transcript chunks, and 600 waveform bins. Each bin is RMS
  over actual 16 kHz mono audio samples, normalized by the maximum RMS.
- `transcript.raw.json` preserves the unedited ASR output and word timestamps.
- `source.mp4` and `audio.m4a` are browser-playable derivatives. Frames come
  from the original OGV. Times are relative to the beginning of that recording.
- The MP4 uses two-pass H.264 at 90 kbps and mono AAC at 32 kbps / 16 kHz,
  with fast-start playback. It retains the source's 320 × 240 resolution and
  24 fps; the encoder checks the site's 1 MiB limit. The original OGV remains
  the input for transcription and frame extraction.
- The detector uses gaps between ASR word timestamps. It does not measure
  silence with VAD, identify speakers, detect semantic video scenes, generate
  embeddings, or evaluate retrieval.
- The recording contains radio noise. Whisper mistakes "fine-grained" for
  "fine green" in chunk a04. The gap rule between a02 and a03 splits an unfinished
  phrase. These errors are intentionally visible; the baseline is not a
  claim of optimal segmentation or transcript accuracy.

## Sources

- [NASA recording and public-domain designation](https://commons.wikimedia.org/wiki/File:Apollo_11_Landing_-_first_steps_on_the_moon.ogv)
- [NASA media usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/)
- [MLX Whisper API](https://github.com/ml-explore/mlx-examples/tree/main/whisper)

Footage and source audio: NASA, 1969, via Wikimedia Commons. NASA does not
endorse this example. Model output and processing are separate from the source.
