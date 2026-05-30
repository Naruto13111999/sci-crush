import { lerp, clamp } from './colors.js';
import { drawRealisticPlantCell } from './bio-draw.js';
import { cameraTransform, withCamera, drawZoomHUD, drawMagnifierRing, easeZoom } from './zoom-camera.js';

const LEAF_FOCUS = { x: 0.58, y: 0.44 };

/** Plant → leaf → cell grid → organelle tour */
export function drawPlantCellZoomTour(ctx, W, H, s, animTime) {
  const focusX = W * LEAF_FOCUS.x;
  const focusY = H * LEAF_FOCUS.y;
  const zoom = s.zoom ?? 0;
  const cam = cameraTransform(W, H, zoom, focusX, focusY, 6.2);
  const macroAlpha = clamp(1 - easeZoom(zoom) * 1.35, 0, 1);

  drawOutdoorBackground(ctx, W, H);

  if (macroAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = macroAlpha;
    drawWholePlant(ctx, W * 0.34, H * 0.62, 1);
    if (zoom < 0.25) {
      ctx.font = '11px DM Sans, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      ctx.fillText('Green plant — all living parts are made of cells', W / 2, H * 0.88);
    }
    ctx.restore();
  }

  const ringPulse = 0.5 + Math.sin(animTime * 3) * 0.5;
  if (zoom < 0.55) {
    drawMagnifierRing(ctx, focusX, focusY, 28 + zoom * 40, ringPulse);
  }

  withCamera(ctx, cam, () => {
    const inv = 1 / cam.scale;
    const lw = W * inv;
    const lh = H * inv;

    if (zoom > 0.12 && zoom < 0.72) {
      drawLeafCloseUp(ctx, focusX, focusY, clamp((zoom - 0.12) / 0.35, 0, 1));
    }

    if (zoom > 0.38) {
      const cellAlpha = clamp((zoom - 0.38) / 0.28, 0, 1);
      ctx.save();
      ctx.globalAlpha = cellAlpha * 0.45;
      drawCellTissueGrid(ctx, focusX, focusY, 90);
      ctx.restore();
    }

    if (zoom > 0.52) {
      drawRealisticPlantCell(ctx, focusX, focusY, 168, 122, s);
    }
  });

  const labels = [
    zoom < 0.28 ? 'Macro — whole plant' : zoom < 0.58 ? 'Meso — leaf surface' : 'Micro — inside one cell',
  ];
  drawZoomHUD(ctx, W, H, zoom, labels[0], zoom > 0.52 ? 'Organelles highlighted step by step' : 'Zooming inward…');
}

function drawOutdoorBackground(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.72);
  sky.addColorStop(0, '#1565C0');
  sky.addColorStop(0.55, '#42A5F5');
  sky.addColorStop(1, '#81C784');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.72);
  ctx.fillStyle = '#558B2F';
  ctx.fillRect(0, H * 0.68, W, H * 0.32);
  ctx.fillStyle = 'rgba(67,160,71,0.35)';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(i * (W / 11) - 10, H * 0.7 + (i % 3) * 4, 28, 8);
  }
}

function drawWholePlant(ctx, x, baseY, scale) {
  ctx.fillStyle = '#795548';
  ctx.fillRect(x - 6, baseY - 55 * scale, 12, 55 * scale);
  const lg = ctx.createLinearGradient(x, baseY - 120, x, baseY - 40);
  lg.addColorStop(0, '#1B5E20');
  lg.addColorStop(0.5, '#388E3C');
  lg.addColorStop(1, '#66BB6A');
  ctx.fillStyle = lg;
  for (let i = 0; i < 4; i++) {
    const ly = baseY - (48 + i * 22) * scale;
    ctx.beginPath();
    ctx.ellipse(x + (i % 2 ? 18 : -18) * scale, ly, 38 * scale, 14 * scale, (i - 1) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.ellipse(x + 42 * scale, baseY - 78 * scale, 22 * scale, 32 * scale, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1B5E20';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 42 * scale, baseY - 78 * scale);
  ctx.lineTo(x + 38 * scale, baseY - 50 * scale);
  ctx.stroke();
}

function drawLeafCloseUp(ctx, cx, cy, t) {
  const w = 80 + t * 40;
  const h = 48 + t * 24;
  const lg = ctx.createLinearGradient(cx - w, cy, cx + w, cy);
  lg.addColorStop(0, '#1B5E20');
  lg.addColorStop(0.5, '#43A047');
  lg.addColorStop(1, '#2E7D32');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h / 2, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1B5E20';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.4, cy);
  ctx.quadraticCurveTo(cx, cy - h * 0.35, cx + w * 0.42, cy - h * 0.05);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(27,94,32,0.5)';
  ctx.lineWidth = 0.8;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 12, cy - h * 0.2);
    ctx.lineTo(cx + i * 18, cy + h * 0.15);
    ctx.stroke();
  }
}

function drawCellTissueGrid(ctx, cx, cy, size) {
  const cols = 4, rows = 3;
  const cw = size / cols;
  const ch = size * 0.65 / rows;
  const ox = cx - size / 2;
  const oy = cy - size * 0.32;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const highlight = c === 2 && r === 1;
      ctx.fillStyle = highlight ? 'rgba(129,199,132,0.55)' : 'rgba(76,175,80,0.28)';
      ctx.strokeStyle = highlight ? '#66BB6A' : 'rgba(129,199,132,0.45)';
      ctx.lineWidth = highlight ? 2 : 1;
      ctx.fillRect(ox + c * cw + 1, oy + r * ch + 1, cw - 2, ch - 2);
      ctx.strokeRect(ox + c * cw + 1, oy + r * ch + 1, cw - 2, ch - 2);
      if (highlight) {
        ctx.fillStyle = 'rgba(126,87,192,0.45)';
        ctx.beginPath();
        ctx.arc(ox + c * cw + cw / 2, oy + r * ch + ch / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export function applyPlantCellZoomVisual(visual, p, s) {
  switch (visual) {
    case 'mix':
      s.zoom = Math.max(s.zoom ?? 0, p * 0.34);
      break;
    case 'react':
      s.zoom = Math.max(s.zoom ?? 0, 0.34 + p * 0.33);
      s.cellWall = Math.max(s.cellWall, p * 0.85);
      s.cytoplasm = Math.max(s.cytoplasm, p * 0.7);
      s.nucleus = Math.max(s.nucleus, p * 0.75);
      s.mitochondria = Math.max(s.mitochondria, p * 0.5);
      break;
    case 'product':
      s.zoom = Math.max(s.zoom ?? 0, 0.67 + p * 0.33);
      s.cellWall = 1;
      s.cytoplasm = 1;
      s.nucleus = 1;
      s.chloroplast = Math.max(s.chloroplast, p);
      s.vacuole = Math.max(s.vacuole, p * 0.9);
      s.mitochondria = Math.max(s.mitochondria, 0.85);
      break;
    default:
      s.zoom = Math.max(s.zoom ?? 0, p * 0.5);
  }
}
