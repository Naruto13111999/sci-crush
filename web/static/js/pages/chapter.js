import { subjectColor, subjectLabel } from '../api.js';
import { renderFlowSteps, bindFlowControls } from '../components/flow-visualizer.js';
import { renderDemos, bindDemos } from '../components/reaction-demo.js';

function renderCrushed(points) {
  return points.map(p => `
    <div class="crushed-card">
      <span class="crushed-emoji">${p.emoji}</span>
      <div>
        <h4>${p.title}</h4>
        <p>${p.text}</p>
      </div>
    </div>
  `).join('');
}

function renderSections(sections) {
  return sections.map(sec => {
    const items = sec.items?.map(item => `
      <div class="section-item${item.highlight ? ' highlight' : ''}">
        ${item.icon ? `<span class="item-icon">${item.icon}</span>` : ''}
        <div>
          <strong>${item.label}</strong>
          <p>${item.detail}</p>
        </div>
      </div>
    `).join('') || '';

    const gridClass = sec.visualType === 'list' ? 'section-list' : 'section-grid';

    return `
      <section class="content-section">
        <h3>${sec.title}</h3>
        ${sec.intro ? `<p class="section-intro">${sec.intro}</p>` : ''}
        <div class="${gridClass}">${items}</div>
      </section>
    `;
  }).join('');
}

function renderCompare(pairs) {
  if (!pairs?.length) return '';
  return pairs.map(pair => `
    <div class="compare-block">
      <h4>${pair.title}</h4>
      <div class="compare-grid">
        <div class="compare-side">
          <h5>${pair.left.label}</h5>
          <ul>${pair.left.points.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="compare-vs">vs</div>
        <div class="compare-side">
          <h5>${pair.right.label}</h5>
          <ul>${pair.right.points.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  `).join('');
}

function renderFlows(flows) {
  if (!flows?.length) return '';
  const tabs = flows.length > 1
    ? `<div class="flow-tabs">${flows.map((f, i) => `
        <button class="flow-tab${i === 0 ? ' active' : ''}" data-flow="${i}">${f.title}</button>
      `).join('')}</div>`
    : '';

  const panels = flows.map((f, i) => `
    <div class="flow-panel${i === 0 ? ' active' : ''}" data-flow="${i}">
      <h3>${f.title}</h3>
      <div class="flow-container">${renderFlowSteps(f)}</div>
    </div>
  `).join('');

  return `
    <section class="content-section flows-section">
      <h3>Interactive Flow Diagrams</h3>
      ${tabs}
      <div class="flow-panels">${panels}</div>
    </section>
  `;
}

function renderKeyTerms(terms) {
  if (!terms?.length) return '';
  return `
    <section class="content-section">
      <h3>Key Terms</h3>
      <div class="terms-grid">
        ${terms.map(t => `
          <div class="term-card">
            <strong>${t.term}</strong>
            <p>${t.definition}</p>
            ${t.analogy ? `<span class="term-analogy">💡 ${t.analogy}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderChapterSummary(summary, subject) {
  if (!summary) return '';
  const points = summary.keyPoints?.map(p => `<li>${p}</li>`).join('') || '';
  return `
    <section class="content-section chapter-summary-section chapter-summary--${subject}">
      <h3>📋 Chapter Summary</h3>
      <p class="summary-overview">${summary.overview}</p>
      ${points ? `<ul class="summary-key-points">${points}</ul>` : ''}
      ${summary.examFocus ? `<div class="summary-exam-focus"><strong>Exam focus:</strong> ${summary.examFocus}</div>` : ''}
    </section>
  `;
}

export function renderChapterPage(classData, chapter) {
  const color = subjectColor(classData.subjects, chapter.subject);
  const label = subjectLabel(classData.subjects, chapter.subject);

  const related = chapter.related?.length
    ? `<div class="related-chapters">
        <h4>Related chapters</h4>
        <div class="related-links">
          ${chapter.related.map(id => {
            const ch = classData.chapters.find(c => c.id === id);
            if (!ch) return '';
            return `<a href="#/class/${classData.id}/chapter/${id}">${ch.icon} ${ch.name}</a>`;
          }).join('')}
        </div>
      </div>`
    : '';

  return `
    <nav class="breadcrumb">
      <a href="#/">Home</a>
      <span>/</span>
      <a href="#/class/${classData.id}">Class ${classData.grade}</a>
      <span>/</span>
      <span>${chapter.name}</span>
    </nav>

    <header class="chapter-header" style="--subject-color: ${color}">
      <div class="chapter-header-top">
        <span class="chapter-big-icon">${chapter.icon}</span>
        <span class="subject-badge">${label}</span>
      </div>
      <h1>${chapter.name}</h1>
      <p class="chapter-intro">${chapter.summary}</p>
      <span class="read-time">⏱ ${chapter.readTime} read</span>
    </header>

    ${renderChapterSummary(chapter.chapterSummary, chapter.subject)}

    <section class="crushed-section">
      <h2>🗜️ Crushed — the essentials</h2>
      <p class="crushed-subtitle">Everything you need to know, stripped to the bone.</p>
      <div class="crushed-grid">${renderCrushed(chapter.crushed)}</div>
    </section>

    ${renderSections(chapter.sections)}
    ${renderCompare(chapter.compare)}
    ${renderDemos(chapter.demos, chapter.subject)}
    ${renderFlows(chapter.flows)}
    ${renderKeyTerms(chapter.keyTerms)}
    ${related}
  `;
}

export function initChapterPage(chapter) {
  bindDemos(chapter.demos || []);

  if (!chapter.flows?.length) return;

  document.querySelectorAll('.flow-panel').forEach(panel => {
    bindFlowControls(panel, chapter.flows[parseInt(panel.dataset.flow)]?.steps.length || 0);
  });

  document.querySelectorAll('.flow-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = tab.dataset.flow;
      document.querySelectorAll('.flow-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.flow-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.flow-panel[data-flow="${idx}"]`)?.classList.add('active');
    });
  });
}
