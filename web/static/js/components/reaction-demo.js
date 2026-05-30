import { ReactionSimulator } from './reaction-sim/engine.js';

const simulators = new Map();

export function renderDemos(demos, subject = 'chemistry') {
  if (!demos?.length) return '';

  const labMeta = {
    biology: { icon: '🔬', title: 'Virtual Biology Lab', intro: 'Step through living processes — cells divide, hormones travel, ecosystems change as each phase runs.' },
    physics: { icon: '⚡', title: 'Virtual Physics Lab', intro: 'Watch forces, waves, and light behave in real time — each step builds the next part of the phenomenon.' },
    chemistry: { icon: '⚗️', title: 'Virtual Reaction Lab', intro: 'Each step runs its own simulation phase — metals, liquids, flames, and gas clouds change as the reaction progresses.' },
  };
  const meta = labMeta[subject] || labMeta.chemistry;

  const cards = demos.map((demo, i) => {
    const stepCount = demo.steps?.length || 3;
    const stepPills = (demo.steps || []).map((st, si) =>
      `<span class="step-pill" data-demo="${i}" data-step="${si}">${si + 1}. ${st.label}</span>`
    ).join('');

    return `
      <div class="demo-card demo-card--${subject}" data-demo-index="${i}">
        <div class="demo-header">
          <h4>${demo.title}</h4>
          ${demo.conditions ? `<span class="demo-conditions">${demo.conditions}</span>` : ''}
        </div>
        <p class="demo-desc">${demo.description}</p>
        ${demo.equation ? `<div class="demo-equation">${formatEquation(demo.equation)}</div>` : ''}
        <div class="step-pills" id="step-pills-${i}">${stepPills}</div>
        <div class="sim-viewport" id="sim-viewport-${i}">
          <canvas class="sim-canvas" id="sim-canvas-${i}"></canvas>
        </div>
        <div class="demo-status" id="demo-status-${i}">Ready — click Run Simulation</div>
        <div class="demo-step-label" id="demo-step-${i}"></div>
        <div class="demo-controls">
          <button class="btn btn-primary demo-run" data-demo="${i}">▶ Run Simulation</button>
          <button class="btn btn-secondary demo-reset" data-demo="${i}">↺ Reset</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="content-section demos-section demos-section--${subject}">
      <h3>${meta.icon} ${meta.title}</h3>
      <p class="section-intro">${meta.intro}</p>
      <div class="demos-grid">${cards}</div>
    </section>
  `;
}

function formatEquation(eq) {
  return eq.replace(/→/g, '<span class="eq-arrow">→</span>').replace(/\+/g, '<span class="eq-plus">+</span>');
}

function highlightStep(demoIndex, stepIndex, total) {
  const pills = document.querySelectorAll(`.step-pill[data-demo="${demoIndex}"]`);
  pills.forEach((pill, i) => {
    pill.classList.remove('active', 'done');
    if (i < stepIndex) pill.classList.add('done');
    if (i === stepIndex) pill.classList.add('active');
  });
}

export function bindDemos(demos) {
  if (!demos?.length) return;
  simulators.clear();

  demos.forEach((demo, i) => {
    const canvas = document.getElementById(`sim-canvas-${i}`);
    const status = document.getElementById(`demo-status-${i}`);
    const stepLabel = document.getElementById(`demo-step-${i}`);
    if (!canvas) return;

    const sim = new ReactionSimulator(canvas, demo, ({ title, description, globalT, stepIndex, totalSteps }) => {
      if (status) status.textContent = title;
      if (stepLabel) stepLabel.textContent = description || '';
      highlightStep(i, stepIndex, totalSteps);
    });
    simulators.set(i, sim);

    const ro = new ResizeObserver(() => sim.resize());
    ro.observe(canvas.parentElement);
  });

  document.querySelectorAll('.demo-run').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.demo);
      highlightStep(i, 0, demos[i]?.steps?.length || 3);
      simulators.get(i)?.run();
    });
  });

  document.querySelectorAll('.demo-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.demo);
      simulators.get(i)?.reset();
      document.querySelectorAll(`.step-pill[data-demo="${i}"]`).forEach(p => {
        p.classList.remove('active', 'done');
      });
    });
  });
}
