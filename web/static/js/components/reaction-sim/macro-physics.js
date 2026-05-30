import { lerp, clamp } from './colors.js';
import { drawSoundWaves } from './draw-lib.js';
import { cameraTransform, withCamera, drawZoomHUD, easeZoom } from './zoom-camera.js';

/** Classroom → bell close-up → sound waves */
export function drawSoundZoomScene(ctx, W, H, s, animTime) {
  const zoom = s.zoom ?? 0;
  const bellX = W * 0.55;
  const bellY = H * 0.48;
  const cam = cameraTransform(W, H, zoom, bellX, bellY, 4.2);
  const macroAlpha = clamp(1 - easeZoom(zoom) * 1.15, 0, 1);

  drawClassroom(ctx, W, H, macroAlpha);

  withCamera(ctx, cam, () => {
    const vib = s.bellVibrate * (1 + 0.15 * Math.sin(animTime * 22));
    ctx.fillStyle = '#FFC107';
    ctx.shadowColor = '#FFD54F';
    ctx.shadowBlur = 8 + vib * 6;
    ctx.beginPath();
    ctx.arc(bellX, bellY, 24 + vib * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FF8F00';
    ctx.fillRect(bellX - 4, bellY - 32, 8, 14);
    if (s.waveProgress > 0) drawSoundWaves(ctx, bellX + 30, bellY, s.waveProgress, animTime);
  });

  const label = zoom < 0.32 ? 'Classroom — bell on wall'
    : zoom < 0.62 ? 'Bell vibrates when struck' : 'Sound waves travel through air';
  drawZoomHUD(ctx, W, H, zoom, label, '');
}

function drawClassroom(ctx, W, H, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#78909C';
  ctx.fillRect(0, 0, W, H * 0.65);
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(0, H * 0.65, W, H * 0.35);
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(W * 0.08, H * 0.2, W * 0.84, H * 0.38);
  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#B0BEC5';
  ctx.textAlign = 'center';
  ctx.fillText('Physics lab / classroom', W / 2, H * 0.16);
  ctx.restore();
}

export function applySoundZoomVisual(visual, p, s) {
  switch (visual) {
    case 'mix':
      s.zoom = Math.max(s.zoom ?? 0, p * 0.32);
      s.bellVibrate = Math.max(s.bellVibrate, p * 0.3);
      break;
    case 'react':
      s.zoom = Math.max(s.zoom ?? 0, 0.32 + p * 0.38);
      s.bellVibrate = Math.max(s.bellVibrate, 0.3 + p * 0.7);
      s.waveProgress = Math.max(s.waveProgress, p * 0.5);
      break;
    case 'product':
      s.zoom = Math.max(s.zoom ?? 0, 0.7 + p * 0.3);
      s.bellVibrate = 1;
      s.waveProgress = Math.max(s.waveProgress, 0.5 + p * 0.5);
      break;
    default:
      s.bellVibrate = Math.max(s.bellVibrate, p);
  }
}

/** Sunlight → prism close → spectrum */
export function drawLightZoomScene(ctx, W, H, s, animTime) {
  const zoom = s.zoom ?? 0;
  const prismX = W * 0.5;
  const prismY = H * 0.52;
  const cam = cameraTransform(W, H, zoom, prismX, prismY, 3.8);
  const macroAlpha = clamp(1 - easeZoom(zoom) * 1.1, 0, 1);

  if (macroAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = macroAlpha;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1565C0');
    sky.addColorStop(1, '#90CAF9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(W * 0.82, H * 0.18, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  withCamera(ctx, cam, () => {
    if (s.rayIn > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${s.rayIn})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FFF';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(prismX - 80, prismY - 40);
      ctx.lineTo(prismX - 15, prismY - 5);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(prismX, prismY - 36);
    ctx.lineTo(prismX - 28, prismY + 22);
    ctx.lineTo(prismX + 28, prismY + 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const SPECTRUM = ['#9400D3', '#0000FF', '#00FF00', '#FFFF00', '#FF0000'];
    if (s.raySplit > 0) {
      SPECTRUM.forEach((col, i) => {
        const ang = -0.25 + i * 0.12;
        ctx.globalAlpha = s.spectrum;
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(prismX, prismY + 10);
        ctx.lineTo(prismX + Math.cos(ang) * 100 * s.raySplit, prismY + 10 + Math.sin(ang) * 70 * s.raySplit);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
  });

  drawZoomHUD(ctx, W, H, zoom,
    zoom < 0.35 ? 'Sunlight enters lab' : zoom < 0.65 ? 'White light hits prism' : 'VIBGYOR spectrum',
    '');
}

export function applyLightZoomVisual(visual, p, s) {
  switch (visual) {
    case 'mix': s.zoom = Math.max(s.zoom ?? 0, p * 0.33); s.rayIn = Math.max(s.rayIn, p * 0.5); break;
    case 'react': s.zoom = Math.max(s.zoom ?? 0, 0.33 + p * 0.34); s.rayIn = 1; s.raySplit = Math.max(s.raySplit, p); break;
    case 'product': s.zoom = Math.max(s.zoom ?? 0, 0.67 + p * 0.33); s.raySplit = 1; s.spectrum = Math.max(s.spectrum, p); break;
    default: s.rayIn = Math.max(s.rayIn, p);
  }
}

export function applyPressureZoomVisual(visual, p, s) {
  switch (visual) {
    case 'mix': s.zoom = Math.max(s.zoom ?? 0, p * 0.3); s.forceApplied = Math.max(s.forceApplied, p); break;
    case 'react': s.zoom = Math.max(s.zoom ?? 0, 0.3 + p * 0.4); s.forceApplied = 1; s.fingerPress = Math.max(s.fingerPress, p); s.nailPress = Math.max(s.nailPress, p * 0.5); break;
    case 'product': s.zoom = Math.max(s.zoom ?? 0, 0.7 + p * 0.3); s.nailPress = Math.max(s.nailPress, 0.5 + p * 0.5); s.woodCrack = Math.max(s.woodCrack, p); break;
    default: s.forceApplied = Math.max(s.forceApplied, p);
  }
}

export function drawPressureZoomScene(ctx, W, H, s, helpers) {
  const zoom = s.zoom ?? 0;
  const focusX = W * 0.52;
  const focusY = H * 0.55;
  const cam = cameraTransform(W, H, zoom, focusX, focusY, 4);
  const macroAlpha = clamp(1 - easeZoom(zoom) * 1.1, 0, 1);

  if (macroAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = macroAlpha;
    ctx.fillStyle = '#795548';
    ctx.fillRect(W * 0.2, H * 0.35, W * 0.6, H * 0.4);
    ctx.fillStyle = '#B0BEC5';
    ctx.textAlign = 'center';
    ctx.font = '10px sans-serif';
    ctx.fillText('Workshop — comparing pressure on wood', W / 2, H * 0.28);
    ctx.restore();
  }

  withCamera(ctx, cam, () => {
    const { drawWoodBlock, drawNailInWood, drawForceArrow, drawShadow } = helpers;
    drawWoodBlock(focusX - 60, focusY, 120, 28);
    drawShadow(ctx, focusX - 60, focusY, 120, 28);
    if (s.nailPress > 0) drawNailInWood(ctx, focusX + 35, focusY, s.woodCrack * 12);
    if (s.fingerPress > 0) {
      ctx.fillStyle = '#FFCCBC';
      ctx.beginPath();
      ctx.ellipse(focusX - 35, focusY - 18 - s.fingerPress * 8, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (s.forceApplied > 0) drawForceArrow(ctx, focusX, focusY - 45, focusX, focusY - 18, '#FF7043', '50 N', 3);
  });

  drawZoomHUD(ctx, W, H, zoom, zoom < 0.4 ? 'Same force, different area' : 'P = F / A', '');
}
