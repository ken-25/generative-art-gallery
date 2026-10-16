/* Pure, versioned Truchet triangle-tile geometry. Independent of ArtGenerator so existing seeds stay reproducible. */
(() => {
  'use strict';
  // Weights for the four 90° orientations; each names the corner covered by the dark triangle.
  const orientations = Object.freeze(['nw', 'ne', 'se', 'sw']);
  const defaults = Object.freeze({columns: 12, rows: 12, nw: 25, ne: 25, se: 25, sw: 25, seed: 'tile-001'});
  const limits = Object.freeze({columns: [1, 40], rows: [1, 40], nw: [0, 100], ne: [0, 100], se: [0, 100], sw: [0, 100]});
  function normalize(input) {
    const result = {};
    for (const [key, [min, max]] of Object.entries(limits)) {
      const raw = input[key];
      let n = raw === '' || raw == null ? defaults[key] : Number(raw);
      if (!Number.isFinite(n)) n = defaults[key];
      result[key] = Math.round(Math.min(max, Math.max(min, n)));
    }
    result.seed = String(input.seed ?? '').trim().slice(0, 80) || defaults.seed;
    return result;
  }
  function random(seed) {
    let h = 2166136261;
    for (const c of seed) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
    return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // Returns rows of orientation indices (0–3). All-zero weights fall back to equal odds.
  function layout(input) {
    const s = normalize(input), rng = random(s.seed);
    const weights = orientations.map(key => s[key]);
    const total = weights.reduce((a, b) => a + b, 0);
    const odds = total === 0 ? [1, 1, 1, 1] : weights, sum = total || 4;
    const grid = [];
    for (let row = 0; row < s.rows; row++) {
      const line = [];
      for (let col = 0; col < s.columns; col++) {
        let pick = rng() * sum, index = 0;
        while (index < 3 && (pick -= odds[index]) >= 0) index++;
        line.push(index);
      }
      grid.push(line);
    }
    return grid;
  }
  const escape = value => String(value).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
  function svg(input) {
    const s = normalize(input), grid = layout(s), size = 24, margin = 24;
    const width = s.columns * size + margin * 2, height = s.rows * size + margin * 2;
    // Triangle corners (relative to the tile) for each orientation: the dark half sits on that corner.
    const shapes = ['0,0 24,0 0,24', '0,0 24,0 24,24', '24,0 24,24 0,24', '0,0 24,24 0,24'];
    let tiles = '';
    grid.forEach((line, row) => line.forEach((index, col) => {
      tiles += `<polygon transform="translate(${margin + col * size} ${margin + row * size})" points="${shapes[index]}"/>`;
    }));
    const counts = orientations.map((_, i) => grid.flat().filter(n => n === i).length).join(' / ');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="truchet-title truchet-desc"><title id="truchet-title">四つの向き</title><desc id="truchet-desc">${s.columns}列 × ${s.rows}行の二色三角タイル。向きの数（左上 / 右上 / 右下 / 左下）: ${counts}。シード: ${escape(s.seed)}</desc><metadata>${escape(JSON.stringify({generator: 'truchet-tiles', version: 1, ...s}))}</metadata><rect width="100%" height="100%" fill="#f7f3e8"/><rect x="${margin}" y="${margin}" width="${s.columns * size}" height="${s.rows * size}" fill="#e4d6b8"/><g fill="#2e4a57">${tiles}</g></svg>`;
  }
  window.TruchetGenerator = Object.freeze({defaults, limits, orientations, normalize, layout, svg});
})();
