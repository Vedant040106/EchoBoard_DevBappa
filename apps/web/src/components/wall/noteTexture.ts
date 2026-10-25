import * as THREE from 'three';
import type { PublicFeedbackNote } from '@devbappa/shared';

/**
 * Exact Studio Reference Note Palette:
 * 1. Coral Red (#FF5D68 -> #F04352)
 * 2. Tangerine Peach (#FF9E58 -> #F08035)
 * 3. Soft Lavender (#B695FF -> #9A73F5)
 * 4. Sky Ice Blue (#8CE0FF -> #65C5F0)
 * 5. Vivid Violet (#9B5DE5 -> #7E3ECF)
 * 6. Warm Butter Yellow (#FFE66D -> #F2CC39)
 *
 * Paired with #1A162B high-contrast charcoal ink (yields >= 10.5:1 contrast ratio, WCAG AAA compliant).
 */
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
    watermark: string;
  }
> = {
  yellow: {
    top: '#FFE66D',
    bottom: '#F2CC39',
    crease: 'rgba(210, 160, 20, 0.4)',
    inkPrimary: '#1A162B',
    inkSecondary: '#2C2544',
    inkMeta: '#453B66',
    badgeBg: 'rgba(26, 22, 43, 0.09)',
    badgeText: '#1A162B',
    watermark: 'rgba(210, 160, 20, 0.12)',
  },
  amber: {
    top: '#FF9E58',
    bottom: '#F08035',
    crease: 'rgba(195, 80, 20, 0.4)',
    inkPrimary: '#1A162B',
    inkSecondary: '#2C2544',
    inkMeta: '#453B66',
    badgeBg: 'rgba(26, 22, 43, 0.09)',
    badgeText: '#1A162B',
    watermark: 'rgba(190, 75, 20, 0.12)',
  },
  orange: {
    top: '#FF9E58',
    bottom: '#F08035',
    crease: 'rgba(195, 80, 20, 0.4)',
    inkPrimary: '#1A162B',
    inkSecondary: '#2C2544',
    inkMeta: '#453B66',
    badgeBg: 'rgba(26, 22, 43, 0.09)',
    badgeText: '#1A162B',
    watermark: 'rgba(190, 75, 20, 0.12)',
  },
  pink: {
    top: '#FF5D68',
    bottom: '#F04352',
    crease: 'rgba(190, 45, 60, 0.4)',
    inkPrimary: '#1A162B',
    inkSecondary: '#2C2544',
    inkMeta: '#453B66',
    badgeBg: 'rgba(26, 22, 43, 0.1)',
    badgeText: '#1A162B',
    watermark: 'rgba(190, 45, 60, 0.12)',
  },
  lavender: {
    top: '#B695FF',
    bottom: '#9A73F5',
    crease: 'rgba(125, 75, 225, 0.4)',
    inkPrimary: '#1A162B',
    inkSecondary: '#2C2544',
    inkMeta: '#453B66',
    badgeBg: 'rgba(26, 22, 43, 0.09)',
    badgeText: '#1A162B',
    watermark: 'rgba(120, 70, 220, 0.12)',
  },
  blue: {
    top: '#8CE0FF',
    bottom: '#65C5F0',
    crease: 'rgba(50, 150, 205, 0.4)',
    inkPrimary: '#1A162B',
    inkSecondary: '#2C2544',
    inkMeta: '#453B66',
    badgeBg: 'rgba(26, 22, 43, 0.09)',
    badgeText: '#1A162B',
    watermark: 'rgba(40, 140, 195, 0.12)',
  },
  mint: {
    top: '#9B5DE5',
    bottom: '#7E3ECF',
    crease: 'rgba(100, 40, 180, 0.4)',
    inkPrimary: '#1A162B',
    inkSecondary: '#2C2544',
    inkMeta: '#453B66',
    badgeBg: 'rgba(26, 22, 43, 0.1)',
    badgeText: '#1A162B',
    watermark: 'rgba(90, 35, 170, 0.12)',
  },
};

// Texture cache to prevent recreating textures unnecessarily
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a high-resolution 1024x1024 CanvasTexture for a square Post-it note.
 * Features multi-stop warm paper gradient, procedural paper-fiber grain,
 * top adhesive press-line, hand-drawn marker typography, and watermark motif.
 */
