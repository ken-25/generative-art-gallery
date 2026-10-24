/* Preserve links from the preview while keeping artwork detail routes canonical. */
(() => {
 const params=new URLSearchParams(location.search),work=params.get('work')||'lorenz-orbit';
 if(!['lorenz-orbit','octahedral-paths','nested-hexagons','voronoi-relaxation','branching-rules'].includes(work))return;
 const url=new URL('../works/'+work+'/',location.href);params.set('view','3d');url.search=params;location.replace(url.href);
})();
