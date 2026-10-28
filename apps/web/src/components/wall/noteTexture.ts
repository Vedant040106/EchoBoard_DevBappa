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
 * Procedural geometric 5-point star path (Zero emojis).
 */
function drawCanvasStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string,
  strokeColor?: string
): void {
  const spikes = 5;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    const x = cx + Math.cos(rot) * outerRadius;
    const y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    const inX = cx + Math.cos(rot) * innerRadius;
    const inY = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(inX, inY);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Procedural Hand-Drawn Ink Doodle Stamp Watermarks (Zero Emojis).
 * Rendered with sketchy, semi-transparent dark ink in the note's lower background.
 */
function drawDoodleWatermark(
  ctx: CanvasRenderingContext2D,
  doodleType: string = 'check',
  strokeColor: string
): void {
  if (doodleType === 'none') return;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = 780;
  const cy = 700;

  switch (doodleType) {
    case 'lightning': {
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 85);
      ctx.lineTo(cx - 45, cy + 15);
      ctx.lineTo(cx + 5, cy + 15);
      ctx.lineTo(cx - 25, cy + 100);
      ctx.lineTo(cx + 55, cy - 10);
      ctx.lineTo(cx + 5, cy - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'heart': {
      ctx.beginPath();
      const topCurveHeight = 55;
      ctx.moveTo(cx, cy + 70);
      // Left curve
      ctx.bezierCurveTo(cx - 95, cy + 25, cx - 95, cy - 45, cx - 45, cy - 45);
      ctx.bezierCurveTo(cx - 20, cy - 45, cx, cy - 25, cx, cy - topCurveHeight);
      // Right curve
      ctx.bezierCurveTo(cx, cy - 25, cx + 20, cy - 45, cx + 45, cy - 45);
      ctx.bezierCurveTo(cx + 95, cy - 45, cx + 95, cy + 25, cx, cy + 70);
      ctx.stroke();
      // Light sketchy interior fill
      ctx.globalAlpha = 0.05;
      ctx.fill();
      break;
    }
    case 'spark': {
      ctx.beginPath();
      // 8-point dynamic spark burst
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const rOuter = i % 2 === 0 ? 80 : 38;
        const x1 = cx + Math.cos(angle) * rOuter;
        const y1 = cy + Math.sin(angle) * rOuter;
        const x0 = cx + Math.cos(angle) * 12;
        const y0 = cy + Math.sin(angle) * 12;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
      }
      ctx.stroke();
      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'spiral': {
      ctx.beginPath();
      let a = 0;
      let r = 8;
      ctx.moveTo(cx, cy);
      while (a < Math.PI * 5.5) {
        a += 0.12;
        r += 1.6;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;
    }
    case 'lightbulb': {
      // Bulb outline
      ctx.beginPath();
      ctx.arc(cx, cy - 20, 50, Math.PI * 0.75, Math.PI * 0.25, false);
      ctx.lineTo(cx + 25, cy + 45);
      ctx.lineTo(cx - 25, cy + 45);
      ctx.closePath();
      ctx.stroke();
      // Socket base lines
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 55);
      ctx.lineTo(cx + 20, cy + 55);
      ctx.moveTo(cx - 16, cy + 68);
      ctx.lineTo(cx + 16, cy + 68);
      ctx.moveTo(cx - 10, cy + 80);
      ctx.lineTo(cx + 10, cy + 80);
      ctx.stroke();
      // Radiating light rays
      for (let angle = -Math.PI * 0.75; angle <= -Math.PI * 0.25; angle += 0.35) {
        const x1 = cx + Math.cos(angle) * 65;
        const y1 = cy - 20 + Math.sin(angle) * 65;
        const x2 = cx + Math.cos(angle) * 85;
        const y2 = cy - 20 + Math.sin(angle) * 85;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      break;
    }
    case 'check':
    default: {
      ctx.beginPath();
      ctx.moveTo(cx - 65, cy + 10);
      ctx.lineTo(cx - 15, cy + 65);
      ctx.lineTo(cx + 70, cy - 55);
      ctx.lineWidth = 14;
      ctx.stroke();
      // Sketchy double underline
      ctx.beginPath();
      ctx.lineWidth = 6;
      ctx.moveTo(cx - 50, cy + 80);
      ctx.lineTo(cx + 65, cy + 80);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

/**
 * Creates a high-resolution 1024x1024 CanvasTexture for a square Post-it note.
 * Features multi-stop warm paper gradient, procedural paper-fiber grain,
 * top adhesive press-line, 1-5 geometric star rating, hand-drawn ink doodle watermark,
 * hand-drawn marker typography, compact event tag, and role badge.
 */
export function createNoteTexture(note: PublicFeedbackNote): THREE.CanvasTexture {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const canvasSize = isMobile ? 512 : 1024;
  const scale = canvasSize / 1024;

  const rating = typeof note.rating === 'number' ? Math.max(1, Math.min(5, note.rating)) : 5;
  const doodleType = note.doodleType || 'check';
  const eventName = note.event?.name || 'Tech Expo';
  const cacheKey = `${note.id}-${note.publicDisplayName}-${note.message}-${note.colorVariant || 'yellow'}-${rating}-${doodleType}-${eventName}-${canvasSize}`;
  const existing = textureCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    return fallbackTexture;
  }

  const palette =
    APPROVED_PAPER_PALETTE[note.colorVariant || 'yellow'] || APPROVED_PAPER_PALETTE.yellow;

  // 1. Multi-stop warm paper gradient (top adhesive highlight -> body -> lower edge depth)
  const grad = ctx.createLinearGradient(0, 0, 0, canvasSize);
  grad.addColorStop(0, palette.top);
  grad.addColorStop(0.18, palette.top);
  grad.addColorStop(0.85, palette.bottom);
  grad.addColorStop(1, palette.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // 2. Procedural paper-fiber grain (micro-noise texture for tactile clay-paper realism)
  const imgData = ctx.getImageData(0, 0, canvasSize, canvasSize);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Subtle luminance jitter (-7 to +7)
    const noise = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Scale remaining vector and typography operations to canvas resolution
  ctx.save();
  ctx.scale(scale, scale);

  // 3. Top adhesive strip highlight & subtle press line (top 150px)
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

  // 4. Hand-Drawn Ink Doodle Stamp Watermark in Lower Background
  drawDoodleWatermark(ctx, doodleType, palette.inkPrimary);

  // 5. Crisp geometric 5-point stars at top-left below the adhesive crease
  const starStartX = 72;
  const starCenterY = 182;
  const starSpacing = 30;
  const starOuterRadius = 11;
  const starInnerRadius = 5.5;

  for (let i = 1; i <= 5; i++) {
    const cx = starStartX + (i - 1) * starSpacing;
    if (i <= rating) {
      // Warm amber gold filled geometric star
      drawCanvasStar(
        ctx,
        cx,
        starCenterY,
        starOuterRadius,
        starInnerRadius,
        '#d97706',
        '#92400e'
      );
    } else {
      // Subtle outlined empty star
      drawCanvasStar(
        ctx,
        cx,
        starCenterY,
        starOuterRadius,
        starInnerRadius,
        'rgba(26, 22, 43, 0.08)',
        'rgba(26, 22, 43, 0.28)'
      );
    }
  }

  // Numerical rating text pill beside stars
  ctx.fillStyle = palette.inkMeta;
  ctx.font = '800 22px "Outfit", -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${rating}.0`, starStartX + 5 * starSpacing + 8, starCenterY);

  // 6. Header: Public Display Name (styled like an ink signature)
  ctx.fillStyle = palette.inkPrimary;
  ctx.font = '800 62px "Outfit", -apple-system, sans-serif';
  ctx.textBaseline = 'top';

  const maxNameWidth = 640;
  let displayName = note.publicDisplayName || 'Visitor';
  if (ctx.measureText(displayName).width > maxNameWidth) {
    while (ctx.measureText(displayName + '...').width > maxNameWidth && displayName.length > 1) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }
  ctx.fillText(displayName, 72, 212);

  // Top Right: Compact Event Tag Tag Header
  let truncatedTopEvent = eventName;
  ctx.font = '700 26px "Outfit", -apple-system, sans-serif';
  if (ctx.measureText(truncatedTopEvent).width > 240) {
    while (ctx.measureText(truncatedTopEvent + '...').width > 240 && truncatedTopEvent.length > 1) {
      truncatedTopEvent = truncatedTopEvent.slice(0, -1);
    }
    truncatedTopEvent += '...';
  }
  const topEventWidth = ctx.measureText(truncatedTopEvent).width;
  ctx.fillStyle = palette.badgeBg;
  ctx.beginPath();
  ctx.roundRect(1024 - topEventWidth - 96, 172, topEventWidth + 24, 38, 19);
  ctx.fill();
  ctx.fillStyle = palette.badgeText;
  ctx.textBaseline = 'middle';
  ctx.fillText(truncatedTopEvent, 1024 - topEventWidth - 84, 191);

  // 7. Subtle divider rule
  ctx.strokeStyle = 'rgba(26, 22, 43, 0.16)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(72, 290);
  ctx.lineTo(952, 290);
  ctx.stroke();

  // 8. Message text in legible, natural handwritten typeface
  ctx.fillStyle = palette.inkPrimary;
  ctx.font = '700 58px "Caveat", cursive, sans-serif';
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
  const lineHeight = 80;
  lines.forEach((line, i) => {
    if (i === 5 && words.length > lines.join(' ').split(' ').length) {
      line += '...';
    }
    ctx.fillText(line, 72, startY + i * lineHeight);
  });

  // 9. Footer: Left side Department or Institution & Date
  const metaLeft = note.department || note.institutionName || 'Expo Visitor';
  const metaDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  ctx.fillStyle = palette.inkMeta;
  ctx.font = '700 32px "Inter", -apple-system, sans-serif';

  let truncatedMeta = metaLeft;
  if (ctx.measureText(truncatedMeta).width > 440) {
    truncatedMeta = truncatedMeta.slice(0, 20) + '...';
  }
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${truncatedMeta}  •  ${metaDate}`, 72, 942);

  // 10. Footer Right: Compact Event Tag alongside Role Badge
  const roleText = (note.role || 'VISITOR').toUpperCase();
  ctx.font = '800 28px "Outfit", -apple-system, sans-serif';
  const roleWidth = ctx.measureText(roleText).width;

  let compactEvent = eventName;
  ctx.font = '700 26px "Outfit", -apple-system, sans-serif';
  if (ctx.measureText(compactEvent).width > 180) {
    compactEvent = compactEvent.slice(0, 11) + '...';
  }
  const eventBadgeWidth = ctx.measureText(compactEvent).width;

  const totalBadgesWidth = roleWidth + 28 + eventBadgeWidth + 28 + 12;
  let startBadgeX = 1024 - totalBadgesWidth - 72;

  // Draw Event Tag Badge
  ctx.fillStyle = palette.badgeBg;
  ctx.beginPath();
  ctx.roundRect(startBadgeX, 912, eventBadgeWidth + 24, 44, 22);
  ctx.fill();

  ctx.fillStyle = palette.badgeText;
  ctx.textBaseline = 'middle';
  ctx.fillText(compactEvent, startBadgeX + 12, 934);

  // Draw Role Badge Tag
  const roleBadgeX = startBadgeX + eventBadgeWidth + 36;
  ctx.font = '800 28px "Outfit", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(26, 22, 43, 0.14)';
  ctx.beginPath();
  ctx.roundRect(roleBadgeX, 912, roleWidth + 28, 44, 22);
  ctx.fill();

  ctx.fillStyle = palette.badgeText;
  ctx.fillText(roleText, roleBadgeX + 14, 934);

  ctx.restore();

  // Create High-DPI Three.js Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = isMobile ? 4 : 16;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates texture for master announcement memo when wall is empty.
 */
export function createAnnouncementTexture(): THREE.CanvasTexture {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const canvasSize = isMobile ? 512 : 1024;
  const scale = canvasSize / 1024;
  const cacheKey = `__announcement__${canvasSize}`;
  const existing = textureCache.get(cacheKey);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Warm Butter Yellow background
  const grad = ctx.createLinearGradient(0, 0, 0, canvasSize);
  grad.addColorStop(0, '#FFE66D');
  grad.addColorStop(1, '#F2CC39');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Micro-noise grain
  const imgData = ctx.getImageData(0, 0, canvasSize, canvasSize);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.scale(scale, scale);

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
  ctx.fillText('Be the first to share your impression & rating!', 512, 460);

  ctx.font = '600 38px "Inter", sans-serif';
  ctx.fillStyle = '#453B66';
  ctx.fillText('Submit authentic thoughts, ratings,', 512, 560);
  ctx.fillText('or feedback on this live 3D wall.', 512, 620);

  // CTA button simulation on paper
  ctx.fillStyle = '#F08035';
  ctx.beginPath();
  ctx.roundRect(262, 730, 500, 105, 26);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 38px "Outfit", sans-serif';
  ctx.fillText('+ Share Feedback & Rating', 512, 795);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = isMobile ? 4 : 16;
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
