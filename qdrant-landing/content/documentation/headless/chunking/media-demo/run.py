#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["mlx-whisper==0.4.3", "numpy==2.2.6", "httpx==0.28.1", "huggingface-hub==0.34.4"]
# ///

import argparse
import asyncio
import hashlib
import importlib.metadata
import json
import re
import subprocess
import tempfile
import wave
from datetime import UTC, datetime
from pathlib import Path
from typing import TypedDict, cast

import httpx
import mlx_whisper
import numpy as np
from huggingface_hub import snapshot_download

SOURCE_URL = "https://upload.wikimedia.org/wikipedia/commons/a/a6/Apollo_11_Landing_-_first_steps_on_the_moon.ogv"
SOURCE_PAGE = "https://commons.wikimedia.org/wiki/File:Apollo_11_Landing_-_first_steps_on_the_moon.ogv"
SOURCE_SHA256 = "92712e9fddf6c30a6df8828ab1c30ee91d90a7503feb0198f8c9ab15320682cd"
MODEL = "mlx-community/whisper-base.en-mlx"
REVISION = "aa0678c3466ed62c5c6114ec600a0e1f96820089"
WINDOW = 12.0
PAUSE = 0.8


class Word(TypedDict):
    start: float
    end: float
    word: str
    probability: float


class Segment(TypedDict):
    words: list[Word]


class Transcript(TypedDict):
    text: str
    segments: list[Segment]
    language: str


class AudioChunk(TypedDict):
    id: str
    start_sec: float
    end_sec: float
    text: str
    word_count: int


class VideoChunk(TypedDict):
    id: str
    start_sec: float
    end_sec: float
    frame_time_sec: float
    frame_path: str


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", *args], check=True)


def encode_video(source: Path, destination: Path, scratch: Path) -> None:
    options = [
        "-i",
        str(source),
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-b:v",
        "90k",
        "-pix_fmt",
        "yuv420p",
        "-passlogfile",
        str(scratch / "video-encode"),
    ]
    ffmpeg(*options, "-pass", "1", "-an", "-f", "null", "/dev/null")
    ffmpeg(
        *options,
        "-pass",
        "2",
        "-c:a",
        "aac",
        "-b:a",
        "32k",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-movflags",
        "+faststart",
        str(destination),
    )
    if destination.stat().st_size > 1024 * 1024:
        raise ValueError("Video exceeds the site's 1 MiB media limit.")


