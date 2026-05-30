import { lerp } from './colors.js';
import {
  drawForceArrow, drawWoodBlock, drawNailInWood, drawShadow,
  drawMoonPhase, drawLightningBolt,
} from './draw-lib.js';
import {
  drawSoundZoomScene, applySoundZoomVisual,
  drawLightZoomScene, applyLightZoomVisual,
  drawPressureZoomScene, applyPressureZoomVisual,
} from './macro-physics.js';

export function createPhysicsState() {
  return {
    zoom: 0,
    forceApplied: 0, fingerPress: 0, nailPress: 0, woodCrack: 0,
    footPush: 0, frictionArrow: 0, brakeForce: 0,
    waveProgress: 0, bellVibrate: 0,
    rayIn: 0, raySplit: 0, spectrum: 0,
    cloudCharge: 0, bolt: 0, thunder: 0,
    moonPhase: 0, orbitAngle: 0,
    camelFoot: 0, sandDepress: 0,
  };
}

export function applyPhysicsVisual(scene, visual, p, s) {
  switch (scene) {
    case 'pressure':
      applyPressureZoomVisual(visual, p, s);
      break;
    case 'friction':
      if (visual === 'mix') s.footPush = Math.max(s.footPush, p * 0.5);
      else if (visual === 'react') { s.footPush = 1; s.frictionArrow = Math.max(s.frictionArrow, p); }
      else { s.brakeForce = Math.max(s.brakeForce, p); s.frictionArrow = Math.max(s.frictionArrow, p); }
      break;
    case 'sound':
      applySoundZoomVisual(visual, p, s);
      break;
    case 'light':
      applyLightZoomVisual(visual, p, s);
      break;
    case 'lightning':
      if (visual === 'mix') s.cloudCharge = Math.max(s.cloudCharge, p);
      else if (visual === 'react') { s.cloudCharge = 1; s.bolt = Math.max(s.bolt, p); }
      else { s.bolt = 1; s.thunder = Math.max(s.thunder, p); }
      break;
    case 'moon-phases':
      if (visual === 'mix') s.moonPhase = Math.max(s.moonPhase, p * 0.25);
      else if (visual === 'react') { s.moonPhase = Math.max(s.moonPhase, 0.25 + p * 0.35); s.orbitAngle = Math.max(s.orbitAngle, p); }
      else { s.moonPhase = Math.max(s.moonPhase, 0.6 + p * 0.4); s.orbitAngle = Math.max(s.orbitAngle, 0.5 + p * 0.5); }
      break;
    case 'camel-pressure':
      s.camelFoot = Math.max(s.camelFoot, p);
      s.sandDepress = Math.max(s.sandDepress, p * 0.35);
      break;
    default:
      s.forceApplied = Math.max(s.forceApplied, p);
  }
}

export function drawPhysicsScene(ctx, W, H, s, scene, helpers, animTime) {
  const cx = W * 0.5;

  switch (scene) {
    case 'pressure':
      drawPressureZoomScene(ctx, W, H, s, {
        drawWoodBlock, drawNailInWood, drawForceArrow, drawShadow,
      });
      break;
    case 'camel-pressure':
      ctx.fillStyle = '#FFE082';
      ctx.fillRect(0, H * 0.58, W, H * 0.2);
      const fw = lerp(80, 140, s.camelFoot);
      ctx.fillStyle = '#8D6E63';
      ctx.beginPath();
      ctx.ellipse(cx, H * 0.52 - s.sandDepress * 8, fw / 2, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6D4C41';
      ctx.fillRect(cx - 20, H * 0.38, 40, 30);
      helpers.label(cx, H * 0.82, 'Wide foot → low pressure on sand', '#FFCC80');
      break;
    case 'friction':
      ctx.fillStyle = '#78909C';
      ctx.fillRect(0, H * 0.62, W, H * 0.15);
      ctx.fillStyle = '#FFCCBC';
      ctx.fillRect(cx - 15, H * 0.45, 30, 40);
      ctx.fillRect(cx - 25, H * 0.52, 18, 8);
      if (s.footPush > 0) drawForceArrow(ctx, cx, H * 0.58, cx - 40 * s.footPush, H * 0.58, '#42A5F6', 'Push', 2);
      if (s.frictionArrow > 0) drawForceArrow(ctx, cx - 25, H * 0.58, cx + 15, H * 0.58, '#66BB6A', 'Friction', 2);
      if (s.brakeForce > 0) {
        ctx.fillStyle = '#455A64';
        ctx.fillRect(cx + 40, H * 0.5, 60, 30);
        drawForceArrow(ctx, cx + 70, H * 0.65, cx + 30, H * 0.65, '#EF5350', 'Brake', 3);
      }
      helpers.label(cx, H * 0.85, 'Friction opposes motion — enables walking & stopping', '#90CAF9');
      break;
    case 'sound':
      drawSoundZoomScene(ctx, W, H, s, animTime);
      break;
    case 'light':
      drawLightZoomScene(ctx, W, H, s, animTime);
      break;
    case 'lightning':
      ctx.fillStyle = `rgba(69,90,100,${0.5 + s.cloudCharge * 0.4})`;
      ctx.beginPath();
      ctx.arc(cx - 40, H * 0.28, 45, 0, Math.PI * 2);
      ctx.arc(cx + 20, H * 0.22, 55, 0, Math.PI * 2);
      ctx.fill();
      drawLightningBolt(ctx, cx + 10, H * 0.35, H * 0.45, s.bolt);
      if (s.thunder > 0) {
        ctx.globalAlpha = s.thunder * 0.45;
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      helpers.label(cx, H * 0.88, 'Charge separation → lightning → thunder', '#FFEE58');
      break;
    case 'moon-phases':
      ctx.fillStyle = '#FDD835';
      ctx.beginPath();
      ctx.arc(W * 0.82, H * 0.22, 22, 0, Math.PI * 2);
      ctx.fill();
      const mx = cx + Math.cos(s.orbitAngle * Math.PI * 2) * 80;
      const my = H * 0.45 + Math.sin(s.orbitAngle * Math.PI * 2) * 15;
      drawMoonPhase(ctx, mx, my, 28, s.moonPhase);
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.arc(cx, H * 0.48, 18, 0, Math.PI * 2);
      ctx.fill();
      helpers.label(cx, H * 0.72, 'Earth');
      helpers.label(mx, my + 42, `Moon phase ${Math.round(s.moonPhase * 100)}% lit`, '#CFD8DC');
      break;
    default:
      helpers.label(cx, H * 0.5, 'Physics simulation', '#90CAF9');
  }
}

export const PHYSICS_SCENES = ['pressure', 'camel-pressure', 'friction', 'sound', 'light', 'lightning', 'moon-phases'];
