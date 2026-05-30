export function renderHomePage(classes) {
  const cards = classes.map(c => `
    <a href="#/class/${c.id}" class="class-card" style="--class-color: ${c.color}">
      <div class="class-card-badge">Class ${c.grade}</div>
      <div class="class-card-icon">${c.icon}</div>
      <h3>${c.name}</h3>
      <p class="class-card-tagline">${c.tagline}</p>
      <div class="class-card-meta">
        <span>${c.chapterCount} chapters</span>
        <span>Virtual labs</span>
      </div>
    </a>
  `).join('');

  const comingSoon = [9, 10, 11, 12].map(n => `
    <div class="coming-soon-card">
      <span class="coming-soon-grade">Class ${n}</span>
      <span class="coming-soon-tag">Coming soon</span>
    </div>
  `).join('');

  return `
    <section class="hero">
      <div class="hero-badge">NCERT Science · Beta</div>
      <h1>Science topics,<br><span>crushed & visualized</span></h1>
      <p>Class 8 is live in beta — crushed notes, virtual labs, summaries, and flow diagrams. More classes launching soon.</p>
    </section>

    <section class="roadmap-banner" aria-label="Upcoming classes">
      <div class="roadmap-banner-inner">
        <div class="roadmap-banner-text">
          <span class="roadmap-pill">🚀 On the way</span>
          <h2>Classes 9, 10, 11 &amp; 12</h2>
          <p>We're building NCERT-aligned content for every class. Register for beta to get early access updates.</p>
        </div>
        <div class="roadmap-classes">${comingSoon}</div>
      </div>
    </section>

    <section>
      <h2 class="section-title">Available now — Class 8</h2>
      <p class="section-desc">18 chapters across Biology, Chemistry, and Physics — beta members get sample chapters today.</p>
      <div class="class-grid">${cards}</div>
    </section>

    <section class="features">
      <h2 class="section-title">How SciCrush works</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <span class="feature-icon">🗜️</span>
          <h3>Crushed notes</h3>
          <p>Complex NCERT paragraphs distilled into 5–7 ultra-simple takeaways you can scan in 2 minutes.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">🔀</span>
          <h3>Flow diagrams</h3>
          <p>Step through processes like photosynthesis, chemical reactions, and circuits with animated flows.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">🧪</span>
          <h3>Virtual labs</h3>
          <p>Step-by-step canvas simulations for reactions, cells, fertilisation, forces, light, and more.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">📋</span>
          <h3>Chapter summaries</h3>
          <p>Comprehensive NCERT-aligned overviews with key points and exam focus for every chapter.</p>
        </div>
      </div>
    </section>

    <p class="home-credit">Made with <span class="heart" aria-hidden="true">♥</span> by <a href="https://gyanankur.dev" target="_blank" rel="noopener noreferrer">Gyanankur</a></p>
  `;
}
