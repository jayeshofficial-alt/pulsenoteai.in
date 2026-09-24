// Generative preview SVG banner generator
export function generateGenerativeImageSvg(
  prompt: string,
  style: string = 'Photorealistic 8K',
  colorPalette: string[] = ['#6366f1', '#0ea5e9', '#f59e0b', '#0f172a']
): string {
  const c1 = colorPalette[0] || '#6366f1';
  const c2 = colorPalette[1] || '#0ea5e9';
  const c3 = colorPalette[2] || '#f59e0b';
  const safePrompt = prompt.replace(/[<>&"']/g, ' ').slice(0, 75);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.95"/>
        <stop offset="50%" stop-color="${c2}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#090d16" stop-opacity="1"/>
      </linearGradient>
      <radialGradient id="sunGlow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="${c3}" stop-opacity="0.8"/>
        <stop offset="40%" stop-color="${c2}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${c3}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${c1}" stop-opacity="0.3"/>
      </linearGradient>
      <filter id="bloom" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#skyGrad)"/>
    <circle cx="640" cy="260" r="280" fill="url(#sunGlow)"/>
    <path d="M0,520 Q640,460 1280,520 L1280,720 L0,720 Z" fill="#090d16" opacity="0.95"/>
    <path d="M120,530 L640,360 L1160,530" stroke="${c2}" stroke-width="1.5" opacity="0.3"/>
    <path d="M280,540 L640,360 L1000,540" stroke="${c3}" stroke-width="1.5" opacity="0.4"/>
    <circle cx="640" cy="360" r="8" fill="${c3}" filter="url(#bloom)"/>
    <polygon points="500,480 640,300 780,480" fill="url(#accentGrad)" opacity="0.4" filter="url(#bloom)"/>
    <polygon points="560,490 640,340 720,490" fill="url(#skyGrad)" opacity="0.7"/>
    <rect x="40" y="40" width="400" height="42" rx="12" fill="#0f172a" fill-opacity="0.8" stroke="${c2}" stroke-width="1" stroke-opacity="0.5"/>
    <text x="56" y="66" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">8K SYNTHESIS • ${style.toUpperCase()}</text>
    <rect x="40" y="630" width="1200" height="50" rx="12" fill="#0f172a" fill-opacity="0.85" stroke="#334155" stroke-width="1"/>
    <text x="60" y="662" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">${safePrompt}...</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
