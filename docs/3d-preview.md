# 3D gallery preview (local, unpublished)

The first 3D release adds a shared atelier at `sculpture/` and one interactive hero on each static collection page. The 20-per-page list, permanent artwork numbers, original artwork routes, all 24 generator-v1 implementations and their PNG/SVG/DXF paths are preserved. Five artwork pages link to their 3D atelier. Cards use existing static previews and badges; they do not create WebGL contexts.

`assets/sculpture-geometry.mjs` defines a separate `mode=sculpture&version=1` state. It calls the existing normalized geometry API without changing 2D defaults or random sequences. Lorenz uses its XYZ trajectory, octahedral paths use selected edges on XYZ vertices, hexagons loft related polygon layers, Voronoi makes relief faces, and branching rules lift the generated growth segments into space. Shape state, color, seed, and optional mount travel in the URL; camera orbit is a viewing operation and is not saved. History retains 30 states and local favorites retain the latest 12 states. Reset restores the initial URL state.

STL is binary, contains geometry only, and uses coordinates interpreted as millimetres. PNG captures the current camera and color. Optional base and hanging ring are included in exported geometry; the hanging connector starts at a real highest vertex. Geometry validation detects empty, non-finite and zero-area triangles. Tests additionally check welded boundary-edge counts, coherent edge orientation and positive volume for each component at low/default/high densities. These software checks do not establish physical performance, and do not check self-intersection or perform a Boolean union between touching components.

Three.js 0.180.0 is bundled locally from the official npm package under MIT. The only vendor adjustment is relative imports in OrbitControls and STLExporter. There is no CDN runtime dependency, new service, account, analytics setting, permission or secret. The static Pages build remains the deployment format.

## Verification

- `npm test`: 111 tests passed, zero failures (includes 7 3D tests and the exact SVG generator-v1 regression corpus).
- `npm run build`: 24 artworks / 2 static collection pages.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser`: passed: all 24 artworks at 1440 and 375 px, 96 SVG/PNG pixel comparisons, 4 mobile sizes, 72 archived SVGs, static pagination, dialogs and sharing; zero JS/network errors.
- `node scripts/sculpture-browser.cjs`: desktop and 375 px, five shapes, PNG decoding, binary STL re-read, deterministic URL reload, share URL, undo/reset, keyboard rotation/zoom, view controls, local favorites, optional mounts, second list page, legacy 2D and forced WebGL-unavailable fallback.
- Independent read-only review: six initial issues fixed and re-reviewed; no remaining major findings. Two subsequent minor findings (PNG filename capture and stale error revision) also fixed.
- Real screenshots and downloaded files are in ignored `evidence/`; screenshots are taken by Chromium from the built site. No generated illustration is substituted for a screenshot.

Not run: real mobile hardware and GPU matrix, physical output tests, full 3D treatment of the remaining 19 artworks. Intersections between separate rods/components are not fused. Their existing 2D features remain available.

Library upload was not performed: the current prepared-upload helper failed before preparation at hosted apps tools/list with a network error. All screenshots remain in `/workspace/generative-art-gallery/evidence/`; there are no confirmed library_file_id values.

No publication, deployment, remote push, PR creation or main mutation is part of this preview. Owner screenshot review is the next step.
