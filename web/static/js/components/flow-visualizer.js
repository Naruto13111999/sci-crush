export function renderFlowSteps(flow) {
  const stepsHTML = flow.steps.map((step, i) => `
    <div class="flow-step${i === 0 ? ' active' : ''}" data-step="${i}">
      <div class="flow-step-indicator">
        <div class="step-icon">${step.icon || (i + 1)}</div>
        ${i < flow.steps.length - 1 ? '<div class="step-line"></div>' : ''}
      </div>
      <div class="flow-step-body">
        <div class="flow-step-header">
          <span class="flow-label">${step.label}</span>
          <span class="flow-action">${step.action}</span>
        </div>
        <p class="flow-step-desc">${step.description}</p>
      </div>
    </div>
  `).join('');

  return `
    <p class="flow-desc">${flow.description}</p>
    <div class="flow-steps" id="flow-steps">${stepsHTML}</div>
    <div class="flow-controls">
      <button class="btn btn-secondary" id="flow-prev" disabled>← Prev</button>
      <div class="flow-progress"><div class="flow-progress-bar" id="flow-progress" style="width: ${100 / flow.steps.length}%"></div></div>
      <button class="btn btn-primary" id="flow-next">Next →</button>
      <button class="btn btn-secondary" id="flow-play">▶ Play</button>
    </div>
  `;
}

export function bindFlowControls(container, totalSteps) {
  let current = 0;
  let playing = false;
  let playTimer = null;

  const steps = container.querySelectorAll('.flow-step');
  const prevBtn = container.querySelector('#flow-prev');
  const nextBtn = container.querySelector('#flow-next');
  const playBtn = container.querySelector('#flow-play');
  const progress = container.querySelector('#flow-progress');

  function update() {
    steps.forEach((s, i) => {
      s.classList.remove('active', 'done');
      if (i < current) s.classList.add('done');
      if (i === current) s.classList.add('active');
    });
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === totalSteps - 1;
    progress.style.width = `${((current + 1) / totalSteps) * 100}%`;
    steps[current]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  prevBtn.addEventListener('click', () => { stopPlay(); if (current > 0) { current--; update(); } });
  nextBtn.addEventListener('click', () => { stopPlay(); if (current < totalSteps - 1) { current++; update(); } });

  playBtn.addEventListener('click', () => playing ? stopPlay() : startPlay());

  function startPlay() {
    playing = true;
    playBtn.textContent = '⏸ Pause';
    playTimer = setInterval(() => {
      if (current < totalSteps - 1) { current++; update(); }
      else stopPlay();
    }, 2000);
  }

  function stopPlay() {
    playing = false;
    playBtn.textContent = '▶ Play';
    clearInterval(playTimer);
  }

  update();
}
