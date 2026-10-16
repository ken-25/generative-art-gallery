(() => {
  'use strict';
  const form = document.getElementById('settings');
  const art = document.getElementById('art');
  const status = document.getElementById('status');
  const G = LissajousGenerator;
  const presets = {line: {freqX: 1, freqY: 1, phase: 0, ampX: 1, ampY: 1}, circle: {freqX: 1, freqY: 1, phase: 90, ampX: 1, ampY: 1}, eight: {freqX: 1, freqY: 2, phase: 90, ampX: 1, ampY: 0.8}, knot: {freqX: 3, freqY: 2, phase: 90, ampX: 1, ampY: 1}, weave: {freqX: 5, freqY: 4, phase: 45, ampX: 1, ampY: 1}, lattice: {freqX: 9, freqY: 8, phase: 30, ampX: 0.9, ampY: 1}};
  const keys = Object.keys(G.limits);
  let current, frame;
  function read() {
    return {...Object.fromEntries(keys.map(key => [key, form.elements[key].value])), palette: form.elements.palette.value};
  }
  function render() {
    current = G.normalize(read());
    art.innerHTML = G.svg(current);
    document.getElementById('freqX-value').value = current.freqX;
    document.getElementById('freqY-value').value = current.freqY;
    const phase = G.phaseLabel(current.phase);
    document.getElementById('phase-value').value = phase.endsWith('°') ? phase : `${current.phase}° (${phase})`;
    for (const key of ['ampX', 'ampY', 'weight']) document.getElementById(`${key}-value`).value = current[key].toFixed(key === 'weight' ? 1 : 2);
    document.getElementById('art-caption').textContent = `a:b = ${current.freqX}:${current.freqY} / δ = ${G.phaseLabel(current.phase)}`;
  }
  function sync() {
    for (const key of keys) form.elements[key].value = current[key];
    form.elements.palette.value = current.palette;
  }
  form.addEventListener('input', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(render); status.textContent = ''; });
  form.addEventListener('change', () => { render(); sync(); });
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', () => { cancelAnimationFrame(frame); requestAnimationFrame(() => { render(); status.textContent = '初期設定に戻しました。'; }); });
  for (const button of document.querySelectorAll('[data-preset]')) {
    button.addEventListener('click', () => {
      const preset = presets[button.dataset.preset];
      for (const [key, value] of Object.entries(preset)) form.elements[key].value = value;
      render(); sync(); status.textContent = `「${button.textContent.trim()}」を適用しました。`;
    });
  }
  document.getElementById('download').addEventListener('click', () => {
    render(); sync();
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', G.svg(current)], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `lissajous-${current.freqX}-${current.freqY}-${current.phase}deg.svg`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    status.textContent = 'SVG の保存を開始しました。';
  });
  render();
  ArtShare.attach(LissajousGenerator, render);
})();
