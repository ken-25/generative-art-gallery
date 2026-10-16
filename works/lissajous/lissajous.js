/* Pure, versioned Lissajous geometry: x = A sin(a t + δ), y = B sin(b t). No external assets. */
(() => {
  'use strict';
  const defaults = Object.freeze({freqX: 3, freqY: 2, phase: 90, ampX: 1, ampY: 1, weight: 1.6, palette: 'indigo'});
  const limits = Object.freeze({freqX: [1, 12], freqY: [1, 12], phase: [0, 360], ampX: [0.1, 1], ampY: [0.1, 1], weight: [0.5, 4]});
  const integers = ['freqX', 'freqY', 'phase'];
  const palettes = Object.freeze({
    indigo: Object.freeze({label: '藍', ground: '#f2f0e8', ink: '#29386a', guide: '#29386a'}),
    vermilion: Object.freeze({label: '朱', ground: '#f7efe4', ink: '#b0432b', guide: '#b0432b'}),
    night: Object.freeze({label: '夜', ground: '#1c1f26', ink: '#ecd9a0', guide: '#ecd9a0'})
  });
  const size = 600, radius = 260, maxPoints = 2401;
  function normalize(input) {
    const result = {};
    for (const [key, [min, max]] of Object.entries(limits)) {
      const raw = input[key];
      let n = raw === '' || raw == null ? defaults[key] : Number(raw);
      if (!Number.isFinite(n)) n = defaults[key];
      n = Math.min(max, Math.max(min, n));
      result[key] = integers.includes(key) ? Math.round(n) : Math.round(n * 100) / 100;
    }
    result.palette = Object.hasOwn(palettes, input.palette) ? input.palette : defaults.palette;
    return result;
  }
  // Integer frequencies close the curve within one 2π period; the sample count is capped.
  function points(input) {
    const s = normalize(input), delta = s.phase * Math.PI / 180;
    const count = Math.min(maxPoints, 200 * Math.max(s.freqX, s.freqY) + 1), result = [];
    for (let i = 0; i < count; i++) {
      const t = 2 * Math.PI * i / (count - 1);
      result.push([size / 2 + s.ampX * radius * Math.sin(s.freqX * t + delta), size / 2 - s.ampY * radius * Math.sin(s.freqY * t)]);
    }
    return result;
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  // 90 -> "π/2", 0 -> "0", 37 -> "37°"
  function phaseLabel(degrees) {
    if (degrees === 0) return '0';
    const g = gcd(degrees, 180), num = degrees / g, den = 180 / g;
    if (den > 12) return `${degrees}°`;
    return `${num === 1 ? '' : num}π${den === 1 ? '' : '/' + den}`;
  }
  function svg(input) {
    const s = normalize(input), p = palettes[s.palette], f = n => n.toFixed(2);
    const d = points(s).map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');
    const w = s.ampX * radius, h = s.ampY * radius;
    const label = `${s.freqX}:${s.freqY}, δ = ${phaseLabel(s.phase)}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-labelledby="lj-title lj-desc"><title id="lj-title">ふたつの振動</title><desc id="lj-desc">Lissajous曲線 x = ${s.ampX} sin(${s.freqX}t + ${phaseLabel(s.phase)}), y = ${s.ampY} sin(${s.freqY}t)。周波数比 ${label}。</desc><metadata>${JSON.stringify({generator: 'lissajous', version: 1, ...s})}</metadata><rect width="100%" height="100%" fill="${p.ground}"/><g fill="none" stroke="${p.guide}" stroke-width="0.6" opacity="0.22"><rect x="${f(size / 2 - w)}" y="${f(size / 2 - h)}" width="${f(w * 2)}" height="${f(h * 2)}" stroke-dasharray="3 5"/><path d="M${size / 2} 18V${size - 18}M18 ${size / 2}H${size - 18}"/></g><path d="${d}" fill="none" stroke="${p.ink}" stroke-width="${s.weight}" stroke-linejoin="round" stroke-linecap="round"/><text x="24" y="${size - 22}" fill="${p.ink}" opacity="0.55" font-family="sans-serif" font-size="11" letter-spacing="1">${label}</text></svg>`;
  }
  const api = Object.freeze({defaults, limits, palettes, normalize, points, phaseLabel, svg});
  if (typeof window !== 'undefined') window.LissajousGenerator = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
