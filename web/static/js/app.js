import { listClasses, getClass, getChapter } from './api.js';
import { ensureAuthModal, logout, renderNavAuth, canAccessChapter, getUserEmail, stopFeedbackReminders, startFeedbackReminders } from './auth.js';
import { renderHomePage } from './pages/home.js';
import { renderClassPage, initClassPage } from './pages/class.js';
import { renderChapterPage, initChapterPage } from './pages/chapter.js';

const main = document.getElementById('main');

function parseRoute() {
  const hash = location.hash.slice(1) || '/';
  return hash.split('/').filter(Boolean);
}

function showLoading() {
  main.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}

function showError(msg) {
  main.innerHTML = `<div class="error-state"><p>${msg}</p><a href="#/" class="btn btn-primary">Go home</a></div>`;
}

function showLockedChapter() {
  main.innerHTML = `
    <nav class="breadcrumb">
      <a href="#/">Home</a>
      <span>/</span>
      <a href="#/class/8">Class 8</a>
      <span>/</span>
      <span>Coming soon</span>
    </nav>
    <div class="locked-page">
      <span class="locked-icon">🔒</span>
      <h2>Coming soon — you're on beta access</h2>
      <p>We're still building the full Class 8 library. Your beta account includes these two chapters:</p>
      <ul class="locked-free-list">
        <li><a href="#/class/8/chapter/cell-structure">🔬 Cell — Structure and Functions</a></li>
        <li><a href="#/class/8/chapter/chemical-effects-electric-current">⚡ Chemical Effects of Electric Current</a></li>
      </ul>
      <p class="locked-hint">Full access to all chapters is available for approved accounts only.</p>
      <a href="#/class/8" class="btn btn-primary">Back to chapters</a>
    </div>
  `;
}

function updateNav(parts) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (parts[0] === 'class' && link.getAttribute('href') === `#/class/${parts[1]}`) {
      link.classList.add('active');
    }
  });
}

async function render() {
  if (!getUserEmail()) {
    await ensureAuthModal();
  }

  const parts = parseRoute();
  updateNav(parts);
  renderNavAuth();
  showLoading();

  try {
    if (parts.length === 0) {
      const data = await listClasses();
      main.innerHTML = renderHomePage(data.classes);
      const email = getUserEmail();
      if (email) startFeedbackReminders(email);
      return;
    }

    if (parts[0] === 'class' && parts.length === 2) {
      const classData = await getClass(parts[1]);
      main.innerHTML = renderClassPage(classData);
      initClassPage(classData);
      return;
    }

    if (parts[0] === 'class' && parts[2] === 'chapter' && parts.length === 4) {
      const chapterId = parts[3];
      if (!canAccessChapter(chapterId)) {
        showLockedChapter();
        return;
      }
      const [classData, chapter] = await Promise.all([
        getClass(parts[1]),
        getChapter(parts[1], chapterId),
      ]);
      main.innerHTML = renderChapterPage(classData, chapter);
      initChapterPage(chapter);
      return;
    }

    showError('Page not found');
  } catch (err) {
    if (err.code === 'LOCKED') {
      showLockedChapter();
      return;
    }
    showError(err.message || 'Something went wrong');
  }
}

async function boot() {
  await ensureAuthModal();
  renderNavAuth();
  const email = getUserEmail();
  if (email) startFeedbackReminders(email);

  window.addEventListener('sci-crush:logout', async () => {
    stopFeedbackReminders();
    logout();
    renderNavAuth();
    location.hash = '#/';
    await ensureAuthModal();
    render();
  });

  window.addEventListener('hashchange', render);
  render();
}

boot();
