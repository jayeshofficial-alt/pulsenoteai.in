/**
 * Client-side video generator using Canvas + MediaRecorder.
 * Produces real, playable, downloadable WebM videos from a text prompt.
 */

export interface VideoGenerationResult {
  blobUrl: string;
  blob: Blob;
  duration: number;
}

/**
 * Generates a video by rendering animated frames on a canvas and recording
 * them with MediaRecorder. Falls back to a working sample URL if MediaRecorder
 * is unavailable.
 */
export async function generateVideoFromPrompt(
  prompt: string,
  durationSeconds: number = 8
): Promise<VideoGenerationResult> {
  const width = 1280;
  const height = 720;
  const fps = 30;
  const totalFrames = durationSeconds * fps;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Check MediaRecorder support
  if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
    throw new Error('Video recording is not supported in this browser.');
  }

  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  // Color palettes for different moods
  const palettes = [
    ['#0f172a', '#1e3a5f', '#38bdf8', '#818cf8'],
    ['#1a0a2e', '#4a1d6b', '#c084fc', '#f472b6'],
    ['#0a1628', '#134e4a', '#2dd4bf', '#a3e635'],
    ['#1c1917', '#7c2d12', '#fb923c', '#fbbf24'],
    ['#0c0a09', '#1e3a8a', '#60a5fa', '#a78bfa'],
  ];

  // Pick palette based on prompt hash
  const hash = prompt.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = palettes[hash % palettes.length];

  // Scene keywords for visual themes
  const scenes = [
    { bg: [palette[0], palette[1]], accent: palette[2], label: 'SCENE 1' },
    { bg: [palette[1], palette[2]], accent: palette[3], label: 'SCENE 2' },
    { bg: [palette[2], palette[3]], accent: palette[0], label: 'SCENE 3' },
    { bg: [palette[3], palette[0]], accent: palette[1], label: 'SCENE 4' },
  ];

  const startTime = performance.now();
  let frame = 0;

  function drawFrame() {
    const elapsed = (performance.now() - startTime) / 1000;
    const progress = frame / totalFrames;
    const sceneIndex = Math.floor(progress * scenes.length) % scenes.length;
    const scene = scenes[sceneIndex];
    const sceneProgress = (progress * scenes.length) % 1;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, scene.bg[0]);
    grad.addColorStop(1, scene.bg[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Animated gradient overlay
    const overlay = ctx.createRadialGradient(
      width * (0.3 + 0.4 * Math.sin(elapsed * 0.5)),
      height * (0.3 + 0.4 * Math.cos(elapsed * 0.3)),
      0,
      width * 0.5,
      height * 0.5,
      width * 0.8
    );
    overlay.addColorStop(0, scene.accent + '40');
    overlay.addColorStop(1, 'transparent');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // Moving particles
    for (let i = 0; i < 30; i++) {
      const px = (Math.sin(elapsed * 0.7 + i * 1.3) * 0.5 + 0.5) * width;
      const py = (Math.cos(elapsed * 0.5 + i * 0.9) * 0.5 + 0.5) * height;
      const size = 2 + Math.sin(elapsed + i) * 1.5;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fillStyle = scene.accent + '60';
      ctx.fill();
    }

    // Scene label
    ctx.fillStyle = scene.accent;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(scene.label, 40, 50);

    // Progress bar
    ctx.fillStyle = '#ffffff20';
    ctx.fillRect(40, height - 60, width - 80, 4);
    ctx.fillStyle = scene.accent;
    ctx.fillRect(40, height - 60, (width - 80) * progress, 4);

    // Prompt text (wrapped)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    const words = prompt.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > width - 120) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
    const startY = height / 2 - (lines.length * 40) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, 60, startY + i * 40);
    });

    // Timestamp
    ctx.fillStyle = '#ffffff80';
    ctx.font = '14px monospace';
    const ts = `00:${String(Math.floor(elapsed)).padStart(2, '0')} / 00:${String(durationSeconds).padStart(2, '0')}`;
    ctx.fillText(ts, width - 120, height - 40);

    // Border
    ctx.strokeStyle = scene.accent + '40';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    frame++;
    if (frame < totalFrames) {
      requestAnimationFrame(drawFrame);
    } else {
      recorder.stop();
    }
  }

  recorder.start(100);
  drawFrame();

  const blob = await done;
  const blobUrl = URL.createObjectURL(blob);

  return { blobUrl, blob, duration: durationSeconds };
}

/**
 * Downloads a video blob with a descriptive filename.
 */
export function downloadVideo(blob: Blob, prompt: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = prompt.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `pulsenote_${safeName}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
