import * as THREE from 'three';
import type { PublicFeedbackNote } from '@devbappa/shared';

// Color palette map for paper textures
const PAPER_COLORS: Record<string, { bg: string; top: string; inkPrimary: string; inkSecondary: string; inkMeta: string }> = {
  yellow: { bg: '#fef08a', top: '#fef9c3', inkPrimary: '#0f172a', inkSecondary: '#334155', inkMeta: '#475569' },
  amber: { bg: '#fde68a', top: '#fef3c7', inkPrimary: '#0f172a', inkSecondary: '#334155', inkMeta: '#475569' },
  orange: { bg: '#fed7aa', top: '#ffedd5', inkPrimary: '#0f172a', inkSecondary: '#334155', inkMeta: '#475569' },
  pink: { bg: '#fbcfe8', top: '#fce7f3', inkPrimary: '#0f172a', inkSecondary: '#334155', inkMeta: '#475569' },
  lavender: { bg: '#e9d5ff', top: '#f3e8ff', inkPrimary: '#0f172a', inkSecondary: '#334155', inkMeta: '#475569' },
  blue: { bg: '#bae6fd', top: '#e0f2fe', inkPrimary: '#0f172a', inkSecondary: '#334155', inkMeta: '#475569' },
  mint: { bg: '#a7f3d0', top: '#d1fae5', inkPrimary: '#0f172a', inkSecondary: '#334155', inkMeta: '#475569' },
};

// Texture cache to prevent recreating textures unnecessarily
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a high-resolution 512x512 CanvasTexture for a sticky note.
 * Renders name, role badge, handwritten feedback snippet, and metadata.
 */
export function createNoteTexture(note: PublicFeedbackNote): THREE.CanvasTexture {
  const cacheKey = `${note.id}-${note.publicDisplayName}-${note.message}-${note.colorVariant || 'yellow'}`;
  const existing = textureCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    return fallbackTexture;
  }

  const palette = PAPER_COLORS[note.colorVariant || 'yellow'] || PAPER_COLORS.yellow;

  // 1. Base paper background
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Subtle paper top gradient highlight
  const topGrad = ctx.createLinearGradient(0, 0, 0, 512);
  topGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  topGrad.addColorStop(0.12, 'rgba(255, 255, 255, 0.15)');
  topGrad.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, 512, 512);

  // 3. Top adhesive tape / fold bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(0, 0, 512, 40);

  // 4. Subtle curled bottom-right corner simulation
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.beginPath();
  ctx.moveTo(460, 512);
  ctx.lineTo(512, 460);
  ctx.lineTo(512, 512);
  ctx.closePath();
  ctx.fill();

  // 5. Header: Public Display Name (Bold, modern brand font)
  ctx.fillStyle = palette.inkPrimary;
  ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
  ctx.textBaseline = 'top';

  const maxNameWidth = 320;
  let displayName = note.publicDisplayName || 'Visitor';
  if (ctx.measureText(displayName).width > maxNameWidth) {
    while (ctx.measureText(displayName + '...').width > maxNameWidth && displayName.length > 1) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }
  ctx.fillText(displayName, 36, 68);

  // 6. Role Badge Tag
  const roleText = (note.role || 'VISITOR').toUpperCase();
  ctx.font = 'bold 18px "Outfit", "Inter", sans-serif';
  const roleWidth = ctx.measureText(roleText).width;
  const badgeX = 512 - roleWidth - 56;
  const badgeY = 70;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, roleWidth + 20, 30, 15);
  ctx.fill();

  ctx.fillStyle = palette.inkSecondary;
  ctx.fillText(roleText, badgeX + 10, badgeY + 6);

  // 7. Divider rule
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(36, 118);
  ctx.lineTo(476, 118);
  ctx.stroke();

  // 8. Message text in physical handwriting style (Caveat or cursive)
  ctx.fillStyle = palette.inkPrimary;
  ctx.font = '700 36px "Caveat", "Dancing Script", cursive, sans-serif';
  ctx.textBaseline = 'top';

  const maxLineWidth = 440;
  const words = (note.message || '').split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxLineWidth) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 6) break; // Limit lines for note preview
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && lines.length < 6) {
    lines.push(currentLine);
  }

  // Draw lines with natural vertical spacing
  const startY = 142;
  const lineHeight = 46;
  lines.forEach((line, i) => {
    if (i === 5 && words.length > lines.join(' ').split(' ').length) {
      line += '...';
    }
    ctx.fillText(line, 36, startY + i * lineHeight);
  });

  // 9. Footer: Department or Institution & Date
  const metaLeft = note.department || note.institutionName || 'Tech Expo Visitor';
  const metaDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  ctx.fillStyle = palette.inkMeta;
  ctx.font = '600 20px "Inter", sans-serif';

  // Crop meta left if too long
  let truncatedMeta = metaLeft;
  if (ctx.measureText(truncatedMeta).width > 300) {
    truncatedMeta = truncatedMeta.slice(0, 24) + '...';
  }
  ctx.fillText(truncatedMeta, 36, 460);

  // Date on right
  const dateWidth = ctx.measureText(metaDate).width;
  ctx.fillText(metaDate, 512 - dateWidth - 36, 460);

  // Create Three.js Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates texture for master announcement memo when wall is empty.
 */
export function createAnnouncementTexture(): THREE.CanvasTexture {
  const cacheKey = '__announcement__';
  const existing = textureCache.get(cacheKey);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Parchment paper
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(0, 0, 512, 512);

  const topGrad = ctx.createLinearGradient(0, 0, 0, 512);
  topGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  topGrad.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Badge
  ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
  ctx.beginPath();
  ctx.roundRect(140, 60, 232, 34, 17);
  ctx.fill();

  ctx.fillStyle = '#ea580c';
  ctx.font = 'bold 16px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DEVBAPPA SOLUTIONS', 256, 82);

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 36px "Outfit", sans-serif';
  ctx.fillText('Tech Expo Wall', 256, 150);

  // Subtitle
  ctx.fillStyle = '#334155';
  ctx.font = '700 28px "Caveat", cursive';
  ctx.fillText('Be the first to leave an impression!', 256, 210);

  ctx.font = '500 20px "Inter", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Share your authentic feedback, cheers,', 256, 260);
  ctx.fillText('or questions on this live interactive board.', 256, 290);

  // CTA button simulation on paper
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.roundRect(126, 350, 260, 60, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Outfit", sans-serif';
  ctx.fillText('+ Pin Your Feedback', 256, 387);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Clears texture cache on unmount to prevent memory leaks.
 */
export function clearTextureCache(): void {
  textureCache.forEach((texture) => texture.dispose());
  textureCache.clear();
}
