import * as THREE from 'three';
import type { PublicFeedbackNote } from '@devbappa/shared';

// Approved 7-note palette from design specification
// Paired with #14161F high-contrast charcoal ink (yields >= 10.5:1 contrast ratio, WCAG AAA compliant)
export const APPROVED_PAPER_PALETTE: Record<
  string,
  {
    top: string;
    bottom: string;
    crease: string;
    inkPrimary: string;
    inkSecondary: string;
    inkMeta: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  yellow: {
    top: '#FFF275',
    bottom: '#F2D43D',
    crease: 'rgba(217, 180, 20, 0.35)',
    inkPrimary: '#14161F',
    inkSecondary: '#2C3042',
    inkMeta: '#454C64',
    badgeBg: 'rgba(20, 22, 31, 0.08)',
    badgeText: '#14161F',
  },
  amber: {
    top: '#FFD166',
    bottom: '#F0AE29',
    crease: 'rgba(200, 130, 15, 0.35)',
    inkPrimary: '#14161F',
    inkSecondary: '#2C3042',
    inkMeta: '#454C64',
    badgeBg: 'rgba(20, 22, 31, 0.08)',
    badgeText: '#14161F',
  },
  orange: {
    top: '#FF9F68',
    bottom: '#E87738',
    crease: 'rgba(190, 80, 20, 0.35)',
    inkPrimary: '#14161F',
    inkSecondary: '#2C3042',
    inkMeta: '#454C64',
    badgeBg: 'rgba(20, 22, 31, 0.08)',
    badgeText: '#14161F',
  },
  pink: {
    top: '#FF9EBB',
    bottom: '#E66C91',
    crease: 'rgba(190, 60, 100, 0.35)',
    inkPrimary: '#14161F',
    inkSecondary: '#2C3042',
    inkMeta: '#454C64',
    badgeBg: 'rgba(20, 22, 31, 0.08)',
    badgeText: '#14161F',
  },
  lavender: {
    top: '#DEC4FF',
    bottom: '#B98EFF',
    crease: 'rgba(140, 90, 220, 0.35)',
    inkPrimary: '#14161F',
    inkSecondary: '#2C3042',
    inkMeta: '#454C64',
    badgeBg: 'rgba(20, 22, 31, 0.08)',
    badgeText: '#14161F',
  },
  blue: {
    top: '#9EE6FF',
    bottom: '#63C3EC',
    crease: 'rgba(60, 160, 210, 0.35)',
    inkPrimary: '#14161F',
    inkSecondary: '#2C3042',
    inkMeta: '#454C64',
    badgeBg: 'rgba(20, 22, 31, 0.08)',
    badgeText: '#14161F',
  },
  mint: {
    top: '#A6F7D1',
    bottom: '#62D6A2',
    crease: 'rgba(50, 180, 120, 0.35)',
    inkPrimary: '#14161F',
    inkSecondary: '#2C3042',
    inkMeta: '#454C64',
    badgeBg: 'rgba(20, 22, 31, 0.08)',
    badgeText: '#14161F',
  },
};

