# Feedback form setup

SciCrush only stops feedback reminders after a **real Google Form submission**, not when the user clicks a button.

## One-time Google Form configuration

1. Open your [feedback form](https://docs.google.com/forms/d/e/1FAIpQLScJezNXH856G3kgJK8P_gNQy8GIBs5Sd3JcsKAXUsNtIbP3nA/edit) in Google Forms
2. Click **Settings** (gear icon) → **Presentation**
3. Under confirmation, choose **Redirect to a website** (or equivalent)
4. Set the redirect URL to your hosted **feedback-done** page:

| Environment | Redirect URL |
|-------------|--------------|
| Local (`make dev`) | `http://localhost:8080/static/feedback-done.html` |
| GitHub Pages (repo root) | `https://YOUR-USER.github.io/YOUR-REPO/static/feedback-done.html` |
| GitHub Pages (project site) | `https://YOUR-USER.github.io/sci-crush/static/feedback-done.html` |

After submit, Google loads that page, which notifies SciCrush and marks feedback as complete.

## How it works

- **Embedded popup:** `feedback-done.html` loads inside the iframe → `postMessage` to the app → reminders stop
- **New tab / full redirect:** `feedback-done.html` sets a flag and sends the user back home → app reads the flag on load

There is **no** “I've submitted” button — users cannot skip without submitting.

## Test locally

1. Set the Google Form redirect to `http://localhost:8080/static/feedback-done.html`
2. Register / log in → wait for popup → submit the form
3. Reminders should stop; `localStorage` key `sci-crush-feedback-verified-v2:your@email.com` is set

To re-test, remove that localStorage key and clear the redirect flag.
