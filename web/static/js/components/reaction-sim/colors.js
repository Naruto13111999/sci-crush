/** Chemically-inspired colours for substances */
export const C = {
  metals: {
    Zn: { fill: '#A8B4BE', hi: '#D8E4EE', lo: '#6B7882', label: 'Zinc' },
    Mg: { fill: '#C5C5C5', hi: '#F0F0F0', lo: '#909090', label: 'Magnesium' },
    Fe: { fill: '#505050', hi: '#787878', lo: '#303030', label: 'Iron' },
    Cu: { fill: '#C27830', hi: '#E8A55A', lo: '#8B4513', label: 'Copper' },
    C:  { fill: '#333333', hi: '#555555', lo: '#1A1A1A', label: 'Carbon' },
    Cr: { fill: '#A8A8A8', hi: '#D0D0D0', lo: '#707070', label: 'Chromium' },
  },
  solutions: {
    hcl:    '#FFF8B0',
    cuso4:  '#1565C0',
    znso4:  '#D6EAF8',
    water:  '#81D4FA',
    acid:   '#FFF176',
    clear:  '#E3F2FD',
  },
  gases: {
    H2:  { core: 'rgba(235,245,255,0.75)', edge: 'rgba(180,210,255,0.5)', label: 'H₂' },
    O2:  { core: 'rgba(180,220,255,0.55)', edge: 'rgba(120,190,255,0.35)', label: 'O₂' },
    CO2: { core: 'rgba(190,190,190,0.6)', edge: 'rgba(150,150,150,0.4)', label: 'CO₂' },
    CO:  { core: 'rgba(255,130,130,0.55)', edge: 'rgba(255,80,80,0.35)', label: 'CO' },
    CH4: { core: 'rgba(255,240,160,0.55)', edge: 'rgba(255,220,100,0.35)', label: 'CH₄' },
    SO2: { core: 'rgba(210,210,210,0.55)', edge: 'rgba(170,170,170,0.35)', label: 'SO₂' },
    NO2: { core: 'rgba(200,160,255,0.55)', edge: 'rgba(160,100,220,0.35)', label: 'NO₂' },
  },
  solids: {
    MgO: '#F0F0F0',
    rust: '#B7410E',
    soot: '#1A1A1A',
    poly: '#FFF9C4',
  },
};

export function gasKey(symbol) {
  if (!symbol) return 'O2';
  const s = symbol.replace(/[₀-₉]/g, c => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(c)] ?? c);
  if (/H2|H₂/.test(s)) return 'H2';
  if (/O2|O₂/.test(s)) return 'O2';
  if (/CO2|CO₂/.test(s)) return 'CO2';
  if (/^CO$/.test(s)) return 'CO';
  if (/CH4|CH₄/.test(s)) return 'CH4';
  if (/SO2|SO₂/.test(s)) return 'SO2';
  if (/NO2|NO₂/.test(s)) return 'NO2';
  return 'O2';
}

export function metalKey(symbol, name = '') {
  const t = (symbol + name).toUpperCase();
  if (t.includes('ZN') || t.includes('ZINC')) return 'Zn';
  if (t.includes('MG') || t.includes('MAGNESIUM')) return 'Mg';
  if (t.includes('FE') || t.includes('IRON')) return 'Fe';
  if (t.includes('CU') || t.includes('COPPER')) return 'Cu';
  if (t.includes('CR') || t.includes('CHROM')) return 'Cr';
  if (t.includes('CARBON') || symbol === 'C') return 'C';
  return 'Fe';
}

export function solutionKey(symbol, name = '') {
  const t = (symbol + name).toLowerCase();
  if (/hcl|hydrochloric|acid/.test(t)) return 'hcl';
  if (/cuso|copper sulphate|copper sulfate|cu²|blue/.test(t)) return 'cuso4';
  if (/znso|zinc sulphate|zinc sulfate|colourless|colorless/.test(t)) return 'znso4';
  if (/h2o|water|rain/.test(t)) return 'water';
  return 'water';
}

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function smooth(t) { return t * t * (3 - 2 * t); }
export function easeOut(t) { return 1 - (1 - t) ** 3; }

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return `rgb(${r},${g},${bl})`;
}