async def download(destination: Path) -> None:
    async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
        response = await client.get(SOURCE_URL)
        response.raise_for_status()
        destination.write_bytes(response.content)


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def duration(source: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(source),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(json.loads(result.stdout)["format"]["duration"])


def video_chunks(source: Path, output: Path, seconds: float) -> list[VideoChunk]:
    frames = output / "frames"
    frames.mkdir(exist_ok=True)
    chunks: list[VideoChunk] = []
    start = 0.0
    while start < seconds:
        end = min(start + WINDOW, seconds)
        midpoint = (start + end) / 2
        name = f"frames/video-{len(chunks) + 1:02d}.jpg"
        ffmpeg(
            "-ss",
            str(midpoint),
            "-i",
            str(source),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(output / name),
        )
        chunks.append(
            {
                "id": f"v{len(chunks) + 1:02d}",
                "start_sec": round(start, 3),
                "end_sec": round(end, 3),
                "frame_time_sec": round(midpoint, 3),
                "frame_path": name,
            }
        )
        start = end
    return chunks


def audio_chunks(words: list[Word]) -> list[AudioChunk]:
    chunks: list[AudioChunk] = []
    pending: list[Word] = []

    def flush() -> None:
        if pending:
            chunks.append(
                {
                    "id": f"a{len(chunks) + 1:02d}",
                    "start_sec": round(pending[0]["start"], 3),
                    "end_sec": round(pending[-1]["end"], 3),
                    "text": "".join(word["word"] for word in pending).strip(),
                    "word_count": len(pending),
                }
            )
            pending.clear()

    for word in words:
        if pending and (
            word["end"] - pending[0]["start"] > WINDOW
            or word["start"] - pending[-1]["end"] >= PAUSE
        ):
            flush()
        pending.append(word)
        if re.search(r"[.!?][\"']?$", word["word"].strip()):
            flush()
    flush()
    return chunks


def waveform(path: Path) -> list[float]:
    with wave.open(str(path)) as recording:
        samples = np.frombuffer(
            recording.readframes(recording.getnframes()), dtype="<i2"
        ).astype(np.float64)
    rms = np.array([np.sqrt(np.mean(part**2)) for part in np.array_split(samples, 600)])
    normalized = rms / rms.max() if rms.max() else rms
    return [round(float(value), 4) for value in normalized]


def run(source: Path | None, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="chunking-media-") as scratch:
        temporary = Path(scratch)
        if source is None:
            source = temporary / "apollo11.ogv"
            asyncio.run(download(source))
        checksum = hashlib.sha256(source.read_bytes()).hexdigest()
        if checksum != SOURCE_SHA256:
            raise ValueError("Source differs from the documented NASA recording.")
        seconds = duration(source)
        wav = temporary / "audio.wav"
        ffmpeg(
            "-i",
            str(source),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "pcm_s16le",
            str(wav),
        )
        encode_video(source, output / "source.mp4", temporary)
        ffmpeg("-i", str(wav), "-c:a", "aac", "-b:a", "64k", str(output / "audio.m4a"))
        clips = video_chunks(source, output, seconds)
        model_path = snapshot_download(MODEL, revision=REVISION)
        print("Transcribing the source recording with Whisper base.en...", flush=True)
        raw = mlx_whisper.transcribe(
            str(wav),
            path_or_hf_repo=model_path,
            language="en",
            word_timestamps=True,
            temperature=0.0,
            condition_on_previous_text=False,
        )
        write_json(output / "transcript.raw.json", raw)
        transcript = cast(Transcript, raw)
        words = [
            word for segment in transcript["segments"] for word in segment["words"]
        ]
        chunks = audio_chunks(words)
        for chunk in chunks:
            if not (0 <= chunk["start_sec"] <= chunk["end_sec"] <= seconds + 0.05):
                raise ValueError(f"Invalid source offsets: {chunk}")
            if chunk["end_sec"] - chunk["start_sec"] > WINDOW + 0.001:
                raise ValueError(f"Chunk exceeds the duration cap: {chunk}")
        ffmpeg_version = subprocess.run(
            ["ffmpeg", "-version"], capture_output=True, text=True, check=True
        ).stdout.splitlines()[0]
        results = {
            "source": {
                "title": "Apollo 11: first steps on the Moon",
                "url": SOURCE_PAGE,
                "download_url": SOURCE_URL,
                "credit": "NASA, 1969 · via Wikimedia Commons",
                "license": "Public domain (NASA)",
                "duration_sec": seconds,
                "sha256": checksum,
            },
            "run": {
                "date": datetime.now(UTC).isoformat(),
                "model": MODEL,
                "model_revision": REVISION,
                "video_window_seconds": WINDOW,
                "audio_max_seconds": WINDOW,
                "pause_seconds": PAUSE,
                "sample_rate_hz": 16000,
                "temperature": 0.0,
                "word_timestamps": True,
                "condition_on_previous_text": False,
                "ffmpeg": ffmpeg_version,
                "packages": {
                    name: importlib.metadata.version(name)
                    for name in ["mlx-whisper", "mlx", "numpy", "huggingface-hub"]
                },
            },
            "video": {
                "method": "Fixed-duration baseline; one midpoint frame per chunk",
                "chunks": clips,
            },
            "audio": {
                "method": "ASR punctuation, word-timestamp gaps, and a duration cap; no diarization",
                "chunks": chunks,
                "waveform": waveform(wav),
                "waveform_method": "600 RMS bins, normalized by the maximum RMS",
            },
        }
        write_json(output / "results.json", results)
        print(
            json.dumps(
                {
                    "duration_sec": seconds,
                    "video_chunks": len(clips),
                    "audio_chunks": len(chunks),
                    "transcript": transcript["text"],
                },
                indent=2,
            )
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Reproduce the NASA video/audio chunking example on Apple Silicon. Requires ffmpeg and uv."
    )
    parser.add_argument(
        "--source", type=Path, help="Optional local copy of the exact NASA OGV source."
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Directory for computed JSON, media, and frames.",
    )
    arguments = parser.parse_args()
    run(arguments.source, arguments.output)


if __name__ == "__main__":
    main()
