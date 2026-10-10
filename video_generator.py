"""
video_generator.py
==================
Generates a 10-second 1280x720 (16:9) cartoon animation at 24 FPS:
1. Queries OpenRouter API (https://openrouter.ai/api/v1/chat/completions) for an animation scene plan.
2. Renders 240 frames using Pillow (PIL) featuring a running man looking back at a pursuing crowd.
3. Encodes frames to MP4 with ffmpeg.
"""

import os
import re
import json
import math
import shutil
import subprocess
from pathlib import Path

try:
    import requests
except ImportError:
    raise ImportError("requests is required. Install with: pip install requests")

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise ImportError("Pillow is required. Install with: pip install pillow")

# ---------------- Animation Settings ----------------
W, H = 1280, 720                  # 16:9 resolution
FPS = 24                          # Frames per second
SECONDS = 10                      # Duration in seconds
TOTAL_FRAMES = FPS * SECONDS      # 240 frames
GROUND = 540                      # Top of sidewalk baseline
MAN_X = 660                       # Horizontal position of main character
FRAME_DIR = Path("frames")
OUT_FILE = Path("cartoon_chase.mp4")

# OpenRouter Model
MODEL = "openai/gpt-4o-mini"      # Reliable JSON-capable OpenRouter model

PROMPT = (
    "A cartoon man running down a street, looking back in panic at an angry crowd chasing him, "
    "16:9 aspect ratio, 10 seconds."
)

DEFAULT_PLAN = {
    "crowd_size": 5,
    "caption": "RUN FOR YOUR LIFE!",
    "sky_tone": "sunset",        # "day", "sunset", "dusk"
    "intensity": "high"
}


