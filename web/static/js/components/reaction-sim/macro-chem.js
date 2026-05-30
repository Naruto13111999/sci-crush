import { lerp, clamp } from './colors.js';
import { drawFlame, drawShadow } from './draw-lib.js';
import {
  cameraTransform, withCamera, drawZoomHUD, drawElectronsOnWire,
  drawCurrentArrow, pointOnWire, easeZoom,
} from './zoom-camera.js';

/** Lab wide → circuit → beaker micro (electrolysis / current) */
export function drawElectrolysisZoom(ctx, W, H, s, demo, animTime, helpers) {
  const isWater = /water/i.test(demo.id);
  const isCu = /cuso4|plating|chromium/i.test(demo.id);
  const zoom = s.zoom ?? 0;
  const beakerFocusX = W * 0.5;
  const beakerFocusY = H * 0.54;
  const cam = cameraTransform(W, H, zoom, beakerFocusX, beakerFocusY, 4.8);
  const macroAlpha = clamp(1 - easeZoom(zoom) * 1.2, 0, 1);

  drawLabWide(ctx, W, H, macroAlpha);

  const wires = getCircuitWires(W, H);

  if (macroAlpha > 0.05 && s.currentOn > 0) {
    drawElectronsOnWire(ctx, wires, s.electronFlow ?? s.currentOn, animTime);
    drawCurrentArrow(ctx, W * 0.18, H * 0.38, W * 0.32, H * 0.38, s.currentOn * 0.8);
  }

  withCamera(ctx, cam, () => {
    drawElectrolysisBeaker(ctx, beakerFocusX, beakerFocusY, s, isWater, isCu, animTime);
  });

  const phase = zoom < 0.3 ? 'Lab setup — battery & wires'
    : zoom < 0.62 ? 'Current flowing through circuit'
    : isWater ? 'Water splitting — H₂ & O₂ bubbles' : 'Electrolysis at electrodes';
  drawZoomHUD(ctx, W, H, zoom, phase, s.currentOn > 0 ? '⚡ Electrons moving →' : 'Connecting circuit…');
}

function drawLabWide(ctx, W, H, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#37474F';
  ctx.fillRect(W * 0.12, H * 0.3, 36, 52);
  ctx.fillStyle = '#EF5350';
  ctx.fillRect(W * 0.14, H * 0.32, 8, 20);
  ctx.fillStyle = '#212121';
  ctx.fillRect(W * 0.22, H * 0.32, 8, 20);
  ctx.font = '8px sans-serif';
  ctx.fillStyle = '#B0BEC5';
  ctx.fillText('DC', W * 0.17, H * 0.28);
  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W * 0.22, H * 0.38);
  ctx.lineTo(W * 0.32, H * 0.38);
  ctx.lineTo(W * 0.32, H * 0.48);
  ctx.lineTo(W * 0.42, H * 0.48);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W * 0.12, H * 0.42);
  ctx.lineTo(W * 0.12, H * 0.52);
  ctx.lineTo(W * 0.42, H * 0.52);
  ctx.stroke();
  ctx.restore();
}

function getCircuitWires(W, H) {
  return [
    { x1: W * 0.22, y1: H * 0.38, x2: W * 0.32, y2: H * 0.38 },
    { x1: W * 0.32, y1: H * 0.38, x2: W * 0.32, y2: H * 0.48 },
    { x1: W * 0.32, y1: H * 0.48, x2: W * 0.42, y2: H * 0.48 },
    { x1: W * 0.42, y1: H * 0.48, x2: W * 0.42, y2: H * 0.52 },
    { x1: W * 0.12, y1: H * 0.42, x2: W * 0.12, y2: H * 0.52 },
    { x1: W * 0.12, y1: H * 0.52, x2: W * 0.42, y2: H * 0.52 },
  ];
}

