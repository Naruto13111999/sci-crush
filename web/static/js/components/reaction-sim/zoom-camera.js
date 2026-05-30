import { clamp, lerp, smooth } from './colors.js';

/** Smooth zoom 0 (wide/macro) → 1 (micro/detail) */
export function easeZoom(t) {
  return smooth(clamp(t, 0, 1));
}

export function cameraTransform(W, H, zoom, focusX, focusY, maxScale = 5) {
  const z = easeZoom(zoom);
  const scale = lerp(1, maxScale, z);
  return {
    scale,
    tx: W / 2 - focusX * scale,
    ty: H / 2 - focusY * scale,
    zoom: z,
  };
}

export function withCamera(ctx, cam, fn) {
  ctx.save();
  ctx.translate(cam.tx, cam.ty);
  ctx.scale(cam.scale, cam.scale);
  fn();
  ctx.restore();
}

export function drawZoomHUD(ctx, W, H, zoom, label, sublabel) {
  const z = easeZoom(zoom);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 148, 36, 6);
  ctx.fill();
  ctx.font = 'bold 10px DM Sans, sans-serif';
  ctx.fillStyle = '#81C784';
  ctx.textAlign = 'left';
  ctx.fillText('🔬 ZOOM', 18, 26);
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '9px DM Sans, sans-serif';
  ctx.fillText(`${Math.round(z * 100)}× cellular`, 18, 38);

  const barW = W - 28;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(14, H - 22, barW, 5);
  const g = ctx.createLinearGradient(14, 0, 14 + barW, 0);
  g.addColorStop(0, '#10B981');
  g.addColorStop(1, '#6366F1');
  ctx.fillStyle = g;
  ctx.fillRect(14, H - 22, barW * z, 5);

  if (label) {
    ctx.font = 'bold 11px DM Sans, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';
    ctx.fillText(label, W / 2, H - 32);
  }
  if (sublabel) {
    ctx.font = '9px DM Sans, sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.fillText(sublabel, W / 2, H - 42);
  }
  ctx.restore();
}

export function drawMagnifierRing(ctx, x, y, r, pulse) {
  ctx.save();
  ctx.strokeStyle = `rgba(99,102,241,${0.35 + pulse * 0.35})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(x, y, r + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/** Point along polyline path segments 0..1 */
export function pointOnWire(segments, t) {
  const total = segments.reduce((s, seg) => {
    const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
    return s + Math.hypot(dx, dy);
  }, 0);
  let rem = t * total;
  for (const seg of segments) {
    const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
    const len = Math.hypot(dx, dy);
    if (rem <= len) {
      const f = len > 0 ? rem / len : 0;
      return { x: seg.x1 + dx * f, y: seg.y1 + dy * f, angle: Math.atan2(dy, dx) };
    }
    rem -= len;
  }
  const last = segments[segments.length - 1];
  return { x: last.x2, y: last.y2, angle: 0 };
}

export function drawElectronsOnWire(ctx, segments, intensity, t, color = '#FFEB3B') {
  if (intensity <= 0) return;
  const count = 4 + Math.floor(intensity * 4);
  for (let i = 0; i < count; i++) {
    const p = (t * (0.35 + intensity * 0.25) + i / count) % 1;
    const pt = pointOnWire(segments, p);
    ctx.save();
    ctx.globalAlpha = 0.55 + intensity * 0.45;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2.5 + intensity, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawCurrentArrow(ctx, x1, y1, x2, y2, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#FFD54F';
  ctx.fillStyle = '#FFD54F';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(ang - 0.45), y2 - 8 * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - 8 * Math.cos(ang + 0.45), y2 - 8 * Math.sin(ang + 0.45));
  ctx.fill();
  ctx.restore();
}