# ---------------- 1. OpenRouter Scene Planner ----------------
def get_plan() -> dict:
    """
    Calls OpenRouter API to fetch a scene plan in JSON format.
    Falls back gracefully to DEFAULT_PLAN if no key or on network failure.
    """
    print(f"Prompt: {PROMPT}")
    key = os.getenv("OPENROUTER_API_KEY")
    if not key or key.strip() in ("", "YOUR_KEY_HERE", "sk-or-v1-YOUR_KEY_HERE"):
        print("No OPENROUTER_API_KEY set -> using default plan.")
        print(f"Plan received from OpenRouter: {DEFAULT_PLAN}")
        return DEFAULT_PLAN

    instruction = (
        "Turn this video idea into a JSON object only, with no other text. "
        "Keys: crowd_size (integer 3-7), caption (max 4 words). "
        f"Idea: {PROMPT}"
    )

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": instruction}],
                "temperature": 0.4,
                "max_tokens": 150
            },
            timeout=30,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()

        # Clean markdown code fences if model included them
        clean_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.MULTILINE).strip()
        match = re.search(r"\{.*\}", clean_json, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            crowd = parsed.get("crowd_size", 5)
            if not isinstance(crowd, int) or crowd < 3 or crowd > 7:
                parsed["crowd_size"] = 5
            final_plan = {**DEFAULT_PLAN, **parsed}
            print(f"Plan received from OpenRouter: {final_plan}")
            return final_plan

    except Exception as e:
        print(f"OpenRouter call failed, using default plan. Reason: {e}")

    print(f"Plan received from OpenRouter: {DEFAULT_PLAN}")
    return DEFAULT_PLAN


# ---------------- 2. Drawing Helpers ----------------
def get_font(size: int = 36):
    """Loads a TTF font if available on host OS; falls back to default bitmap font."""
    font_candidates = [
        "arial.ttf",
        "Arial.ttf",
        "DejaVuSans-Bold.ttf",
        "DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    ]
    for font_name in font_candidates:
        try:
            return ImageFont.truetype(font_name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_sky_and_clouds(d: ImageDraw.ImageDraw, frame_idx: int, sky_tone: str):
    """Draws background sky gradient and scrolling fluffy clouds."""
    if sky_tone == "sunset":
        top_color = (255, 120, 70)
        bot_color = (255, 210, 120)
    elif sky_tone == "dusk":
        top_color = (60, 45, 95)
        bot_color = (180, 100, 110)
    else:  # day
        top_color = (110, 185, 245)
        bot_color = (195, 230, 255)

    # Vertical gradient for sky
    for y in range(0, GROUND, 8):
        t = y / max(1, GROUND)
        r = int(top_color[0] + (bot_color[0] - top_color[0]) * t)
        g = int(top_color[1] + (bot_color[1] - top_color[1]) * t)
        b = int(top_color[2] + (bot_color[2] - top_color[2]) * t)
        d.rectangle([0, y, W, min(GROUND, y + 8)], fill=(r, g, b))

    # Parallax Clouds
    cloud_scroll = (frame_idx * 2) % (W + 200)
    for cx_base, cy, scale in [(200, 80, 1.0), (650, 120, 0.8), (1100, 70, 1.2), (-100, 100, 0.9)]:
        cx = (cx_base - cloud_scroll) % (W + 300) - 100
        cloud_color = (255, 245, 240, 200) if sky_tone == "sunset" else (255, 255, 255)
        d.ellipse([cx - 40 * scale, cy - 20 * scale, cx + 40 * scale, cy + 20 * scale], fill=cloud_color)
        d.ellipse([cx - 15 * scale, cy - 35 * scale, cx + 25 * scale, cy + 15 * scale], fill=cloud_color)
        d.ellipse([cx + 10 * scale, cy - 22 * scale, cx + 60 * scale, cy + 18 * scale], fill=cloud_color)


def draw_scenery(d: ImageDraw.ImageDraw, frame_idx: int, sky_tone: str):
    """Draws scrolling skyline buildings, sidewalk, and road markings."""
    draw_sky_and_clouds(d, frame_idx, sky_tone)

    # Far background skyline (slow scroll)
    far_scroll = (frame_idx * 5) % 360
    for k in range(-1, 6):
        bx = k * 360 - far_scroll
        bw = 320
        bh = 220 + ((k * 37) % 80)
        d.rectangle([bx, GROUND - bh, bx + bw, GROUND], fill=(120, 115, 140))

    # Midground buildings (faster scroll to simulate high running speed)
    b_scroll = (frame_idx * 16) % 260
    palette = [
        (180, 85, 75), (90, 120, 145), (200, 150, 90),
        (130, 100, 140), (85, 135, 120), (190, 110, 80)
    ]
    for k in range(-1, 8):
        bx = k * 240 - b_scroll
        bw = 200
        bh = 170 + ((k * 53) % 110)
        b_color = palette[k % len(palette)]
        d.rectangle([bx, GROUND - bh, bx + bw, GROUND], fill=b_color, outline=(40, 40, 40), width=2)

        # Windows with varied lighting
        for wy in range(int(GROUND - bh + 25), GROUND - 30, 45):
            for wx in range(int(bx + 20), int(bx + bw - 20), 45):
                win_lit = ((wx + wy + k * 11) % 5 != 0)
                win_col = (255, 235, 140) if win_lit else (60, 60, 75)
                d.rectangle([wx, wy, wx + 26, wy + 26], fill=win_col, outline=(30, 30, 30), width=1)

    # Sidewalk curb
    d.rectangle([0, GROUND, W, GROUND + 28], fill=(195, 195, 195), outline=(50, 50, 50), width=2)
    # Sidewalk tile lines
    tile_scroll = (frame_idx * 24) % 80
    for sx in range(-80, W + 80, 80):
        pos_x = sx - tile_scroll
        d.line([(pos_x, GROUND), (pos_x, GROUND + 28)], fill=(150, 150, 150), width=2)

    # Asphalt Road
    d.rectangle([0, GROUND + 28, W, H], fill=(65, 68, 75))

    # Road dashed markings (fast forward motion)
    stripe_scroll = (frame_idx * 28) % 180
    for x in range(-180, W + 180, 180):
        sx = x - stripe_scroll
        d.rectangle([sx, 650, sx + 90, 664], fill=(255, 220, 50))


def draw_speed_lines(d: ImageDraw.ImageDraw, frame_idx: int):
    """Draws kinetic white motion speed lines along the screen."""
    for j in range(6):
        seed = (frame_idx * 17 + j * 93) % 1000
        lx = (seed * 1.3) % W
        ly = 200 + (seed * 3) % 400
        length = 90 + (seed % 140)
        d.line([(lx, ly), (lx + length, ly)], fill=(255, 255, 255), width=2)


def draw_person(
    d: ImageDraw.ImageDraw,
    hx: float,
    hy: float,
    phase: float,
    shirt_color: tuple,
    pants_color: tuple,
    skin_color: tuple,
    scale: float = 1.0,
    angry: bool = False,
    face_dir: int = 1,
    look_back: bool = False,
    weapon: str = None
):
    """
    Renders an animated cartoon runner with dynamic limbs, head, and facial expressions.
    - face_dir: 1 = facing right (forward), -1 = facing left
    - look_back: turns head backward with terrified expression & sweat drops
    """
    s = scale
    torso_top = hy - 95 * s
    head_r = 30 * s
    hcx = hx
    hcy = torso_top - head_r + 4 * s
    lw_legs = max(3, int(11 * s))
    lw_arms = max(3, int(9 * s))

    # Running bounce
    bounce_y = abs(math.sin(phase * 2)) * 8 * s
    hy -= bounce_y
    torso_top -= bounce_y
    hcy -= bounce_y

    # --- LEGS (2-segment articulated running cycle) ---
    leg_configs = [
        (phase, pants_color),
        (phase + math.pi, tuple(max(0, c - 35) for c in pants_color))  # shaded back leg
    ]
    for p, col in leg_configs:
        # Hip to knee
        knee_x = hx + math.sin(p) * 36 * s
        knee_y = hy + 45 * s - max(0, math.cos(p)) * 14 * s
        # Knee to foot
        foot_x = hx + math.sin(p) * 65 * s
        foot_y = hy + 90 * s - max(0, math.cos(p)) * 26 * s

        d.line([(hx, hy), (knee_x, knee_y)], fill=col, width=lw_legs)
        d.line([(knee_x, knee_y), (foot_x, foot_y)], fill=col, width=lw_legs)
        # Shoes
        d.ellipse([foot_x - 7 * s, foot_y - 4 * s, foot_x + 14 * s, foot_y + 8 * s], fill=(30, 30, 30))

    # --- TORSO ---
    d.line([(hx, hy), (hx, torso_top)], fill=shirt_color, width=max(4, int(34 * s)))

    # --- ARMS ---
    shoulder_y = torso_top + 16 * s
    if angry:
        # Angry raised fists waving in anger
        fist_phase = math.sin(phase * 1.5) * 14 * s
        hand1 = (hx - 24 * s, shoulder_y - 45 * s + fist_phase)
        hand2 = (hx + 24 * s, shoulder_y - 52 * s - fist_phase)

        d.line([(hx, shoulder_y), hand1], fill=shirt_color, width=lw_arms)
        d.line([(hx, shoulder_y), hand2], fill=shirt_color, width=lw_arms)
        # Fist spheres
        for f in (hand1, hand2):
            d.ellipse([f[0] - 8 * s, f[1] - 8 * s, f[0] + 8 * s, f[1] + 8 * s], fill=skin_color, outline=(20, 20, 20))

        # Optional pitchfork or sign
        if weapon == "pitchfork":
            d.line([(hand1[0], hand1[1] + 30 * s), (hand1[0] - 15 * s, hand1[1] - 50 * s)], fill=(120, 75, 40), width=4)
            # tines
            tx, ty = hand1[0] - 15 * s, hand1[1] - 50 * s
            d.line([(tx - 12 * s, ty), (tx + 12 * s, ty)], fill=(180, 180, 190), width=3)
            d.line([(tx - 12 * s, ty), (tx - 12 * s, ty - 22 * s)], fill=(180, 180, 190), width=3)
            d.line([(tx, ty), (tx, ty - 25 * s)], fill=(180, 180, 190), width=3)
            d.line([(tx + 12 * s, ty), (tx + 12 * s, ty - 22 * s)], fill=(180, 180, 190), width=3)

    else:
        # Athletic forward pump
        arm1_hand = (hx + math.sin(phase) * 44 * s, shoulder_y + 42 * s + math.cos(phase) * 10 * s)
        arm2_hand = (hx + math.sin(phase + math.pi) * 44 * s, shoulder_y + 42 * s + math.cos(phase + math.pi) * 10 * s)

        d.line([(hx, shoulder_y), arm1_hand], fill=shirt_color, width=lw_arms)
        d.line([(hx, shoulder_y), arm2_hand], fill=shirt_color, width=lw_arms)
        for h in (arm1_hand, arm2_hand):
            d.ellipse([h[0] - 6 * s, h[1] - 6 * s, h[0] + 6 * s, h[1] + 6 * s], fill=skin_color)

    # --- HEAD ---
    d.ellipse(
        [hcx - head_r, hcy - head_r, hcx + head_r, hcy + head_r],
        fill=skin_color, outline=(30, 30, 30), width=2
    )

    # Hair / Cap
    d.chord([hcx - head_r, hcy - head_r, hcx + head_r, hcy + 5 * s], start=180, end=360, fill=(45, 30, 20))

    # Facial Features
    effective_face_dir = -1 if look_back else face_dir
    eye_x = hcx + effective_face_dir * 10 * s
    eye_y = hcy - 3 * s

    if look_back:
        # PANIC: Wide terrified eye, huge screaming mouth, flying sweat drop
        eye_radius = 8 * s
        d.ellipse([eye_x - eye_radius, eye_y - eye_radius, eye_x + eye_radius, eye_y + eye_radius], fill=(255, 255, 255), outline=(0, 0, 0))
        d.ellipse([eye_x - 3 * s, eye_y - 3 * s, eye_x + 3 * s, eye_y + 3 * s], fill=(0, 0, 0))

        # Open screaming mouth
        mouth_y = hcy + 13 * s
        d.ellipse([eye_x - 7 * s, mouth_y - 6 * s, eye_x + 7 * s, mouth_y + 10 * s], fill=(160, 30, 30), outline=(0, 0, 0))

        # Sweat drop flying backward
        sweat_x = hcx + 24 * s
        sweat_y = hcy - 12 * s - (math.sin(phase * 3) * 6 * s)
        d.ellipse([sweat_x - 4 * s, sweat_y - 6 * s, sweat_x + 4 * s, sweat_y + 6 * s], fill=(100, 200, 255), outline=(50, 120, 200))

    elif angry:
        # ANGRY: Furrowed brow, teeth gritted
        d.ellipse([eye_x - 5 * s, eye_y - 5 * s, eye_x + 5 * s, eye_y + 5 * s], fill=(255, 255, 255), outline=(0, 0, 0))
        d.ellipse([eye_x - 2 * s, eye_y - 2 * s, eye_x + 2 * s, eye_y + 2 * s], fill=(0, 0, 0))
        # Eyebrow slant
        d.line([(eye_x - 9 * s, eye_y - 9 * s), (eye_x + 7 * s, eye_y - 5 * s)], fill=(0, 0, 0), width=3)
        # Grimace mouth
        d.rectangle([eye_x - 8 * s, hcy + 12 * s, eye_x + 8 * s, hcy + 18 * s], fill=(240, 240, 240), outline=(0, 0, 0))
    else:
        # Determined runner
        d.ellipse([eye_x - 4 * s, eye_y - 4 * s, eye_x + 4 * s, eye_y + 4 * s], fill=(0, 0, 0))
        d.line([(eye_x - 6 * s, hcy + 12 * s), (eye_x + 6 * s, hcy + 12 * s)], fill=(0, 0, 0), width=2)


def draw_caption_badge(d: ImageDraw.ImageDraw, text: str, font):
    """Draws a bright comic-book style exclamation bubble at the top."""
    if not text:
        return
    text = str(text).upper()
    box_w = 420
    box_h = 64
    bx = (W - box_w) // 2
    by = 32

    # Drop shadow
    d.rounded_rectangle([bx + 4, by + 4, bx + box_w + 4, by + box_h + 4], radius=14, fill=(20, 20, 20, 180))
    # Badge background
    d.rounded_rectangle([bx, by, bx + box_w, by + box_h], radius=14, fill=(255, 235, 50), outline=(20, 20, 20), width=3)

    # Centered text
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = bx + (box_w - tw) // 2
    ty = by + (box_h - th) // 2 - 3
    d.text((tx, ty), text, fill=(20, 20, 20), font=font)


# ---------------- 3. Animation Rendering ----------------
def render_animation(plan: dict):
    """Generates all 240 frames with dynamic running cycles and chases."""
    if FRAME_DIR.exists():
        shutil.rmtree(FRAME_DIR)
    FRAME_DIR.mkdir(parents=True, exist_ok=True)

    font = get_font(34)
    crowd_size = int(plan.get("crowd_size", 5))
    caption = plan.get("caption", "RUN!")
    sky_tone = plan.get("sky_tone", "sunset")

    # Crowd character specs (varied colors and slight stagger)
    crowd_palette = [
        {"shirt": (210, 45, 45),   "pants": (50, 50, 60),   "skin": (245, 195, 160), "weapon": "pitchfork"},
        {"shirt": (50, 130, 200),  "pants": (80, 60, 40),   "skin": (210, 160, 120), "weapon": None},
        {"shirt": (60, 160, 80),   "pants": (40, 40, 70),   "skin": (250, 210, 175), "weapon": "sign"},
        {"shirt": (230, 140, 30),  "pants": (60, 60, 60),   "skin": (190, 140, 100), "weapon": None},
        {"shirt": (160, 50, 140),  "pants": (45, 55, 75),   "skin": (240, 190, 155), "weapon": "pitchfork"},
        {"shirt": (70, 70, 85),    "pants": (90, 80, 65),   "skin": (225, 175, 135), "weapon": None},
        {"shirt": (195, 80, 50),   "pants": (40, 50, 60),   "skin": (245, 200, 170), "weapon": None},
    ]

    print(f"[Render] Beginning frame generation: {TOTAL_FRAMES} frames ({SECONDS}s @ {FPS}fps)...")

    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (W, H))
        d = ImageDraw.Draw(img)

        # 1. Background, buildings, road
        draw_scenery(d, i, sky_tone)

        # 2. Speed motion lines
        draw_speed_lines(d, i)

        # 3. Pursuing Crowd (closes the gap over 10 seconds)
        # Gap between lead runner and man decreases from 340px down to 150px
        gap_progress = i / max(1, TOTAL_FRAMES - 1)
        lead_distance = 340 - (190 * gap_progress)  # 340 -> 150
        lead_x = MAN_X - lead_distance

        for c_idx in range(crowd_size):
            spec = crowd_palette[c_idx % len(crowd_palette)]
            # Stagger crowd members behind the leader
            cx = lead_x - (c_idx * 55) + math.sin(i * 0.2 + c_idx) * 12

            c_phase = i * 0.70 + c_idx * 1.1
            c_scale = 0.88 + (c_idx % 3) * 0.05
            cy = GROUND - 18 - (c_idx % 2) * 12

            draw_person(
                d=d,
                hx=cx,
                hy=cy,
                phase=c_phase,
                shirt_color=spec["shirt"],
                pants_color=spec["pants"],
                skin_color=spec["skin"],
                scale=c_scale,
                angry=True,
                face_dir=1,
                look_back=False,
                weapon=spec.get("weapon")
            )

        # 4. Main Character (Hero)
        # Man glances back at the crowd between 2.5s and 7.5s (frames 60 to 180)
        is_looking_back = (60 <= i <= 180)
        man_phase = i * 0.85

        draw_person(
            d=d,
            hx=MAN_X,
            hy=GROUND - 20,
            phase=man_phase,
            shirt_color=(255, 215, 0),    # Bright yellow athletic shirt
            pants_color=(35, 75, 175),     # Blue jeans
            skin_color=(255, 205, 170),    # Light peach
            scale=1.05,
            angry=False,
            face_dir=1,
            look_back=is_looking_back
        )

        # 5. Dynamic Comic Caption Banner
        draw_caption_badge(d, caption, font)

        # Save frame to disk
        frame_path = FRAME_DIR / f"frame_{i:04d}.png"
        img.save(frame_path, "PNG")

        frame_num = i + 1
        if frame_num == 1 or frame_num % 25 == 0 or frame_num == TOTAL_FRAMES:
            print(f"Rendered {frame_num}/{TOTAL_FRAMES} frames")

    print("All frames rendered.")


# ---------------- 4. MP4 Encoding with ffmpeg ----------------
def encode_video():
    """Encodes generated PNG frames to MP4 using ffmpeg."""
    ffmpeg_cmd = shutil.which("ffmpeg")
    if not ffmpeg_cmd:
        print("\n[Warning] ffmpeg was not found in PATH!")
        print("To encode frames to MP4:")
        print("  Ubuntu/Debian:  sudo apt update && sudo apt install -y ffmpeg")
        print("  macOS:          brew install ffmpeg")
        print("  Windows:        winget install Gyan.FFmpeg\n")
        print("Or run manually if installed:")
        print(f"  ffmpeg -y -framerate {FPS} -i frames/frame_%04d.png -c:v libx264 -pix_fmt yuv420p {OUT_FILE}")
        return False

    cmd = [
        ffmpeg_cmd,
        "-y",                             # Overwrite output without asking
        "-framerate", str(FPS),          # 24 fps
        "-i", str(FRAME_DIR / "frame_%04d.png"),
        "-c:v", "libx264",               # H.264 video codec
        "-preset", "medium",
        "-crf", "20",                    # High visual quality
        "-pix_fmt", "yuv420p",           # Universal compatibility
        str(OUT_FILE)
    ]

    print(f"[ffmpeg] Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if result.returncode == 0 and OUT_FILE.exists():
        size_mb = OUT_FILE.stat().st_size / (1024 * 1024)
        print(f"\n[Success] Video encoded: {OUT_FILE.resolve()} ({size_mb:.2f} MB, {SECONDS}s, 16:9 1280x720)")
        return True
    else:
        print("[ffmpeg] Encoding failed with error:\n", result.stderr)
        return False


# ---------------- 5. Main Entrypoint ----------------
def main():
    print("=" * 60)
    print(" CARTOON CHASE ANIMATION GENERATOR (16:9, 1280x720, 10s)")
    print("=" * 60)

    # Step 1: OpenRouter Scene Plan
    plan = get_plan()

    # Step 2: Draw frames with Pillow
    render_animation(plan)

    # Step 3: Compile to MP4 with ffmpeg
    success = encode_video()

    if success:
        print(f"\nDONE! Video saved to: {OUT_FILE.resolve()}")
    else:
        print(f"\nFrames are saved in {FRAME_DIR.resolve()}/ for encoding.")


if __name__ == "__main__":
    main()
