---
name: ffmpeg-video-processing
description: Expert guidelines and CLI recipes for processing marketing videos, clips, reels, shorts, overlays, audio mixing, and aspect ratio conversion using FFmpeg.
---

# FFmpeg Video Processing Skill

Comprehensive reference for server-side and CLI video processing tailored for social media creative workflows (Shorts 9:16, Reels, TikTok, YouTube 16:9, Square 1:1).

## 1. Core Principles for Social Media Video
- **Vertical Video (9:16)**: `1080x1920` (Reels, TikTok, Shorts).
- **Square Video (1:1)**: `1080x1080` (Instagram feed, VK feed, Telegram).
- **Landscape Video (16:9)**: `1920x1080` (YouTube, web hero banners).
- **Codecs**: Video: `libx264` (yuv420p format for universal mobile playback), Audio: `aac` (128k - 192k).
- **FastStart**: Always enable `-movflags +faststart` for progressive web and mobile streaming without downloading the entire file.

## 2. Common FFmpeg Recipes

### Static Image + Audio to Video (Product Slideshow / Banner to Reel)
```bash
ffmpeg -loop 1 -i image.png -i audio.mp3 -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -movflags +faststart output.mp4
```

### Crop / Scale to Target Aspect Ratio with Smart Padding (Blur Background)
Convert any aspect ratio to 9:16 without distortion by blurring the background:
```bash
ffmpeg -i input.mp4 -vf "split[original][copy];[copy]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:20[blur];[original]scale=1080:1920:force_original_aspect_ratio=decrease[scaled];[blur][scaled]overlay=(W-w)/2:(H-h)/2" -c:v libx264 -c:a copy -movflags +faststart output_vertical.mp4
```

### Deterministic Text & Price Watermark Overlay
Burn promotional badges, price tags, and logo overlays on video:
```bash
ffmpeg -i input.mp4 -i badge_overlay.png -filter_complex "[0:v][1:v]overlay=x=W-w-40:y=H-h-40[v]" -map "[v]" -map 0:a? -c:v libx264 -c:a copy -movflags +faststart output_badge.mp4
```

### Generating High-Quality Video Thumbnails / Covers
```bash
ffmpeg -ss 00:00:01 -i input.mp4 -vframes 1 -q:v 2 cover.jpg
```

### Extracting Video Metadata (Probe)
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,codec_name -of json input.mp4
```

## 3. Server-side Execution & Fallbacks
- Execute FFmpeg commands through non-blocking processes with timeout protection.
- Validate input paths, sanitize arguments to prevent command injection.
- When FFmpeg binary is absent on host, provide a graceful fallback (e.g. animated SVG/GIF/HTML5 canvas video generator or static cover packaging).
