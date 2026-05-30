import { authHeaders, getUserEmail } from './auth.js';
import { getApiBase } from './config.js';

function apiUrl(path) {
  return `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
}

function headers(extra = {}) {
  return { ...authHeaders(), ...extra };
}

async function apiFetch(url, options = {}) {
  try {
    return await fetch(url, { cache: 'no-store', ...options });
  } catch {
    throw new Error('Cannot reach the server — run make dev and refresh the page.');
  }
}

export async function listClasses() {
  const res = await apiFetch(apiUrl('/classes'), { headers: headers() });
  if (!res.ok) throw new Error('Failed to load classes');
  return res.json();
}

export async function getClass(id) {
  const res = await apiFetch(apiUrl(`/classes/${id}`), { headers: headers() });
  if (!res.ok) throw new Error('Class not found');
  return res.json();
}

export async function getChapter(classId, chapterId) {
  if (!getUserEmail()) {
    throw new Error('Please log in to continue');
  }

  const res = await apiFetch(apiUrl(`/classes/${classId}/chapters/${chapterId}`), {
    headers: headers(),
  });

  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    const err = new Error('This chapter is locked');
    err.code = 'LOCKED';
    err.data = data;
    throw err;
  }
  if (res.status === 401) throw new Error('Please log in to continue');
  if (res.status === 404) throw new Error('Chapter not found');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not load chapter');
  }
  return res.json();
}

export function subjectColor(subjects, subjectId) {
  const s = subjects?.find(x => x.id === subjectId);
  return s?.color || '#6366F1';
}

export function subjectLabel(subjects, subjectId) {
  const s = subjects?.find(x => x.id === subjectId);
  return s?.label || subjectId;
}

export function subjectIcon(subjects, subjectId) {
  const s = subjects?.find(x => x.id === subjectId);
  return s?.icon || '📖';
}
