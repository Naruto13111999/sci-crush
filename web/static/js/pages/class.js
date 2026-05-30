import { subjectColor, subjectIcon, subjectLabel } from '../api.js';
import { canAccessChapter, hasFullAccess } from '../auth.js';

export function renderClassPage(classData) {
  const subjectFilters = classData.subjects.map(s => `
    <button class="filter-btn" data-subject="${s.id}" style="--filter-color: ${s.color}">
      ${s.icon} ${s.label}
    </button>
  `).join('');

  const chapters = classData.chapters.map(ch => {
    const color = subjectColor(classData.subjects, ch.subject);
    const icon = subjectIcon(classData.subjects, ch.subject);
    const label = subjectLabel(classData.subjects, ch.subject);
    const locked = !canAccessChapter(ch.id);

    if (locked) {
      return `
        <div class="chapter-card chapter-card--locked"
             data-subject="${ch.subject}"
             data-chapter-id="${ch.id}"
             style="--subject-color: ${color}">
          <div class="chapter-card-top">
            <span class="chapter-icon">${ch.icon}</span>
            <span class="subject-tag">${icon} ${label}</span>
            <span class="lock-badge">🔒 Coming soon</span>
          </div>
          <h3>${ch.name}</h3>
          <p class="chapter-summary">${ch.summary}</p>
          <div class="chapter-meta">
            <span>⏱ ${ch.readTime}</span>
            <span class="chapter-link locked-text">Beta access — full library coming soon</span>
          </div>
        </div>
      `;
    }

    return `
      <a href="#/class/${classData.id}/chapter/${ch.id}"
         class="chapter-card chapter-card--unlocked"
         data-subject="${ch.subject}"
         style="--subject-color: ${color}">
        <div class="chapter-card-top">
          <span class="chapter-icon">${ch.icon}</span>
          <span class="subject-tag">${icon} ${label}</span>
          <span class="unlock-badge">🔓 Beta</span>
        </div>
        <h3>${ch.name}</h3>
        <p class="chapter-summary">${ch.summary}</p>
        <div class="chapter-meta">
          <span>⏱ ${ch.readTime}</span>
          <span class="chapter-link">Read →</span>
        </div>
      </a>
    `;
  }).join('');

  const accessNote = hasFullAccess()
    ? '<p class="access-banner access-banner--full">✅ Full access enabled for your account</p>'
    : '<p class="access-banner">🔓 Beta access — <strong>Cell Structure</strong> &amp; <strong>Chemical Effects of Electric Current</strong> unlocked. More chapters coming soon.</p>';

  return `
    <nav class="breadcrumb">
      <a href="#/">Home</a>
      <span>/</span>
      <span>Class ${classData.grade}</span>
    </nav>

    <header class="class-header" style="--class-color: ${classData.color}">
      <div class="class-header-icon">${classData.icon}</div>
      <div>
        <h1>${classData.name}</h1>
        <p>${classData.description}</p>
      </div>
    </header>

    ${accessNote}

    <div class="filter-bar">
      <button class="filter-btn active" data-subject="all">All subjects</button>
      ${subjectFilters}
    </div>

    <div class="chapter-grid" id="chapter-grid">${chapters}</div>
  `;
}

export function initClassPage(classData) {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.chapter-card');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const subject = btn.dataset.subject;
      cards.forEach(card => {
        card.style.display = (subject === 'all' || card.dataset.subject === subject) ? '' : 'none';
      });
    });
  });

  document.querySelectorAll('.chapter-card--locked').forEach(card => {
    card.addEventListener('click', () => {
      location.hash = `#/class/${classData.id}/chapter/${card.dataset.chapterId}`;
    });
  });
}
