# Artwork detail preview (unpublished)

The collection links directly to the existing `works/<slug>/` detail pages. The five spatial studies use the same artwork heading, notes, settings layout, and Save/Share dialogs as the original 2D gallery. There is no collection-level editor or artwork select menu. Lorenz and octahedral paths initially open in 3D; nested hexagons, Voronoi and branching rules initially open in 2D. Their alternate view is available on the same detail route. The other 19 artworks keep their existing UI.

`?view=3d` selects the spatial view; `?view=2d` selects the original view. Every archived `#art=` URL selects generator-v1 2D, even when a conflicting view query is present. No generator-v1 implementation or compatibility fixture changed. The previous `sculpture/?work=...` preview route only forwards to the corresponding detail page.

The 3D view exposes only effective controls for the selected artwork. Geometry limits also bound the controls: hexagon layers stop at 14 and their rotation at 45 degrees. There are no recommendations, random multi-setting changes, undo history, favorites, or mount controls. Settings reset restores the artwork's defaults; a separate view reset restores its camera. PNG/STL are selected inside Save, and links/PNG use the existing Share dialog. Shared 3D settings restore on the corresponding detail route. Camera orbit is a viewing operation and is not saved in the URL; PNG captures the current camera.

Three.js 0.180.0, OrbitControls and STLExporter remain bundled locally. `sculpture-geometry.mjs` retains the previous geometry-v1 implementation: Lorenz's XYZ trajectory, XYZ octahedral edges, lofted hexagon layers, Voronoi relief and lifted branching segments. The shared dialog accepts a renderer adapter for image capture, available formats, and the detail URL; its original SVG/PNG/DXF path is preserved.

## Verification

- `npm test`: 112 tests, including deterministic STL readback, closed geometry, and an effective-change check for every adjacent value exposed by each 3D range control.
- `npm run build`: 24 artworks / 2 collection pages.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser`: the existing 24-work 2D suite plus integrated 3D desktop/mobile coverage. This includes archived 2D URLs, 96 SVG/PNG comparisons, four mobile sizes, PNG/STL downloads, nondefault 3D share restoration, effective controls, keyboard input, distinct setting/camera resets, button alignment and WebGL fallback.
- `CHROMIUM_PATH=/usr/bin/chromium node scripts/sculpture-browser.cjs --screenshots`: updates the four owner-review images in `review-preview/`. The nested-hexagon image shows its optional 3D detail view; its default remains 2D.

Owner-review screenshots are stored in `review-preview/`; they are not copied into the generated site in `dist/`.
