import { lerp } from './colors.js';
import { drawAnimalCell } from './draw-lib.js';
import {
  drawFertilizationScene, drawCurdJar, drawHormonePathway,
} from './bio-draw.js';
import { drawPlantCellZoomTour, applyPlantCellZoomVisual } from './macro-bio.js';

export function createBioState(scene) {
  const base = {
    zoom: 0,
    cellWall: 0, cytoplasm: 0, nucleus: 0, chloroplast: 0, mitochondria: 0, vacuole: 0,
    mrnaTravel: 0, ribosome: 0, protein: 0,
    bacteriaCount: 0, curdForm: 0,
    treesLeft: 1, soilLoss: 0, co2Rise: 0,
    eggRelease: 0, spermSwim: 0, penetration: 0, blockOthers: 0, zygoteForm: 0,
    hormoneRelease: 0, hormoneTravel: 0, targetGlow: 0,
    waterFlow: 0, seedGrow: 0,
  };
  return base;
}

export function applyBioVisual(scene, visual, p, s) {
  switch (scene) {
    case 'cell':
      applyPlantCellZoomVisual(visual, p, s);
      break;
    case 'protein-synthesis':
      if (visual === 'mix') s.nucleus = Math.max(s.nucleus, p);
      else if (visual === 'react') { s.mrnaTravel = Math.max(s.mrnaTravel, p); s.nucleus = 1; }
      else { s.mrnaTravel = 1; s.ribosome = Math.max(s.ribosome, p); s.protein = Math.max(s.protein, p * 0.85); }
      break;
    case 'fermentation':
      if (visual === 'mix') s.bacteriaCount = Math.max(s.bacteriaCount, p * 0.25);
      else if (visual === 'react') s.bacteriaCount = Math.max(s.bacteriaCount, 0.25 + p * 0.55);
      else { s.bacteriaCount = 1; s.curdForm = Math.max(s.curdForm, p); }
      break;
    case 'ecosystem':
      if (visual === 'mix') s.treesLeft = 1;
      else if (visual === 'react') { s.treesLeft = lerp(1, 0.35, p); s.soilLoss = Math.max(s.soilLoss, p * 0.5); }
      else { s.treesLeft = lerp(0.35, 0.12, p); s.soilLoss = Math.max(s.soilLoss, 0.5 + p * 0.5); s.co2Rise = Math.max(s.co2Rise, p); }
      break;
    case 'reproduction':
      if (visual === 'mix') s.eggRelease = Math.max(s.eggRelease, p);
      else if (visual === 'react') {
        s.eggRelease = 1;
        s.spermSwim = Math.max(s.spermSwim, p);
        s.penetration = Math.max(s.penetration, p > 0.65 ? (p - 0.65) / 0.35 : 0);
      } else {
        s.spermSwim = 1;
        s.penetration = 1;
        s.blockOthers = Math.max(s.blockOthers, p * 0.8);
        s.zygoteForm = Math.max(s.zygoteForm, p);
      }
      break;
    case 'hormone':
      if (visual === 'mix') s.hormoneRelease = Math.max(s.hormoneRelease, p * 0.4);
      else if (visual === 'react') { s.hormoneRelease = 1; s.hormoneTravel = Math.max(s.hormoneTravel, p); }
      else { s.hormoneTravel = 1; s.targetGlow = Math.max(s.targetGlow, p); }
      break;
    case 'agriculture':
      if (visual === 'mix') s.waterFlow = Math.max(s.waterFlow, p * 0.4);
      else if (visual === 'react') s.waterFlow = Math.max(s.waterFlow, 0.4 + p * 0.5);
      else { s.waterFlow = 1; s.seedGrow = Math.max(s.seedGrow, p); }
      break;
    default:
      s.cytoplasm = Math.max(s.cytoplasm, p);
  }
}

