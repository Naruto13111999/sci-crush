/** API base URL — overridden at build time for GitHub Pages (see cmd/staticexport). */
export function getApiBase() {
  const configured = window.__SCI_CRUSH_CONFIG__?.apiBase;
  if (configured !== undefined && configured !== null && configured !== '') {
    return String(configured).replace(/\/$/, '');
  }
  return '/api';
}
