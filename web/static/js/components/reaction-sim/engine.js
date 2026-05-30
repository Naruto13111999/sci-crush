import { C, gasKey, metalKey, solutionKey, clamp, lerp, smooth, lerpColor } from './colors.js';
import { drawFlame, drawSteam, drawTestTube, drawShadow } from './draw-lib.js';
import { createBioState, applyBioVisual, drawBioScene, BIO_SCENES } from './scenes-bio.js';
import { createPhysicsState, applyPhysicsVisual, drawPhysicsScene, PHYSICS_SCENES } from './scenes-physics.js';
import { drawElectrolysisZoom, drawBoilingWaterSetup, applyElectrolysisZoomVisual, applyBoilingVisual } from './macro-chem.js';

const STEP_MS = 2200;

export class ReactionSimulator {
  constructor(canvas, demo, onUpdate) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.demo = demo;
    this.onUpdate = onUpdate;
    this.running = false;
    this.raf = null;
    this.bubbles = [];
    this.gasPuffs = [];
    this.steamPuffs = [];
    this.startTime = 0;
    this.animTime = 0;
    this.scene = demo.scene || inferScene(demo);
    this.steps = normalizeSteps(demo);
    this.duration = this.steps.reduce((s, st) => s + (st.duration || STEP_MS), 0);
    this.resize();
  }

  resize() {
    const parent = this.canvas.parentElement;
    const w = parent?.clientWidth || 480;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = 320 * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = '320px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w;
    this.H = 320;
    this.draw();
  }

  reset() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.bubbles = [];
    this.gasPuffs = [];
    this.steamPuffs = [];
    this.animTime = 0;
    this.draw(this.buildState(0, 0));
    this.emitUpdate('Ready — click Run Simulation', 0, -1, '');
  }

  run() {
    if (this.running) return;
    this.running = true;
    this.bubbles = [];
    this.gasPuffs = [];
    this.steamPuffs = [];
    this.startTime = performance.now();
    this.loop();
  }

  loop() {
    if (!this.running) return;
    const elapsed = performance.now() - this.startTime;
    this.animTime = elapsed / 1000;
    const { stepIndex, stepT, globalT } = this.getStepTiming(elapsed);
    const state = this.buildState(stepIndex, stepT);
    state.animTime = this.animTime;

    this.updateParticles(state);
    this.draw(state);
    const step = this.steps[stepIndex];
    this.emitUpdate(
      `Step ${stepIndex + 1}/${this.steps.length}: ${step?.label || ''}`,
      globalT,
      stepIndex,
      step?.description || ''
    );

    if (elapsed >= this.duration) {
      this.running = false;
      this.draw(this.buildState(this.steps.length - 1, 1));
      this.emitUpdate('✅ Simulation complete', 1, this.steps.length - 1, '');
      return;
    }
    this.raf = requestAnimationFrame(() => this.loop());
  }

  getStepTiming(elapsed) {
    let rem = elapsed;
    for (let i = 0; i < this.steps.length; i++) {
      const dur = this.steps[i].duration || STEP_MS;
      if (rem < dur) {
        return { stepIndex: i, stepT: clamp(rem / dur, 0, 1), globalT: clamp(elapsed / this.duration, 0, 1) };
      }
      rem -= dur;
    }
    const last = this.steps.length - 1;
    return { stepIndex: last, stepT: 1, globalT: 1 };
  }

  buildState(stepIndex, stepT) {
    const state = createSceneState(this.scene, this.demo);
    for (let i = 0; i < stepIndex; i++) {
      applyStepVisual(this.scene, this.steps[i].visual, 1, state, this.demo);
    }
    if (stepIndex < this.steps.length) {
      applyStepVisual(this.scene, this.steps[stepIndex].visual, smooth(stepT), state, this.demo);
    }
    state.stepIndex = stepIndex;
    state.stepT = stepT;
    state.stepLabel = this.steps[stepIndex]?.label || '';
    return state;
  }

  emitUpdate(title, globalT, stepIndex, description = '') {
    this.onUpdate?.({ title, description, globalT, stepIndex, totalSteps: this.steps.length });
  }

  updateParticles(state) {
    if (state.bubbleIntensity > 0.15) {
      const rate = 0.25 + state.bubbleIntensity * 0.5;
      if (Math.random() < rate) {
        this.bubbles.push({
          x: this.W * 0.5 + (Math.random() - 0.5) * 30,
          y: this.H * 0.58 + Math.random() * 25,
          r: 2 + Math.random() * 4,
          vy: -0.7 - Math.random() * 1.3,
          life: 1,
          gas: state.bubbleGas || 'H2',
        });
      }
    }
    if (state.gasIntensity > 0.2 && Math.random() < 0.06 * state.gasIntensity) {
      const gk = state.gasKey || 'H2';
      this.gasPuffs.push({
        x: this.W * 0.5 + (Math.random() - 0.5) * 36,
        y: this.H * 0.32,
        life: 1,
        key: gk,
        vy: -0.12 - Math.random() * 0.15,
      });
    }
    this.bubbles = this.bubbles.filter(b => {
      b.y += b.vy;
      b.life -= 0.011;
      return b.life > 0 && b.y > this.H * 0.12;
    });
    this.gasPuffs.forEach(p => { p.y += p.vy; p.life -= 0.005; });
    this.gasPuffs = this.gasPuffs.filter(p => p.life > 0);

    if (state.steamIntensity > 0.2 && Math.random() < 0.08 * state.steamIntensity) {
      this.steamPuffs.push({
        x: this.W * 0.5 + (Math.random() - 0.5) * 40,
        y: this.H * 0.55,
        r: 4 + Math.random() * 8,
        life: 1,
        vy: -0.4 - Math.random() * 0.5,
      });
    }
    this.steamPuffs.forEach(p => { p.y += p.vy; p.life -= 0.008; p.r += 0.05; });
    this.steamPuffs = this.steamPuffs.filter(p => p.life > 0);
  }

  draw(state) {
    if (!state) state = this.buildState(0, 0);
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    const skipBench = ['cell', 'sound', 'light', 'boiling', 'electrolysis'].includes(this.scene);
    if (!skipBench) this.drawLabBench(W, H);
    else {
      const bg = this.ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a1018');
      bg.addColorStop(1, '#141f2e');
      this.ctx.fillStyle = bg;
      this.ctx.fillRect(0, 0, W, H);
    }

    if (BIO_SCENES.includes(this.scene)) {
      this.drawBio(state);
    } else if (PHYSICS_SCENES.includes(this.scene)) {
      this.drawPhysics(state);
    } else switch (this.scene) {
      case 'beaker': this.drawBeaker(state); break;
      case 'combustion': this.drawCombustion(state); break;
      case 'boiling': this.drawBoiling(state); break;
      case 'displacement': this.drawDisplacement(state); break;
      case 'electrolysis': this.drawElectrolysis(state); break;
      case 'rust': this.drawRust(state); break;
      default: this.drawGeneric(state); break;
    }

    this.drawGasPuffs();
    this.drawBubbles();
    drawSteam(this.ctx, this.steamPuffs);
    this.drawStepUI(state);
  }

  /* ─── Scene renderers (driven by state) ─── */

  drawBio(s) {
    const helpers = {
      label: (x, y, text, color) => this.drawLabel(x, y, text, color),
      glassBeaker: (cx, cy, w, h, liq, fill) => this.drawGlassBeaker(cx, cy, w, h, liq, fill),
      gasCloud: (x, y, key, intensity) => this.drawRisingGasCloud(x, y, key, intensity),
    };
    drawBioScene(this.ctx, this.W, this.H, s, this.scene, helpers, s.animTime || 0);
  }

  drawPhysics(s) {
    const helpers = { label: (x, y, text, color) => this.drawLabel(x, y, text, color) };
    drawPhysicsScene(this.ctx, this.W, this.H, s, this.scene, helpers, s.animTime || 0);
  }

  drawBeaker(s) {
    const { W, H } = this;
    const cx = W * 0.5;
    const m = C.metals[s.metalKey] || C.metals.Zn;
    const liq = lerpColor(C.solutions[s.liquidStart] || C.solutions.hcl, C.solutions.znso4, s.liquidFade);

    if (s.useTestTube) {
      drawTestTube(this.ctx, cx, H * 0.22, 52, 130, liq, 0.62, s.beakerLabel || 'Dilute HCl');
    } else {
      drawShadow(this.ctx, cx - 46, H * 0.48, 92, 124);
      this.drawGlassBeaker(cx, H * 0.54, 92, 124, liq, 0.62);
    }
    this.drawLabel(cx, H * 0.84, s.beakerLabel || 'Dilute HCl (aq)', s.liquidFade > 0.3 ? '#B0BEC5' : '#FFF176');

    if (s.dropProgress > 0) {
      const gy = lerp(H * 0.1, s.useTestTube ? H * 0.38 : H * 0.56, s.dropProgress);
      const gs = s.granuleScale;
      this.drawMetalGranule(cx - 14, gy, 11 * gs, m);
      this.drawMetalGranule(cx + 5, gy + 7, 9 * gs, m);
      this.drawMetalGranule(cx - 3, gy + 16, 10 * gs, m);
    }

    if (s.gasIntensity > 0) {
      this.drawRisingGasCloud(cx, H * 0.2 - s.gasIntensity * 8, s.gasKey || 'H2', s.gasIntensity);
    }
    if (s.popTest > 0) this.drawPopTest(cx + 72, H * 0.16, s.popTest);
    if (s.bubbleIntensity > 0.3) this.drawEffervescenceLabel(cx + 58, H * 0.48, s.bubbleIntensity);
  }

  drawCombustion(s) {
    const { W, H, demo } = this;
    const cx = W * 0.5;
    const m = C.metals[s.metalKey] || C.metals.C;

    if (s.isMethane) {
      drawFlame(this.ctx, cx, H * 0.72, s.flameIntensity, s.flameType, s.animTime || 0);
      this.drawLabel(cx, H * 0.9, s.flameType === 'yellow' ? 'Incomplete — yellow flame' : 'Complete — blue flame', '#90CAF9');
      if (s.gasIntensity > 0) this.drawRisingGasCloud(cx, H * 0.26, s.gasKey || 'CO2', s.gasIntensity);
      return;
    }

    if (s.showTongs) this.drawTongs(cx, H * 0.28);

    if (s.flash > 0) {
      ctxSave(this.ctx);
      this.ctx.globalAlpha = s.flash * 0.92;
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(0, 0, W, H);
      ctxRestore(this.ctx);
    }

    if (s.ribbonHeight > 0) {
      this.drawMetalRibbon(cx, H * 0.3, s.ribbonHeight, m, s.metalGlow);
    }
    if (s.showCharcoal) {
      this.drawMetalBlock(cx - 28, H * 0.54, 56, 32 - s.charcoalBurn * 8, m, s.metalGlow);
    }

    drawFlame(this.ctx, cx, H * 0.72, s.flameIntensity, s.flameType, s.animTime || 0);

    if (s.ashAmount > 0) {
      this.drawPowderPile(cx, H * 0.34, C.solids.MgO, s.ashAmount);
      this.drawLabel(cx, H * 0.84, 'White MgO ash', '#F5F5F5');
    }
    if (s.sootAmount > 0) {
      this.drawPowderPile(cx, H * 0.7, C.solids.soot, s.sootAmount);
      this.drawLabel(cx, H * 0.88, 'Black soot deposited', '#9E9E9E');
    }
    if (s.gasIntensity > 0) {
      this.drawRisingGasCloud(cx + (s.gasKey === 'CO' ? -20 : 0), H * 0.24, s.gasKey || 'CO2', s.gasIntensity);
    }
    if (s.showO2) this.drawRisingGasCloud(cx + 60, H * 0.18, 'O2', s.o2Intensity || 0.4);
  }

  drawDisplacement(s) {
    const { W, H } = this;
    const cx = W * 0.5;
    const liq = lerpColor(C.solutions.cuso4, C.solutions.znso4, s.colorFade);

    this.drawGlassBeaker(cx, H * 0.52, 102, 132, liq, 0.68);
    this.drawLabel(cx, H * 0.86, s.colorFade < 0.4 ? 'CuSO₄ — deep blue' : s.colorFade < 0.85 ? 'Blue fading…' : 'ZnSO₄ — colourless', s.colorFade < 0.5 ? '#64B5F6' : '#B0BEC5');

    const stripTop = lerp(H * 0.06, H * 0.2, s.stripDip);
    this.drawMetalStrip(cx, stripTop, 102, C.metals.Zn, s.copperDeposit);
  }

  drawElectrolysis(s) {
    drawElectrolysisZoom(this.ctx, this.W, this.H, s, this.demo, s.animTime || 0, {
      label: (x, y, t, c) => this.drawLabel(x, y, t, c),
    });
  }

  drawBoiling(s) {
    drawBoilingWaterSetup(this.ctx, this.W, this.H, s, s.animTime || 0);
  }

  drawRust(s) {
    const { W, H } = this;
    const cx = W * 0.5;
    this.drawMetalBlock(cx - 42, H * 0.44, 84, 46, C.metals.Fe, 0);

    if (s.rustAmount > 0) {
      ctxSave(this.ctx);
      this.ctx.globalAlpha = s.rustAmount * 0.9;
      this.ctx.fillStyle = C.solids.rust;
      [[0, 0, 32, 22], [38, 4, 42, 26], [8, 24, 58, 20], [52, 20, 30, 24]].forEach(([px, py, pw, ph]) => {
        this.ctx.beginPath();
        this.ctx.roundRect(cx - 42 + px, H * 0.44 + py, pw * s.rustAmount, ph * s.rustAmount, 4);
        this.ctx.fill();
      });
      ctxRestore(this.ctx);
    }

    for (let i = 0; i < 3; i++) {
      if (s.moisture > i * 0.25) {
        const dt = clamp((s.moisture - i * 0.25) / 0.5, 0, 1);
        this.drawWaterDrop(cx - 22 + i * 22, H * 0.3 + dt * 28, dt);
      }
    }
    if (s.o2Intensity > 0) this.drawRisingGasCloud(cx + 55, H * 0.18, 'O2', s.o2Intensity);
    this.drawLabel(cx, H * 0.84, 'Iron + O₂ + H₂O → Rust', '#FF8A65');
  }

  drawGeneric(s) {
    const { W, H, demo } = this;
    const cx = W * 0.5;
    const showProducts = s.productReveal > 0;

    (demo.reactants || []).forEach((r, i) => {
      this.drawSubstance(cx - 90 + i * 75, H * 0.44, r, showProducts ? 1 - s.productReveal : 1 - s.reactProgress * 0.5);
    });

    if (s.reactProgress > 0.15) {
      this.ctx.globalAlpha = s.reactProgress;
      this.ctx.fillStyle = '#F59E0B';
      this.ctx.font = 'bold 26px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('→', cx, H * 0.5);
      this.ctx.globalAlpha = 1;
    }

    if (showProducts) {
      (demo.products || []).forEach((p, i) => {
        this.drawSubstance(cx + 10 + i * 75, H * 0.44, p, s.productReveal);
      });
    }
  }

  /* ─── Drawing primitives ─── */
  drawLabBench(W, H) {
    const g = this.ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1018');
    g.addColorStop(0.45, '#121c28');
    g.addColorStop(1, '#1a2838');
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, W, H);
    const vig = this.ctx.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, W * 0.7);
    vig.addColorStop(0, 'rgba(255,255,255,0.04)');
    vig.addColorStop(1, 'rgba(0,0,0,0.35)');
    this.ctx.fillStyle = vig;
    this.ctx.fillRect(0, 0, W, H);
    const bench = this.ctx.createLinearGradient(0, H - 32, 0, H);
    bench.addColorStop(0, '#2a3d52');
    bench.addColorStop(1, '#1e2d3d');
    this.ctx.fillStyle = bench;
    this.ctx.fillRect(0, H - 32, W, 32);
    this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, H - 32);
    this.ctx.lineTo(W, H - 32);
    this.ctx.stroke();
  }

  drawGlassBeaker(cx, cy, w, h, liquidColor, fillLevel) {
    const ctx = this.ctx;
    const x = cx - w / 2, y = cy - h / 2;
    ctxSave(ctx);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + 8, y + h - 12);
    ctx.quadraticCurveTo(x + 8, y + h, x + 18, y + h);
    ctx.lineTo(x + w - 18, y + h);
    ctx.quadraticCurveTo(x + w - 8, y + h, x + w - 8, y + h - 12);
    ctx.lineTo(x + w - 8, y);
    ctx.stroke();
    const ly = y + h - 12 - (h - 20) * fillLevel;
    ctx.fillStyle = liquidColor;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x + 10, ly);
    ctx.lineTo(x + 10, y + h - 14);
    ctx.lineTo(x + w - 10, y + h - 14);
    ctx.lineTo(x + w - 10, ly);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + 12, y + 8, 4, h - 28);
    ctxRestore(ctx);
  }

  drawMetalGranule(x, y, r, m) {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, m.hi); g.addColorStop(0.55, m.fill); g.addColorStop(1, m.lo);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = m.lo; ctx.lineWidth = 1; ctx.stroke();
  }

  drawMetalBlock(x, y, w, h, m, glow) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, m.hi); g.addColorStop(0.5, m.fill); g.addColorStop(1, m.lo);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill();
    if (glow > 0) {
      ctx.shadowColor = '#FFF'; ctx.shadowBlur = 18 * glow;
      ctx.strokeStyle = `rgba(255,255,255,${glow})`; ctx.lineWidth = 2; ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  drawMetalRibbon(cx, top, h, m, glow) {
    const ctx = this.ctx;
    const w = 10;
    const g = ctx.createLinearGradient(cx - w, top, cx + w, top + h);
    g.addColorStop(0, m.hi); g.addColorStop(0.5, m.fill); g.addColorStop(1, m.lo);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(cx - w / 2, top, w, h, 2); ctx.fill();
    if (glow > 0.08) {
      ctx.shadowColor = '#FFF'; ctx.shadowBlur = 22 * glow;
      ctx.fillStyle = `rgba(255,255,255,${glow * 0.75})`;
      ctx.fill(); ctx.shadowBlur = 0;
    }
  }

  drawMetalStrip(cx, top, h, m, copperT) {
    const ctx = this.ctx;
    const w = 14;
    const g = ctx.createLinearGradient(cx - w, top, cx + w, top + h);
    g.addColorStop(0, m.hi); g.addColorStop(0.45, m.fill); g.addColorStop(1, m.lo);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(cx - w / 2, top, w, h, 2); ctx.fill();
    if (copperT > 0) {
      ctxSave(ctx);
      ctx.globalAlpha = copperT * 0.92;
      const cg = ctx.createLinearGradient(cx - w, top, cx + w, top + h);
      cg.addColorStop(0, C.metals.Cu.hi); cg.addColorStop(1, C.metals.Cu.lo);
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.roundRect(cx - w / 2, top + h * (1 - copperT), w, h * copperT, 2); ctx.fill();
      ctxRestore(ctx);
    }
  }

  drawBurner(cx, cy, intensity, type) {
    if (intensity <= 0) return;
    const ctx = this.ctx;
    const pal = type === 'blue' ? ['#0D47A1', '#1976D2', '#64B5F6']
      : type === 'yellow' ? ['#E65100', '#FF8F00', '#FFEE58']
      : ['#FFFFFF', '#FFFDE7', '#FFF59D'];
    const fh = 38 + intensity * 28;
    for (let i = 2; i >= 0; i--) {
      ctx.globalAlpha = intensity * (0.45 + i * 0.22);
      ctx.fillStyle = pal[i];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx - 16 - i * 5, cy - fh * 0.35, cx - 7, cy - fh, cx, cy - fh - 4);
      ctx.bezierCurveTo(cx + 7, cy - fh, cx + 16 + i * 5, cy - fh * 0.35, cx, cy);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#455A64';
    ctx.fillRect(cx - 16, cy, 32, 14);
    ctx.fillRect(cx - 6, cy + 14, 12, 8);
  }

  drawTongs(cx, y) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#78909C'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 32, y - 22); ctx.lineTo(cx - 8, y + 8);
    ctx.moveTo(cx + 32, y - 22); ctx.lineTo(cx + 8, y + 8);
    ctx.stroke();
  }

  drawPowderPile(cx, y, color, amount) {
    const ctx = this.ctx;
    ctx.globalAlpha = amount;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(cx, y, 24 * amount, 9 * amount, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawRisingGasCloud(x, y, key, intensity) {
    if (intensity <= 0.04) return;
    const g = C.gases[key] || C.gases.O2;
    const ctx = this.ctx;
    const r = 16 + intensity * 24;
    ctxSave(ctx);
    ctx.globalAlpha = intensity * 0.8;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, g.core); grad.addColorStop(0.65, g.edge); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    [[0, 0, 1], [-14, 6, 0.8], [14, 6, 0.8], [-7, -10, 0.65], [9, -8, 0.6]].forEach(([ox, oy, s]) => {
      ctx.beginPath(); ctx.arc(x + ox, y + oy - intensity * 12, r * s, 0, Math.PI * 2); ctx.fill();
    });
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = intensity;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(g.label, x, y - intensity * 18 - 6);
    ctxRestore(ctx);
  }

  drawGasPuffs() {
    this.gasPuffs.forEach(p => this.drawRisingGasCloud(p.x, p.y, p.key, p.life * 0.75));
  }

  drawBubbles() {
    const ctx = this.ctx;
    this.bubbles.forEach(b => {
      ctxSave(ctx);
      ctx.globalAlpha = b.life * 0.75;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.fillStyle = 'rgba(200,230,255,0.2)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctxRestore(ctx);
    });
  }

  drawElectrolysisCell(cx, cy, w, h, liquidColor, currentOn, deposit, isCu) {
    const ctx = this.ctx;
    const x = cx - w / 2, y = cy - h / 2;
    this.drawGlassBeaker(cx, cy, w, h, liquidColor, 0.72);
    const drawE = (ex, col) => {
      ctx.fillStyle = '#90A4AE';
      ctx.fillRect(ex - 3, y + 10, 6, h - 22);
      if (currentOn > 0) {
        ctx.shadowColor = col; ctx.shadowBlur = 10 * currentOn;
        ctx.fillStyle = col; ctx.fillRect(ex - 4, y + 6, 8, 7);
        ctx.shadowBlur = 0;
      }
    };
    drawE(x + 24, '#42A5F5');
    drawE(x + w - 24, '#EF5350');
    if (currentOn > 0.3) {
      ctx.strokeStyle = `rgba(255,193,7,${currentOn * 0.55})`;
      ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + 24, y - 16); ctx.lineTo(x + w - 24, y - 16); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (isCu && deposit > 0) {
      ctxSave(ctx);
      ctx.globalAlpha = deposit;
      const cg = ctx.createLinearGradient(0, y + h - 30, 0, y + h - 8);
      cg.addColorStop(0, C.metals.Cu.hi); cg.addColorStop(1, C.metals.Cu.lo);
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.roundRect(x + 18, y + h - 30 - deposit * 22, 12, deposit * 24, 2); ctx.fill();
      ctxRestore(ctx);
    }
  }

  drawWaterDrop(x, y, t) {
    if (t <= 0) return;
    const ctx = this.ctx;
    ctx.globalAlpha = t; ctx.fillStyle = '#4FC3F7';
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawPopTest(x, y, t) {
    if (t <= 0) return;
    ctxSave(this.ctx);
    this.ctx.globalAlpha = t;
    this.ctx.font = '11px sans-serif';
    this.ctx.fillStyle = '#FF7043';
    this.ctx.fillText('🔥 POP!', x, y);
    ctxRestore(this.ctx);
  }

  drawEffervescenceLabel(x, y, t) {
    ctxSave(this.ctx);
    this.ctx.globalAlpha = t * 0.8;
    this.ctx.font = '10px sans-serif';
    this.ctx.fillStyle = '#81D4FA';
    this.ctx.fillText('fizz…', x, y);
    ctxRestore(this.ctx);
  }

  drawLabel(x, y, text, color) {
    const ctx = this.ctx;
    ctx.font = '11px DM Sans, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
  }

  drawSubstance(x, y, p, alpha) {
    if (alpha <= 0.04) return;
    ctxSave(this.ctx);
    this.ctx.globalAlpha = alpha;
    if (p.state === 'gas') this.drawRisingGasCloud(x + 20, y, gasKey(p.symbol), 0.85);
    else if (p.kind === 'metal') this.drawMetalBlock(x, y, 38, 28, C.metals[metalKey(p.symbol, p.name)] || C.metals.Fe, 0);
    else this.drawGlassBeaker(x + 20, y + 44, 38, 52, C.solutions[solutionKey(p.symbol, p.name)] || C.solutions.water, 0.65);
    ctxRestore(this.ctx);
  }

  drawStepUI(state) {
    const { ctx, W, H } = this;
    const stepsArr = this.steps;
    const n = stepsArr.length;
    const pad = W * 0.06;
    const barW = W - pad * 2;
    const y = H - 14;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.roundRect(pad, y, barW, 6, 3); ctx.fill();

    const globalT = (state.stepIndex + state.stepT) / n;
    const grad = ctx.createLinearGradient(pad, 0, pad + barW, 0);
    grad.addColorStop(0, '#6366F1'); grad.addColorStop(1, '#10B981');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(pad, y, barW * globalT, 6, 3); ctx.fill();

    for (let i = 0; i < n; i++) {
      const sx = pad + (i / n) * barW;
      const active = i <= state.stepIndex;
      ctx.beginPath(); ctx.arc(sx, y + 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = active ? '#10B981' : '#475569';
      ctx.fill();
      if (i === state.stepIndex) {
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
  }
}

/* ─── Step state machine ─── */

function createSceneState(scene, demo) {
  const id = demo.id || '';
  const base = {
    stepIndex: 0, stepT: 0, stepLabel: '',
    bubbleIntensity: 0, bubbleGas: 'H2',
    gasIntensity: 0, gasKey: gasKey(demo.products?.find(p => p.state === 'gas')?.symbol),
  };

  if (scene === 'beaker') {
    const mk = metalKey(demo.reactants?.find(r => r.kind === 'metal' || r.state === 'solid')?.symbol);
    const sk = solutionKey(demo.reactants?.find(r => r.state === 'liquid')?.symbol, demo.reactants?.find(r => r.state === 'liquid')?.name);
    return { ...base, metalKey: mk, liquidStart: sk, liquidFade: 0, dropProgress: 0, granuleScale: 1, popTest: 0, beakerLabel: sk === 'hcl' ? 'Dilute HCl (aq)' : 'Solution', useTestTube: /acid|hcl|test/.test(id) };
  }
  if (scene === 'combustion') {
    const mk = metalKey(demo.reactants?.[0]?.symbol, demo.reactants?.[0]?.name);
    return {
      ...base, metalKey: mk,
      isMethane: /methane|petrol|petroleum/.test(id),
      isIncomplete: /incomplete|co-poison/.test(id),
      showTongs: !/methane|petrol|petroleum/.test(id),
      showCharcoal: mk === 'C' || /complete-combustion|carbon/.test(id),
      flameIntensity: 0, flameType: 'blue',
      ribbonHeight: 72, metalGlow: 0, flash: 0,
      charcoalBurn: 0, ashAmount: 0, sootAmount: 0,
      showO2: false, o2Intensity: 0, steamIntensity: 0,
    };
  }
  if (scene === 'displacement') {
    return { ...base, stripDip: 0, colorFade: 0, copperDeposit: 0 };
  }
  if (scene === 'electrolysis') {
    return { ...base, zoom: 0, currentOn: 0, electronFlow: 0, cathodeDeposit: 0, h2Intensity: 0, o2Intensity: 0, liquidFade: 0, boilActivity: 0 };
  }
  if (scene === 'boiling') {
    return { ...base, zoom: 0, flameIntensity: 0, flameType: 'blue', heatLevel: 0, boilPhase: 0 };
  }
  if (scene === 'rust') {
    return { ...base, moisture: 0, rustAmount: 0, o2Intensity: 0 };
  }
  if (BIO_SCENES.includes(scene)) {
    return { ...createBioState(), ...base };
  }
  if (PHYSICS_SCENES.includes(scene)) {
    return { ...createPhysicsState(), ...base };
  }
  return { ...base, reactProgress: 0, productReveal: 0, steamIntensity: 0, useTestTube: /acid|hcl|test/.test(id) };
}

function applyStepVisual(scene, visual, p, state, demo) {
  const id = demo.id || '';
  switch (scene) {
    case 'beaker': applyBeakerVisual(visual, p, state); break;
    case 'combustion': applyCombustionVisual(visual, p, state, id); break;
    case 'displacement': applyDisplacementVisual(visual, p, state); break;
    case 'electrolysis': applyElectrolysisVisual(visual, p, state, id); break;
    case 'boiling': applyBoilingVisual(visual, p, state); break;
    case 'rust': applyRustVisual(visual, p, state); break;
    default:
      if (BIO_SCENES.includes(scene)) applyBioVisual(scene, visual, p, state);
      else if (PHYSICS_SCENES.includes(scene)) applyPhysicsVisual(scene, visual, p, state);
      else applyGenericVisual(visual, p, state);
      break;
  }
}

function applyBeakerVisual(v, p, s) {
  switch (v) {
    case 'mix':
      s.dropProgress = Math.max(s.dropProgress, p);
      break;
    case 'react':
      s.dropProgress = 1;
      s.bubbleIntensity = Math.max(s.bubbleIntensity, p);
      s.granuleScale = lerp(1, 0.45, p);
      s.gasIntensity = Math.max(s.gasIntensity, p * 0.55);
      s.liquidFade = Math.max(s.liquidFade, p * 0.15);
      break;
    case 'product':
      s.dropProgress = 1;
      s.bubbleIntensity = Math.max(s.bubbleIntensity, 0.4 + p * 0.6);
      s.granuleScale = lerp(0.45, 0.15, p);
      s.gasIntensity = Math.max(s.gasIntensity, 0.55 + p * 0.45);
      s.liquidFade = Math.max(s.liquidFade, 0.15 + p * 0.35);
      s.popTest = Math.max(s.popTest, p > 0.4 ? (p - 0.4) / 0.6 : 0);
      break;
    case 'heat':
      s.dropProgress = Math.max(s.dropProgress, p * 0.5);
      break;
    default:
      s.dropProgress = Math.max(s.dropProgress, p);
  }
}

function applyCombustionVisual(v, p, s, id) {
  const isMg = /mg|magnesium/.test(id) || s.metalKey === 'Mg';
  switch (v) {
    case 'mix':
      if (s.isMethane) { s.flameIntensity = Math.max(s.flameIntensity, p * 0.3); }
      else { s.showO2 = true; s.o2Intensity = Math.max(s.o2Intensity, p * 0.5); }
      break;
    case 'heat':
      s.flameIntensity = Math.max(s.flameIntensity, p);
      s.flameType = s.isIncomplete ? 'yellow' : 'blue';
      s.metalGlow = Math.max(s.metalGlow, p * 0.4);
      break;
    case 'spark':
      s.flameIntensity = 1;
      s.flameType = 'white';
      s.flash = Math.max(s.flash, p < 0.5 ? p * 2 : (1 - p) * 2);
      s.metalGlow = Math.max(s.metalGlow, p);
      if (isMg) { s.ribbonHeight = lerp(72, 20, p); }
      s.charcoalBurn = Math.max(s.charcoalBurn, p * 0.6);
      break;
    case 'react':
      s.flameIntensity = Math.max(s.flameIntensity, 0.7 + p * 0.3);
      s.flameType = s.isIncomplete ? 'yellow' : isMg ? 'white' : 'blue';
      s.gasIntensity = Math.max(s.gasIntensity, p * 0.7);
      s.steamIntensity = Math.max(s.steamIntensity || 0, p * 0.6);
      s.gasKey = s.isIncomplete ? 'CO' : s.gasKey;
      if (isMg) s.ribbonHeight = lerp(20, 6, p);
      s.charcoalBurn = Math.max(s.charcoalBurn, 0.6 + p * 0.4);
      break;
    case 'product':
      s.flameIntensity = Math.max(s.flameIntensity, 0.5);
      if (isMg) {
        s.ribbonHeight = lerp(6, 0, p);
        s.ashAmount = Math.max(s.ashAmount, p);
        s.flameIntensity = lerp(1, 0.3, p);
      } else if (s.isIncomplete) {
        s.sootAmount = Math.max(s.sootAmount, p);
        s.gasIntensity = Math.max(s.gasIntensity, p);
        s.gasKey = 'CO';
        s.flameType = 'yellow';
      } else {
        s.gasIntensity = Math.max(s.gasIntensity, p);
        s.gasKey = 'CO2';
        s.charcoalBurn = Math.max(s.charcoalBurn, 1);
      }
      break;
    default:
      s.flameIntensity = Math.max(s.flameIntensity, p * 0.5);
  }
}

function applyDisplacementVisual(v, p, s) {
  switch (v) {
    case 'mix':
      s.stripDip = Math.max(s.stripDip, p);
      break;
    case 'displace':
    case 'react':
      s.stripDip = 1;
      s.colorFade = Math.max(s.colorFade, p * 0.65);
      s.copperDeposit = Math.max(s.copperDeposit, p * 0.55);
      break;
    case 'product':
      s.stripDip = 1;
      s.colorFade = Math.max(s.colorFade, 0.65 + p * 0.35);
      s.copperDeposit = Math.max(s.copperDeposit, 0.55 + p * 0.45);
      break;
    default:
      s.stripDip = Math.max(s.stripDip, p);
  }
}

function applyElectrolysisVisual(v, p, s, id) {
  applyElectrolysisZoomVisual(v, p, s);
}

function applyRustVisual(v, p, s) {
  switch (v) {
    case 'mix':
      s.moisture = Math.max(s.moisture, p);
      s.o2Intensity = Math.max(s.o2Intensity, p * 0.35);
      break;
    case 'react':
      s.moisture = 1;
      s.rustAmount = Math.max(s.rustAmount, p * 0.55);
      s.o2Intensity = Math.max(s.o2Intensity, 0.35 + p * 0.3);
      break;
    case 'product':
      s.moisture = 1;
      s.rustAmount = Math.max(s.rustAmount, 0.55 + p * 0.45);
      break;
    default:
      s.rustAmount = Math.max(s.rustAmount, p * 0.5);
  }
}

function applyGenericVisual(v, p, s) {
  switch (v) {
    case 'mix': s.reactProgress = Math.max(s.reactProgress, p * 0.3); break;
    case 'heat': s.reactProgress = Math.max(s.reactProgress, 0.3 + p * 0.3); break;
    case 'react': s.reactProgress = Math.max(s.reactProgress, 0.6 + p * 0.4); break;
    case 'product': s.productReveal = Math.max(s.productReveal, p); s.reactProgress = 1; break;
    default: s.reactProgress = Math.max(s.reactProgress, p);
  }
}

function normalizeSteps(demo) {
  if (demo.steps?.length) return demo.steps;
  return [
    { label: 'Setup', description: 'Reactants prepared', visual: 'mix', duration: STEP_MS },
    { label: 'Reaction', description: demo.description, visual: 'react', duration: STEP_MS },
    { label: 'Products', description: 'Products formed', visual: 'product', duration: STEP_MS },
  ];
}

function inferScene(demo) {
  const id = demo.id || '';
  if (demo.scene) return demo.scene;
  if (/water-boil|boiling-water/.test(id)) return 'boiling';
  if (/electrol|plating/.test(id)) return 'electrolysis';
  if (/displace/.test(id)) return 'displacement';
  if (/rust/.test(id)) return 'rust';
  if (/burn|combust|mg-|methane|petrol|co-poison|incomplete|complete|acid-rain|metal-oxygen/.test(id)) return 'combustion';
  if (/plant-cell|organelle/.test(id)) return 'cell';
  if (/protein|mrna/.test(id)) return 'protein-synthesis';
  if (/curd|ferment|lacto/.test(id)) return 'fermentation';
  if (/deforest|ecosystem/.test(id)) return 'ecosystem';
  if (/fertil|zygote|repro/.test(id)) return 'reproduction';
  if (/hormone|adolesc/.test(id)) return 'hormone';
  if (/irrig|crop|farm/.test(id)) return 'agriculture';
  if (/camel|sand-foot/.test(id)) return 'camel-pressure';
  if (/nail|pressure-demo/.test(id)) return 'pressure';
  if (/friction|walk|brak/.test(id)) return 'friction';
  if (/sound|bell|wave/.test(id)) return 'sound';
  if (/prism|light-disp/.test(id)) return 'light';
  if (/lightning|thunder/.test(id)) return 'lightning';
  if (/moon|phase|eclipse/.test(id)) return 'moon-phases';
  if (demo.reactants?.some(r => r.state === 'liquid') && demo.effect === 'gas') return 'beaker';
  return 'default';
}

function ctxSave(ctx) { ctx.save(); }
function ctxRestore(ctx) { ctx.restore(); }
