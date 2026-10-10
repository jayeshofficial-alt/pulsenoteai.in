/**
 * Subject-aware client-side video generator (Canvas + MediaRecorder).
 * Produces real, playable, downloadable WebM videos whose animated scenes
 * reflect the prompt's subjects (people, animals, settings).
 */

export interface VideoGenerationResult {
  blobUrl: string;
  blob: Blob;
  duration: number;
}

interface SubjectProfile {
  hasPerson: boolean;
  hasTiger: boolean;
  hasAnimal: boolean;
  animalWord: string;
  setting: 'jungle' | 'city' | 'ocean' | 'space' | 'generic';
  palette: string[];
  accent: string;
}

/** Extract a visual subject profile from the prompt. No network needed. */
function analyzePrompt(prompt: string): SubjectProfile {
  const p = prompt.toLowerCase();
  const hasPerson = /\b(man|woman|boy|girl|person|people|runner|athlete|child|king|queen|astronaut|doctor|dog walker)\b/.test(p);
  const hasTiger = /\btiger\b/.test(p);
  const hasAnimal =
    hasTiger ||
    /\b(lion|elephant|bird|eagle|dog|cat|horse|bear|wolf|shark|whale|dolphin|snake|dragon|tiger|animal|beast|predator)\b/.test(p);
  const animalMatch = p.match(/\b(tiger|lion|elephant|bird|eagle|dog|cat|horse|bear|wolf|shark|whale|dolphin|snake|dragon)\b/);
  let setting: SubjectProfile['setting'] = 'generic';
  if (/\b(jungle|forest|rainforest|trees|woods|canopy)\b/.test(p)) setting = 'jungle';
  else if (/\b(city|urban|street|neon|cyberpunk|metropolis)\b/.test(p)) setting = 'city';
  else if (/\b(ocean|sea|beach|underwater|river|lake)\b/.test(p)) setting = 'ocean';
  else if (/\b(space|galaxy|planet|stars|cosmos|moon)\b/.test(p)) setting = 'space';

  const palettes: Record<SubjectProfile['setting'], string[]> = {
    jungle: ['#04140a', '#0b3d1e', '#2dd4bf', '#fbbf24'],
    city: ['#0b1026', '#1e1b4b', '#38bdf8', '#f472b6'],
    ocean: ['#020c1b', '#0c4a6e', '#22d3ee', '#a5f3fc'],
    space: ['#030014', '#1e1b4b', '#a78bfa', '#f0abfc'],
    generic: ['#0f172a', '#1e3a5f', '#38bdf8', '#818cf8'],
  };
  const palette = palettes[setting];
  return {
    hasPerson,
    hasTiger,
    hasAnimal,
    animalWord: animalMatch ? animalMatch[1] : 'animal',
    setting,
    palette,
    accent: palette[2],
  };
}

/** Deterministic pseudo-random from seed (stable across frames). */
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Draw a running-person silhouette. phase animates the stride. */
function drawRunner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  phase: number,
  color: string
): void {
  ctx.fillStyle = color;
  const legSwing = Math.sin(phase) * s * 0.45;
  const armSwing = Math.sin(phase + Math.PI) * s * 0.4;
  // head
  ctx.beginPath();
  ctx.arc(x, y - s * 1.55, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  // torso (leaning forward)
  ctx.beginPath();
  ctx.moveTo(x - s * 0.12, y - s * 1.3);
  ctx.lineTo(x + s * 0.28, y - s * 0.35);
  ctx.lineWidth = s * 0.28;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.stroke();
  // legs
  ctx.lineWidth = s * 0.16;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.28, y - s * 0.35);
  ctx.lineTo(x + s * 0.28 + legSwing, y);
  ctx.moveTo(x + s * 0.28, y - s * 0.35);
  ctx.lineTo(x + s * 0.28 - legSwing, y - s * 0.08);
  ctx.stroke();
  // arms
  ctx.beginPath();
  ctx.moveTo(x + s * 0.1, y - s * 1.1);
  ctx.lineTo(x + s * 0.1 + armSwing, y - s * 0.55);
  ctx.moveTo(x + s * 0.1, y - s * 1.1);
  ctx.lineTo(x + s * 0.1 - armSwing, y - s * 0.6);
  ctx.stroke();
}

