---
name: contentpilot-creative-studio
description: Architecture rules, contracts, and best practices for developing and maintaining the ContentPilot AI Creative Studio (multi-provider image & video generation, deterministic text/price overlays, and social post publishing).
---

# ContentPilot AI Creative Studio — Architectural & Implementation Guide

This skill governs the design, implementation, and maintenance of the AI Creative Studio in ContentPilot across Web (React), Mobile (Flutter), and Backend (Spring Boot + PostgreSQL + FFmpeg).

## 1. Core Principles

1. **Server-side Key Security**:
   - Generative APIs (OpenAI DALL-E, Claude, external video models) must NEVER be called directly from React or Flutter.
   - All API tokens reside exclusively in backend environment variables (`OPENAI_API_KEY`, `CLAUDE_API_KEY`).

2. **Model Segregation of Duties**:
   - **Claude**: Analyzes business goals, extracts brand facts (from Brand Memory), crafts persuasive copy, and builds optimized visual prompts.
   - **Image Provider (DALL-E 3 / Builtin Engine)**: Generates pure, high-resolution product and lifestyle backgrounds without any text.
   - **Deterministic Overlay Layer (`CreativeOverlayRenderer`)**: Synthesizes brand logos, confirmed prices, discount badges, and CTA buttons on top of generated visuals using exact vector/raster rendering.

3. **0% Price & Fact Hallucination Rule**:
   - Generative image models frequently distort numbers and Cyrillic glyphs.
   - Never prompt an image model to write numbers, currency symbols, or prices directly on the canvas.
   - Always route pricing through `CreativeOverlayRenderer` with confirmed data from the brand's verified fact database.

4. **Asynchronous Video Pipeline**:
   - Video creation takes 5–45 seconds. Synchronous HTTP responses are prohibited.
   - API must return `200 OK` with task status `PENDING` and a unique `taskId`.
   - Web and mobile clients poll `GET /api/v1/creative/tasks/{id}` with exponential backoff or 2–3s intervals.

## 2. Media Formats & Aspect Ratios

- **1:1 Square (`1080x1080`)**: Standard for VK posts, Telegram channels, and Instagram feeds.
- **9:16 Vertical (`1080x1920`)**: Optimized for Reels, Shorts, and TikTok. Video codec: `libx264`, pixel format: `yuv420p`, flag: `-movflags +faststart`.
- **16:9 Landscape (`1920x1080`)**: Banners, website headers, and YouTube.
- **4:5 Portrait (`1080x1350`)**: Portrait feed posts.

## 3. Database Schema Reference

- **`creative_tasks`**:
  - `id`: BIGSERIAL PRIMARY KEY
  - `brand_id`: BIGINT REFERENCES brands(id)
  - `user_id`: BIGINT REFERENCES users(id)
  - `type`: VARCHAR(50) ('IMAGE', 'VIDEO')
  - `provider`: VARCHAR(100)
  - `status`: VARCHAR(50) ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')
  - `progress`: INT (0–100)
  - `result_url`: TEXT
  - `parameters`: JSONB (`@JdbcTypeCode(SqlTypes.JSON)`)

- **`media_assets`**:
  - `id`: BIGSERIAL PRIMARY KEY
  - `brand_id`: BIGINT REFERENCES brands(id)
  - `task_id`: BIGINT REFERENCES creative_tasks(id)
  - `media_type`: VARCHAR(50)
  - `url`: TEXT
  - `thumbnail_url`: TEXT
  - `aspect_ratio`: VARCHAR(20)

## 4. API Contract Quick Reference

- `POST /api/v1/creative/images` -> Generates image + applies deterministic overlay -> returns `CreativeTaskResponse`.
- `POST /api/v1/creative/videos` -> Dispatches async background video generation -> returns `CreativeTaskResponse` (`PENDING`).
- `GET /api/v1/creative/tasks/{id}` -> Returns task execution status and `resultUrl`.
- `GET /api/v1/creative/media` -> Lists all saved brand visual assets.
- `POST /api/v1/creative/media/{id}/attach-post` -> Creates or updates a social media post with the asset URL.
- `GET /api/v1/creative/presets` -> Returns curated business presets for fast one-tap creation.
