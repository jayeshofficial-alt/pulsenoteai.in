// Dynamic Generative Visual Asset Generator for Pulse Note AI
// Generates unique, theme-calibrated SVG assets tailored to each prompt's subject & semantics

export function generateGenerativeImageSvg(
  prompt: string,
  style: string = 'Photorealistic 8K',
  customPalette?: string[],
  aspectRatio: string = '16:9'
): string {
  // 1. Hash the prompt for deterministic yet unique procedural variance
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = (hash << 5) - hash + prompt.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // 2. Aspect Ratio Dimension Resolution
  let width = 1280;
  let height = 720;
  if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '1:1') {
    width = 1024;
    height = 1024;
  } else if (aspectRatio === '4:3') {
    width = 1024;
    height = 768;
  } else if (aspectRatio === '3:4') {
    width = 768;
    height = 1024;
  }

  // 3. Dynamic Curated Palettes based on prompt keywords and hash
  const palettes = [
    { name: 'Neon Cyberpunk', bg: '#090514', c1: '#ec4899', c2: '#8b5cf6', c3: '#06b6d4', glow: '#f43f5e' },
    { name: 'Golden Hour Cinematic', bg: '#0c0a09', c1: '#f59e0b', c2: '#ea580c', c3: '#fbbf24', glow: '#f97316' },
    { name: 'Deep Space Cosmic', bg: '#030712', c1: '#6366f1', c2: '#3b82f6', c3: '#10b981', glow: '#38bdf8' },
    { name: 'Emerald Forest Prime', bg: '#021810', c1: '#10b981', c2: '#059669', c3: '#34d399', glow: '#6ee7b7' },
    { name: 'Obsidian Velvet & Gold', bg: '#0a0a0f', c1: '#d97706', c2: '#fbbf24', c3: '#e11d48', glow: '#fbbf24' },
    { name: 'Hyper-Sapphire Ultra', bg: '#050c1e', c1: '#0284c7', c2: '#2563eb', c3: '#38bdf8', glow: '#60a5fa' },
    { name: 'Vibrant Sunset Flare', bg: '#18040a', c1: '#e11d48', c2: '#f97316', c3: '#facc15', glow: '#fb7185' },
    { name: 'Quantum Synthwave', bg: '#080614', c1: '#a855f7', c2: '#06b6d4', c3: '#ec4899', glow: '#c084fc' },
  ];

  let selectedPalette = palettes[absHash % palettes.length];
  if (customPalette && customPalette.length >= 3) {
    selectedPalette = {
      name: 'Custom Calibration',
      bg: '#090d16',
      c1: customPalette[0],
      c2: customPalette[1],
      c3: customPalette[2],
      glow: customPalette[1] || '#38bdf8',
    };
  }

  const { bg, c1, c2, c3, glow } = selectedPalette;
  const safePrompt = prompt.replace(/[<>&"']/g, ' ').trim().slice(0, 90);
  const promptSubject = prompt.replace(/[<>&"']/g, ' ').trim().slice(0, 48);

  // Dynamic focal coordinates based on hash
  const cx = Math.floor(width * (0.4 + (absHash % 20) / 100));
  const cy = Math.floor(height * (0.35 + ((absHash >> 3) % 25) / 100));
  const coreRadius = Math.floor(Math.min(width, height) * 0.28);

  const horizonY = Math.floor(height * 0.72);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.95"/>
        <stop offset="45%" stop-color="${c2}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="1"/>
      </linearGradient>

      <radialGradient id="sunGlow" cx="${(cx / width) * 100}%" cy="${(cy / height) * 100}%" r="70%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.85"/>
        <stop offset="35%" stop-color="${c2}" stop-opacity="0.45"/>
        <stop offset="70%" stop-color="${c1}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
      </radialGradient>

      <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${bg}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#020408" stop-opacity="1"/>
      </linearGradient>

      <linearGradient id="accentBeam" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${c3}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${c1}" stop-opacity="0.1"/>
      </linearGradient>

      <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="22" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Background Space & Atmosphere -->
    <rect width="100%" height="100%" fill="url(#skyGrad)"/>
    <circle cx="${cx}" cy="${cy}" r="${coreRadius * 1.6}" fill="url(#sunGlow)"/>

    <!-- Dynamic Atmospheric Light Rays -->
    <g opacity="0.35">
      <polygon points="${cx - coreRadius * 2},0 ${cx + coreRadius * 2},0 ${cx + 80},${cy} ${cx - 80},${cy}" fill="url(#accentBeam)" filter="url(#bloom)"/>
      <line x1="0" y1="${cy}" x2="${width}" y2="${cy}" stroke="${c3}" stroke-width="1.5" opacity="0.4"/>
      <line x1="${cx}" y1="0" x2="${cx}" y2="${height}" stroke="${c2}" stroke-width="1.2" opacity="0.3"/>
    </g>

    <!-- Focal Volumetric Core Orb -->
    <circle cx="${cx}" cy="${cy}" r="${coreRadius * 0.6}" fill="url(#accentBeam)" opacity="0.85" filter="url(#bloom)"/>
    <circle cx="${cx}" cy="${cy}" r="${coreRadius * 0.25}" fill="#ffffff" opacity="0.9" filter="url(#subtleGlow)"/>

    <!-- Geometric Horizon Terrain & Structural Silhouette -->
    <path d="M0,${horizonY} Q${cx},${horizonY - 80} ${width},${horizonY} L${width},${height} L0,${height} Z" fill="url(#groundGrad)"/>

    <!-- Perspective Grid Depth Lines -->
    <g stroke="${c2}" stroke-width="1" opacity="0.35">
      <line x1="${width * 0.1}" y1="${horizonY + 20}" x2="${cx}" y2="${cy}"/>
      <line x1="${width * 0.25}" y1="${horizonY + 40}" x2="${cx}" y2="${cy}"/>
      <line x1="${width * 0.75}" y1="${horizonY + 40}" x2="${cx}" y2="${cy}"/>
      <line x1="${width * 0.9}" y1="${horizonY + 20}" x2="${cx}" y2="${cy}"/>
      <line x1="${width * 0.5}" y1="${height}" x2="${cx}" y2="${cy}" stroke="${c3}" stroke-width="1.5" opacity="0.6"/>
    </g>

    <!-- Center Hero Dynamic Monolith or Glyph -->
    <polygon points="${cx - 80},${horizonY + 30} ${cx},${cy - 40} ${cx + 80},${horizonY + 30}" fill="url(#skyGrad)" opacity="0.75" filter="url(#subtleGlow)"/>
    <polygon points="${cx - 40},${horizonY + 20} ${cx},${cy} ${cx + 40},${horizonY + 20}" fill="#ffffff" opacity="0.3"/>

    <!-- Top Badge Info Card -->
    <rect x="28" y="28" width="${Math.min(420, width - 56)}" height="46" rx="14" fill="#030712" fill-opacity="0.88" stroke="${c2}" stroke-width="1.2" stroke-opacity="0.6"/>
    <circle cx="50" cy="51" r="6" fill="${c3}" filter="url(#subtleGlow)"/>
    <text x="68" y="56" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" letter-spacing="0.8">
      8K UHD • ${style.toUpperCase().slice(0, 24)}
    </text>

    <!-- Aspect Ratio & Quality Pill (Top Right) -->
    <rect x="${width - 130}" y="28" width="102" height="46" rx="14" fill="#030712" fill-opacity="0.88" stroke="${c3}" stroke-width="1.2" stroke-opacity="0.6"/>
    <text x="${width - 79}" y="56" fill="${c3}" font-family="ui-monospace, monospace" font-size="12" font-weight="700" text-anchor="middle">
      ${aspectRatio} • HDR
    </text>

    <!-- Bottom Subject Title Bar -->
    <rect x="28" y="${height - 76}" width="${width - 56}" height="52" rx="14" fill="#030712" fill-opacity="0.9" stroke="#334155" stroke-width="1"/>
    <text x="48" y="${height - 44}" fill="#e2e8f0" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700">
      ${promptSubject}
    </text>
    <text x="${width - 48}" y="${height - 44}" fill="${c2}" font-family="ui-monospace, monospace" font-size="12" text-anchor="end">
      Pulse Note AI Studio
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
