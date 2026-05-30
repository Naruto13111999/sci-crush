import { getApiBase } from './config.js';

const STORAGE_KEY = 'sci-crush-user';

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScJezNXH856G3kgJK8P_gNQy8GIBs5Sd3JcsKAXUsNtIbP3nA/viewform?embedded=true';
const FEEDBACK_FORM_OPEN_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScJezNXH856G3kgJK8P_gNQy8GIBs5Sd3JcsKAXUsNtIbP3nA/viewform';
/** Re-prompt every ~6s while logged in until feedback is submitted */
const FEEDBACK_INTERVAL_MS = 6000;
const FEEDBACK_INITIAL_MS = 5000;

let feedbackInterval = null;
let feedbackInitialTimeout = null;

/** Must stay in sync with internal/access/access.go FreeChapterIDs */
export const FREE_CHAPTER_IDS = [
  'cell-structure',
  'chemical-effects-electric-current',
];

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Legacy: flat { name, email, ... } without user/access wrapper
    if (parsed?.email && !parsed?.user) {
      return { user: parsed, access: null };
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveUser(user, access) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, access }));
}

export function getUserEmail() {
  return getStoredUser()?.user?.email?.toLowerCase()?.trim() || '';
}

export function hasFullAccess() {
  return getStoredUser()?.access?.fullAccess === true;
}

export function canAccessChapter(chapterId) {
  const stored = getStoredUser();
  if (!stored?.user?.email) return false;
  if (stored.access?.fullAccess === true) return true;
  const unlocked = stored.access?.unlockedChapters;
  if (Array.isArray(unlocked) && unlocked.length > 0) {
    return unlocked.includes(chapterId);
  }
  return FREE_CHAPTER_IDS.includes(chapterId);
}

/** Refresh access flags from the server (fixes stale localStorage after updates). */
export async function refreshAccessFromServer() {
  const email = getUserEmail();
  if (!email) return null;
  try {
    const res = await fetch(`${getApiBase()}/access?email=${encodeURIComponent(email)}`, {
      headers: { 'X-User-Email': email },
    });
    if (!res.ok) return null;
    const access = await res.json();
    const stored = getStoredUser();
    if (stored?.user) {
      saveUser(stored.user, access);
    }
    return access;
  } catch {
    return null;
  }
}

export function authHeaders() {
  const email = getUserEmail();
  return email ? { 'X-User-Email': email } : {};
}

export function logout() {
  stopFeedbackReminders();
  localStorage.removeItem(STORAGE_KEY);
}

function feedbackSubmittedKey(email) {
  // v2: only set after verified Google Form redirect/postMessage (not manual button)
  return `sci-crush-feedback-verified-v2:${email.toLowerCase().trim()}`;
}

function hasFeedbackSubmitted(email) {
  return localStorage.getItem(feedbackSubmittedKey(email)) === '1';
}

function markFeedbackSubmitted(email) {
  localStorage.setItem(feedbackSubmittedKey(email), '1');
  stopFeedbackReminders();
}

/** After Google Form redirect (new tab / full page), mark submitted for logged-in user. */
export function processFeedbackRedirect() {
  if (localStorage.getItem('sci-crush-feedback-redirect') !== '1') return;
  localStorage.removeItem('sci-crush-feedback-redirect');
  const email = getUserEmail();
  if (email) markFeedbackSubmitted(email);
}

/** URL to set in Google Form → Settings → Presentation → Redirect to a website */
export function getFeedbackDoneUrl() {
  return new URL('static/feedback-done.html', window.location.href).href;
}

export function stopFeedbackReminders() {
  if (feedbackInitialTimeout) {
    clearTimeout(feedbackInitialTimeout);
    feedbackInitialTimeout = null;
  }
  if (feedbackInterval) {
    clearInterval(feedbackInterval);
    feedbackInterval = null;
  }
}

function shouldShowFeedback(email) {
  if (!email || hasFeedbackSubmitted(email)) return false;
  if (document.querySelector('.register-overlay')) return false;
  if (document.querySelector('.feedback-overlay')) return false;
  return true;
}