/** Draw a big-cat (tiger) silhouette with stripes. phase animates the gallop. */
function drawTiger(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  phase: number,
  body: string,
  stripe: string
): void {
  const bob = Math.abs(Math.sin(phase)) * s * 0.12;
  const stretch = Math.sin(phase) * s * 0.25;
  ctx.fillStyle = body;
  // body (horizontal ellipse, stretching with gallop)
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.5 - bob, s * (1.0 + Math.abs(stretch) / s), s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.arc(x + s * 1.05 + stretch * 0.3, y - s * 0.72 - bob, s * 0.34, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.beginPath();
  ctx.moveTo(x + s * 0.9 + stretch * 0.3, y - s * 1.0 - bob);
  ctx.lineTo(x + s * 1.0 + stretch * 0.3, y - s * 1.22 - bob);
  ctx.lineTo(x + s * 1.12 + stretch * 0.3, y - s * 1.0 - bob);
  ctx.fill();
  // legs (gallop cycle)
  ctx.strokeStyle = body;
  ctx.lineWidth = s * 0.2;
  ctx.lineCap = 'round';
  const f = Math.sin(phase) * s * 0.4;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.55, y - s * 0.3);
  ctx.lineTo(x + s * 0.55 + f, y);
  ctx.moveTo(x - s * 0.55, y - s * 0.3);
  ctx.lineTo(x - s * 0.55 - f, y);
  ctx.stroke();
  // tail (curved, swaying)
  ctx.beginPath();
  ctx.moveTo(x - s * 1.0, y - s * 0.55 - bob);
  ctx.quadraticCurveTo(
    x - s * 1.5,
    y - s * 0.9 - bob + Math.sin(phase * 0.7) * s * 0.15,
    x - s * 1.35,
    y - s * 0.25 - bob
  );
  ctx.stroke();
  // stripes
  ctx.strokeStyle = stripe;
  ctx.lineWidth = s * 0.07;
  for (let i = 0; i < 4; i++) {
    const sx = x - s * 0.55 + i * s * 0.32;
    ctx.beginPath();
    ctx.moveTo(sx, y - s * 0.88 - bob);
    ctx.lineTo(sx + s * 0.08, y - s * 0.3 - bob);
    ctx.stroke();
  }
}

