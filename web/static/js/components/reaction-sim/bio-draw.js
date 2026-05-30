import { clamp, lerp } from './colors.js';

/** Realistic biology illustrations for Class 8 simulations */

export function drawFallopianTube(ctx, W, H, progress) {
  const ox = W * 0.18, oy = H * 0.38;
  ctx.save();
  const tg = ctx.createRadialGradient(ox, oy, 4, ox, oy, 28);
  tg.addColorStop(0, '#FFCDD2');
  tg.addColorStop(0.6, '#F48FB1');
  tg.addColorStop(1, '#EC407A');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.ellipse(ox, oy, 26, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = '9px DM Sans, sans-serif';
  ctx.fillStyle = '#F8BBD0';
  ctx.textAlign = 'center';
  ctx.fillText('Ovary', ox, oy + 36);

  ctx.strokeStyle = 'rgba(244,143,177,0.9)';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ox + 22, oy + 4);
  ctx.bezierCurveTo(W * 0.35, oy - 10, W * 0.55, H * 0.42, W * 0.62, H * 0.48);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.stroke();
  ctx.font = '9px DM Sans, sans-serif';
  ctx.fillStyle = '#F48FB1';
  ctx.fillText('Fallopian tube (oviduct)', W * 0.42, H * 0.36);
  ctx.restore();
  return { eggX: W * 0.58, eggY: H * 0.47 };
}

export function drawOvum(ctx, x, y, scale, state) {
  ctx.save();
  const r = 22 * scale;
  const zg = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, r + 6);
  zg.addColorStop(0, 'rgba(255,255,255,0.5)');
  zg.addColorStop(0.4, 'rgba(255,205,210,0.35)');
  zg.addColorStop(1, 'rgba(236,64,122,0.15)');
  ctx.fillStyle = zg;
  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, Math.PI * 2);
  ctx.fill();

  const cg = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, r);
  cg.addColorStop(0, '#FFEBEE');
  cg.addColorStop(0.5, '#F8BBD0');
  cg.addColorStop(1, '#EC407A');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  if (state.penetration > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${0.4 + state.penetration * 0.4})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = '#AD1457';
  ctx.beginPath();
  ctx.arc(x + r * 0.55, y - r * 0.1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '8px sans-serif';
  ctx.fillStyle = '#FCE4EC';
  ctx.textAlign = 'center';
  ctx.fillText('Egg (ovum)', x, y + r + 14);
  ctx.restore();
}