function feedbackTick(email) {
  if (!getUserEmail() || getUserEmail() !== email) {
    stopFeedbackReminders();
    return;
  }
  if (hasFeedbackSubmitted(email)) {
    stopFeedbackReminders();
    return;
  }
  if (shouldShowFeedback(email)) {
    showFeedbackModal(email);
  }
}

/** Show feedback every ~6s while logged in until the user submits the form. */
export function startFeedbackReminders(email) {
  const normalized = email?.toLowerCase()?.trim();
  if (!normalized || hasFeedbackSubmitted(normalized)) return;

  stopFeedbackReminders();

  feedbackInitialTimeout = setTimeout(() => {
    feedbackInitialTimeout = null;
    feedbackTick(normalized);
    feedbackInterval = setInterval(() => feedbackTick(normalized), FEEDBACK_INTERVAL_MS);
  }, FEEDBACK_INITIAL_MS);
}

function dismissFeedbackModal(overlay, onMessage) {
  if (onMessage) window.removeEventListener('message', onMessage);
  overlay.remove();
  document.body.classList.remove('feedback-open');
}

function showFeedbackModal(email) {
  if (hasFeedbackSubmitted(email)) return;
  if (document.querySelector('.feedback-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'feedback-overlay';
  overlay.innerHTML = `
    <div class="feedback-modal" role="dialog" aria-labelledby="feedback-title">
      <div class="feedback-modal-header">
        <div>
          <h2 id="feedback-title">Quick feedback</h2>
          <p>Fill in the form below (about 20–30 seconds). Reminders stop only after you submit.</p>
        </div>
        <button type="button" class="feedback-close" aria-label="Close feedback">&times;</button>
      </div>
      <iframe
        src="${FEEDBACK_FORM_URL}"
        title="SciCrush beta feedback"
        class="feedback-iframe"
        loading="lazy"
      ></iframe>
      <div class="feedback-footer">
        <button type="button" class="btn feedback-skip">Remind me later</button>
        <a href="${FEEDBACK_FORM_OPEN_URL}" target="_blank" rel="noopener noreferrer" class="feedback-open-link">Open in new tab ↗</a>
      </div>
      <p class="feedback-hint">Submit the form above to stop reminders — closing without submitting will ask again in about 6 seconds.</p>
    </div>
  `;

  const onMessage = (event) => {
    if (event.data?.type !== 'sci-crush-feedback-submitted') return;
    markFeedbackSubmitted(email);
    dismissFeedbackModal(overlay, onMessage);
  };
  window.addEventListener('message', onMessage);

  overlay.querySelector('.feedback-close')?.addEventListener('click', () => dismissFeedbackModal(overlay, onMessage));
  overlay.querySelector('.feedback-skip')?.addEventListener('click', () => dismissFeedbackModal(overlay, onMessage));

  document.body.appendChild(overlay);
  document.body.classList.add('feedback-open');
}

/** Show signed-in user + logout in the nav bar */
export function renderNavAuth() {
  const el = document.getElementById('nav-auth');
  if (!el) return;

  const stored = getStoredUser();
  if (!stored?.user?.email) {
    el.innerHTML = '';
    return;
  }

  const name = stored.user.name || 'Beta user';
  const email = stored.user.email;
  const badge = stored.access?.fullAccess === true
    ? '<span class="nav-access-badge nav-access-badge--full">Full access</span>'
    : '<span class="nav-access-badge">Beta</span>';

  el.innerHTML = `
    <div class="nav-user">
      ${badge}
      <span class="nav-user-name" title="${email}">${name}</span>
      <button type="button" class="nav-logout-btn" id="nav-logout">Log out</button>
    </div>
  `;

  el.querySelector('#nav-logout')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('sci-crush:logout'));
  });
}

function loginModalHTML() {
  return `
    <div class="register-modal" role="dialog" aria-labelledby="login-title">
      <div class="register-modal-header">
        <span class="register-icon">⚗️</span>
        <h2 id="login-title">Welcome back</h2>
        <p>Log in with the email and name you used when you registered.</p>
      </div>
      <form id="login-form" class="register-form">
        <label>
          <span>Full name</span>
          <input type="text" name="name" required placeholder="Your name" autocomplete="name">
        </label>
        <label>
          <span>Email</span>
          <input type="email" name="email" required placeholder="you@school.com" autocomplete="email">
        </label>
        <p class="register-error" id="auth-error" hidden></p>
        <button type="submit" class="btn btn-primary register-submit">Log in</button>
      </form>
      <p class="auth-switch">
        New to SciCrush?
        <button type="button" class="auth-switch-btn" data-mode="register">Register for beta</button>
      </p>
    </div>
  `;
}