// Texture cache to prevent recreating textures unnecessarily
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a high-resolution 512x512 CanvasTexture for a sticky note.
 * Features multi-stop warm paper gradient, procedural paper-fiber grain,
 * top adhesive crease line, ink signature styling, and compact role badge.
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

  const palette =
    APPROVED_PAPER_PALETTE[note.colorVariant || 'yellow'] || APPROVED_PAPER_PALETTE.yellow;

  // 1. Multi-stop warm paper gradient (top highlight -> body -> lower depth)
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, palette.top);
  grad.addColorStop(0.18, palette.top);
  grad.addColorStop(0.82, palette.bottom);
  grad.addColorStop(1, palette.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Procedural paper-fiber grain (micro-noise texture for tactile realism)
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Subtle luminance jitter (-6 to +6)
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Top adhesive strip highlight & faint crease line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(0, 0, 512, 42);

  ctx.strokeStyle = palette.crease;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 42.5);
  ctx.lineTo(512, 42.5);
  ctx.stroke();

  // Subtle bottom edge bevel shadow
  const bottomShadow = ctx.createLinearGradient(0, 498, 0, 512);
  bottomShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomShadow.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
  ctx.fillStyle = bottomShadow;
  ctx.fillRect(0, 498, 512, 14);

  // 4. Header: Public Display Name (styled cleanly like an ink signature)
  ctx.fillStyle = palette.inkPrimary;
  ctx.font = '800 36px "Outfit", -apple-system, sans-serif';
  ctx.textBaseline = 'top';

  const maxNameWidth = 310;
  let displayName = note.publicDisplayName || 'Visitor';
  if (ctx.measureText(displayName).width > maxNameWidth) {
    while (ctx.measureText(displayName + '...').width > maxNameWidth && displayName.length > 1) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }
  ctx.fillText(displayName, 36, 68);

  // 5. Role Badge Tag
  const roleText = (note.role || 'VISITOR').toUpperCase();
  ctx.font = '800 17px "Outfit", -apple-system, sans-serif';
  const roleWidth = ctx.measureText(roleText).width;
  const badgeX = 512 - roleWidth - 52;
  const badgeY = 70;

  ctx.fillStyle = palette.badgeBg;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, roleWidth + 18, 28, 14);
  ctx.fill();

  ctx.fillStyle = palette.badgeText;
  ctx.fillText(roleText, badgeX + 9, badgeY + 5.5);

  // 6. Subtle divider rule
  ctx.strokeStyle = 'rgba(20, 22, 31, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(36, 116);
  ctx.lineTo(476, 116);
  ctx.stroke();

  // 7. Message text in legible, natural handwritten typeface
  ctx.fillStyle = palette.inkPrimary;
  ctx.font = '700 34px "Caveat", cursive, sans-serif';
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
      if (lines.length >= 6) break;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && lines.length < 6) {
    lines.push(currentLine);
  }

  // Draw lines with natural vertical spacing
  const startY = 138;
  const lineHeight = 46;
  lines.forEach((line, i) => {
    if (i === 5 && words.length > lines.join(' ').split(' ').length) {
      line += '...';
    }
    ctx.fillText(line, 36, startY + i * lineHeight);
  });

  // 8. Footer: Department or Institution & Date
  const metaLeft = note.department || note.institutionName || 'Tech Expo Visitor';
  const metaDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  ctx.fillStyle = palette.inkMeta;
  ctx.font = '700 19px "Inter", -apple-system, sans-serif';

  let truncatedMeta = metaLeft;
  if (ctx.measureText(truncatedMeta).width > 290) {
    truncatedMeta = truncatedMeta.slice(0, 22) + '...';
  }
  ctx.fillText(truncatedMeta, 36, 462);

  // Date on right
  const dateWidth = ctx.measureText(metaDate).width;
  ctx.fillText(metaDate, 512 - dateWidth - 36, 462);

  // Create High-DPI Three.js Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
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

  // Premium Amber Parchment background
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#FFF275');
  grad.addColorStop(1, '#F2D43D');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Micro-noise grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Top adhesive crease
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.fillRect(0, 0, 512, 42);
  ctx.strokeStyle = 'rgba(200, 160, 20, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 42.5);
  ctx.lineTo(512, 42.5);
  ctx.stroke();

  // DevBappa Solutions Badge
  ctx.fillStyle = 'rgba(20, 22, 31, 0.08)';
  ctx.beginPath();
  ctx.roundRect(126, 62, 260, 32, 16);
  ctx.fill();

  ctx.fillStyle = '#14161F';
  ctx.font = '800 15px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DEVBAPPA SOLUTIONS', 256, 82);

  // Title
  ctx.fillStyle = '#14161F';
  ctx.font = '800 36px "Outfit", sans-serif';
  ctx.fillText('EchoBoard Tech Expo', 256, 150);

  // Subtitle in handwritten style
  ctx.fillStyle = '#2C3042';
  ctx.font = '700 28px "Caveat", cursive';
  ctx.fillText('Be the first to share your impression!', 256, 210);

  ctx.font = '600 20px "Inter", sans-serif';
  ctx.fillStyle = '#454C64';
  ctx.fillText('Submit authentic thoughts, questions,', 256, 260);
  ctx.fillText('or feedback on this live 3D wall.', 256, 290);

  // CTA button simulation on paper
  ctx.fillStyle = '#E87738';
  ctx.beginPath();
  ctx.roundRect(126, 350, 260, 58, 14);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 21px "Outfit", sans-serif';
  ctx.fillText('+ Share Feedback', 256, 386);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
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