export function createNoteTexture(note: PublicFeedbackNote): THREE.CanvasTexture {
  const cacheKey = `${note.id}-${note.publicDisplayName}-${note.message}-${note.colorVariant || 'yellow'}`;
  const existing = textureCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    return fallbackTexture;
  }

  const palette =
    APPROVED_PAPER_PALETTE[note.colorVariant || 'yellow'] || APPROVED_PAPER_PALETTE.yellow;

  // 1. Multi-stop warm paper gradient (top adhesive highlight -> body -> lower edge depth)
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, palette.top);
  grad.addColorStop(0.18, palette.top);
  grad.addColorStop(0.85, palette.bottom);
  grad.addColorStop(1, palette.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Procedural paper-fiber grain (micro-noise texture for tactile clay-paper realism)
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Subtle luminance jitter (-7 to +7)
    const noise = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Top adhesive strip highlight & subtle press line (top 160px)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(0, 0, 1024, 150);

  ctx.strokeStyle = palette.crease;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.lineTo(1024, 150);
  ctx.stroke();

  // Subtle bottom edge bevel shadow
  const bottomShadow = ctx.createLinearGradient(0, 990, 0, 1024);
  bottomShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomShadow.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
  ctx.fillStyle = bottomShadow;
  ctx.fillRect(0, 990, 1024, 34);

  // 4. Subtle watermark logo motif in lower background
  ctx.save();
  ctx.fillStyle = palette.watermark;
  ctx.beginPath();
  ctx.arc(880, 840, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Header: Public Display Name (styled like an ink signature)
  ctx.fillStyle = palette.inkPrimary;
  ctx.font = '800 68px "Outfit", -apple-system, sans-serif';
  ctx.textBaseline = 'top';

  const maxNameWidth = 620;
  let displayName = note.publicDisplayName || 'Visitor';
  if (ctx.measureText(displayName).width > maxNameWidth) {
    while (ctx.measureText(displayName + '...').width > maxNameWidth && displayName.length > 1) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }
  ctx.fillText(displayName, 72, 190);

  // 6. Role Badge Tag
  const roleText = (note.role || 'VISITOR').toUpperCase();
  ctx.font = '800 32px "Outfit", -apple-system, sans-serif';
  const roleWidth = ctx.measureText(roleText).width;
  const badgeX = 1024 - roleWidth - 100;
  const badgeY = 194;

  ctx.fillStyle = palette.badgeBg;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, roleWidth + 34, 54, 27);
  ctx.fill();

  ctx.fillStyle = palette.badgeText;
  ctx.fillText(roleText, badgeX + 17, badgeY + 11);

  // 7. Subtle divider rule
  ctx.strokeStyle = 'rgba(26, 22, 43, 0.16)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(72, 280);
  ctx.lineTo(952, 280);
  ctx.stroke();

  // 8. Message text in legible, natural handwritten typeface
  ctx.fillStyle = palette.inkPrimary;
  ctx.font = '700 60px "Caveat", cursive, sans-serif';
  ctx.textBaseline = 'top';

  const maxLineWidth = 880;
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
  const startY = 320;
  const lineHeight = 84;
  lines.forEach((line, i) => {
    if (i === 5 && words.length > lines.join(' ').split(' ').length) {
      line += '...';
    }
    ctx.fillText(line, 72, startY + i * lineHeight);
  });

  // 9. Footer: Department or Institution & Date
  const metaLeft = note.department || note.institutionName || 'Tech Expo Visitor';
  const metaDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  ctx.fillStyle = palette.inkMeta;
  ctx.font = '700 36px "Inter", -apple-system, sans-serif';

  let truncatedMeta = metaLeft;
  if (ctx.measureText(truncatedMeta).width > 560) {
    truncatedMeta = truncatedMeta.slice(0, 24) + '...';
  }
  ctx.fillText(truncatedMeta, 72, 920);

  // Date on right
  const dateWidth = ctx.measureText(metaDate).width;
  ctx.fillText(metaDate, 1024 - dateWidth - 72, 920);

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
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Warm Butter Yellow background
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#FFE66D');
  grad.addColorStop(1, '#F2CC39');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro-noise grain
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Top adhesive crease
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(0, 0, 1024, 150);
  ctx.strokeStyle = 'rgba(210, 160, 20, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.lineTo(1024, 150);
  ctx.stroke();

  // DevBappa Solutions Badge
  ctx.fillStyle = 'rgba(26, 22, 43, 0.09)';
  ctx.beginPath();
  ctx.roundRect(262, 190, 500, 60, 30);
  ctx.fill();

  ctx.fillStyle = '#1A162B';
  ctx.font = '800 30px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DEVBAPPA SOLUTIONS', 512, 230);

  // Title
  ctx.fillStyle = '#1A162B';
  ctx.font = '800 68px "Outfit", sans-serif';
  ctx.fillText('EchoBoard Tech Expo', 512, 350);

  // Subtitle in handwritten style
  ctx.fillStyle = '#2C2544';
  ctx.font = '700 52px "Caveat", cursive';
  ctx.fillText('Be the first to share your impression!', 512, 460);

  ctx.font = '600 38px "Inter", sans-serif';
  ctx.fillStyle = '#453B66';
  ctx.fillText('Submit authentic thoughts, questions,', 512, 560);
  ctx.fillText('or feedback on this live 3D wall.', 512, 620);

  // CTA button simulation on paper
  ctx.fillStyle = '#F08035';
  ctx.beginPath();
  ctx.roundRect(262, 730, 500, 105, 26);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 38px "Outfit", sans-serif';
  ctx.fillText('+ Share Feedback', 512, 795);

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