function registerModalHTML() {
  return `
    <div class="register-modal" role="dialog" aria-labelledby="register-title">
      <div class="register-modal-header">
        <span class="register-icon">⚗️</span>
        <h2 id="register-title">Register for beta access</h2>
        <p>SciCrush is in beta — sign up to explore Class 8 sample chapters while we build the full library.</p>
      </div>
      <form id="register-form" class="register-form">
        <label>
          <span>Full name</span>
          <input type="text" name="name" required placeholder="Your name" autocomplete="name">
        </label>
        <div class="register-class-fixed">
          <span class="register-class-label">Class</span>
          <span class="register-class-value">Class 8 <em>(beta)</em></span>
        </div>
        <label>
          <span>Email</span>
          <input type="email" name="email" required placeholder="you@school.com" autocomplete="email">
        </label>
        <label>
          <span>Phone number</span>
          <input type="tel" name="phone" required placeholder="10-digit mobile" autocomplete="tel">
        </label>
        <p class="register-note">Beta includes: <strong>Cell Structure</strong> &amp; <strong>Chemical Effects of Electric Current</strong></p>
        <p class="register-error" id="auth-error" hidden></p>
        <button type="submit" class="btn btn-primary register-submit">Join beta</button>
      </form>
      <p class="auth-switch">
        Already registered?
        <button type="button" class="auth-switch-btn" data-mode="login">Log in</button>
      </p>
    </div>
  `;
}

function bindAuthSwitch(overlay, onSwitch) {
  overlay.querySelectorAll('.auth-switch-btn').forEach((btn) => {
    btn.addEventListener('click', () => onSwitch(btn.dataset.mode));
  });
}

function showAuthModal(initialMode = 'login') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'register-overlay';

    const renderMode = (mode) => {
      overlay.innerHTML = mode === 'register' ? registerModalHTML() : loginModalHTML();
      bindAuthSwitch(overlay, renderMode);
      bindForm(overlay, mode);
    };

    const bindForm = (root, mode) => {
      const form = root.querySelector(mode === 'register' ? '#register-form' : '#login-form');
      const errEl = root.querySelector('#auth-error');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.hidden = true;
        const btn = form.querySelector('.register-submit');
        btn.disabled = true;
        btn.textContent = mode === 'register' ? 'Saving…' : 'Logging in…';

        const fd = new FormData(form);
        const name = fd.get('name')?.toString().trim();
        const email = fd.get('email')?.toString().trim();

        try {
          let res;
          if (mode === 'register') {
            res = await fetch(`${getApiBase()}/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                class: '8',
                email,
                phone: fd.get('phone')?.toString().trim(),
              }),
            });
          } else {
            res = await fetch(`${getApiBase()}/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email }),
            });
          }

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || (mode === 'register' ? 'Registration failed' : 'Login failed'));

          saveUser(data.user, data.access);
          overlay.remove();
          document.body.classList.remove('register-open');
          renderNavAuth();
          if (data.user?.email) {
            startFeedbackReminders(data.user.email);
          }
          resolve({ user: data.user, access: data.access });
        } catch (err) {
          errEl.textContent = err.message || 'Something went wrong. Try again.';
          errEl.hidden = false;
          btn.disabled = false;
          btn.textContent = mode === 'register' ? 'Join beta' : 'Log in';
        }
      });
    };

    document.body.appendChild(overlay);
    document.body.classList.add('register-open');
    renderMode(initialMode);
  });
}

/** Gate the app until the user is logged in or registers. */
export async function ensureAuthModal() {
  processFeedbackRedirect();
  const existing = getStoredUser();
  if (existing?.user?.email) {
    await refreshAccessFromServer();
    startFeedbackReminders(existing.user.email);
    return getStoredUser();
  }
  return showAuthModal('login');
}

/** @deprecated Use ensureAuthModal */
export const ensureRegistrationModal = ensureAuthModal;