export function drawSperm(ctx, x, y, angle, alpha = 1, highlight = false) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (highlight) {
    ctx.shadowColor = '#64B5F6';
    ctx.shadowBlur = 8;
  }
  ctx.fillStyle = '#1565C0';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#42A5F5';
  ctx.fillRect(-2, -2, 5, 4);
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  for (let i = 0; i < 4; i++) {
    ctx.quadraticCurveTo(-14 - i * 5, (i % 2 ? 4 : -4), -18 - i * 6, 0);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawFertilizationScene(ctx, W, H, s, helpers) {
  const { eggX, eggY } = drawFallopianTube(ctx, W, H, s.eggRelease);

  if (s.eggRelease > 0.3) {
    drawOvum(ctx, eggX, eggY, 0.85 + s.eggRelease * 0.15, s);
  }

  const spermStartX = W * 0.12;
  const spermStartY = H * 0.55;
  const count = 5;
  for (let i = 0; i < count; i++) {
    const phase = (s.spermSwim + i * 0.12) % 1;
    if (phase <= 0 || s.spermSwim <= 0) continue;
    const t = clamp(s.spermSwim - i * 0.08, 0, 1);
    if (t <= 0) continue;
    const sx = lerp(spermStartX + i * 8, eggX - 18, t);
    const sy = lerp(spermStartY + Math.sin(i) * 12, eggY, t);
    const ang = Math.atan2(eggY - sy, eggX - sx);
    const isWinner = i === 2 && s.penetration > 0;
    if (s.blockOthers > 0 && i !== 2 && t > 0.7) continue;
    drawSperm(ctx, sx, sy, ang, isWinner ? 1 : 0.65, isWinner);
  }

  if (s.penetration > 0.4) {
    drawSperm(ctx, eggX - 10, eggY, 0, 1, true);
  }

  if (s.zygoteForm > 0) {
    ctx.save();
    const zr = 14 + s.zygoteForm * 10;
    const zg = ctx.createRadialGradient(eggX, eggY, 2, eggX, eggY, zr);
    zg.addColorStop(0, '#E1BEE7');
    zg.addColorStop(0.5, '#CE93D8');
    zg.addColorStop(1, '#8E24AA');
    ctx.fillStyle = zg;
    ctx.beginPath();
    ctx.arc(eggX, eggY, zr, 0, Math.PI * 2);
    ctx.fill();
    if (s.zygoteForm < 0.7) {
      ctx.fillStyle = '#7B1FA2';
      ctx.beginPath();
      ctx.arc(eggX - 4, eggY, 4, 0, Math.PI * 2);
      ctx.arc(eggX + 4, eggY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#4A148C';
      ctx.beginPath();
      ctx.arc(eggX, eggY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '10px DM Sans, sans-serif';
    ctx.fillStyle = '#E1BEE7';
    ctx.textAlign = 'center';
    ctx.fillText('Zygote (fertilised egg)', eggX, eggY + zr + 16);
    ctx.restore();
  }

  if (s.blockOthers > 0.5) {
    helpers.label(eggX, eggY - 38, 'Zona blocks other sperm', '#FFAB91');
  } else if (s.spermSwim > 0.2) {
    helpers.label(W * 0.22, H * 0.72, 'Sperm swim up the fallopian tube', '#90CAF9');
  }
}

export function drawRealisticPlantCell(ctx, cx, cy, w, h, s) {
  const x = cx - w / 2, y = cy - h / 2;
  ctx.save();

  if (s.cellWall > 0) {
    ctx.strokeStyle = `rgba(56,142,60,${0.4 + s.cellWall * 0.6})`;
    ctx.lineWidth = 5;
    ctx.strokeRect(x - 8, y - 8, w + 16, h + 16);
    ctx.fillStyle = 'rgba(46,125,50,0.15)';
    ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
  }

  const cyg = ctx.createLinearGradient(x, y, x + w, y + h);
  cyg.addColorStop(0, `rgba(200,230,201,${0.2 + s.cytoplasm * 0.3})`);
  cyg.addColorStop(1, `rgba(129,199,132,${0.15 + s.cytoplasm * 0.25})`);
  ctx.fillStyle = cyg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(100,181,246,0.75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  if (s.vacuole > 0) {
    ctx.globalAlpha = s.vacuole * 0.55;
    const vg = ctx.createLinearGradient(x + 20, y + 25, x + w - 20, y + h - 25);
    vg.addColorStop(0, '#B3E5FC');
    vg.addColorStop(1, '#4FC3F7');
    ctx.fillStyle = vg;
    ctx.fillRect(x + 18, y + 22, w - 36, h - 44);
    ctx.globalAlpha = 1;
  }

  if (s.chloroplast > 0) {
    [[x + 32, y + 45], [x + w - 38, y + 58], [x + 48, y + h - 48]].forEach(([px, py], i) => {
      if (s.chloroplast <= i * 0.28) return;
      ctx.globalAlpha = clamp(s.chloroplast - i * 0.25, 0, 1);
      const lg = ctx.createLinearGradient(px - 12, py, px + 12, py);
      lg.addColorStop(0, '#1B5E20');
      lg.addColorStop(0.5, '#388E3C');
      lg.addColorStop(1, '#66BB6A');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.ellipse(px, py, 15, 9, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 0.8;
      for (let j = -8; j <= 8; j += 4) {
        ctx.beginPath();
        ctx.moveTo(px + j, py - 6);
        ctx.lineTo(px + j, py + 6);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  if (s.nucleus > 0) {
    ctx.globalAlpha = s.nucleus;
    const nx = cx, ny = cy + 5;
    const ng = ctx.createRadialGradient(nx - 4, ny - 4, 2, nx, ny, 24);
    ng.addColorStop(0, '#B39DDB');
    ng.addColorStop(1, '#5E35B1');
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(nx, ny, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(nx - 6, ny - 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '9px DM Sans, sans-serif';
    ctx.fillStyle = '#E1BEE7';
    ctx.textAlign = 'center';
    ctx.fillText('Nucleus', nx, ny + 38);
    ctx.globalAlpha = 1;
  }

  if (s.mitochondria > 0) {
    ctx.globalAlpha = s.mitochondria;
    ctx.fillStyle = '#FF7043';
    ctx.beginPath();
    ctx.ellipse(x + w - 38, y + 38, 14, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#BF360C';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w - 44, y + 38);
    ctx.lineTo(x + w - 32, y + 38);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function drawCurdJar(ctx, cx, cy, w, h, s, t) {
  drawShadowSoft(ctx, cx - w / 2, cy - h / 2, w, h);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + 6, cy - h / 2);
  ctx.lineTo(cx - w / 2 + 6, cy + h / 2 - 8);
  ctx.lineTo(cx + w / 2 - 6, cy + h / 2 - 8);
  ctx.lineTo(cx + w / 2 - 6, cy - h / 2);
  ctx.stroke();
  const milkCol = lerpColor('#FFFDE7', '#FFF9C4', s.curdForm);
  const lg = ctx.createLinearGradient(cx, cy, cx, cy + h / 2);
  lg.addColorStop(0, milkCol);
  lg.addColorStop(1, '#FFECB3');
  ctx.fillStyle = lg;
  ctx.globalAlpha = 0.92;
  ctx.fillRect(cx - w / 2 + 8, cy - h / 2 + 4, w - 16, h - 16);
  ctx.globalAlpha = 1;

  const n = Math.floor(s.bacteriaCount * 18);
  for (let i = 0; i < n; i++) {
    const bx = cx - w / 2 + 14 + (i % 5) * 14;
    const by = cy - h / 2 + 20 + Math.floor(i / 5) * 12 + Math.sin(t * 2 + i) * 2;
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (s.bacteriaCount > 0.4) {
      ctx.strokeStyle = '#66BB6A';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(bx - 3, by);
      ctx.lineTo(bx + 3, by);
      ctx.stroke();
    }
  }

  if (s.curdForm > 0.2) {
    ctx.globalAlpha = s.curdForm * 0.5;
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + 10, cy - h / 2 + 30);
    ctx.lineTo(cx + w / 2 - 10, cy - h / 2 + 30);
    ctx.lineTo(cx + w / 2 - 10, cy - h / 2 + 30 + s.curdForm * (h - 50));
    ctx.lineTo(cx - w / 2 + 10, cy - h / 2 + 30 + s.curdForm * (h - 50));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(cx - w / 2 + 10, cy - h / 2 + 6, 4, h - 24);
  ctx.restore();
}

export function drawHormonePathway(ctx, W, H, s) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, H * 0.15);
  ctx.lineTo(W * 0.5, H * 0.75);
  ctx.stroke();

  const glandX = W * 0.5, glandY = H * 0.28;
  const gg = ctx.createRadialGradient(glandX, glandY, 2, glandX, glandY, 22);
  gg.addColorStop(0, '#EF5350');
  gg.addColorStop(1, '#B71C1C');
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.arc(glandX, glandY, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '9px DM Sans, sans-serif';
  ctx.fillStyle = '#FFCDD2';
  ctx.textAlign = 'center';
  ctx.fillText('Endocrine gland', glandX, glandY + 34);

  if (s.hormoneRelease > 0) {
    for (let i = 0; i < 4; i++) {
      if (s.hormoneRelease <= i * 0.2) continue;
      const dotY = glandY + 28 + i * 14;
      ctx.fillStyle = `rgba(255,152,0,${s.hormoneRelease})`;
      ctx.beginPath();
      ctx.arc(glandX + (i % 2 ? 6 : -6), dotY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (s.hormoneTravel > 0) {
    ctx.strokeStyle = `rgba(255,152,0,${0.4 + s.hormoneTravel * 0.5})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(glandX, glandY + 22);
    ctx.bezierCurveTo(glandX + 40, H * 0.45, W * 0.68, H * 0.42, W * 0.72, H * 0.48);
    ctx.stroke();
    ctx.setLineDash([]);
    const hx = lerp(glandX, W * 0.72, s.hormoneTravel);
    const hy = lerp(glandY + 30, H * 0.48, s.hormoneTravel);
    ctx.fillStyle = '#FF9800';
    ctx.shadowColor = '#FF9800';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(hx, hy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#FFE0B2';
    ctx.fillText('Hormone in blood', (glandX + hx) / 2 + 10, (glandY + hy) / 2);
  }

  const tx = W * 0.72, ty = H * 0.48;
  ctx.fillStyle = `rgba(66,165,245,${0.25 + s.targetGlow * 0.55})`;
  ctx.strokeStyle = `rgba(100,181,246,${0.5 + s.targetGlow * 0.5})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(tx - 28, ty - 22, 56, 44, 6);
  ctx.fill();
  ctx.stroke();
  if (s.targetGlow > 0.3) {
    ctx.shadowColor = '#42A5F5';
    ctx.shadowBlur = 16 * s.targetGlow;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = '#BBDEFB';
  ctx.textAlign = 'center';
  ctx.fillText('Target organ', tx, ty + 38);
  ctx.restore();
}

function drawShadowSoft(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 4, w * 0.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function lerpColor(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return t < 0.5 ? a : b;
}
