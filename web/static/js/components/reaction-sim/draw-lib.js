import { clamp, lerp } from './colors.js';

/** Shared high-fidelity drawing helpers */
export function drawShadow(ctx, x, y, w, h, blur = 12) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.filter = `blur(${blur}px)`;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h, w * 0.45, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
}

export function drawForceArrow(ctx, x1, y1, x2, y2, color, label, width = 3) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const hs = 10;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(ang - 0.4), y2 - hs * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - hs * Math.cos(ang + 0.4), y2 - hs * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.font = 'bold 11px DM Sans, sans-serif';
    ctx.fillText(label, (x1 + x2) / 2 + 8, (y1 + y2) / 2 - 6);
  }
  ctx.restore();
}

export function drawTestTube(ctx, cx, top, w, h, liquidColor, fillLevel, label) {
  const x = cx - w / 2;
  drawShadow(ctx, x, top, w, h);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x + 4, top);
  ctx.lineTo(x + 4, top + h - 18);
  ctx.quadraticCurveTo(x + w / 2, top + h + 2, x + w - 4, top + h - 18);
  ctx.lineTo(x + w - 4, top);
  ctx.stroke();
  const ly = top + h - 20 - (h - 28) * fillLevel;
  ctx.fillStyle = liquidColor;
  ctx.globalAlpha = 0.88;
  ctx.beginPath();
  ctx.moveTo(x + 6, ly);
  ctx.lineTo(x + 6, top + h - 20);
  ctx.quadraticCurveTo(x + w / 2, top + h - 2, x + w - 6, top + h - 20);
  ctx.lineTo(x + w - 6, ly);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x + 7, top + 4, 3, h - 30);
  if (label) {
    ctx.font = '10px DM Sans, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, top + h + 16);
  }
  ctx.restore();
}

export function drawFlame(ctx, cx, cy, intensity, type, t = 0) {
  if (intensity <= 0) return;
  const flicker = 1 + Math.sin(t * 14) * 0.08 + Math.sin(t * 23) * 0.05;
  const pal = type === 'blue' ? ['#0D47A1', '#1565C0', '#42A5F5', '#90CAF9']
    : type === 'yellow' ? ['#BF360C', '#E65100', '#FFB300', '#FFEE58']
    : ['#ECEFF1', '#FFFDE7', '#FFFFFF'];
  const fh = (40 + intensity * 30) * flicker;
  for (let i = pal.length - 1; i >= 0; i--) {
    ctx.globalAlpha = intensity * (0.35 + i * 0.18);
    ctx.fillStyle = pal[i];
    const spread = 14 + i * 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx - spread, cy - fh * 0.35, cx - 6, cy - fh, cx + Math.sin(t * 8 + i) * 3, cy - fh - 4);
    ctx.bezierCurveTo(cx + 6, cy - fh, cx + spread, cy - fh * 0.35, cx, cy);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#37474F';
  ctx.fillRect(cx - 18, cy, 36, 15);
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(cx - 7, cy + 15, 14, 10);
}