function drawElectrolysisBeaker(ctx, cx, cy, s, isWater, isCu, t) {
  const w = 168, h = 104;
  drawShadow(ctx, cx - w / 2, cy - h / 2, w, h);
  drawGlassBeakerLocal(ctx, cx, cy, w, h, s, isWater, isCu, t);

  const x = cx - w / 2, y = cy - h / 2;
  const drawElectrode = (ex, col, sign) => {
    ctx.fillStyle = '#90A4AE';
    ctx.fillRect(ex - 3, y + 8, 6, h - 18);
    if (s.currentOn > 0) {
      ctx.shadowColor = col;
      ctx.shadowBlur = 12 * s.currentOn;
      ctx.fillStyle = col;
      ctx.fillRect(ex - 5, y + 4, 10, 8);
      ctx.shadowBlur = 0;
    }
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.fillText(sign, ex, y - 4);
  };
  drawElectrode(x + 28, '#42A5F5', 'Cathode −');
  drawElectrode(x + w - 28, '#EF5350', 'Anode +');

  if (s.currentOn > 0.25) {
    ctx.strokeStyle = `rgba(255,213,79,${s.currentOn * 0.6})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x + 28, y - 12);
    ctx.lineTo(x + w - 28, y - 12);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (isCu && s.cathodeDeposit > 0) {
    ctx.globalAlpha = s.cathodeDeposit;
    ctx.fillStyle = '#B45309';
    ctx.fillRect(x + 22, y + h - 28 - s.cathodeDeposit * 22, 12, s.cathodeDeposit * 24);
    ctx.globalAlpha = 1;
  }

  if (s.h2Intensity > 0) helpersBubble(ctx, x + 28, y + h - 30, s.h2Intensity, t, '#E3F2FD');
  if (s.o2Intensity > 0) helpersBubble(ctx, x + w - 28, y + h - 30, s.o2Intensity, t, '#FFCCBC');

  if (isWater && s.boilActivity > 0) {
    drawWaterAgitation(ctx, cx, cy, w, h, s.boilActivity, t);
  }
}

function helpersBubble(ctx, ex, baseY, intensity, t, color) {
  for (let i = 0; i < Math.floor(intensity * 8); i++) {
    const bx = ex + Math.sin(t * 4 + i * 1.7) * 6;
    const by = baseY - ((t * 40 + i * 11) % 35) * intensity;
    ctx.globalAlpha = intensity * 0.7;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx, by, 2 + intensity * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawGlassBeakerLocal(ctx, cx, cy, w, h, s, isWater, isCu, t) {
  const x = cx - w / 2, y = cy - h / 2;
  const temp = s.boilActivity ?? 0;
  let liq = isCu ? '#2563EB' : '#42A5F5';
  if (isWater) liq = lerpColor('#64B5F6', '#29B6F6', temp * 0.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x + 8, y, w - 16, h - 8);
  const ly = y + h - 14;
  const lg = ctx.createLinearGradient(x, ly - 60, x, ly);
  lg.addColorStop(0, liq);
  lg.addColorStop(1, isWater ? '#1565C0' : liq);
  ctx.fillStyle = lg;
  ctx.globalAlpha = 0.88;
  ctx.fillRect(x + 10, ly - (h - 24), w - 20, h - 24);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x + 12, y + 6, 4, h - 28);
}

function drawWaterAgitation(ctx, cx, cy, w, h, activity, t) {
  const surfaceY = cy - h / 2 + 18;
  ctx.strokeStyle = `rgba(255,255,255,${activity * 0.35})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    const sx = cx - w / 2 + 20 + i * 22;
    ctx.moveTo(sx, surfaceY);
    ctx.quadraticCurveTo(sx + 8, surfaceY - 3 - activity * 4 * Math.sin(t * 5 + i), sx + 16, surfaceY);
    ctx.stroke();
  }
  for (let i = 0; i < Math.floor(activity * 6); i++) {
    ctx.globalAlpha = activity * 0.4;
    ctx.fillStyle = '#B0BEC5';
    ctx.beginPath();
    ctx.arc(cx + Math.sin(t + i) * 20, surfaceY - 20 - (t * 30 + i * 8) % 25, 3 + activity * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function lerpColor(a, b, t) {
  return t < 0.5 ? a : b;
}

/** Beaker on burner — water heating → boiling */
export function drawBoilingWaterSetup(ctx, W, H, s, animTime) {
  const zoom = s.zoom ?? 0;
  const cx = W * 0.5;
  const cy = H * 0.5;
  const cam = cameraTransform(W, H, zoom, cx, cy + 10, 3.5);
  const macroAlpha = clamp(1 - easeZoom(zoom) * 1.1, 0, 1);

  if (macroAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = macroAlpha;
    ctx.fillStyle = '#455A64';
    ctx.fillRect(W * 0.15, H * 0.15, W * 0.7, H * 0.55);
    ctx.fillStyle = '#546E7A';
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#90A4AE';
    ctx.textAlign = 'center';
    ctx.fillText('Chemistry lab — heating water', W / 2, H * 0.22);
    ctx.restore();
  }

  withCamera(ctx, cam, () => {
    drawShadow(ctx, cx - 50, cy - 20, 100, 120);
    drawFlame(ctx, cx, cy + 58, s.flameIntensity ?? 0, s.flameType ?? 'blue', animTime);
    drawBoilingBeaker(ctx, cx, cy, s, animTime);
  });

  const label = zoom < 0.35 ? 'Bunsen burner lit — heat transfers to beaker'
    : s.boilPhase > 0.6 ? 'Rolling boil — vapour (steam) rises'
    : s.boilPhase > 0.2 ? 'Nucleation — bubbles form at bottom' : 'Water warming — convection currents';
  drawZoomHUD(ctx, W, H, zoom, label, `Temp ↑  ${Math.round((s.boilPhase ?? 0) * 100)}°C scale`);
}

function drawBoilingBeaker(ctx, cx, cy, s, t) {
  const w = 100, h = 120;
  const x = cx - w / 2, y = cy - h / 2 + 10;
  const boil = s.boilPhase ?? 0;
  const temp = s.heatLevel ?? boil;

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 8, y + h - 12);
  ctx.lineTo(x + w - 8, y + h - 12);
  ctx.lineTo(x + w - 8, y);
  ctx.stroke();

  const waterTop = y + h - 14 - (h - 30) * 0.62;
  const wg = ctx.createLinearGradient(x, waterTop, x, y + h - 14);
  wg.addColorStop(0, lerpColor('#90CAF9', '#42A5F5', temp));
  wg.addColorStop(0.7, lerpColor('#42A5F5', '#1E88E5', temp));
  wg.addColorStop(1, '#1565C0');
  ctx.fillStyle = wg;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x + 10, waterTop, w - 20, y + h - 14 - waterTop);
  ctx.globalAlpha = 1;

  if (temp > 0.15) {
    ctx.strokeStyle = `rgba(255,255,255,${temp * 0.25})`;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 25 + i * 22, waterTop + 15);
      ctx.bezierCurveTo(x + 30 + i * 22, waterTop + 5, x + 35 + i * 22, waterTop + 25, x + 40 + i * 22, waterTop + 15);
      ctx.stroke();
    }
  }

  const bubbleRate = boil;
  for (let i = 0; i < Math.floor(bubbleRate * 14); i++) {
    const bx = x + 18 + (i * 17) % (w - 36);
    const rise = ((t * (30 + boil * 40) + i * 13) % (y + h - 14 - waterTop - 5));
    const by = y + h - 16 - rise;
    const r = 1.5 + boil * 3 * (0.5 + (i % 3) / 3);
    ctx.globalAlpha = 0.35 + boil * 0.45;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.fillStyle = 'rgba(200,230,255,0.15)';
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (boil > 0.45) {
    for (let i = 0; i < Math.floor(boil * 5); i++) {
      ctx.globalAlpha = boil * 0.35;
      ctx.fillStyle = '#CFD8DC';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(t + i * 2) * 15, waterTop - 15 - ((t * 25 + i * 10) % 30), 4 + boil * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

export function applyElectrolysisZoomVisual(visual, p, s) {
  switch (visual) {
    case 'mix':
      s.zoom = Math.max(s.zoom ?? 0, p * 0.32);
      s.currentOn = Math.max(s.currentOn ?? 0, p * 0.15);
      break;
    case 'electric':
      s.zoom = Math.max(s.zoom ?? 0, 0.32 + p * 0.34);
      s.currentOn = Math.max(s.currentOn ?? 0, p);
      s.electronFlow = Math.max(s.electronFlow ?? 0, p);
      s.boilActivity = Math.max(s.boilActivity ?? 0, p * 0.25);
      break;
    case 'react':
    case 'displace':
      s.zoom = Math.max(s.zoom ?? 0, 0.66 + p * 0.22);
      s.currentOn = Math.max(s.currentOn ?? 0, 0.85 + p * 0.15);
      s.electronFlow = 1;
      s.h2Intensity = Math.max(s.h2Intensity ?? 0, p * 0.85);
      s.o2Intensity = Math.max(s.o2Intensity ?? 0, p * 0.55);
      s.boilActivity = Math.max(s.boilActivity ?? 0, 0.25 + p * 0.45);
      if (visual === 'displace') s.cathodeDeposit = Math.max(s.cathodeDeposit ?? 0, p * 0.6);
      break;
    case 'product':
      s.zoom = Math.max(s.zoom ?? 0, 0.88 + p * 0.12);
      s.currentOn = 1;
      s.electronFlow = 1;
      s.h2Intensity = Math.max(s.h2Intensity ?? 0, 0.85 + p * 0.15);
      s.o2Intensity = Math.max(s.o2Intensity ?? 0, 0.65 + p * 0.35);
      s.boilActivity = Math.max(s.boilActivity ?? 0, 0.6 + p * 0.4);
      s.cathodeDeposit = Math.max(s.cathodeDeposit ?? 0, 0.6 + p * 0.4);
      s.liquidFade = Math.max(s.liquidFade ?? 0, p * 0.45);
      break;
    default:
      s.currentOn = Math.max(s.currentOn ?? 0, p * 0.5);
  }
}

export function applyBoilingVisual(visual, p, s) {
  switch (visual) {
    case 'mix':
      s.zoom = Math.max(s.zoom ?? 0, p * 0.35);
      s.flameIntensity = Math.max(s.flameIntensity ?? 0, p * 0.4);
      s.heatLevel = Math.max(s.heatLevel ?? 0, p * 0.2);
      break;
    case 'heat':
    case 'react':
      s.zoom = Math.max(s.zoom ?? 0, 0.35 + p * 0.35);
      s.flameIntensity = Math.max(s.flameIntensity ?? 0, 0.4 + p * 0.6);
      s.flameType = 'blue';
      s.heatLevel = Math.max(s.heatLevel ?? 0, 0.2 + p * 0.5);
      s.boilPhase = Math.max(s.boilPhase ?? 0, p * 0.35);
      break;
    case 'product':
      s.zoom = Math.max(s.zoom ?? 0, 0.7 + p * 0.3);
      s.flameIntensity = Math.max(s.flameIntensity ?? 0, 0.7);
      s.heatLevel = 1;
      s.boilPhase = Math.max(s.boilPhase ?? 0, 0.35 + p * 0.65);
      break;
    default:
      s.flameIntensity = Math.max(s.flameIntensity ?? 0, p * 0.5);
  }
}
