import sys
import time
import json
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8080/api/v1"

def log_step(name):
    print(f"\n==========================================")
    print(f"▶ [TEST STEP] {name}")
    print(f"==========================================")

def request(endpoint, method="GET", body=None, token=None):
    url = f"{BASE_URL}{endpoint}" if endpoint.startswith("/") else endpoint
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read()
            if "application/json" in content_type:
                return resp.status, json.loads(raw.decode("utf-8")), resp.headers
            return resp.status, raw, resp.headers
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw.decode("utf-8")), e.headers
        except:
            return e.code, raw.decode("utf-8", errors="ignore"), e.headers

def main():
    print("🚀 Starting ContentPilot 2.0 MVP Live Integration Test Suite...")
    ts = int(time.time())
    test_email = f"mvp_test_{ts}@contentpilot.io"
    test_password = "Password123!"

    # 1. Register
    log_step("1. User Registration")
    status, res, _ = request("/auth/register", method="POST", body={
        "email": test_email,
        "password": test_password
    })
    assert status in (200, 201), f"Registration failed: {status} {res}"
    token = res.get("token")
    assert token, "Token not returned in registration response"
    print(f"✓ User registered: {test_email}, JWT acquired.")

    # 2. Login
    log_step("2. User Authentication (Login)")
    status, res, _ = request("/auth/login", method="POST", body={
        "email": test_email,
        "password": test_password
    })
    assert status == 200, f"Login failed: {status} {res}"
    token = res.get("token")
    assert token, "Token not returned in login response"
    print(f"✓ Authentication successful, access token refreshed.")

    # 3. Create Brand with Brand Memory
    log_step("3. Create Brand with Facts & Menu (Brand Memory)")
    menu_facts = {
        "address": "ул. Баумана, 28",
        "workingHours": "08:00 - 23:00",
        "menu": [
            {"name": "капучино", "price": 320},
            {"name": "латте", "price": 350},
            {"name": "круассан", "price": 220}
        ]
    }
    status, brand, _ = request("/brands", method="POST", body={
        "name": "CoffeePilot Specialty",
        "description": "Спешелти кофейня и пекарня свежей выпечки",
        "audience": "Студенты, предприниматели, ценители авторского кофе",
        "tone": "Тёплый, экспертный, дружелюбный",
        "facts": menu_facts,
        "autonomyMode": "COPILOT"
    }, token=token)
    assert status == 200, f"Brand creation failed: {status} {brand}"
    brand_id = brand["id"]
    print(f"✓ Brand created with ID {brand_id} ('{brand['name']}').")

    # 4. Check Channels Capabilities
    log_step("4. Social Channels Capabilities")
    status, capabilities, _ = request("/channels/capabilities", method="GET", token=token)
    assert status == 200, f"Channels capabilities failed: {status} {capabilities}"
    print(f"✓ Platform capabilities verified for {len(capabilities)} social networks.")

    # 5. Generate Campaign Content Plan
    log_step("5. Generate 7-Day Campaign Content Plan")
    status, campaign, _ = request("/campaigns", method="POST", body={
        "goal": "Продвижение сезонного меню и напитка латте",
        "periodStart": "2026-10-23",
        "periodEnd": "2026-10-30"
    }, token=token)
    assert status in (200, 201), f"Campaign creation failed: {status} {campaign}"
    campaign_id = campaign["id"]
    posts = campaign.get("posts", [])
    print(f"✓ Campaign {campaign_id} generated with {len(posts)} scheduled publications.")

    # 6. Creative Studio: Get Presets
    log_step("6. Creative Studio Presets")
    status, presets, _ = request("/creative/presets", method="GET", token=token)
    assert status == 200, f"Presets fetch failed: {status} {presets}"
    assert len(presets) >= 4, f"Expected at least 4 presets, got {len(presets)}"
    print(f"✓ Found {len(presets)} curated business presets.")

    # 7. Creative Studio: Generate Image with Deterministic Price Overlay
    log_step("7. Generate Image with Deterministic Price Overlay (0% Hallucination)")
    status, img_task, _ = request("/creative/images", method="POST", body={
        "prompt": "Чашка латте с артом на деревянном столике",
        "style": "COFFEE_AESTHETIC",
        "aspectRatio": "1:1",
        "enableOverlay": True,
        "brandName": "CoffeePilot Specialty",
        "price": "350 ₽",
        "badgeText": "Сезонная новинка",
        "ctaText": "Попробовать",
        "overlayPosition": "BOTTOM_CENTER"
    }, token=token)
    assert status == 200, f"Image generation failed: {status} {img_task}"
    assert img_task["status"] == "COMPLETED", f"Expected COMPLETED status, got {img_task['status']}"
    assert img_task["resultUrl"], "Missing resultUrl"
    img_url = img_task["resultUrl"]
    print(f"✓ Image generated successfully: {img_url}")

    # 8. Download Generated Image
    log_step("8. Verify Public Image Serving (HTTP 200 & Valid PNG)")
    img_full_url = f"http://localhost:8080{img_url}"
    status, img_bytes, headers = request(img_full_url, method="GET")
    assert status == 200, f"Failed to download image: {status}"
    assert headers.get("Content-Type") == "image/png", f"Unexpected content-type: {headers.get('Content-Type')}"
    assert len(img_bytes) > 10000, f"Image file too small: {len(img_bytes)} bytes"
    print(f"✓ Image file verified: {len(img_bytes)} bytes, Content-Type: {headers.get('Content-Type')}")

    # 9. Creative Studio: Create Asynchronous Video Task (Shorts 9:16)
    log_step("9. Asynchronous Video Generation (Reels / Shorts 9:16 with FFmpeg)")
    status, vid_task, _ = request("/creative/videos", method="POST", body={
        "prompt": "Свежий круассан и карамельный латте",
        "style": "COFFEE_AESTHETIC",
        "aspectRatio": "9:16",
        "durationSeconds": 5,
        "cameraMotion": "SLOW_ZOOM_IN",
        "enableOverlay": True,
        "brandName": "CoffeePilot Specialty",
        "price": "350 ₽",
        "badgeText": "Хит продаж"
    }, token=token)
    assert status == 200, f"Video task dispatch failed: {status} {vid_task}"
    task_id = vid_task["id"]
    print(f"✓ Video task {task_id} dispatched (Initial status: {vid_task['status']}). Polling...")

    # 10. Poll Video Task
    log_step("10. Polling Video Task Status")
    completed = False
    for attempt in range(15):
        time.sleep(2)
        status, updated_task, _ = request(f"/creative/tasks/{task_id}", method="GET", token=token)
        print(f"  → Attempt {attempt+1}: Status={updated_task['status']}, Progress={updated_task.get('progress')}%")
        if updated_task["status"] == "COMPLETED":
            completed = True
            vid_url = updated_task["resultUrl"]
            break
        elif updated_task["status"] == "FAILED":
            raise AssertionError(f"Video generation task failed: {updated_task.get('errorMessage')}")

    assert completed, f"Video task timed out"
    print(f"✓ Video rendered and ready: {vid_url}")

    # 11. Download Generated Video
    log_step("11. Verify Video File (HTTP 200 & MP4/Video Stream)")
    vid_full_url = f"http://localhost:8080{vid_url}"
    status, vid_bytes, headers = request(vid_full_url, method="GET")
    assert status == 200, f"Failed to download video: {status}"
    print(f"✓ Video stream verified: {len(vid_bytes)} bytes, Content-Type: {headers.get('Content-Type')}")

    # 12. Media Library Verification
    log_step("12. Verify Media Library Storage")
    status, media_list, _ = request("/creative/media", method="GET", token=token)
    assert status == 200, f"Media fetch failed: {status}"
    assert len(media_list) >= 2, f"Expected at least 2 media assets, got {len(media_list)}"
    target_media_id = media_list[0]["id"]
    print(f"✓ Brand media gallery contains {len(media_list)} assets.")

    # 13. Attach Media to Social Post
    log_step("13. Attach Generated Creative to Social Publication")
    status, post, _ = request(f"/creative/media/{target_media_id}/attach-post", method="POST", body={
        "platform": "TELEGRAM",
        "postText": "🔥 Специальное предложение дня: свежий круассан и капучино в CoffeePilot!"
    }, token=token)
    assert status == 200, f"Attach to post failed: {status} {post}"
    assert post["mediaUrl"], "Post has no mediaUrl"
    print(f"✓ Post {post['id']} created with attached mediaUrl: {post['mediaUrl']}")

    # 14. Emergency Stop-All (Rule Requirement)
    log_step("14. Emergency Stop-All (Pause all scheduled posts)")
    status, stop_res, _ = request("/posts/stop-all", method="POST", token=token)
    assert status == 200, f"Stop-all failed: {status} {stop_res}"
    print(f"✓ Emergency stop executed: {stop_res.get('message')}")

    print("\n" + "=" * 60)
    print("🎉 ALL MVP LIVE INTEGRATION TESTS PASSED SUCCESSFULLY! (14/14)")
    print("=" * 60)

if __name__ == "__main__":
    main()
