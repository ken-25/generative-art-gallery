/* Pure, versioned geometry shared by the gallery and artwork. No external assets. */
(() => {
  'use strict';
  const defaults = Object.freeze({position: 0.75, rotation: 65, growth: 1.7, columns: 12, rows: 22, seed: 'study-001'});
  const limits = Object.freeze({position: [0, 2], rotation: [0, 180], growth: [0.2, 4], columns: [1, 40], rows: [1, 60]});
  function normalize(input) {
    const result = {};
    for (const [key, [min, max]] of Object.entries(limits)) {
      const raw = input[key];
      let n = raw === '' || raw == null ? defaults[key] : Number(raw);
      if (!Number.isFinite(n)) n = defaults[key];
      n = Math.min(max, Math.max(min, n));
      result[key] = ['columns', 'rows'].includes(key) ? Math.round(n) : Math.round(n * 100) / 100;
    }
    result.seed = String(input.seed ?? '').trim().slice(0, 80) || defaults.seed;
    return result;
  }
  function random(seed) {
    let h = 2166136261;
    for (const c of seed) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
    return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const escape = value => String(value).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
  function svg(input) {
    const s = normalize(input), rng = random(s.seed), pitch = 24, side = 22;
    // Fixed conservative margins contain even the maximum displacement and rotation.
    const margin = side * s.position + side * Math.SQRT2 / 2 + 24;
    const width = (s.columns - 1) * pitch + margin * 2, height = (s.rows - 1) * pitch + margin * 2;
    const f = n => n.toFixed(3);
    let shapes = '';
    for (let row = 0; row < s.rows; row++) {
      const amount = Math.pow(s.rows === 1 ? 0 : row / (s.rows - 1), s.growth);
      for (let col = 0; col < s.columns; col++) {
        const x = margin + col * pitch + (rng() * 2 - 1) * side * s.position * amount;
        const y = margin + row * pitch + (rng() * 2 - 1) * side * s.position * amount;
        const angle = (rng() * 2 - 1) * s.rotation * amount;
        shapes += `<rect x="-11" y="-11" width="22" height="22" transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})"/>`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(width)} ${f(height)}" width="${f(width)}" height="${f(height)}" role="img" aria-labelledby="art-title art-desc"><title id="art-title">秩序とゆらぎ</title><desc id="art-desc">${s.columns}列 × ${s.rows}行の正方形。下の行ほど位置と回転が乱れる。シード: ${escape(s.seed)}</desc><metadata>${escape(JSON.stringify({generator: 'order-and-chance', version: 1, ...s}))}</metadata><rect width="100%" height="100%" fill="#fff"/><g fill="none" stroke="#191919" stroke-width="0.85">${shapes}</g></svg>`;
  }
  window.ArtGenerator = Object.freeze({defaults, limits, normalize, svg});
})();
