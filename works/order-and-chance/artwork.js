(() => {
  'use strict';
  const form = document.getElementById('settings');
  const art = document.getElementById('art');
  const status = document.getElementById('status');
  let current, frame;
  const controls = Object.keys(ArtGenerator.defaults).map(key => form.elements.namedItem(key));
  function render() {
    current = ArtGenerator.normalize(Object.fromEntries(controls.map(input => [input.name, input.value])));
    art.innerHTML = ArtGenerator.svg(current);
    for (const key of ['position', 'rotation', 'growth']) document.getElementById(`${key}-value`).value = current[key] + (key === 'rotation' ? '°' : '');
    document.getElementById('art-caption').textContent = `${current.columns} × ${current.rows} / ${current.seed}`;
  }
  function sync() { for (const input of controls) input.value = current[input.name]; }
  form.addEventListener('input', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(render); });
  form.addEventListener('change', () => { render(); sync(); });
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', () => { cancelAnimationFrame(frame); requestAnimationFrame(() => { render(); status.textContent = '初期設定に戻しました。'; }); });
  document.getElementById('new-seed').addEventListener('click', () => {
    const previous = form.elements.seed.value;
    let next = `s-${Array.from(crypto.getRandomValues(new Uint32Array(2)), n => n.toString(36)).join('-')}`;
    if (next === previous) next += '-next';
    form.elements.seed.value = next; render(); status.textContent = '新しいシードで生成しました。';
  });
  document.getElementById('download').addEventListener('click', () => {
    render(); sync();
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', ArtGenerator.svg(current)], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `order-and-chance-${current.seed.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)}.svg`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    status.textContent = 'SVG の保存を開始しました。';
  });
  render();
  ArtShare.attach(ArtGenerator, render);
})();