export function drawSteam(ctx, particles) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life * 0.35;
    ctx.fillStyle = '#B0BEC5';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function drawSoundWaves(ctx, cx, cy, progress, t) {
  for (let i = 0; i < 4; i++) {
    const phase = (progress * 3 + i * 0.25 + t * 0.5) % 1;
    const r = 20 + phase * 100;
    ctx.strokeStyle = `rgba(100,181,246,${(1 - phase) * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -0.5, 0.5);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const px = cx - 80 + i * 35 + Math.sin(t * 3 + i) * progress * 8;
    ctx.fillStyle = `rgba(129,212,250,${0.4 + progress * 0.5})`;
    ctx.beginPath();
    ctx.arc(px, cy, 4 + progress * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPlantCell(ctx, cx, cy, w, h, state) {
  const x = cx - w / 2, y = cy - h / 2;
  ctx.save();
  if (state.cellWall > 0) {
    ctx.strokeStyle = `rgba(76,175,80,${0.3 + state.cellWall * 0.7})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
  }
  ctx.fillStyle = `rgba(129,199,132,${0.15 + state.cytoplasm * 0.25})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(100,181,246,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  if (state.nucleus > 0) {
    const nx = cx, ny = cy;
    ctx.globalAlpha = state.nucleus;
    ctx.fillStyle = '#7E57C2';
    ctx.beginPath();
    ctx.arc(nx, ny, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B39DDB';
    ctx.beginPath();
    ctx.arc(nx - 5, ny - 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#E1BEE7';
    ctx.textAlign = 'center';
    ctx.fillText('Nucleus', nx, ny + 34);
    ctx.globalAlpha = 1;
  }
  if (state.chloroplast > 0) {
    [[x + 30, y + 40], [x + w - 40, y + 55], [x + 45, y + h - 45]].forEach(([px, py], i) => {
      if (state.chloroplast > i * 0.3) {
        ctx.globalAlpha = clamp(state.chloroplast - i * 0.25, 0, 1);
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.ellipse(px, py, 14, 8, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }
  if (state.mitochondria > 0) {
    ctx.globalAlpha = state.mitochondria;
    ctx.fillStyle = '#FF7043';
    ctx.beginPath();
    ctx.ellipse(x + w - 35, y + 35, 12, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (state.vacuole > 0) {
    ctx.globalAlpha = state.vacuole * 0.5;
    ctx.fillStyle = '#4FC3F7';
    ctx.fillRect(x + 15, y + 20, w - 30, h - 40);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function drawAnimalCell(ctx, cx, cy, r, state) {
  ctx.save();
  ctx.fillStyle = `rgba(244,143,177,${0.12 + state.cytoplasm * 0.2})`;
  ctx.strokeStyle = 'rgba(100,181,246,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (state.nucleus > 0) {
    ctx.globalAlpha = state.nucleus;
    ctx.fillStyle = '#7E57C2';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function drawLightRay(ctx, x1, y1, x2, y2, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawPrism(ctx, cx, cy, size) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx - size * 0.75, cy + size * 0.6);
  ctx.lineTo(cx + size * 0.75, cy + size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawMoonPhase(ctx, cx, cy, r, phase) {
  ctx.save();
  ctx.fillStyle = '#CFD8DC';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  const lit = phase;
  ctx.fillStyle = '#FFF9C4';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, -Math.PI / 2, Math.PI / 2);
  if (lit < 0.5) {
    ctx.arc(cx + r * (1 - lit * 2), cy, r, Math.PI / 2, -Math.PI / 2, true);
  } else {
    ctx.arc(cx - r * ((lit - 0.5) * 2), cy, r, -Math.PI / 2, Math.PI / 2, true);
  }
  ctx.fill();
  ctx.restore();
}

export function drawLightningBolt(ctx, x, y, height, progress) {
  if (progress <= 0) return;
  ctx.save();
  ctx.globalAlpha = progress;
  ctx.strokeStyle = '#FFEE58';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#FFF';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const segs = [[8, 25], [-12, 22], [10, 28], [-6, 24], [4, height - 100]];
  let cy = y;
  segs.forEach(([dx, dy]) => {
    if (cy + dy > y + height * progress) return;
    cy += dy;
    ctx.lineTo(x + dx, cy);
  });
  ctx.stroke();
  ctx.restore();
}

export function drawWoodBlock(ctx, x, y, w, h) {
  ctx.fillStyle = '#795548';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + i * (h / 4));
    ctx.lineTo(x + w, y + i * (h / 4));
    ctx.stroke();
  }
}

export function drawNailInWood(ctx, cx, woodY, depth) {
  ctx.fillStyle = '#90A4AE';
  ctx.fillRect(cx - 2, woodY - depth - 40, 4, 40 + depth);
  ctx.beginPath();
  ctx.moveTo(cx, woodY - depth);
  ctx.lineTo(cx - 4, woodY - depth + 8);
  ctx.lineTo(cx + 4, woodY - depth + 8);
  ctx.fill();
}
