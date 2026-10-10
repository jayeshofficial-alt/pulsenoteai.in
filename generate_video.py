# generate_video.py
# pip install google-genai
import os
import time
from google import genai
from google.genai import types

api_key = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

BLOCKED_PATTERNS = [
    "rahul gandhi",
    "modi",
    "narendra modi",
    "celebrity name",
    "donald trump",
    "trump",
    "joe biden",
    "biden",
    "vladimir putin",
    "putin",
    "kamala harris",
    "barack obama",
    "elon musk"
]  # extend with your own list

def precheck_prompt(prompt: str) -> str | None:
    """Return an error message if the prompt should not be sent to the model."""
    lowered = prompt.lower()
    if any(name in lowered for name in BLOCKED_PATTERNS):
        return ("Videos of real public figures in violent, threatening or "
                "humiliating scenarios can't be generated. Try a fictional character.")
    if len(prompt.strip()) < 10:
        return "Please describe the scene in more detail."
    return None

def generate_video(prompt: str, out_path: str = "output.mp4") -> dict:
    error = precheck_prompt(prompt)
    if error:
        return {"status": "rejected", "message": error}

    operation = client.models.generate_videos(
        model="veo-3.0-generate-preview",
        prompt=prompt,
        config=types.GenerateVideosConfig(
            aspect_ratio="16:9",
            duration_seconds=8,  # Veo supports roughly 5–8 s per clip; 10 s needs two clips joined
        ),
    )

    # Poll until the job finishes
    while not operation.done:
        time.sleep(10)
        operation = client.operations.get(operation)

    result = operation.response
    if not result or not getattr(result, "generated_videos", None):
        # Safety filter or empty result: return a message, never raw model text
        return {"status": "blocked",
                "message": "This prompt was blocked by the safety filter. Please try a different scene."}

    video = result.generated_videos[0].video
    client.files.download(file=video)
    video.save(out_path)
    return {"status": "ok", "file": out_path, "message": "Video ready."}

if __name__ == "__main__":
    import sys
    test_prompt = sys.argv[1] if len(sys.argv) > 1 else "A golden eagle soaring majestically over snow-capped mountains at sunrise"
    print(f"Generating video for prompt: {test_prompt}")
    res = generate_video(test_prompt)
    print(res)