export function drawBioScene(ctx, W, H, s, scene, helpers, animTime = 0) {
  const cx = W * 0.5;

  switch (scene) {
    case 'cell':
      drawPlantCellZoomTour(ctx, W, H, s, animTime);
      break;
    case 'protein-synthesis':
      drawAnimalCell(ctx, cx - 40, H * 0.45, 55, { cytoplasm: 1, nucleus: s.nucleus });
      if (s.mrnaTravel > 0) {
        ctx.strokeStyle = '#FFEB3B';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(cx - 40, H * 0.45);
        ctx.lineTo(cx - 40 + s.mrnaTravel * 80, H * 0.45 + 20);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#FFEB3B';
        ctx.font = '9px monospace';
        ctx.fillText('mRNA strand', cx - 20 + s.mrnaTravel * 60, H * 0.42);
      }
      if (s.ribosome > 0) {
        ctx.fillStyle = `rgba(255,112,67,${s.ribosome})`;
        ctx.beginPath();
        ctx.arc(cx + 30, H * 0.52, 8 + s.ribosome * 4, 0, Math.PI * 2);
        ctx.fill();
        helpers.label(cx + 30, H * 0.68, 'Ribosome', '#FFAB91');
      }
      if (s.protein > 0) {
        ctx.globalAlpha = s.protein;
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(cx + 70, H * 0.48, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        helpers.label(cx + 70, H * 0.62, 'Protein chain', '#81C784');
      }
      break;
    case 'fermentation':
      drawCurdJar(ctx, cx, H * 0.5, 90, 130, s, animTime);
      helpers.label(cx, H * 0.84, s.curdForm > 0.5 ? 'Curd forming — Lactobacillus converts lactose' : 'Warm milk + curd starter (bacteria)', '#FFF176');
      break;
    case 'ecosystem':
      drawForestScene(ctx, W, H, s, helpers, cx);
      break;
    case 'reproduction':
      drawFertilizationScene(ctx, W, H, s, helpers);
      break;
    case 'hormone':
      drawHormonePathway(ctx, W, H, s);
      break;
    case 'agriculture':
      drawField(ctx, W, H, s.seedGrow, s.waterFlow);
      helpers.label(cx, H * 0.88, 'Canal irrigation → seeds germinate → shoots grow', '#81C784');
      break;
    default:
      drawPlantCellZoomTour(ctx, W, H, s, animTime);
  }
}

function drawForestScene(ctx, W, H, s, helpers, cx) {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  sky.addColorStop(0, '#1a237e');
  sky.addColorStop(1, '#283593');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.65);
  for (let i = 0; i < 5; i++) {
    if (i / 5 < s.treesLeft) drawTree(ctx, 55 + i * 75, H * 0.52, 1);
    else drawStump(ctx, 55 + i * 75, H * 0.6);
  }
  ctx.fillStyle = '#558B2F';
  ctx.fillRect(0, H * 0.62, W, H * 0.12);
  if (s.soilLoss > 0) {
    ctx.fillStyle = `rgba(121,85,72,${s.soilLoss * 0.8})`;
    ctx.beginPath();
    ctx.moveTo(40, H * 0.68);
    ctx.lineTo(W - 40, H * 0.68);
    ctx.lineTo(W - 20, H * 0.68 + 25 * s.soilLoss);
    ctx.lineTo(20, H * 0.68 + 30 * s.soilLoss);
    ctx.fill();
  }
  if (s.co2Rise > 0) helpers.gasCloud(W * 0.78, H * 0.22, 'CO2', s.co2Rise);
  helpers.label(cx, H * 0.88, 'Deforestation → soil erosion → rising CO₂', '#A1887F');
}

function drawTree(ctx, x, y, scale) {
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 5, y, 10, 28 * scale);
  const lg = ctx.createLinearGradient(x, y - 35, x, y);
  lg.addColorStop(0, '#2E7D32');
  lg.addColorStop(1, '#66BB6A');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(x, y - 35 * scale);
  ctx.lineTo(x - 20 * scale, y + 2);
  ctx.lineTo(x + 20 * scale, y + 2);
  ctx.fill();
}

function drawStump(ctx, x, y) {
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(x - 10, y, 20, 12);
  ctx.fillStyle = '#4E342E';
  ctx.beginPath();
  ctx.ellipse(x, y, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawField(ctx, W, H, grow, water) {
  const ground = ctx.createLinearGradient(0, H * 0.6, 0, H * 0.85);
  ground.addColorStop(0, '#7CB342');
  ground.addColorStop(1, '#558B2F');
  ctx.fillStyle = ground;
  ctx.fillRect(0, H * 0.62, W, H * 0.22);
  if (water > 0) {
    ctx.strokeStyle = `rgba(79,195,247,${water * 0.85})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(W * 0.08, H * 0.18);
    for (let i = 0; i <= 8; i++) {
      ctx.lineTo(W * 0.08 + i * 42, H * 0.18 + i * 16 + Math.sin(i * 0.8) * 4);
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(79,195,247,${water * 0.25})`;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(W * 0.15 + i * 55, H * 0.62 + 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let i = 0; i < 9; i++) {
    const h = 6 + grow * 28 * ((i % 3) + 1) / 3;
    ctx.fillStyle = '#33691E';
    ctx.fillRect(45 + i * 48, H * 0.62 - h, 5, h);
    if (grow > 0.5) {
      ctx.fillStyle = '#689F38';
      ctx.beginPath();
      ctx.ellipse(47 + i * 48, H * 0.62 - h - 3, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const BIO_SCENES = ['cell', 'protein-synthesis', 'fermentation', 'ecosystem', 'reproduction', 'hormone', 'agriculture'];