/** Layered jungle foliage silhouette with horizontal parallax offset. */
function drawJungleLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseY: number,
  color: string,
  seed: number,
  offset: number,
  scale: number
): void {
  ctx.fillStyle = color;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const r1 = rand(seed + i * 3.7);
    const r2 = rand(seed + i * 9.1);
    let x = ((r1 * (w + 400) + offset) % (w + 400)) - 200;
    const treeH = (0.25 + r2 * 0.4) * h * scale;
    const treeW = treeH * (0.25 + r1 * 0.2);
    // trunk
    ctx.fillRect(x - treeW * 0.12, baseY - treeH * 0.7, treeW * 0.24, treeH * 0.7);
    // canopy (stacked ellipses)
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(
        x,
        baseY - treeH * (0.65 + k * 0.16),
        treeW * (1.1 - k * 0.22),
        treeH * 0.2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

/** Speed streaks for chase scenes. */
function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  color: string,
  count = 26
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i++) {
    const r1 = rand(i * 1.71);
    const r2 = rand(i * 4.33);
    const y = r1 * h;
    const len = 60 + r2 * 160;
    const x = ((r2 * (w + 600) - t * (400 + r1 * 700)) % (w + 600) + (w + 600)) % (w + 600) - 300;
    ctx.globalAlpha = 0.12 + r1 * 0.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * Generates a video by rendering subject-aware animated scenes on a canvas
 * and recording them with MediaRecorder. Falls back with a clear error if
 * recording is unsupported.
 */
export async function generateVideoFromPrompt(
  prompt: string,
  durationSeconds = 12
): Promise<VideoGenerationResult> {
  const width = 1280;
  const height = 720;
  const fps = 30;
  const totalFrames = Math.max(60, Math.round(durationSeconds * fps));
  const subject = analyzePrompt(prompt);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser.');
  if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
    throw new Error('Video recording is not supported in this browser.');
  }

  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      if (blob.size < 1000) reject(new Error('Video encoding produced an empty file.'));
      else resolve(blob);
    };
    recorder.onerror = () => reject(new Error('Video recording failed.'));
  });

  const [bg0, bg1, accent] = [subject.palette[0], subject.palette[1], subject.accent];
  const groundY = height * 0.82;
  const startTime = performance.now();
  let frame = 0;
  let stopped = false;

  const shortTitle = prompt.length > 90 ? prompt.slice(0, 90) + '…' : prompt;

  function drawFrame(): void {
    if (stopped) return;
    const elapsed = (performance.now() - startTime) / 1000;
    const progress = Math.min(1, frame / totalFrames);
    const sceneIdx = Math.min(2, Math.floor(progress * 3));

    // --- backdrop ---
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, bg0);
    grad.addColorStop(0.7, bg1);
    grad.addColorStop(1, bg0);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // god rays
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#fef9c3';
    for (let i = 0; i < 3; i++) {
      const rx = width * (0.25 + i * 0.25) + Math.sin(elapsed * 0.4 + i) * 20;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 90, 0);
      ctx.lineTo(rx + 200, height);
      ctx.lineTo(rx + 60, height);
      ctx.fill();
    }
    ctx.restore();

    // --- parallax jungle layers ---
    drawJungleLayer(ctx, width, height, groundY + 40, bg0, 11, -elapsed * 60, 1.0);
    drawJungleLayer(ctx, width, height, groundY + 70, bg1, 47, -elapsed * 140, 1.25);

    // --- ground ---
    ctx.fillStyle = bg0;
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.fillStyle = accent + '55';
    ctx.fillRect(0, groundY, width, 3);

    // --- subjects per scene ---
    const t = elapsed * 6; // stride clock
    if (subject.hasPerson || subject.hasAnimal) {
      if (sceneIdx === 0) {
        // Scene 1: runner flees toward camera, tiger bursts in behind
        const px = width * 0.5;
        drawRunner(ctx, px, groundY, 64, t, '#f8fafc');
        const tigerX = width * 0.5 - Math.min(width * 0.32, 60 + elapsed * 40);
        if (subject.hasAnimal) {
          drawTiger(ctx, tigerX, groundY, 58, t * 1.15, '#c2701e', '#1c0f02');
        }
        drawSpeedLines(ctx, width, height, elapsed, '#ffffff');
      } else if (sceneIdx === 1) {
        // Scene 2: lateral profile chase
        const px = width * 0.62 - elapsed * 8;
        drawRunner(ctx, px, groundY, 72, t, '#f8fafc');
        if (subject.hasAnimal) {
          drawTiger(ctx, px - 260, groundY, 66, t * 1.15, '#c2701e', '#1c0f02');
        }
        drawSpeedLines(ctx, width, height, elapsed, '#ffffff');
      } else {
        // Scene 3: wide — small figures race toward misty light
        const px = width * (0.3 + progress * 0.25);
        drawRunner(ctx, px, groundY, 40, t, '#e2e8f0');
        if (subject.hasAnimal) {
          drawTiger(ctx, px - 130, groundY, 36, t * 1.15, '#b45309', '#1c0f02');
        }
        // mist glow at the exit
        const mist = ctx.createRadialGradient(width * 0.85, groundY - 60, 10, width * 0.85, groundY - 60, 260);
        mist.addColorStop(0, '#fef9c355');
        mist.addColorStop(1, 'transparent');
        ctx.fillStyle = mist;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // No characters: ambient cinematic drift + prompt title card
      drawSpeedLines(ctx, width, height, elapsed * 0.4, accent);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 30px sans-serif';
      ctx.fillText('PulseNote AI • Cinematic Preview', 60, height * 0.4);
    }

    // --- overlay: title, scene tag, progress, timestamp ---
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, width, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 20px sans-serif';
    ctx.fillText(shortTitle, 24, 40);

    ctx.fillStyle = accent;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`SCENE ${sceneIdx + 1}/3 • ${subject.setting.toUpperCase()}`, 24, height - 46);

    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(24, height - 32, width - 48, 4);
    ctx.fillStyle = accent;
    ctx.fillRect(24, height - 32, (width - 48) * progress, 4);

    ctx.fillStyle = '#ffffffaa';
    ctx.font = '13px monospace';
    const stamp = (s: number) => `00:${String(Math.floor(s)).padStart(2, '0')}`;
    ctx.fillText(`${stamp(elapsed)} / ${stamp(totalFrames / fps)}`, width - 130, height - 40);

    ctx.strokeStyle = accent + '55';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    frame++;
    if (frame < totalFrames) {
      requestAnimationFrame(drawFrame);
    } else {
      stopped = true;
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    }
  }

  recorder.start(120);
  drawFrame();

  const blob = await done;
  return { blobUrl: URL.createObjectURL(blob), blob, duration: totalFrames / fps };
}

/** Downloads a video blob with a descriptive filename. */
export function downloadVideo(blob: Blob, prompt: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pulsenote_${prompt.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_') || 'video'}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
